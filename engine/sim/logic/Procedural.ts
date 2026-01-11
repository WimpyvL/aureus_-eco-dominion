/**
 * Procedural Generation Utilities
 * Pure TypeScript implementation of world generation logic.
 * usable by both Main thread and Worker threads.
 */

import { BiomeType, FoliageType } from '../../../types';

// Simple fast 2D hash
function hash(x: number, y: number, seed: number): number {
    const k = x * 0.3183099 + 0.3678794;
    const y2 = y * 0.3183099 + 0.3678794;
    const h = Math.sin(k * 12.9898 + y2 * 78.233 + seed) * 43758.5453;
    return h - Math.floor(h);
}

function noise(x: number, y: number, seed: number): number {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const f = x - i;
    const g = y - j;

    // Quintic interpolation
    const u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    const v = g * g * g * (g * (g * 6.0 - 15.0) + 10.0);

    const a = hash(i, j, seed);
    const b = hash(i + 1, j, seed);
    const c = hash(i, j + 1, seed);
    const d = hash(i + 1, j + 1, seed);

    return (a + (b - a) * u) + (c - a) * v * (1.0 - u) + (d - b) * u * v;
}

function fbm(x: number, y: number, octaves: number, persistence: number, lacunarity: number, seed: number): number {
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

export interface BiomeData {
    biome: BiomeType | 'STONE'; // 'STONE' is handled as specific biome internally sometimes
    height: number;
    temp: number;
    moisture: number;
    detail: number;
}

export function getBiomeAt(x: number, z: number): BiomeData {
    // Lower frequencies for larger, more natural features
    const elevation = fbm(x * 0.007, z * 0.007, 6, 0.5, 2.0, 999.9);
    const temp = fbm(x * 0.003, z * 0.003, 3, 0.5, 2.0, 123.4);
    const moisture = fbm(x * 0.003, z * 0.003, 3, 0.5, 2.0, 567.8);
    const detail = fbm(x * 0.1, z * 0.1, 2, 0.5, 2.0, 111.1);

    // Safe zone logic (Playable area is approx -22 to +22)
    const dist = Math.sqrt(x * x + z * z);
    const isSafeZone = dist < 14;

    let biome: BiomeType | 'STONE' = 'GRASS';
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
            const n = (elevation - 0.65) / 0.35;
            height = 10 + Math.floor(n * n * 100);
        }

        // Limit world height to 32 max
        height = Math.min(32, height);

        // --- BIOME MAP ---
        // Altitude affects biome (cooling effect)
        const adjTemp = temp - (height * 0.02);

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

// Foliage Generators
interface Voxel { x: number; y: number; z: number; c: string; }

const Generators = {
    simple: (voxels: Voxel[]) => voxels,
    rock: (radius: number, mat: string, accentMat?: string) => {
        const voxels: Voxel[] = [];
        for (let x = -radius; x <= radius; x++) {
            for (let y = 0; y <= radius * 1.2; y++) {
                for (let z = -radius; z <= radius; z++) {
                    if (x * x + (y * 0.8) * (y * 0.8) + z * z <= radius * radius && Math.random() > 0.1) {
                        const m = (accentMat && Math.random() > 0.7) ? accentMat : mat;
                        voxels.push({ x: x, y: y, z: z, c: m });
                    }
                }
            }
        }
        return voxels;
    },
    basicTree: (height: number, leafRad: number, trunkMat: string, leafMat: string) => {
        const voxels: Voxel[] = [];
        for (let y = 0; y < height; y++) {
            voxels.push({ x: 0, y: y, z: 0, c: trunkMat });
            if (y === 0) { voxels.push({ x: 1, y: 0, z: 0, c: trunkMat }); voxels.push({ x: -1, y: 0, z: 0, c: trunkMat }); voxels.push({ x: 0, y: 0, z: 1, c: trunkMat }); voxels.push({ x: 0, y: 0, z: -1, c: trunkMat }); }
        }
        for (let x = -leafRad; x <= leafRad; x++) for (let y = -leafRad; y <= leafRad; y++) for (let z = -leafRad; z <= leafRad; z++) {
            if (Math.sqrt(x * x + y * y + z * z) <= leafRad && Math.random() > 0.2) voxels.push({ x: x, y: height + y, z: z, c: leafMat });
        }
        return voxels;
    },
    pineTree: (height: number, trunkMat: string, leafMat: string) => {
        const voxels: Voxel[] = [];
        for (let y = 0; y < height; y++) voxels.push({ x: 0, y: y, z: 0, c: trunkMat });
        let w = 3;
        for (let y = 2; y < height; y += 2) {
            for (let x = -w; x <= w; x++) for (let z = -w; z <= w; z++) if (Math.abs(x) + Math.abs(z) <= w + 0.5) voxels.push({ x: x, y: y, z: z, c: leafMat });
            w = Math.max(0, w - 1);
        }
        voxels.push({ x: 0, y: height, z: 0, c: leafMat });
        return voxels;
    },
    cactus: (height: number, mat: string) => {
        const voxels: Voxel[] = [];
        for (let y = 0; y < height; y++) { voxels.push({ x: 0, y: y, z: 0, c: mat }); if (y < height - 1 && y > 0) { voxels.push({ x: 1, y: y, z: 0, c: mat }); voxels.push({ x: 0, y: y, z: 1, c: mat }); } }
        // Arms
        voxels.push({ x: 2, y: 3, z: 0, c: mat }); voxels.push({ x: 2, y: 4, z: 0, c: mat }); voxels.push({ x: 2, y: 5, z: 0, c: mat });
        return voxels;
    },
    mineHole: () => {
        const v: Voxel[] = [];
        v.push({ x: 0, y: -1, z: 0, c: 'dead' });
        v.push({ x: 1, y: 0, z: 0, c: 'rock' }); v.push({ x: -1, y: 0, z: 0, c: 'rock' });
        v.push({ x: 0, y: 0, z: 1, c: 'rock' }); v.push({ x: 0, y: 0, z: -1, c: 'rock' });
        return v;
    }
};

export const TreeDefs: Record<string, () => Voxel[]> = {
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
    'GOLD_VEIN': () => Generators.rock(2, 'rock', 'gold'),
    'MINE_HOLE': () => Generators.mineHole()
};

export function getFoliageAt(biome: string, height: number, detail: number, distFromCenter: number, randVal?: number): FoliageType | 'GOLD_VEIN' | 'NONE' {
    let foliage: FoliageType | 'GOLD_VEIN' | 'NONE' = 'NONE';
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

    // --- FOLIAGE LOGIC (Heavily reduced for performance) ---

    if (biome === 'SAND') {
        if (rand > 0.995) foliage = 'CACTUS_SAGUARO'; // 0.5%
        else if (rand > 0.99) foliage = 'SHRUB_DRY'; // 0.5%
    }
    else if (biome === 'STONE') {
        if (rand > 0.995) foliage = 'CRYSTAL_SPIKE';
        else if (rand > 0.99) foliage = 'ROCK_PEBBLE';
    }
    else if (biome === 'DIRT') {
        if (rand > 0.99) foliage = 'TREE_DEAD';
        else if (rand > 0.98) foliage = 'BUSH_THORN';
    }
    else if (biome === 'SNOW') {
        if (rand > 0.99) foliage = 'TREE_FROSTED_PINE';
    }
    else if (biome === 'GRASS') {
        // Grass Biome - Very sparse
        if (detail > 0.6) {
            // Forest - Sparse trees
            if (rand > 0.985) foliage = 'TREE_OAK';
            else if (rand > 0.975) foliage = 'TREE_BIRCH';
        } else {
            // Plains - Minimal
            if (rand > 0.995) foliage = 'TREE_OAK';
            else if (rand > 0.99) foliage = 'FLOWER_YELLOW';
        }
    }

    return foliage;
}
