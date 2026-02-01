
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Generator Factory - Multi-level power source
 * Level 1: Fire-box generator (makeshift burner)
 * Level 2: Modern diesel-style generator (Original)
 * Level 3: Dual-turbine industrial generator
 * Level 4: Fusion core / Zero-point module
 */
export const GeneratorFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

// Level 1: Fire-box generator
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.0, 0.1, 1.0, mats.concrete, 0, 0, 0));

    // Makeshift burner body (old metal and wood)
    g.add(voxel(0.8, 0.8, 0.8, mats.metal, 0, 0.1, 0));
    g.add(voxel(0.85, 0.1, 0.85, mats.wood, 0, 0.5, 0));

    // Chimney
    g.add(voxel(0.2, 1.2, 0.2, mats.darkPipe, 0.2, 0.9, 0.2));

    // Fire door
    g.add(voxel(0.4, 0.4, 0.05, mats.metal, 0, 0.1, 0.4));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.3, 0.3, 0.02, mats.emissiveOrange, 0, 0.15, 0.43));
    }

    // Exposed copper wiring
    g.add(voxel(0.05, 0.6, 0.05, mats.hazard, -0.4, 0.1, -0.4));

    return g;
}

// Level 2: Modern industrial generator (Original)
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.0, 0.2, 1.0, mats.concrete, 0, 0, 0));
    g.add(voxel(0.9, 1.0, 0.9, mats.metal, 0, 0.2, 0));
    g.add(voxel(0.05, 0.6, 0.6, mats.darkPipe, 0.46, 0.5, 0));
    g.add(voxel(0.05, 0.6, 0.6, mats.darkPipe, -0.46, 0.5, 0));
    g.add(voxel(0.2, 1.5, 0.2, mats.metal, 0.3, 1.0, 0.3));
    g.add(voxel(0.25, 0.1, 0.25, mats.darkPipe, 0.3, 2.5, 0.3));
    g.add(voxel(0.3, 0.4, 0.1, mats.metal, 0, 0.8, 0.46));

    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.1, 0.1, 0.05, mats.emissiveGreen, -0.08, 0.95, 0.48));
        g.add(voxel(0.1, 0.1, 0.05, mats.darkPipe, 0.08, 0.95, 0.48));
    } else {
        g.add(voxel(0.1, 0.1, 0.05, mats.darkPipe, -0.08, 0.95, 0.48));
        g.add(voxel(0.1, 0.1, 0.05, mats.emissiveRed, 0.08, 0.95, 0.48));
    }

    g.add(voxel(0.3, 0.5, 0.3, mats.hazard, -0.3, 0.2, -0.3));
    g.add(voxel(0.6, 0.08, 0.08, mats.darkPipe, 0, 0.2, 0.55));
    g.add(voxel(0.95, 0.15, 0.95, mats.metalLight, 0, 1.2, 0));
    g.add(voxel(0.9, 0.08, 0.05, mats.hazard, 0, 0.3, 0.46));

    return g;
}

// Level 3: Dual-turbine industrial generator
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.4, 0.25, 1.4, mats.concrete, 0, 0, 0));

    // Main dual body
    g.add(voxel(1.2, 1.2, 1.0, mats.metalLight, 0, 0.25, 0));
    g.add(voxel(0.1, 0.1, 1.3, mats.blueMetal, 0.6, 0.8, 0));
    g.add(voxel(0.1, 0.1, 1.3, mats.blueMetal, -0.6, 0.8, 0));

    // Dual exhaust
    g.add(voxel(0.25, 2.0, 0.25, mats.metal, 0.4, 1.45, 0.3));
    g.add(voxel(0.25, 2.0, 0.25, mats.metal, -0.4, 1.45, 0.3));

    // Large fuel reservoirs
    g.add(voxel(0.4, 0.8, 0.4, mats.hazard, -0.7, 0.25, -0.4));
    g.add(voxel(0.4, 0.8, 0.4, mats.hazard, 0.7, 0.25, -0.4));

    // Advanced display
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.5, 0.4, 0.05, mats.emissiveCyan, 0, 0.9, 0.51));
    }

    return g;
}

// Level 4: Fusion Core
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.6, 0.3, 1.6, mats.concrete, 0, 0, 0));

    // Modern shell
    g.add(voxel(1.4, 1.8, 1.4, mats.concreteLight, 0, 0.3, 0));
    g.add(voxel(1.45, 0.1, 1.45, mats.blueMetal, 0, 1.0, 0));

    // Glass core window
    g.add(voxel(0.6, 0.6, 0.05, mats.glass, 0, 0.8, 0.71));
    if (!opts?.isUnderConstruction) {
        // Glowing fusion plasma
        g.add(voxel(0.5, 0.5, 0.5, mats.emissiveCyan, 0, 0.85, 0));
    }

    // Cooling vents
    g.add(voxel(0.4, 0.1, 0.4, mats.metal, 0, 2.1, 0));

    return g;
}
