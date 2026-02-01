
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Fence Factory - Multi-level boundary
 * Level 1: Wooden logs with twine (primitive)
 * Level 2: Metal and glass (Original)
 * Level 3: Reinforced security fence with laser beams
 * Level 4: Force field emitters
 */
export const FenceFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

// Level 1: Wooden logs
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const conn = opts?.connections || { north: false, south: false, east: false, west: false };
    const connCount = [conn.north, conn.south, conn.east, conn.west].filter(Boolean).length;

    // Center post (log)
    g.add(voxel(0.15, 1.2, 0.15, mats.wood, 0, 0, 0));

    // Fence segments (logs)
    if (conn.north || connCount === 0) {
        g.add(voxel(0.08, 0.08, 0.5, mats.wood, 0, 0.4, -0.25));
        g.add(voxel(0.08, 0.08, 0.5, mats.wood, 0, 0.9, -0.25));
    }
    if (conn.south || connCount === 0) {
        g.add(voxel(0.08, 0.08, 0.5, mats.wood, 0, 0.4, 0.25));
        g.add(voxel(0.08, 0.08, 0.5, mats.wood, 0, 0.9, 0.25));
    }
    if (conn.east || connCount === 0) {
        g.add(voxel(0.5, 0.08, 0.08, mats.wood, 0.25, 0.4, 0));
        g.add(voxel(0.5, 0.08, 0.08, mats.wood, 0.25, 0.9, 0));
    }
    if (conn.west || connCount === 0) {
        g.add(voxel(0.5, 0.08, 0.08, mats.wood, -0.25, 0.4, 0));
        g.add(voxel(0.5, 0.08, 0.08, mats.wood, -0.25, 0.9, 0));
    }

    return g;
}

// Level 2: Modern metal and glass (Original)
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const conn = opts?.connections || { north: false, south: false, east: false, west: false };
    const connCount = [conn.north, conn.south, conn.east, conn.west].filter(Boolean).length;
    g.add(voxel(0.1, 1.4, 0.1, mats.metal, 0, 0, 0));
    g.add(voxel(0.14, 0.08, 0.14, mats.metal, 0, 1.4, 0));

    const addSeg = (isZ: boolean, dir: number) => {
        const x = isZ ? 0 : 0.25 * dir;
        const z = isZ ? 0.25 * dir : 0;
        const w = isZ ? 0.06 : 0.5;
        const d = isZ ? 0.5 : 0.06;
        const gw = isZ ? 0.04 : 0.45;
        const gd = isZ ? 0.45 : 0.04;
        g.add(voxel(w, 0.04, d, mats.metal, x, 0.4, z));
        g.add(voxel(w, 0.04, d, mats.metal, x, 0.8, z));
        g.add(voxel(w, 0.04, d, mats.metal, x, 1.2, z));
        g.add(voxel(gw, 0.7, gd, mats.glass, x, 0.5, z));
    };

    if (conn.north || connCount === 0) addSeg(true, -1);
    if (conn.south || connCount === 0) addSeg(true, 1);
    if (conn.east || connCount === 0) addSeg(false, 1);
    if (conn.west || connCount === 0) addSeg(false, -1);

    if (connCount >= 2) g.add(voxel(0.12, 0.1, 0.12, mats.concrete, 0, 0, 0));
    return g;
}

// Level 3: Security Laser Fence
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const conn = opts?.connections || { north: false, south: false, east: false, west: false };
    const connCount = [conn.north, conn.south, conn.east, conn.west].filter(Boolean).length;

    // Industrial post
    g.add(voxel(0.2, 1.6, 0.2, mats.blueMetal, 0, 0, 0));
    g.add(voxel(0.25, 0.1, 0.25, mats.emissiveCyan, 0, 1.6, 0));

    const addLaser = (isZ: boolean, dir: number) => {
        const x = isZ ? 0 : 0.25 * dir;
        const z = isZ ? 0.25 * dir : 0;
        const w = isZ ? 0.04 : 0.5;
        const d = isZ ? 0.5 : 0.04;
        // Two laser beams
        g.add(voxel(w, 0.02, d, mats.emissiveCyan, x, 0.6, z));
        g.add(voxel(w, 0.02, d, mats.emissiveCyan, x, 1.2, z));
        // Base rail
        g.add(voxel(w + 0.05, 0.1, d + 0.05, mats.metal, x, 0, z));
    };

    if (conn.north || connCount === 0) addLaser(true, -1);
    if (conn.south || connCount === 0) addLaser(true, 1);
    if (conn.east || connCount === 0) addLaser(false, 1);
    if (conn.west || connCount === 0) addLaser(false, -1);

    return g;
}

// Level 4: Force Field Spire
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const conn = opts?.connections || { north: false, south: false, east: false, west: false };
    const connCount = [conn.north, conn.south, conn.east, conn.west].filter(Boolean).length;

    // Glowing emitter spire
    g.add(voxel(0.15, 2.0, 0.15, mats.metalLight, 0, 0, 0));
    g.add(voxel(0.2, 0.1, 0.2, mats.emissiveCyan, 0, 0.5, 0));
    g.add(voxel(0.2, 0.1, 0.2, mats.emissiveCyan, 0, 1.5, 0));

    const addField = (isZ: boolean, dir: number) => {
        const x = isZ ? 0 : 0.25 * dir;
        const z = isZ ? 0.25 * dir : 0;
        const w = isZ ? 0.02 : 0.5;
        const d = isZ ? 0.5 : 0.02;
        // The force field itself (glowing cyan plane)
        g.add(voxel(w, 1.8, d, mats.emissiveCyan, x, 0.1, z));
    };

    if (conn.north || connCount === 0) addField(true, -1);
    if (conn.south || connCount === 0) addField(true, 1);
    if (conn.east || connCount === 0) addField(false, 1);
    if (conn.west || connCount === 0) addField(false, -1);

    return g;
}
