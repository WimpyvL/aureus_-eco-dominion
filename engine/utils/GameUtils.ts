
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { BuildingType, BiomeType, GridTile, FoliageType } from '../../types';
import { BUILDINGS } from '../data/VoxelConstants';

// Map Size: 45x45 total.
// Playable area: 35x35 in the center (much larger buildable area).
// Padding: 5 tiles on each side (reduced from 15).
export const GRID_SIZE = 45;
const PLAYABLE_SIZE = 35; // Increased from 15
const PADDING = 5; // Reduced from 15 - (45 - 35) / 2 = 5

// --- NOISE LOGIC (Exported as string for Worker Injection) ---
export const NOISE_SOURCE = `
// Simple fast 2D hash
function hash(x, y, seed) {
    let k = x * 0.3183099 + 0.3678794;
    y = y * 0.3183099 + 0.3678794;
    let h = Math.sin(k * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return h - Math.floor(h);
}

function noise(x, y, seed) {
    let i = Math.floor(x);
    let j = Math.floor(y);
    let f = x - i;
    let g = y - j;

    // Quintic interpolation
    let u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    let v = g * g * g * (g * (g * 6.0 - 15.0) + 10.0);

    let a = hash(i, j, seed);
    let b = hash(i + 1, j, seed);
    let c = hash(i, j + 1, seed);
    let d = hash(i + 1, j + 1, seed);

    return (a + (b - a) * u) + (c - a) * v * (1.0 - u) + (d - b) * u * v;
}

function fbm(x, y, octaves, persistence, lacunarity, seed) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
        total += noise(x * frequency, y * frequency, seed) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }
    return total / maxValue;
}

function getBiomeAt(x, z) {
    // Lower frequencies for larger, more natural features
    const elevation = fbm(x * 0.007, z * 0.007, 6, 0.5, 2.0, 999.9);
    const temp = fbm(x * 0.003, z * 0.003, 3, 0.5, 2.0, 123.4);
    const moisture = fbm(x * 0.003, z * 0.003, 3, 0.5, 2.0, 567.8);
    const detail = fbm(x * 0.1, z * 0.1, 2, 0.5, 2.0, 111.1);

    // Safe zone logic (Playable area is approx -22 to +22)
    const dist = Math.sqrt(x * x + z * z);
    const isSafeZone = dist < 14;

    let biome = 'GRASS';
    let height = 1; // Default flat land

    if (isSafeZone) {
        // Guaranteed flat land at start
        biome = 'GRASS';
        height = 1;
    } else {
        // --- HEIGHT & WATER MAP ---
        if (elevation < 0.33) {
            height = 0; // Water level (Larger Oceans/Lakes)
        } else if (elevation < 0.40) {
            height = 1; // Beach/Low
        } else if (elevation < 0.65) {
            // Hills: Scale 2 to 10
            height = 2 + Math.floor((elevation - 0.40) * 32);
        } else {
            // Mountains: Scale 10 to ~50
            // Exponential growth for jagged peaks
            let n = (elevation - 0.65) / 0.35;
            height = 10 + Math.floor(n * n * 100);
        }

        // Limit world height to 32 max
        height = Math.min(32, height);

        // --- BIOME MAP ---
        // Altitude affects biome (cooling effect)
        let adjTemp = temp - (height * 0.02);

        if (height >= 12) {
            biome = 'STONE';
            if (height > 20) biome = 'SNOW'; // High Peaks
        } else if (height === 0) {
            biome = 'GRASS'; // Riverbed/Lakebed base
        } else {
            // Land Biomes
            if (adjTemp < 0.35) {
                biome = 'SNOW';
            } else if (adjTemp > 0.60) {
                if (moisture < 0.25) {
                    biome = 'SAND'; // Desert
                } else {
                    biome = 'GRASS'; // Jungle/Savanna
                }
            } else {
                if (moisture < 0.3) {
                    biome = 'DIRT'; // Badlands
                } else {
                    biome = 'GRASS'; // Forest
                }
            }

            // Rocky Cliffs blend with detail noise
            if (detail > 0.7 && height > 4) {
                biome = 'STONE';
            }
        }
    }

    return { biome, height, temp, moisture, detail };
}
`;

