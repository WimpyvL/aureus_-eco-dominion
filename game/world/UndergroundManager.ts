
import { StateManager } from '../../engine/state/StateManager';
import { IsoCameraSystem } from '../render/IsoCameraSystem';
import { InputSystem } from '../../engine/input/InputSystem';
import { TerrainRenderSystem } from '../render/systems/TerrainRenderSystem';
import { EnvironmentRenderSystem } from '../render/systems/EnvironmentRenderSystem';
import { GridTile, SfxType, Chunk } from '../../types';
import { ChunkStore } from '../../engine/space/ChunkStore';

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
        const state = this.stateManager.getState();

        if (state.isLoading) return;

        if (state.viewMode === 'SURFACE') {
            const hasEntrance = Object.values(state.chunks).some(c => c.tiles.some(t => t.hasEntrance));
            if (!hasEntrance) {
                this.stateManager.pushEffect({
                    type: 'AUDIO',
                    sfx: SfxType.ERROR
                });
                // Note: newsFeed should ideally be pushed via command or a safe update if it's transient UI state
                // But for now, let's use a command to handle it if we want to be strict,
                // or just use update if newsFeed is considered UI state.
                this.stateManager.update({
                    newsFeed: [{
                        id: `no_underground_${Date.now()}`,
                        headline: "Underground access locked. You must build a Mine Entrance first!",
                        type: 'NEUTRAL',
                        timestamp: Date.now()
                    }, ...state.newsFeed]
                });
                return;
            }

            this.stateManager.update({
                isLoading: true,
                loadingMessage: 'Descending to Underground...'
            });

            setTimeout(() => {
                const s = this.stateManager.getState();
                this.stateManager.update({
                    viewMode: 'UNDERGROUND'
                });
                this.cameraSystem.setUndergroundMode(true);

                const layerY = (s.currentUndergroundLayer ?? -1) * 2.0;
                this.cameraSystem.setTargetHeight(layerY);
                this.inputSystem?.setRayPlaneHeight(layerY);

                this.environmentRenderSystem.setViewMode('UNDERGROUND');
                this.terrainRenderSystem.setViewMode('UNDERGROUND');

                const allTiles = Object.values(s.chunks).flatMap(c => c.tiles);
                this.terrainRenderSystem.syncGrid(allTiles);

                setTimeout(() => {
                    this.stateManager.update({
                        isLoading: false,
                        loadingMessage: ''
                    });
                }, 600);
            }, 300);

        } else {
            this.stateManager.update({
                isLoading: true,
                loadingMessage: 'Returning to Surface...'
            });

            setTimeout(() => {
                const s = this.stateManager.getState();
                this.stateManager.update({
                    viewMode: 'SURFACE'
                });
                this.cameraSystem.setUndergroundMode(false);
                this.cameraSystem.setTargetHeight(0);
                this.inputSystem?.setRayPlaneHeight(0);

                this.environmentRenderSystem.setViewMode('SURFACE');
                this.terrainRenderSystem.setViewMode('SURFACE');

                const allTiles = Object.values(s.chunks).flatMap(c => c.tiles);
                this.terrainRenderSystem.syncGrid(allTiles);

                setTimeout(() => {
                    this.stateManager.update({
                        isLoading: false,
                        loadingMessage: ''
                    });
                }, 600);
            }, 300);
        }

        this.stateManager.pushEffect({ type: 'AUDIO', sfx: SfxType.UI_CLICK });
    }

    changeUndergroundLayer(delta: number): void {
        const state = this.stateManager.getState();
        if (state.viewMode !== 'UNDERGROUND') return;

        const nextLayer = Math.max(-10, Math.min(-1, state.currentUndergroundLayer + delta));
        if (nextLayer === state.currentUndergroundLayer) return;

        this.stateManager.update({
            currentUndergroundLayer: nextLayer
        });

        this.cameraSystem.setTargetHeight(nextLayer * 2.0);
        this.inputSystem?.setRayPlaneHeight(nextLayer * 2.0);

        this.stateManager.pushEffect({ type: 'AUDIO', sfx: SfxType.UI_CLICK });
        // meshDirty is internal to chunk objects, normally mutated in simTick.
        // If we need to trigger a remesh from UI, we might need a command or a cleaner way.
        // For now, let's use a command to mark chunks dirty if needed, or see if update() handles it.
    }

    queueDig(x: number, z: number, layer: number): void {
        this.stateManager.pushCommand('QUEUE_DIG', { x, z, layer });
    }

    private isLayerAccessible(x: number, z: number, layer: number, chunks: Record<string, Chunk>): boolean {
        if (layer === -1) return true;

        const offsets = [
            { dx: 0, dz: -1 },
            { dx: 0, dz: 1 },
            { dx: -1, dz: 0 },
            { dx: 1, dz: 0 }
        ];

        for (const off of offsets) {
            const nx = x + off.dx;
            const nz = z + off.dz;
            const nTile = ChunkStore.getTile(chunks, nx, nz);
            if (nTile && nTile.underground?.[layer]?.excavated) {
                return true;
            }
        }

        // Also accessible if layer above is excavated
        const tile = ChunkStore.getTile(chunks, x, z);
        if (tile && tile.underground?.[layer + 1]?.excavated) {
            return true;
        }

        return false;
    }
}
