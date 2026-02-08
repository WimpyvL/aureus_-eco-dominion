/**
 * Building Manager
 * Handles all building-related operations: placement, bulldozing, selection, and ghost previews.
 */

import { StateManager } from '../../engine/state/StateManager';
import { BuildingRenderSystem } from '../render/systems/BuildingRenderSystem';
import { BuildingType, SfxType } from '../../types';
import { BUILDINGS } from '../../engine/data/VoxelConstants';

export class BuildingManager {
    private stateManager: StateManager;
    private buildingRenderSystem: BuildingRenderSystem;

    constructor(stateManager: StateManager, buildingRenderSystem: BuildingRenderSystem) {
        this.stateManager = stateManager;
        this.buildingRenderSystem = buildingRenderSystem;
    }

    /**
     * Place a building at the specified tile index
     */
    placeBuilding(index: number, type?: string): void {
        const state = this.stateManager.getMutableState();
        const buildingType = (type || state.selectedBuilding) as BuildingType;

        console.log('[BuildingManager] placeBuilding:', index, buildingType, state.viewMode);

        if (!buildingType) {
            console.warn('[BuildingManager] No buildingType');
            return;
        }

        const def = BUILDINGS[buildingType];
        if (!def) {
            console.warn('[BuildingManager] No definition for', buildingType);
            return;
        }

        // Validate placement
        const tile = state.grid[index];
        if (!tile) {
            console.warn('[BuildingManager] Tile is null');
            return;
        }
        if (tile.buildingType !== BuildingType.EMPTY && tile.buildingType !== BuildingType.POND) {
            console.warn('[BuildingManager] Tile is not empty, current:', tile.buildingType);
            return;
        }

        // Context-aware placement (surface vs underground)
        if (state.viewMode === 'UNDERGROUND') {
            this.placeUndergroundBuilding(index, buildingType, state);
        } else {
            this.placeSurfaceBuilding(index, buildingType, state);
        }
    }

    /**
     * Place a building on the surface
     */
    private placeSurfaceBuilding(index: number, buildingType: BuildingType, state: any): void {
        this.stateManager.pushCommand('PLACE_BUILDING', { index, buildingType });
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BUILD });
    }

    /**
     * Place a building underground
     */
    private placeUndergroundBuilding(index: number, buildingType: BuildingType, state: any): void {
        const layer = state.currentUndergroundLayer;
        const tile = state.grid[index];
        const strata = tile.underground ? tile.underground[layer] : null;

        // Only allow subterranean construction on excavated tiles
        if (!strata || !strata.excavated) {
            console.warn('[BuildingManager] Cannot build on unexcavated bedrock');
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ERROR });
            return;
        }

        const subterraneanTypes = [
            BuildingType.PIPE,
            BuildingType.SUPPORT_PILLAR,
            BuildingType.MINING_DRILL,
            BuildingType.UNDERGROUND_FANS,
            BuildingType.ORE_EXTRACTOR
        ];

        if (subterraneanTypes.includes(buildingType)) {
            this.stateManager.pushCommand('PLACE_SUB_BUILDING', { index, buildingType, layer });
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BUILD });
        } else {
            console.warn(`${buildingType} cannot be placed underground`);
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ERROR });
        }
    }

    bulldozeTile(index: number): void {
        const state = this.stateManager.getMutableState();
        const tile = state.grid[index];
        if (!tile) return;

        if (state.viewMode === 'UNDERGROUND') {
            const layer = state.currentUndergroundLayer;
            const hasSub = tile.subBuildings && tile.subBuildings[layer];
            if (hasSub) {
                this.stateManager.pushCommand('BULLDOZE_SUB', { index, layer });
                state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BULLDOZE });
            }
        } else {
            this.stateManager.pushCommand('BULLDOZE', { index });
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BUILD });
        }
    }

    /**
     * Select a building type for placement
     */
    selectBuilding(type: string | null): void {
        const state = this.stateManager.getMutableState();
        state.selectedBuilding = type as BuildingType | null;
        this.buildingRenderSystem.setGhostBuilding(type as BuildingType | null);

        // CRITICAL: Set interaction mode to BUILD when selecting a building
        if (type) {
            state.interactionMode = 'BUILD';
        } else {
            state.interactionMode = 'INSPECT';
        }
    }

    /**
     * Pin a ghost building at a location for mobile confirmation
     */
    pinBuildingForConfirmation(index: number): void {
        const state = this.stateManager.getState();
        const tile = state.grid[index];
        const surfaceY = tile ? tile.terrainHeight * 0.5 : 0;

        let y = surfaceY;
        if (state.viewMode === 'UNDERGROUND') {
            // Use 2.0 depth scaling for underground layers
            y = surfaceY + (state.currentUndergroundLayer * 2.0);
        }

        this.buildingRenderSystem.setPinnedGhost(index, y);
    }

    /**
     * Clear the pinned ghost building
     */
    clearPinnedBuilding(): void {
        this.buildingRenderSystem.setPinnedGhost(null);
    }

    /**
     * Upgrade an existing building to the next level
     */
    upgradeBuilding(index: number): void {
        const state = this.stateManager.getMutableState();
        const tile = state.grid[index];
        if (!tile || tile.buildingType === BuildingType.EMPTY) return;

        const def = BUILDINGS[tile.buildingType];
        if (!def || !def.upgrades) return;

        const nextLevel = (tile.level || 1) + 1;
        const upgrade = def.upgrades.find(u => u.level === nextLevel);

        if (!upgrade) {
            console.warn(`[BuildingManager] No upgrade found for level ${nextLevel}`);
            return;
        }

        // Push Command
        this.stateManager.pushCommand('UPGRADE_BUILDING', { index });
    }

    /**
     * Speed up construction at a tile using gems
     */
    speedUpConstruction(index: number): void {
        const state = this.stateManager.getMutableState();
        const tile = state.grid[index];
        if (!tile || !tile.isUnderConstruction) return;

        const rushCost = 1; // 1 gem per rush
        if (state.resources.gems >= rushCost) {
            // Deduct gems in orchestrator (or let engine handle it, but better to deduct here for immediate UI feedback if possible)
            // Actually, ConstructionSystem also deducts gems, so we should be careful about double-deduction.
            // Let's let the engine handle the resource deduction for consistency.
            this.stateManager.pushCommand('SPEED_UP', { index });

            // We can add the effect here for immediate feedback
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.CONSTRUCT_SPEEDUP });
        } else {
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ERROR });
        }
    }
}