export const TREE_LOGIC_SOURCE = `
const Random = {
    _seed: 12345,
    setSeed: (s) => { Random._seed = s; },
    next: () => {
        Random._seed = (Random._seed * 1664525 + 1013904223) >>> 0;
        return Random._seed / 4294967296;
    }
};

const Generators = {
    simple: (voxels) => voxels,
    rock: (radius, mat, accentMat) => {
        const voxels = [];
        for (let x = -radius; x <= radius; x++) {
            for (let y = 0; y <= radius * 1.2; y++) {
                for (let z = -radius; z <= radius; z++) {
                    // Use coordinate hashing for stability or just the random stream?
                    // User requested "Deterministic RNG" - usually implies seeded stream per chunk/object.
                    // For procedural generation in loop, simple stream is okay if order is deterministic.
                    if (x * x + (y * 0.8) * (y * 0.8) + z * z <= radius * radius && Random.next() > 0.1) {
                        const m = (accentMat && Random.next() > 0.7) ? accentMat : mat;
                        voxels.push({ x: x, y: y, z: z, c: m });
                    }
                }
            }
        }
        return voxels;
    },
    basicTree: (height, leafRad, trunkMat, leafMat) => {
        const voxels = [];
        for (let y = 0; y < height; y++) {
            voxels.push({ x: 0, y: y, z: 0, c: trunkMat });
            if (y === 0) { voxels.push({ x: 1, y: 0, z: 0, c: trunkMat }); voxels.push({ x: -1, y: 0, z: 0, c: trunkMat }); voxels.push({ x: 0, y: 0, z: 1, c: trunkMat }); voxels.push({ x: 0, y: 0, z: -1, c: trunkMat }); }
        }
        for (let x = -leafRad; x <= leafRad; x++) for (let y = -leafRad; y <= leafRad; y++) for (let z = -leafRad; z <= leafRad; z++) {
            if (Math.sqrt(x * x + y * y + z * z) <= leafRad && Random.next() > 0.2) voxels.push({ x: x, y: height + y, z: z, c: leafMat });
        }
        return voxels;
    },
    pineTree: (height, trunkMat, leafMat) => {
        const voxels = [];
        for (let y = 0; y < height; y++) voxels.push({ x: 0, y: y, z: 0, c: trunkMat });
        let w = 3;
        for (let y = 2; y < height; y += 2) {
            for (let x = -w; x <= w; x++) for (let z = -w; z <= w; z++) if (Math.abs(x) + Math.abs(z) <= w + 0.5) voxels.push({ x: x, y: y, z: z, c: leafMat });
            w = Math.max(0, w - 1);
        }
        voxels.push({ x: 0, y: height, z: 0, c: leafMat });
        return voxels;
    },
    cactus: (height, mat) => {
        const voxels = [];
        for (let y = 0; y < height; y++) { voxels.push({ x: 0, y: y, z: 0, c: mat }); if (y < height - 1 && y > 0) { voxels.push({ x: 1, y: y, z: 0, c: mat }); voxels.push({ x: 0, y: y, z: 1, c: mat }); } }
        // Arms
        voxels.push({ x: 2, y: 3, z: 0, c: mat }); voxels.push({ x: 2, y: 4, z: 0, c: mat }); voxels.push({ x: 2, y: 5, z: 0, c: mat });
        return voxels;
    }
};

const TreeDefs = {
    'TREE_OAK': () => Generators.basicTree(10, 4, 'wood', 'leaf'),
    'TREE_BIRCH': () => Generators.basicTree(12, 3, 'birch', 'birchLeaf'),
    'TREE_PINE': () => Generators.pineTree(14, 'wood', 'pine'),
    'TREE_FROSTED_PINE': () => Generators.pineTree(14, 'wood', 'snow'),
    'CACTUS_SAGUARO': () => Generators.cactus(6, 'cactus'),
    'ROCK_BOULDER': () => Generators.rock(2, 'rock'),
    'ROCK_PEBBLE': () => [{ x: 0, y: 0, z: 0, c: 'rock' }],
    'FLOWER_YELLOW': () => [{ x: 0, y: 0, z: 0, c: 'flowerYellow' }],
    'FLOWER_ALPINE': () => [{ x: 0, y: 0, z: 0, c: 'flower' }],
    'BUSH_OAK': () => Generators.rock(1, 'leaf'),
    'SHRUB_DRY': () => Generators.rock(1, 'dead'),
    'CRYSTAL_SPIKE': () => [{ x: 0, y: 0, z: 0, c: 'crystal' }, { x: 0, y: 1, z: 0, c: 'crystal' }, { x: 0, y: 2, z: 0, c: 'crystal' }],
    'GOLD_VEIN': () => Generators.rock(2, 'rock', 'gold'), // Gold accent
    'MINE_HOLE': () => {
        const v = [];
        v.push({ x: 0, y: -1, z: 0, c: 'dead' });
        v.push({ x: 1, y: 0, z: 0, c: 'rock' }); v.push({ x: -1, y: 0, z: 0, c: 'rock' });
        v.push({ x: 0, y: 0, z: 1, c: 'rock' }); v.push({ x: 0, y: 0, z: -1, c: 'rock' });
        return v;
    }
};

function getFoliageAt(biome, height, detail, distFromCenter, randVal) {
    let foliage = 'NONE';
    const rand = randVal !== undefined ? randVal : Math.random();

    // --- GOLD LOGIC ---
    // Reduced gold distribution (Sparse resources)
    let goldChance = 0.002; // Base chance (0.2%)

    if (biome === 'STONE' || height >= 8) goldChance = 0.035; // Mountains (3.5%)
    else if (biome === 'DIRT') goldChance = 0.015; // Badlands (1.5%)
    else if (biome === 'SAND') goldChance = 0.005; // Desert (0.5%)

    // Very rarely find gold in forest
    if (biome === 'GRASS' && detail > 0.8) goldChance = 0.002;

    if (rand < goldChance) return 'GOLD_VEIN';

    // --- FOLIAGE LOGIC (Heavily reduced for 60fps target) ---

    if (biome === 'SAND') {
        if (rand > 0.99) foliage = 'CACTUS_SAGUARO';
        else if (rand > 0.97) foliage = 'SHRUB_DRY';
    }
    else if (biome === 'STONE') {
        if (rand > 0.99) foliage = 'CRYSTAL_SPIKE';
        else if (rand > 0.96) foliage = 'ROCK_PEBBLE';
    }
    else if (biome === 'DIRT') {
        if (rand > 0.98) foliage = 'TREE_DEAD';
        else if (rand > 0.96) foliage = 'BUSH_THORN';
    }
    else if (biome === 'SNOW') {
        if (rand > 0.97) foliage = 'TREE_FROSTED_PINE';
    }
    else if (biome === 'GRASS') {
        // Grass Biome - Very sparse for performance
        if (detail > 0.6) {
            // Forest - Sparse trees
            if (rand > 0.96) foliage = 'TREE_OAK';
            else if (rand > 0.94) foliage = 'TREE_BIRCH';
        } else {
            // Plains - Minimal
            if (rand > 0.99) foliage = 'TREE_OAK';
            else if (rand > 0.97) foliage = 'FLOWER_YELLOW';
        }
    }

    return foliage;
}
`;

