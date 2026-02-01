
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Security Post Factory - Multi-level protection
 * Level 1: Wooden watchtower (Lattice logs)
 * Level 2: Modern metal tower (Original)
 * Level 3: Reinforced concrete bunker tower
 * Level 4: High-tech drone sensor array
 */
export const SecurityPostFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

// Level 1: Wooden watchtower
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.0, 0.2, 1.0, mats.stone, 0, 0, 0));

    // Wooden corner posts
    for (let y = 0.2; y < 3.0; y += 1.0) {
        g.add(voxel(0.1, 1.0, 0.1, mats.wood, -0.4, y, -0.4));
        g.add(voxel(0.1, 1.0, 0.1, mats.wood, 0.4, y, -0.4));
        g.add(voxel(0.1, 1.0, 0.1, mats.wood, -0.4, y, 0.4));
        g.add(voxel(0.1, 1.0, 0.1, mats.wood, 0.4, y, 0.4));
    }

    // Observation platform
    g.add(voxel(1.2, 0.1, 1.2, mats.wood, 0, 3.2, 0));
    g.add(voxel(0.1, 0.6, 1.2, mats.wood, 0.55, 3.3, 0));
    g.add(voxel(0.1, 0.6, 1.2, mats.wood, -0.55, 3.3, 0));

    // Log roof
    g.add(voxel(1.4, 0.1, 1.4, mats.wood, 0, 4.0, 0));

    // Lantern
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.12, 0.12, 0.12, mats.emissiveYellow, 0.3, 3.5, 0.3));
    }

    return g;
}

// Level 2: Modern metal tower (Original)
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(1.0, 0.4, 1.0, mats.concrete, 0, 0, 0));
    g.add(voxel(0.8, 1.2, 0.8, mats.metal, 0, 0.4, 0));
    g.add(voxel(0.3, 0.5, 0.05, mats.glass, 0, 0.9, 0.41));
    g.add(voxel(0.35, 4.0, 0.35, mats.metal, 0, 1.6, 0));
    g.add(voxel(1.2, 0.15, 1.2, mats.concrete, 0, 5.0, 0));
    g.add(voxel(1.0, 1.0, 1.0, mats.glass, 0, 5.15, 0));
    g.add(voxel(1.05, 0.1, 1.05, mats.metal, 0, 6.15, 0));
    g.add(voxel(1.3, 0.6, 0.08, mats.metal, 0, 5.15, 0.6));
    g.add(voxel(1.3, 0.6, 0.08, mats.metal, 0, 5.15, -0.6));
    g.add(voxel(0.08, 0.6, 1.2, mats.metal, 0.6, 5.15, 0));
    g.add(voxel(0.08, 0.6, 1.2, mats.metal, -0.6, 5.15, 0));
    g.add(voxel(0.2, 0.3, 0.2, mats.metal, 0.4, 6.25, 0.4));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.15, 0.15, 0.15, isPowered ? mats.emissiveCyan : mats.emissiveRed, 0.4, 6.55, 0.4));
        g.add(voxel(0.12, 0.12, 0.12, isPowered ? mats.emissiveGreen : mats.emissiveRed, 0, 6.3, 0));
    }
    return g;
}

// Level 3: Reinforced Bunker Tower
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(1.4, 0.4, 1.4, mats.concrete, 0, 0, 0));

    // Heavy concrete tower
    g.add(voxel(1.0, 5.5, 1.0, mats.concrete, 0, 0.4, 0));

    // Armored observation slits
    g.add(voxel(1.1, 0.2, 0.8, mats.darkPipe, 0, 5.0, 0));
    g.add(voxel(0.8, 0.2, 1.1, mats.darkPipe, 0, 5.0, 0));

    // Radar dish
    g.add(voxel(0.1, 0.6, 0.6, mats.metal, 0, 6.1, 0.3));
    if (!opts?.isUnderConstruction && isPowered) {
        g.add(voxel(0.12, 0.12, 0.12, mats.emissiveCyan, 0, 6.3, 0.5));
    }

    // Heavy spotlight
    g.add(voxel(0.3, 0.3, 0.3, mats.metal, -0.3, 5.9, -0.3));

    return g;
}

// Level 4: High-Tech Drone Sensor Tower
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(1.4, 0.4, 1.4, mats.concrete, 0, 0, 0));

    // Sleek metal spire
    g.add(voxel(0.6, 7.0, 0.6, mats.metalLight, 0, 0.4, 0));
    g.add(voxel(0.65, 0.1, 0.65, mats.blueMetal, 0, 1.5, 0));
    g.add(voxel(0.65, 0.1, 0.65, mats.blueMetal, 0, 4.0, 0));
    g.add(voxel(0.65, 0.1, 0.65, mats.blueMetal, 0, 6.5, 0));

    // Sensor pods
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const x = Math.cos(angle) * 0.4;
        const z = Math.sin(angle) * 0.4;
        g.add(voxel(0.2, 0.2, 0.2, mats.blueMetal, x, 6.0, z));
        if (!opts?.isUnderConstruction && isPowered) {
            g.add(voxel(0.1, 0.1, 0.1, mats.emissiveCyan, x * 1.2, 6.0, z * 1.2));
        }
    }

    // Top beacon
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.2, 0.4, 0.2, mats.emissiveCyan, 0, 7.4, 0));
    }

    return g;
}
