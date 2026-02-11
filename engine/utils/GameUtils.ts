
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { BuildingType, BiomeType, GridTile, FoliageType, Chunk } from '../types';
import { BUILDINGS } from '../data/VoxelConstants';
import { getBiomeAt } from '../worldgen/Core';

// Map Constants
export const DEFAULT_VIEW_RADIUS = 6;

// Note: World generation logic (noises, biome distribution) has been isolated 
// into 'engine/worldgen'. Do not add procedural logic here.

// --- GAME LOGIC ---

import { ChunkStore } from '../space/ChunkStore';

/**
 * Propagates water connectivity across the entire chunked world.
 */
export function updateWaterConnectivity(chunks: Record<string, Chunk>): Record<string, Chunk> {
    const connectedCoords = new Set<string>();
    const queue: { x: number, z: number }[] = [];

    // 1. Seed queue with all Water Sources
    for (const chunk of Object.values(chunks)) {
        for (const tile of chunk.tiles) {
            if (tile.buildingType === BuildingType.POND || tile.buildingType === BuildingType.WATER_WELL) {
                const key = `${tile.x},${tile.z}`;
                if (!connectedCoords.has(key)) {
                    connectedCoords.add(key);
                    queue.push({ x: tile.x, z: tile.z });
                }
            }
        }
    }

    // 2. BFS Flood Fill through Surface Network (Pipes, Wells, Ponds)
    while (queue.length > 0) {
        const curr = queue.shift()!;

        // Check Neighbors (North, South, East, West)
        const neighbors = [
            { x: curr.x, z: curr.z - 1 },
            { x: curr.x, z: curr.z + 1 },
            { x: curr.x - 1, z: curr.z },
            { x: curr.x + 1, z: curr.z }
        ];

        for (const n of neighbors) {
            const key = `${n.x},${n.z}`;
            if (connectedCoords.has(key)) continue;

            const tile = ChunkStore.getTile(chunks, n.x, n.z);
            if (!tile) continue;

            // Propagation happens via pipes
            const hasPipe = tile.buildingType === BuildingType.PIPE;
            // Also sources themselves act as nodes in the network
            const isSource = tile.buildingType === BuildingType.WATER_WELL || tile.buildingType === BuildingType.POND;

            if (hasPipe || isSource) {
                connectedCoords.add(key);
                queue.push(n);
            }
        }
    }

    // 3. Map status back to tiles in all chunks
    for (const chunk of Object.values(chunks)) {
        for (let i = 0; i < chunk.tiles.length; i++) {
            const tile = chunk.tiles[i];
            const isNetworked = connectedCoords.has(`${tile.x},${tile.z}`);

            if (tile.buildingType !== BuildingType.EMPTY) {
                const newStatus = isNetworked ? 'CONNECTED' : 'DISCONNECTED';
                if (tile.waterStatus !== newStatus) {
                    chunk.tiles[i] = { ...tile, waterStatus: newStatus };
                    chunk.simDirty = true;
                }
            }
        }
    }

    return chunks;
}

// Utility: Check if a tile is connected to a water source via pipes
export function isConnectedToWater(chunks: Record<string, Chunk>, startX: number, startZ: number): boolean {
    const queue: { x: number, z: number }[] = [{ x: startX, z: startZ }];
    const visited = new Set<string>();
    visited.add(`${startX},${startZ}`);

    while (queue.length > 0) {
        const curr = queue.shift()!;

        // Check Neighbors
        const neighbors = [
            { x: curr.x, z: curr.z - 1 },
            { x: curr.x, z: curr.z + 1 },
            { x: curr.x - 1, z: curr.z },
            { x: curr.x + 1, z: curr.z }
        ];

        for (const n of neighbors) {
            const key = `${n.x},${n.z}`;
            if (visited.has(key)) continue;

            const tile = ChunkStore.getTile(chunks, n.x, n.z);
            if (!tile) continue;

            if (tile.buildingType === BuildingType.POND || tile.buildingType === BuildingType.WATER_WELL) {
                return true;
            }

            if (tile.buildingType === BuildingType.PIPE) {
                visited.add(key);
                queue.push(n);
            }
        }
    }
    return false;
}

