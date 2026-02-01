
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Underground Fans Factory - Multi-level ventilation
 * Level 1: Wooden-framed propeller (primitive)
 * Level 2: Standard industrial fan (Original)
 * Level 3: Dual-rotor high-pressure fan
 * Level 4: Modern atmospheric scrubber fan
 */
export const UndergroundFansFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

// Level 1: Primitive wooden fan
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    // Rough log frame
    g.add(voxel(1.1, 0.1, 1.1, mats.wood, 0, 0.5, 0));
    g.add(voxel(1.1, 0.1, 1.1, mats.wood, 0, -0.5, 0));
    g.add(voxel(0.1, 1.1, 1.1, mats.wood, 0.5, 0, 0));
    g.add(voxel(0.1, 1.1, 1.1, mats.wood, -0.5, 0, 0));

    // Wooden propeller
    g.add(voxel(0.8, 0.1, 0.05, mats.wood, 0, 0, 0));
    g.add(voxel(0.1, 0.8, 0.05, mats.wood, 0, 0, 0));
    g.add(voxel(0.15, 0.15, 0.1, mats.metal, 0, 0, 0));

    return g;
}

// Level 2: Industrial metal fan (Original)
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(1.0, 1.0, 0.4, mats.metal, 0, 0, 0));
    g.add(voxel(0.8, 0.8, 0.05, mats.darkPipe, 0, 0, 0.2));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.15, 0.15, 0.15, isPowered ? mats.emissiveGreen : mats.emissiveRed, 0, 0, 0));
    }
    return g;
}

// Level 3: Dual-rotor high-pressure fan
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';

    // Cylindrical casing
    g.add(voxel(1.2, 1.2, 0.8, mats.blueMetal, 0, 0, 0));

    // Front and back rotors
    g.add(voxel(0.9, 0.9, 0.05, mats.metalLight, 0, 0, 0.4));
    g.add(voxel(0.9, 0.9, 0.05, mats.metalLight, 0, 0, -0.4));

    if (!opts?.isUnderConstruction && isPowered) {
        g.add(voxel(0.3, 0.3, 0.3, mats.emissiveCyan, 0, 0, 0));
    }

    return g;
}

// Level 4: Atmospheric Scrubber Fan
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';

    // Sleek white hex casing
    g.add(voxel(1.4, 1.4, 0.6, mats.metalLight, 0, 0, 0));

    // Internal glowing filter
    g.add(voxel(1.1, 1.1, 0.1, mats.glass, 0, 0, 0));
    if (!opts?.isUnderConstruction && isPowered) {
        g.add(voxel(1.0, 1.0, 0.05, mats.emissiveCyan, 0, 0, 0.05));
    }

    // Modern intake ports
    for (let i = 0; i < 4; i++) {
        const x = i < 2 ? 0.6 : -0.6;
        const y = i % 2 === 0 ? 0.6 : -0.6;
        g.add(voxel(0.15, 0.15, 0.7, mats.blueMetal, x, y, 0));
    }

    return g;
}
