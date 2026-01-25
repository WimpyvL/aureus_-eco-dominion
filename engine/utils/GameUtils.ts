
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { BuildingType, BiomeType, GridTile, FoliageType } from '../../types';
import { BUILDINGS } from '../data/VoxelConstants';
import { getBiomeAt } from '../worldgen/Core';

// Map Size: 45x45 total.
// Playable area: 35x35 in the center (much larger buildable area).
// Padding: 5 tiles on each side (reduced from 15).
export const GRID_SIZE = 45;
const PLAYABLE_SIZE = 35; // Increased from 15
const PADDING = 5; // Reduced from 15 - (45 - 35) / 2 = 5

// Note: World generation logic (noises, biome distribution) has been isolated 
// into 'engine/worldgen'. Do not add procedural logic here.

// --- GAME LOGIC ---

/**
 * Propagates water connectivity across the entire grid.
 */
export function updateWaterConnectivity(grid: GridTile[]): GridTile[] {
    const connectedIndices = new Set<number>();
    const queue: number[] = [];

    // 1. Seed queue with all Water Sources (Surface buildings providing water)
    grid.forEach((tile, i) => {
        if (tile.buildingType === BuildingType.POND || tile.buildingType === BuildingType.WATER_WELL) {
            connectedIndices.add(i);
            queue.push(i);
        }
    });

    // 2. BFS Flood Fill through layer -1 (Underground Network)
    while (queue.length > 0) {
        const currIdx = queue.shift()!;

        // Check Neighbors
        const neighbors = [
            currIdx - GRID_SIZE, // Up
            currIdx + GRID_SIZE, // Down
            currIdx % GRID_SIZE !== 0 ? currIdx - 1 : -1, // Left
            (currIdx + 1) % GRID_SIZE !== 0 ? currIdx + 1 : -1 // Right
        ].filter(n => n >= 0 && n < grid.length);

        for (const n of neighbors) {
            if (connectedIndices.has(n)) continue;

            const tile = grid[n];
            // Propagation happens via pipes at layer -1
            const hasPipe = tile.subBuildings?.[-1] === BuildingType.PIPE;
            // Also sources themselves act as nodes in the network
            const isSource = tile.buildingType === BuildingType.WATER_WELL || tile.buildingType === BuildingType.POND;

            if (hasPipe || isSource) {
                connectedIndices.add(n);
                queue.push(n);
            }
        }
    }

    // 3. Map status back to grid
    return grid.map((tile, i) => {
        // A tile is part of the network if it's in connectedIndices
        const isNetworked = connectedIndices.has(i);

        // If it's a building that needs water, it's connected if its tile index is networked
        // (Assuming a pipe exists on the same tile at layer -1 or it's a source)
        if (tile.buildingType !== BuildingType.EMPTY) {
            return { ...tile, waterStatus: isNetworked ? 'CONNECTED' : 'DISCONNECTED' };
        }

        // Also update the visual state of pipes if they are in sub-buildings
        if (tile.subBuildings?.[-1] === BuildingType.PIPE) {
            // This allows pipes to show as connected visual-wise
            return { ...tile, waterStatus: isNetworked ? 'CONNECTED' : 'DISCONNECTED' };
        }

        return tile;
    });
}

// Utility: Check if a tile is connected to a water source via pipes
export function isConnectedToWater(grid: GridTile[], startIndex: number): boolean {
    // BFS through the same layer -1 logic
    const queue = [startIndex];
    const visited = new Set<number>();
    visited.add(startIndex);

    while (queue.length > 0) {
        const currIdx = queue.shift()!;

        // Check Neighbors
        const neighbors = [
            currIdx - GRID_SIZE, // Up
            currIdx + GRID_SIZE, // Down
            currIdx % GRID_SIZE !== 0 ? currIdx - 1 : -1, // Left
            (currIdx + 1) % GRID_SIZE !== 0 ? currIdx + 1 : -1 // Right
        ].filter(n => n >= 0 && n < grid.length);

        for (const n of neighbors) {
            if (visited.has(n)) continue;
            const tile = grid[n];

            // Found Water Source!
            if (tile.buildingType === BuildingType.POND || tile.buildingType === BuildingType.WATER_WELL) {
                return true;
            }

            // Continue searching if there's a pipe at layer -1
            if (tile.subBuildings?.[-1] === BuildingType.PIPE) {
                visited.add(n);
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
export function calculateBuildingCost(type: BuildingType, grid: GridTile[]): number {
    const base = BUILDINGS[type].cost;

    // Infrastructure (Roads/Pipes) should have flat cost, no inflation
    if (type === BuildingType.ROAD || type === BuildingType.PIPE) {
        return base;
    }

    // Logic for 2-tile buildings: divide by width to avoid double counting
    const rawCount = grid.filter(t => t.buildingType === type).length;
    let count = rawCount;
    if (BUILDINGS[type].width === 2) count = Math.ceil(rawCount / 2);

    // Inflation Formula: Base * (1.15 ^ count)
    return Math.floor(base * Math.pow(1.15, count));
}

// Helper: Bresenham's Line Algorithm for Grid
export function getLineCoordinates(startIdx: number, endIdx: number): number[] {
    const x0 = startIdx % GRID_SIZE;
    const y0 = Math.floor(startIdx / GRID_SIZE);
    const x1 = endIdx % GRID_SIZE;
    const y1 = Math.floor(endIdx / GRID_SIZE);

    const path: number[] = [];

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    let cx = x0;
    let cy = y0;

    while (true) {
        path.push(cy * GRID_SIZE + cx);

        if ((cx === x1) && (cy === y1)) break;

        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            cx += sx;
        }
        if (e2 < dx) {
            err += dx;
            cy += sy;
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
