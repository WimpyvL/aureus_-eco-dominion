/**
 * Underground Manager
 * Handles all underground-related operations: view mode, layer navigation, and excavation.
 */

import { StateManager } from '../../engine/state/StateManager';
import { IsoCameraSystem } from '../render/IsoCameraSystem';
import { InputSystem } from '../../engine/input/InputSystem';
import { TerrainRenderSystem } from '../render/systems/TerrainRenderSystem';
import { EnvironmentRenderSystem } from '../render/systems/EnvironmentRenderSystem';
import { GridTile, SfxType } from '../../types';
import { GRID_SIZE } from '../../engine/utils/GameUtils';

export class UndergroundManager {
    private stateManager: StateManager;
    private cameraSystem: IsoCameraSystem;
    private inputSystem: InputSystem | null;
    private terrainRenderSystem: TerrainRenderSystem;
    private environmentRenderSystem: EnvironmentRenderSystem;

    constructor(
        stateManager: StateManager,
        cameraSystem: IsoCameraSystem,
        terrainRenderSystem: TerrainRenderSystem,
        environmentRenderSystem: EnvironmentRenderSystem
    ) {
        this.stateManager = stateManager;
        this.cameraSystem = cameraSystem;
        this.terrainRenderSystem = terrainRenderSystem;
        this.environmentRenderSystem = environmentRenderSystem;
        this.inputSystem = null;
    }

    setInputSystem(inputSystem: InputSystem): void {
        this.inputSystem = inputSystem;
    }

    /**
     * Toggle between surface and underground view modes with loading transitions
     */
    toggleViewMode(): void {
        const state = this.stateManager.getMutableState();

        // Already loading? Prevent double-toggle
        if (state.isLoading) return;

        if (state.viewMode === 'SURFACE') {
            // Check if at least one entrance exists
            const hasEntrance = state.grid.some(t => t.hasEntrance);
            if (!hasEntrance) {
                state.newsFeed.push({
                    id: `no_underground_${Date.now()}`,
                    headline: "Underground access locked. You must build a Mine Entrance first!",
                    type: 'NEUTRAL',
                    timestamp: Date.now()
                });
                state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ERROR });
                return;
            }

            // Show loading screen
            state.isLoading = true;
            state.loadingMessage = 'Descending to Underground...';

            // Perform transition after brief delay
            setTimeout(() => {
                const s = this.stateManager.getMutableState();
                s.viewMode = 'UNDERGROUND';
                this.cameraSystem.setUndergroundMode(true);

                // Focus on current layer with proper depth scaling
                const layerY = (s.currentUndergroundLayer ?? -1) * 2.0;
                this.cameraSystem.setTargetHeight(layerY);
                this.inputSystem?.setRayPlaneHeight(layerY);

                this.environmentRenderSystem.setViewMode(s.viewMode);
                this.terrainRenderSystem.setViewMode(s.viewMode);
                this.terrainRenderSystem.syncGrid(s.grid);

                // Hide loading after chunks rebuild
                setTimeout(() => {
                    const s2 = this.stateManager.getMutableState();
                    s2.isLoading = false;
                    s2.loadingMessage = '';
                }, 600);
            }, 300);

        } else {
            // Show loading screen
            state.isLoading = true;
            state.loadingMessage = 'Returning to Surface...';

            // Perform transition after brief delay
            setTimeout(() => {
                const s = this.stateManager.getMutableState();
                s.viewMode = 'SURFACE';
                this.cameraSystem.setUndergroundMode(false);
                this.cameraSystem.setTargetHeight(0);
                this.inputSystem?.setRayPlaneHeight(0);

                this.environmentRenderSystem.setViewMode(s.viewMode);
                this.terrainRenderSystem.setViewMode(s.viewMode);
                this.terrainRenderSystem.syncGrid(s.grid);

                // Hide loading after chunks rebuild
                setTimeout(() => {
                    const s2 = this.stateManager.getMutableState();
                    s2.isLoading = false;
                    s2.loadingMessage = '';
                }, 600);
            }, 300);
        }

        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_CLICK });
    }

    /**
     * Change the current underground layer being viewed
     */
    changeUndergroundLayer(delta: number): void {
        const state = this.stateManager.getMutableState();
        if (state.viewMode !== 'UNDERGROUND') return;

        const nextLayer = Math.max(-10, Math.min(-1, state.currentUndergroundLayer + delta));
        if (nextLayer === state.currentUndergroundLayer) return;

        state.currentUndergroundLayer = nextLayer;

        // Update Camera & Interaction with proper depth scaling
        this.cameraSystem.setTargetHeight(state.currentUndergroundLayer * 2.0);
        this.inputSystem?.setRayPlaneHeight(state.currentUndergroundLayer * 2.0);

        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_CLICK });
        state.pendingEffects.push({ type: 'GRID_UPDATE', updates: [] });
    }

    /**
     * Queue a dig operation at a specific tile and layer
     */
    queueDig(index: number, layer: number): void {
        const state = this.stateManager.getMutableState();
        const tile = state.grid[index];
        if (!tile) return;

        // DK2-Style: If in underground view, default to the current viewed layer
        const targetLayer = state.viewMode === 'UNDERGROUND'
            ? (state.currentUndergroundLayer || -1)
            : layer;

        // Accessibility Check: Can we reach this layer to dig it?
        if (!this.isLayerAccessible(index, targetLayer, state.grid)) {
            console.warn(`Layer ${targetLayer} at ${index} is not reachable`);
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ERROR });
            return;
        }

        if (!tile.digState) tile.digState = {};
        // Use status 4 for 'ENTRANCE DIG' and 1 for 'TUNNEL DIG'
        tile.digState[targetLayer] = (targetLayer === -1 && state.viewMode === 'SURFACE') ? 4 : 1;
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_CLICK });
    }

    /**
     * Check if a layer is accessible for digging
     * Layers must be reachable from surface or adjacent excavated areas
     */
    private isLayerAccessible(index: number, layer: number, grid: GridTile[]): boolean {
        // Top layer always accessible from surface
        if (layer === -1) return true;

        const tile = grid[index];

        // DK2 Priority: Horizontal access (from neighbors at same depth)
        const x = index % GRID_SIZE;
        const z = Math.floor(index / GRID_SIZE);
        const offsets = [
            { dx: 0, dz: -1 },
            { dx: 0, dz: 1 },
            { dx: -1, dz: 0 },
            { dx: 1, dz: 0 }
        ];

        for (const off of offsets) {
            const nx = x + off.dx;
            const nz = z + off.dz;
            if (nx >= 0 && nx < GRID_SIZE && nz >= 0 && nz < GRID_SIZE) {
                const nIdx = nz * GRID_SIZE + nx;
                if (grid[nIdx].underground[layer]?.excavated) return true;
            }
        }

        // Vertical access (from layer above)
        if (grid[index].underground[layer + 1]?.excavated) return true;

        return false;
    }
}
