/**
 * Construction System
 * Handles building placement, bulldozing, and construction site management.
 * Manages consistency for multi-tile structures.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState, GridTile, BuildingType, SfxType, Chunk } from '../../../types';
import { BUILDINGS } from '../../data/VoxelConstants';
import { updateWaterConnectivity } from '../../utils/GameUtils';
import { ChunkStore } from '../../space/ChunkStore';
import { worldToChunk, CHUNK_SIZE } from '../../utils/coords';

export class ConstructionSystem extends BaseSimSystem {
    readonly id = 'construction';
    readonly priority = 60; // Run high to handle placement/removal before sim systems

    tick(ctx: FixedContext, state: GameState): void {
        // 1. Process Command Queue
        this.processCommandQueue(ctx, state);

        // 2. Passive Construction Progress (All head tiles under construction progress slowly)
        if (state.tickCount % 60 === 0) {
            for (const chunk of Object.values(state.chunks)) {
                for (const tile of chunk.tiles) {
                    // Only progress if it's a head tile (or single-tile) under construction
                    if (tile.isUnderConstruction && (tile.structureHeadX === undefined || (tile.structureHeadX === tile.x && tile.structureHeadZ === tile.z))) {
                        this.progressConstruction(tile.x, tile.z, 1.0, state);
                    }
                }
            }
        }

        // 3. Periodic consistency check for multi-tile buildings
        if (state.tickCount % 120 === 0) {
            this.enforceMultiTileConsistency(state);
        }
    }

    private processCommandQueue(ctx: FixedContext, state: GameState) {
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
                    this.placeBuilding(cmd.payload.x, cmd.payload.z, cmd.payload.buildingType, state, cmd.payload.isInstant);
                    break;
                case 'PLACE_SUB_BUILDING':
                    this.placeSubBuilding(cmd.payload.x, cmd.payload.z, cmd.payload.buildingType, cmd.payload.layer, state, cmd.payload.isInstant);
                    break;
                case 'BULLDOZE':
                    this.bulldozeBuilding(cmd.payload.x, cmd.payload.z, state);
                    break;
                case 'BULLDOZE_SUB':
                    this.bulldozeSubBuilding(cmd.payload.x, cmd.payload.z, cmd.payload.layer, state);
                    break;
                case 'SPEED_UP':
                    this.speedUpConstruction(cmd.payload.x, cmd.payload.z, state);
                    break;
                case 'REHABILITATE':
                    this.rehabilitateTile(ctx, cmd.payload.x, cmd.payload.z, state);
                    break;
                case 'UPGRADE_BUILDING':
                    this.handleUpgradeBuilding(cmd.payload.buildingId, state);
                    break;
                case 'MARK_HARVEST':
                    this.handleMarkHarvest(cmd.payload.x, cmd.payload.z, state);
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
    public progressConstruction(x: number, z: number, amount: number, state: GameState): boolean {
        const tile = ChunkStore.getTile(state.chunks, x, z);
        if (!tile || !tile.isUnderConstruction) return false;

        // Multi-tile buildings share progress via the head tile
        const hx = tile.structureHeadX !== undefined ? tile.structureHeadX : x;
        const hz = tile.structureHeadZ !== undefined ? tile.structureHeadZ : z;
        const headTile = ChunkStore.getTile(state.chunks, hx, hz);

        if (!headTile) return false;

        // CHECK FOLIAGE OBSTRUCTION
        const def = BUILDINGS[headTile.buildingType];
        if (def) {
            const w = def.width || 1;
            const d = def.depth || 1;

            for (let dz = 0; dz < d; dz++) {
                for (let dx = 0; dx < w; dx++) {
                    const tx = hx + dx;
                    const tz = hz + dz;
                    const pTile = ChunkStore.getTile(state.chunks, tx, tz);
                    if (pTile && (pTile.structureHeadX === hx && pTile.structureHeadZ === hz)) {
                        if (pTile.foliage && pTile.foliage !== 'NONE') {
                            return false; // Obstruction!
                        }
                    }
                }
            }
        }

        headTile.constructionTimeLeft = Math.max(0, (headTile.constructionTimeLeft || 0) - amount);

        if (headTile.constructionTimeLeft <= 0) {
            this.completeConstruction(hx, hz, state);
            return true; // Finished
        }

        return false; // Still ongoing
    }

    /**
     * Immediately completes construction for a building.
     */
    private completeConstruction(hx: number, hz: number, state: GameState): void {
        const headTile = ChunkStore.getTile(state.chunks, hx, hz);
        if (!headTile) return;

        const def = BUILDINGS[headTile.buildingType];
        if (!def) return;

        const w = def.width || 1;
        const d = def.depth || 1;

        const affectedChunks = new Set<string>();

        for (let dz = 0; dz < d; dz++) {
            for (let dx = 0; dx < w; dx++) {
                const tx = hx + dx;
                const tz = hz + dz;
                const pTile = ChunkStore.getTile(state.chunks, tx, tz);

                if (pTile && (pTile.structureHeadX === hx && pTile.structureHeadZ === hz)) {
                    pTile.isUnderConstruction = false;
                    pTile.constructionTimeLeft = 0;

                    if (pTile.structureHeadX === undefined) {
                        pTile.structureHeadX = hx;
                        pTile.structureHeadZ = hz;
                    }

                    if (pTile.digState) {
                        for (const layer in pTile.digState) {
                            if (pTile.digState[layer] === 1) pTile.digState[layer] = 2;
                        }
                    }

                    if (headTile.buildingType === BuildingType.MINING_HEADFRAME) {
                        if (!pTile.digState) pTile.digState = {};
                        if (!pTile.underground?.[-1]?.excavated) {
                            pTile.digState[-1] = 4;
                        }
                    }

                    const { cx, cz } = worldToChunk(tx, tz, CHUNK_SIZE);
                    affectedChunks.add(`${cx},${cz}`);
                }
            }
        }

        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.COMPLETE });
        for (const key of affectedChunks) {
            const [cx, cz] = key.split(',').map(Number);
            const chunk = state.chunks[key];
            if (chunk) {
                state.pendingEffects.push({ type: 'CHUNK_UPDATE', cx, cz, updates: chunk.tiles.filter(t => (t.structureHeadX === hx && t.structureHeadZ === hz)) });
            }
        }
        updateWaterConnectivity(state.chunks);
    }

    /**
     * Places a building on the grid.
     * Handles multi-tile footprint and initial construction state.
     */
    public placeBuilding(x: number, z: number, buildingType: BuildingType, state: GameState, isInstant: boolean = false): void {
        const def = BUILDINGS[buildingType];
        if (!def) return;

        const w = def.width || 1;
        const d = def.depth || 1;

        const affectedChunks = new Set<string>();
        const updates: GridTile[] = [];

        for (let dz = 0; dz < d; dz++) {
            for (let dx = 0; dx < w; dx++) {
                const tx = x + dx;
                const tz = z + dz;
                const tile = ChunkStore.getTile(state.chunks, tx, tz);
                if (tile) {
                    Object.assign(tile, {
                        buildingType,
                        isUnderConstruction: !isInstant,
                        constructionTimeLeft: isInstant ? 0 : def.buildTime,
                        structureHeadX: x,
                        structureHeadZ: z,
                        explored: true,
                        level: 1,
                        hasEntrance: buildingType === BuildingType.MINING_HEADFRAME
                    });
                    updates.push(tile);
                    const { cx, cz } = worldToChunk(tx, tz, CHUNK_SIZE);
                    affectedChunks.add(`${cx},${cz}`);
                }
            }
        }

        updateWaterConnectivity(state.chunks);
        for (const key of affectedChunks) {
            const [cx, cz] = key.split(',').map(Number);
            state.pendingEffects.push({
                type: 'CHUNK_UPDATE', cx, cz, updates: updates.filter(t => {
                    const c = worldToChunk(t.x, t.z, CHUNK_SIZE);
                    return c.cx === cx && c.cz === cz;
                })
            });
        }
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BUILD_START });
    }

    /**
     * Removes a building or foliage from a tile.
     * Handles multi-tile cleanup.
     */
    public bulldozeBuilding(x: number, z: number, state: GameState): void {
        const tile = ChunkStore.getTile(state.chunks, x, z);
        if (!tile) return;

        const updates: GridTile[] = [];
        const affectedChunks = new Set<string>();

        if (tile.foliage === 'ILLEGAL_CAMP') {
            tile.foliage = 'NONE';
            updates.push(tile);
            const { cx, cz } = worldToChunk(x, z, CHUNK_SIZE);
            affectedChunks.add(`${cx},${cz}`);
        } else if (tile.structureHeadX !== undefined && tile.structureHeadZ !== undefined) {
            const hx = tile.structureHeadX;
            const hz = tile.structureHeadZ;
            const headTile = ChunkStore.getTile(state.chunks, hx, hz);
            if (headTile) {
                const def = BUILDINGS[headTile.buildingType];
                const w = def?.width || 1;
                const d = def?.depth || 1;

                for (let dz = 0; dz < d; dz++) {
                    for (let dx = 0; dx < w; dx++) {
                        const tx = hx + dx;
                        const tz = hz + dz;
                        const pTile = ChunkStore.getTile(state.chunks, tx, tz);
                        if (pTile && pTile.structureHeadX === hx && pTile.structureHeadZ === hz) {
                            Object.assign(pTile, {
                                buildingType: BuildingType.EMPTY,
                                isUnderConstruction: false,
                                structureHeadX: undefined,
                                structureHeadZ: undefined,
                                constructionTimeLeft: 0,
                                hasEntrance: false
                            });
                            updates.push(pTile);
                            const { cx, cz } = worldToChunk(tx, tz, CHUNK_SIZE);
                            affectedChunks.add(`${cx},${cz}`);
                        }
                    }
                }
            }
        } else {
            tile.buildingType = BuildingType.EMPTY;
            tile.isUnderConstruction = false;
            tile.structureHeadX = undefined;
            tile.structureHeadZ = undefined;
            updates.push(tile);
            const { cx, cz } = worldToChunk(x, z, CHUNK_SIZE);
            affectedChunks.add(`${cx},${cz}`);
        }

        updateWaterConnectivity(state.chunks);
        for (const key of affectedChunks) {
            const [cx, cz] = key.split(',').map(Number);
            state.pendingEffects.push({
                type: 'CHUNK_UPDATE', cx, cz, updates: updates.filter(t => {
                    const c = worldToChunk(t.x, t.z, CHUNK_SIZE);
                    return c.cx === cx && c.cz === cz;
                })
            });
        }
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BULLDOZE });
    }

    /**
     * Instantly completes construction for a gem cost.
     */
    public speedUpConstruction(x: number, z: number, state: GameState): void {
        const tile = ChunkStore.getTile(state.chunks, x, z);
        if (!tile) return;

        const hx = tile.structureHeadX !== undefined ? tile.structureHeadX : x;
        const hz = tile.structureHeadZ !== undefined ? tile.structureHeadZ : z;
        this.completeConstruction(hx, hz, state);

        state.resources.gems = Math.max(0, state.resources.gems - 1);
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_CLICK });
    }

    /**
     * Initiates rehabilitation of a polluted tile.
     */
    public rehabilitateTile(ctx: FixedContext, x: number, z: number, state: GameState): void {
        if (state.resources.agt < 100) return;

        const exists = state.jobs.some(j => j.type === 'REHABILITATE' && j.targetX === x && j.targetZ === z);
        if (!exists) {
            state.jobs.push({
                id: ctx.getNextId?.('rehab') || `rehab_${x}_${z}_${Date.now()}`,
                type: 'REHABILITATE',
                targetX: x,
                targetZ: z,
                priority: 25,
                assignedAgentId: null
            });
            const tile = ChunkStore.getTile(state.chunks, x, z);
            if (tile) {
                tile.rehabProgress = 0.1;
                state.resources.agt -= 100;
                const { cx, cz } = worldToChunk(x, z, CHUNK_SIZE);
                state.pendingEffects.push({ type: 'CHUNK_UPDATE', cx, cz, updates: [tile] });
            }
        }
    }

    public placeSubBuilding(x: number, z: number, buildingType: BuildingType, layer: number, state: GameState, isInstant: boolean = false): void {
        const tile = ChunkStore.getTile(state.chunks, x, z);
        if (!tile) return;

        const def = BUILDINGS[buildingType];
        if (!def) return;

        if (!tile.subBuildings) tile.subBuildings = {};
        if (!tile.digState) tile.digState = {};

        tile.subBuildings[layer] = buildingType;
        tile.isUnderConstruction = !isInstant;
        tile.constructionTimeLeft = isInstant ? 0 : def.buildTime;
        tile.structureHeadX = x;
        tile.structureHeadZ = z;

        if (layer === -1) {
            tile.digState[layer] = 1; // Trench
        }

        updateWaterConnectivity(state.chunks);
        const { cx, cz } = worldToChunk(x, z, CHUNK_SIZE);
        state.pendingEffects.push({ type: 'CHUNK_UPDATE', cx, cz, updates: [tile] });
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BUILD_START });
    }

    public bulldozeSubBuilding(x: number, z: number, layer: number, state: GameState): void {
        const tile = ChunkStore.getTile(state.chunks, x, z);
        if (!tile || !tile.subBuildings) return;

        if (tile.subBuildings[layer]) {
            delete tile.subBuildings[layer];
            if (Object.keys(tile.subBuildings).length === 0) {
                if (tile.digState) tile.digState[layer] = 0; // Filled
            }
        }

        updateWaterConnectivity(state.chunks);
        const { cx, cz } = worldToChunk(x, z, CHUNK_SIZE);
        state.pendingEffects.push({ type: 'CHUNK_UPDATE', cx, cz, updates: [tile] });
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BULLDOZE });
    }

    /**
     * Ensures all tiles of a multi-tile building are in the same state.
     */
    private enforceMultiTileConsistency(state: GameState): void {
        for (const chunk of Object.values(state.chunks)) {
            for (const tile of chunk.tiles) {
                if (tile.structureHeadX !== undefined && tile.structureHeadZ !== undefined && (tile.structureHeadX !== tile.x || tile.structureHeadZ !== tile.z)) {
                    const head = ChunkStore.getTile(state.chunks, tile.structureHeadX, tile.structureHeadZ);
                    if (!head || head.buildingType === BuildingType.EMPTY) {
                        tile.buildingType = BuildingType.EMPTY;
                        tile.structureHeadX = undefined;
                        tile.structureHeadZ = undefined;
                        tile.isUnderConstruction = false;
                        chunk.meshDirty = true;
                    } else {
                        tile.buildingType = head.buildingType;
                        tile.isUnderConstruction = head.isUnderConstruction;
                    }
                }
            }
        }
    }

    /**
     * Upgrades a building to the next level.
     */
    public upgradeBuilding(ctx: FixedContext, x: number, z: number, state: GameState): void {
        const tile = ChunkStore.getTile(state.chunks, x, z);
        if (!tile || tile.buildingType === BuildingType.EMPTY) return;

        const hx = tile.structureHeadX !== undefined ? tile.structureHeadX : x;
        const hz = tile.structureHeadZ !== undefined ? tile.structureHeadZ : z;
        const headTile = ChunkStore.getTile(state.chunks, hx, hz);
        if (!headTile) return;

        const def = BUILDINGS[headTile.buildingType];
        if (!def || !def.upgrades) {
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_CLICK });
            return;
        }

        const currentLevel = headTile.level || 1;
        const nextLevel = currentLevel + 1;
        const upgrade = def.upgrades.find(u => u.level === nextLevel);

        if (!upgrade) {
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_CLICK });
            return;
        }

        if (upgrade.era && state.currentEra < upgrade.era && !state.unlockedEras?.includes(upgrade.era)) {
            if (!state.cheatsEnabled) {
                state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_CLICK });
                return;
            }
        }

        const costs = upgrade.costs || {};
        if (!state.cheatsEnabled) {
            if ((state.resources.agt || 0) < (costs.agt || 0) ||
                (state.resources.minerals || 0) < (costs.minerals || 0) ||
                (state.resources.wood || 0) < (costs.wood || 0) ||
                (state.resources.stone || 0) < (costs.stone || 0) ||
                (state.resources.gems || 0) < (costs.gems || 0)) {

                state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_CLICK });
                return;
            }

            state.resources.agt = (state.resources.agt || 0) - (costs.agt || 0);
            state.resources.minerals = (state.resources.minerals || 0) - (costs.minerals || 0);
            state.resources.wood = (state.resources.wood || 0) - (costs.wood || 0);
            state.resources.stone = (state.resources.stone || 0) - (costs.stone || 0);
            state.resources.gems = (state.resources.gems || 0) - (costs.gems || 0);
        }

        headTile.level = nextLevel;
        headTile.isUnderConstruction = true;
        headTile.constructionTimeLeft = def.buildTime || 10;

        const affectedChunks = new Set<string>();
        const updates: GridTile[] = [headTile];
        const { cx: hcx, cz: hcz } = worldToChunk(hx, hz, CHUNK_SIZE);
        affectedChunks.add(`${hcx},${hcz}`);

        if ((def.width || 1) > 1 || (def.depth || 1) > 1) {
            const w = def.width || 1;
            const d = def.depth || 1;
            for (let dz = 0; dz < d; dz++) {
                for (let dx = 0; dx < w; dx++) {
                    const tx = hx + dx;
                    const tz = hz + dz;
                    const pTile = ChunkStore.getTile(state.chunks, tx, tz);
                    if (pTile && pTile.structureHeadX === hx && pTile.structureHeadZ === hz) {
                        pTile.level = headTile.level;
                        pTile.isUnderConstruction = true;
                        pTile.constructionTimeLeft = headTile.constructionTimeLeft;
                        updates.push(pTile);
                        const { cx, cz } = worldToChunk(tx, tz, CHUNK_SIZE);
                        affectedChunks.add(`${cx},${cz}`);
                    }
                }
            }
        }

        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BUILD_START });
        for (const key of affectedChunks) {
            const [cx, cz] = key.split(',').map(Number);
            state.pendingEffects.push({
                type: 'CHUNK_UPDATE', cx, cz, updates: updates.filter(t => {
                    const c = worldToChunk(t.x, t.z, CHUNK_SIZE);
                    return c.cx === cx && c.cz === cz;
                })
            });
        }

        state.newsFeed.unshift({
            id: ctx.getNextId?.('upgrade') || `upgrade_${Date.now()}`,
            headline: `${def.name} upgrading to Level ${nextLevel}...`,
            type: 'POSITIVE',
            timestamp: state.tickCount
        });
    }

    private handleMarkHarvest(x: number, z: number, state: GameState) {
        const tile = ChunkStore.getTile(state.chunks, x, z);
        if (!tile || !tile.foliage || tile.foliage === 'NONE') return;

        tile.markedForHarvest = !tile.markedForHarvest;
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_CLICK });
    }

    private handleUpgradeBuilding(id: string, state: GameState) {
        // Find building by ID
        for (const chunk of Object.values(state.chunks)) {
            const tile = chunk.tiles.find(t => t.id === id || (t.buildingType !== BuildingType.EMPTY && t.x + '_' + t.z === id));
            if (tile) {
                this.upgradeBuilding({ time: 0, delta: 0 } as any, tile.x, tile.z, state);
                return;
            }
        }
    }
}
