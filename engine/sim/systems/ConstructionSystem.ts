/**
 * Construction System
 * Handles building placement, bulldozing, and construction site management.
 * Manages consistency for multi-tile structures.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState, GridTile, BuildingType, SfxType } from '../../../types';
import { BUILDINGS } from '../../data/VoxelConstants';
import { GRID_SIZE, updateWaterConnectivity } from '../../utils/GameUtils';

export class ConstructionSystem extends BaseSimSystem {
    readonly id = 'construction';
    readonly priority = 60; // Run high to handle placement/removal before sim systems

    tick(ctx: FixedContext, state: GameState): void {
        // 1. Process Command Queue
        this.processCommandQueue(state);

        // 2. Passive Construction Progress (All head tiles under construction progress slowly)
        // Construction is normally 1:1 with real seconds if not being worked on by an agent.
        // agent.ts handles the boosted work speed.
        if (state.tickCount % 60 === 0) {
            for (let i = 0; i < state.grid.length; i++) {
                const tile = state.grid[i];
                // Only progress if it's a head tile (or single-tile) under construction
                if (tile.isUnderConstruction && (tile.structureHeadIndex === undefined || tile.structureHeadIndex === i)) {
                    this.progressConstruction(i, 1.0, state);
                }
            }
        }

        // 3. Periodic consistency check for multi-tile buildings
        if (state.tickCount % 120 === 0) {
            this.enforceMultiTileConsistency(state);
        }
    }

    private processCommandQueue(state: GameState) {
        if (!state.commandQueue || state.commandQueue.length === 0) return;

        // Process all commands
        // We use a while loop or just iterate and clear.
        // Since we are synchronous here, we can iterate and clear.
        const queue = state.commandQueue;
        for (const cmd of queue) {
            // Check if already processed (though clearing prevents this)
            // Execute
            switch (cmd.type) {
                case 'PLACE_BUILDING':
                    this.placeBuilding(cmd.payload.index, cmd.payload.buildingType, state, cmd.payload.isInstant);
                    break;
                case 'PLACE_SUB_BUILDING':
                    this.placeSubBuilding(cmd.payload.index, cmd.payload.buildingType, cmd.payload.layer, state, cmd.payload.isInstant);
                    break;
                case 'BULLDOZE':
                    this.bulldozeBuilding(cmd.payload.index, state);
                    break;
                case 'BULLDOZE_SUB':
                    this.bulldozeSubBuilding(cmd.payload.index, cmd.payload.layer, state);
                    break;
                case 'SPEED_UP':
                    this.speedUpConstruction(cmd.payload.index, state);
                    break;
                case 'REHABILITATE':
                    this.rehabilitateTile(cmd.payload.index, state);
                    break;
                case 'UPGRADE_BUILDING':
                    this.upgradeBuilding(cmd.payload.index, state);
                    break;
            }
        }

        // Clear Queue
        state.commandQueue = [];
    }

    /**
     * Advances construction progress on a tile.
     * Handles multi-tile synchronization.
     */
    public progressConstruction(tileId: number, amount: number, state: GameState): boolean {
        const grid = state.grid;
        const tile = grid[tileId];
        if (!tile || !tile.isUnderConstruction) return false;

        // Multi-tile buildings share progress via the head tile
        const headIdx = tile.structureHeadIndex !== undefined ? tile.structureHeadIndex : tileId;
        const headTile = grid[headIdx];

        if (!headTile) return false;

        headTile.constructionTimeLeft = Math.max(0, (headTile.constructionTimeLeft || 0) - amount);

        if (headTile.constructionTimeLeft <= 0) {
            this.completeConstruction(headIdx, state);
            return true; // Finished
        }

        return false; // Still ongoing
    }

    /**
     * Immediately completes construction for a building.
     */
    private completeConstruction(headIdx: number, state: GameState): void {
        const grid = state.grid;
        const headTile = grid[headIdx];
        if (!headTile) return;

        const def = BUILDINGS[headTile.buildingType];
        if (!def) return;

        const w = def.width || 1;
        const d = def.depth || 1;

        for (let dz = 0; dz < d; dz++) {
            for (let dx = 0; dx < w; dx++) {
                const tx = (headIdx % GRID_SIZE) + dx;
                const tz = Math.floor(headIdx / GRID_SIZE) + dz;
                const idx = tz * GRID_SIZE + tx;

                if (grid[idx] && (grid[idx].structureHeadIndex === headIdx || idx === headIdx)) {
                    grid[idx].isUnderConstruction = false;
                    grid[idx].constructionTimeLeft = 0;

                    // Finalize this specific tile's structure head if it was targeting us
                    if (grid[idx].structureHeadIndex === undefined) {
                        grid[idx].structureHeadIndex = headIdx;
                    }

                    // If it's a sub-building (pipe/wire), finalize the excavation state
                    if (grid[idx].digState) {
                        for (const layer in grid[idx].digState) {
                            if (grid[idx].digState[layer] === 1) grid[idx].digState[layer] = 2;
                        }
                    }
                }
            }
        }

        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.COMPLETE });
        state.pendingEffects.push({ type: 'GRID_UPDATE', updates: [headTile] });
        // Trigger water update in case this building connects pipes
        state.grid = updateWaterConnectivity(grid);
    }

    /**
     * Places a building on the grid.
     * Handles multi-tile footprint and initial construction state.
     */
    public placeBuilding(index: number, buildingType: BuildingType, state: GameState, isInstant: boolean = false): void {
        const def = BUILDINGS[buildingType];
        if (!def) return;

        const grid = state.grid;
        const w = def.width || 1;
        const d = def.depth || 1;

        const updates: GridTile[] = [];
        for (let dz = 0; dz < d; dz++) {
            for (let dx = 0; dx < w; dx++) {
                const x = (index % GRID_SIZE) + dx;
                const z = Math.floor(index / GRID_SIZE) + dz;
                if (x < GRID_SIZE && z < GRID_SIZE) {
                    const idx = z * GRID_SIZE + x;
                    grid[idx] = {
                        ...grid[idx],
                        buildingType,
                        isUnderConstruction: !isInstant,
                        constructionTimeLeft: isInstant ? 0 : def.buildTime,
                        structureHeadIndex: index,
                        explored: true,
                        level: 1,
                        // Set entrance property for mining buildings
                        hasEntrance: buildingType === BuildingType.MINING_HEADFRAME
                    };
                    updates.push(grid[idx]);
                }
            }
        }

        state.grid = updateWaterConnectivity(grid);
        state.pendingEffects.push({ type: 'GRID_UPDATE', updates });
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BUILD_START });
    }

    /**
     * Removes a building or foliage from a tile.
     * Handles multi-tile cleanup.
     */
    public bulldozeBuilding(index: number, state: GameState): void {
        const grid = state.grid;
        const tile = grid[index];
        if (!tile) return;

        const updates: GridTile[] = [];

        if (tile.foliage === 'ILLEGAL_CAMP') {
            tile.foliage = 'NONE';
            updates.push(tile);
        } else if (tile.structureHeadIndex !== undefined) {
            const headIdx = tile.structureHeadIndex;
            const headTile = grid[headIdx];
            if (headTile) {
                const def = BUILDINGS[headTile.buildingType];
                const w = def?.width || 1;
                const d = def?.depth || 1;

                for (let dz = 0; dz < d; dz++) {
                    for (let dx = 0; dx < w; dx++) {
                        const idx = (Math.floor(headIdx / GRID_SIZE) + dz) * GRID_SIZE + ((headIdx % GRID_SIZE) + dx);
                        if (grid[idx] && grid[idx].structureHeadIndex === headIdx) {
                            grid[idx] = {
                                ...grid[idx],
                                buildingType: BuildingType.EMPTY,
                                isUnderConstruction: false,
                                structureHeadIndex: undefined,
                                constructionTimeLeft: 0,
                                hasEntrance: false
                            };
                            updates.push(grid[idx]);
                        }
                    }
                }
            }
        } else {
            tile.buildingType = BuildingType.EMPTY;
            tile.isUnderConstruction = false;
            tile.structureHeadIndex = undefined;
            updates.push(tile);
        }

        state.grid = updateWaterConnectivity(grid);
        state.pendingEffects.push({ type: 'GRID_UPDATE', updates });
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BULLDOZE });
    }

    /**
     * Instantly completes construction for a gem cost.
     */
    public speedUpConstruction(index: number, state: GameState): void {
        const grid = state.grid;
        const tile = grid[index];
        if (!tile) return;

        const headIdx = tile.structureHeadIndex !== undefined ? tile.structureHeadIndex : index;
        this.completeConstruction(headIdx, state);

        state.resources.gems = Math.max(0, state.resources.gems - 1);
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_CLICK });
    }

    /**
     * Initiates rehabilitation of a polluted tile.
     */
    public rehabilitateTile(index: number, state: GameState): void {
        if (state.resources.agt < 100) return;

        const exists = state.jobs.some(j => j.targetTileId === index && j.type === 'REHABILITATE');
        if (!exists) {
            state.jobs.push({
                id: `rehab_${index}_${Date.now()}`,
                type: 'REHABILITATE',
                targetTileId: index,
                priority: 25,
                assignedAgentId: null
            });
            state.grid[index].rehabProgress = 0.1;
            state.resources.agt -= 100;
            state.pendingEffects.push({ type: 'GRID_UPDATE', updates: [state.grid[index]] });
        }
    }

    /**
     * Places a subterranean building (e.g. pipe) at a specific layer.
     */
    public placeSubBuilding(index: number, buildingType: BuildingType, layer: number, state: GameState, isInstant: boolean = false): void {
        const grid = state.grid;
        const tile = grid[index];
        if (!tile) return;

        const def = BUILDINGS[buildingType];
        if (!def) return;

        // Initialize sub-layer structures if missing
        if (!tile.subBuildings) tile.subBuildings = {};
        if (!tile.digState) tile.digState = {};

        // Sub-buildings share construction state with the main tile for simplicity
        // But we track their type separately
        tile.subBuildings[layer] = buildingType;
        tile.isUnderConstruction = !isInstant;
        tile.constructionTimeLeft = isInstant ? 0 : def.buildTime;
        tile.structureHeadIndex = index; // Ensure we can find the head for completion

        // Start with a trench if it's the infrastructure layer
        if (layer === -1) {
            tile.digState[layer] = 1; // Trench
        }

        state.grid = updateWaterConnectivity(grid);
        state.pendingEffects.push({ type: 'GRID_UPDATE', updates: [tile] });
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BUILD_START });
    }

    /**
     * Removes a subterranean building.
     */
    public bulldozeSubBuilding(index: number, layer: number, state: GameState): void {
        const grid = state.grid;
        const tile = grid[index];
        if (!tile || !tile.subBuildings) return;

        if (tile.subBuildings[layer]) {
            delete tile.subBuildings[layer];

            // If no more sub buildings, reset digState
            if (Object.keys(tile.subBuildings).length === 0) {
                if (tile.digState) tile.digState[layer] = 0; // Filled
            }
        }

        state.grid = updateWaterConnectivity(grid);
        state.pendingEffects.push({ type: 'GRID_UPDATE', updates: [tile] });
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BULLDOZE });
    }

    /**
     * Ensures all tiles of a multi-tile building are in the same state.
     */
    private enforceMultiTileConsistency(state: GameState): void {
        const grid = state.grid;
        for (let i = 0; i < grid.length; i++) {
            const tile = grid[i];
            if (tile.structureHeadIndex !== undefined && tile.structureHeadIndex !== i) {
                const head = grid[tile.structureHeadIndex];
                if (!head || head.buildingType === BuildingType.EMPTY) {
                    // Head is gone, orphan tile cleanup
                    tile.buildingType = BuildingType.EMPTY;
                    tile.structureHeadIndex = undefined;
                    tile.isUnderConstruction = false;
                } else {
                    // Sync state from head
                    tile.buildingType = head.buildingType;
                    tile.isUnderConstruction = head.isUnderConstruction;
                }
            }
        }
    }

    /**
     * Upgrades a building to the next level.
     */
    public upgradeBuilding(index: number, state: GameState): void {
        const grid = state.grid;
        const tile = grid[index];
        if (!tile || tile.buildingType === BuildingType.EMPTY) return;

        // Ensure we are operating on the head tile
        const headIdx = tile.structureHeadIndex !== undefined ? tile.structureHeadIndex : index;
        const headTile = grid[headIdx];
        if (!headTile) return;

        // Increment level
        headTile.level = (headTile.level || 1) + 1;

        // Sync to parts if multi-tile
        const def = BUILDINGS[headTile.buildingType];
        if (def && (def.width || 1) > 1 || (def.depth || 1) > 1) {
            const w = def.width || 1;
            const d = def.depth || 1;
            for (let dz = 0; dz < d; dz++) {
                for (let dx = 0; dx < w; dx++) {
                    const idx = (Math.floor(headIdx / GRID_SIZE) + dz) * GRID_SIZE + ((headIdx % GRID_SIZE) + dx);
                    if (grid[idx] && grid[idx].structureHeadIndex === headIdx) {
                        grid[idx].level = headTile.level;
                    }
                }
            }
        }

        // Trigger Effect
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.COMPLETE }); // Upgrade sound
        state.pendingEffects.push({ type: 'GRID_UPDATE', updates: [headTile] });
    }
}