// 0-100 Eco Score to Multiplier
export function getEcoMultiplier(eco: number): number {
    return 0.5 + (1.5 * (eco / 100));
}

// Helper: Count buildings for Scaling Costs
export function calculateBuildingCost(type: BuildingType | null, chunks: Record<string, Chunk>): number {
    if (!type) return 0;

    const base = BUILDINGS[type].cost;

    if (type === BuildingType.ROAD || type === BuildingType.PIPE) {
        return base;
    }

    let count = 0;
    for (const chunk of Object.values(chunks)) {
        for (const tile of chunk.tiles) {
            if (tile.buildingType === type) {
                // For multi-tile buildings, only count the head to avoid over-inflation
                if (tile.structureHeadX === undefined || (tile.structureHeadX === tile.x && tile.structureHeadZ === tile.z)) {
                    count++;
                }
            }
        }
    }

    // Inflation Formula: Base * (1.15 ^ count)
    return Math.floor(base * Math.pow(1.15, count));
}

// Helper: Bresenham's Line Algorithm for Grid
export function getLineCoordinates(x0: number, z0: number, x1: number, z1: number): { x: number, z: number }[] {
    const path: { x: number, z: number }[] = [];

    const dx = Math.abs(x1 - x0);
    const dz = Math.abs(z1 - z0);
    const sx = (x0 < x1) ? 1 : -1;
    const sz = (z0 < z1) ? 1 : -1;
    let err = dx - dz;

    let cx = x0;
    let cz = z0;

    while (true) {
        path.push({ x: cx, z: cz });

        if ((cx === x1) && (cz === z1)) break;

        const e2 = 2 * err;
        if (e2 > -dz) {
            err -= dz;
            cx += sx;
        }
        if (e2 < dx) {
            err += dx;
            cz += sz;
        }
    }
    return path;
}

export function pseudoRandom(seed: number) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
        s = s * 16807 % 2147483647;
        return (s - 1) / 2147483646;
    };
}


// --- HARVESTABLE RESOURCES ---

export const HARVESTABLE_ROCKS: FoliageType[] = [
    'ROCK_ICY' as FoliageType,
    'ROCK_SANDSTONE' as FoliageType,
    'ROCK_BOULDER' as FoliageType,
    'ROCK_PEBBLE' as FoliageType,
    'ROCK_MOSSY' as FoliageType,
    'CRYSTAL_SPIKE' as FoliageType,
    'BONE_RIB' as FoliageType,
    'ROCK_STUMP' as any // Fallback
];

export const HARVESTABLE_TREES: FoliageType[] = [
    'TREE_OAK' as FoliageType,
    'TREE_BIRCH' as FoliageType,
    'TREE_WILLOW' as FoliageType,
    'TREE_APPLE' as FoliageType,
    'TREE_PINE' as FoliageType,
    'TREE_FROSTED_PINE' as FoliageType,
    'TREE_TALL_PINE' as FoliageType,
    'TREE_PALM' as FoliageType,
    'TREE_DEAD' as FoliageType,
    'TREE_STUMP' as FoliageType,
    'CACTUS_SAGUARO' as FoliageType,
    'CACTUS_BARREL' as FoliageType,
    'BUSH_OAK' as FoliageType,
    'BUSH_THORN' as FoliageType,
    'SHRUB_WINTER' as FoliageType,
    'SHRUB_DRY' as FoliageType,
    'MUSHROOM_GIANT' as FoliageType
];

export function isHarvestable(foliage: FoliageType | string | undefined): boolean {
    if (!foliage || foliage === 'NONE') return false;
    const f = foliage as FoliageType;
    return HARVESTABLE_ROCKS.includes(f) || HARVESTABLE_TREES.includes(f);
}