// --- JS Implementation of the string above for Main Thread ---
// We eval this in the main thread to ensure EXACT math parity with the worker
// without complex bundling.
const SCOPE: any = {};
// eslint-disable-next-line no-new-func
const _loader = new Function(NOISE_SOURCE + `
return { getBiomeAt };
`);
const { getBiomeAt } = _loader();

// --- GAME LOGIC ---

/**
 * Propagates water connectivity across the entire grid.
 */
export function updateWaterConnectivity(grid: GridTile[]): GridTile[] {
    const connectedIndices = new Set<number>();
    const queue: number[] = [];

    // 1. Seed queue with all Water Sources
    grid.forEach((tile, i) => {
        if (tile.buildingType === BuildingType.POND || tile.buildingType === BuildingType.WATER_WELL) {
            connectedIndices.add(i);
            queue.push(i);
        }
    });

    // 2. BFS Flood Fill
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
            // We can flow through pipes and any building that connects to pipes
            // (Basically any non-empty lot that isn't under construction or just empty terrain)
            const canConduct = tile.buildingType === BuildingType.PIPE ||
                tile.buildingType === BuildingType.WASH_PLANT ||
                tile.buildingType === BuildingType.RECYCLING_PLANT ||
                tile.buildingType === BuildingType.WATER_WELL ||
                tile.buildingType === BuildingType.POND;

            if (canConduct) {
                connectedIndices.add(n);
                queue.push(n);
            }
        }
    }

    // 3. Map status back to grid
    return grid.map((tile, i) => {
        // Only buildings that actually CARE about water get a status (visual pipes)
        if (tile.buildingType === BuildingType.PIPE) {
            return { ...tile, waterStatus: connectedIndices.has(i) ? 'CONNECTED' : 'DISCONNECTED' };
        }
        return tile;
    });
}

