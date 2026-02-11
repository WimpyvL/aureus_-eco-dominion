/**
 * Building Manager
 * Handles all building-related operations: placement, bulldozing, selection, and ghost previews.
 */

import { StateManager } from '../../engine/state/StateManager';
import { BuildingRenderSystem } from '../render/systems/BuildingRenderSystem';
import { BuildingType, SfxType, Chunk } from '../../types';
import { BUILDINGS } from '../../engine/data/VoxelConstants';
import { ChunkStore } from '../../engine/space/ChunkStore';
export class BuildingManager {
    private stateManager: StateManager;
    private buildingRenderSystem: BuildingRenderSystem;

    constructor(stateManager: StateManager, buildingRenderSystem: BuildingRenderSystem) {
        this.stateManager = stateManager;
        this.buildingRenderSystem = buildingRenderSystem;
    }

    /**
     * Place a building at the specified coordinates
     */
    placeBuilding(x: number, z: number, type?: string): void {
        const state = this.stateManager.getState();
        const buildingType = (type || state.selectedBuilding) as BuildingType;

        console.log('[BuildingManager] placeBuilding:', x, z, buildingType);

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
        const tile = ChunkStore.getTile(state.chunks, x, z);
        if (!tile) {
            console.warn('[BuildingManager] Tile is null');
            return;
        }
        if (tile.buildingType !== BuildingType.EMPTY && tile.buildingType !== BuildingType.POND) {
            console.warn('[BuildingManager] Tile is not empty, current:', tile.buildingType);
            return;
        }

        this.placeSurfaceBuilding(x, z, buildingType, state);
    }

    /**
     * Place a building on the surface
     */
    private placeSurfaceBuilding(x: number, z: number, buildingType: BuildingType, state: any): void {
        this.stateManager.pushCommand('PLACE_BUILDING', { x, z, buildingType });
        this.stateManager.pushEffect({ type: 'AUDIO', sfx: SfxType.BUILD });
    }

    bulldozeTile(x: number, z: number): void {
        this.stateManager.pushCommand('BULLDOZE', { x, z });
        this.stateManager.pushEffect({ type: 'AUDIO', sfx: SfxType.BUILD });
    }

    /**
     * Select a building type for placement
     */
    selectBuilding(type: string | null): void {
        this.buildingRenderSystem.setGhostBuilding(type as BuildingType | null);

        if (type) {
            this.stateManager.update({
                selectedBuilding: type as BuildingType,
                interactionMode: 'BUILD'
            });
        } else {
            this.stateManager.update({
                selectedBuilding: null,
                interactionMode: 'INSPECT'
            });
        }
    }

    /**
     * Pin a ghost building at a location for mobile confirmation
     */
    pinBuildingForConfirmation(x: number, z: number): void {
        const state = this.stateManager.getState();
        const tile = ChunkStore.getTile(state.chunks, x, z);
        const y = tile ? tile.terrainHeight * 0.5 : 0;

        this.buildingRenderSystem.setPinnedGhost({ x, z }, y);
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
    upgradeBuilding(x: number, z: number): void {
        const state = this.stateManager.getState();
        const tile = ChunkStore.getTile(state.chunks, x, z);
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
        this.stateManager.pushCommand('UPGRADE_BUILDING', { x, z });
    }

    /**
     * Speed up construction at a tile using gems
     */
    speedUpConstruction(x: number, z: number): void {
        const state = this.stateManager.getState();
        const tile = ChunkStore.getTile(state.chunks, x, z);
        if (!tile || !tile.isUnderConstruction) return;

        const rushCost = 1; // 1 gem per rush
        if (state.resources.gems >= rushCost) {
            // Deduct gems in orchestrator (or let engine handle it, but better to deduct here for immediate UI feedback if possible)
            // Actually, ConstructionSystem also deducts gems, so we should be careful about double-deduction.
            // Let's let the engine handle the resource deduction for consistency.
            this.stateManager.pushCommand('SPEED_UP', { x, z });

            // We can add the effect here for immediate feedback
            this.stateManager.pushEffect({ type: 'AUDIO', sfx: SfxType.CONSTRUCT_SPEEDUP });
        } else {
            this.stateManager.pushEffect({ type: 'AUDIO', sfx: SfxType.ERROR });
        }
    }
}