// Utility: Check if a tile is connected to a water source via pipes
export function isConnectedToWater(grid: GridTile[], startIndex: number): boolean {
    // BFS
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

            // If Pipe, continue searching
            if (tile.buildingType === BuildingType.PIPE ||
                tile.buildingType === BuildingType.WASH_PLANT ||
                tile.buildingType === BuildingType.RECYCLING_PLANT) {
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

export function generateInitialGrid(): GridTile[] {
    // Calculate center offset for grid coordinates to match noise world coordinates
    const offset = (GRID_SIZE - 1) / 2;

    return Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
        const x = i % GRID_SIZE;
        const y = Math.floor(i / GRID_SIZE);

        // World coordinates (0,0 is center of map)
        const worldX = x - offset;
        const worldY = y - offset; // Use Y as Z in logic

        const isPlayable =
            x >= PADDING &&
            x < PADDING + PLAYABLE_SIZE &&
            y >= PADDING &&
            y < PADDING + PLAYABLE_SIZE;

        // Use shared logic
        const { biome, height, detail } = getBiomeAt(worldX, worldY);

        let finalHeight = height;
        const isWater = height === 0;

        // Foliage generation is now handled entirely by TerrainChunkManager's procedural system.
        // We only generate gold veins here for the playable area.
        let foliage: FoliageType = 'NONE';
        const rand = Math.random();

        // Only place gold veins via initial grid (foliage is handled by chunk system)
        if (!isWater) {
            let goldChance = 0.002;
            if (biome === 'STONE' || height >= 8) {
                goldChance = 0.035;
            } else if (biome === 'DIRT') {
                goldChance = 0.015;
            } else if (biome === 'GRASS' && height >= 2) {
                goldChance = 0.005;
            }

            if (rand < goldChance) {
                foliage = 'GOLD_VEIN';
            }
            // Trees/rocks/flowers are now generated by TerrainChunkManager procedurally
        }

        return {
            id: i,
            x,
            y,
            buildingType: isWater ? BuildingType.POND : BuildingType.EMPTY,
            level: 0,
            terrainHeight: finalHeight,
            biome: biome as BiomeType,
            foliage,
            locked: !isPlayable,
            explored: isPlayable,
            underground: {}
        };
    });
}
