
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Stone Quarry Factory - Multi-level stone extraction
 * Level 1: Hand-carved pit
 * Level 2: Wooden scaffolding with hoist
 * Level 3: Industrial excavator
 * Level 4: Modern automated site
 */
export const StoneQuarryFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

// Level 1: Hand-carved pit
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.8, 0.08, 1.8, mats.sand, 0, 0, 0));
    g.add(voxel(0.6, 0.8, 0.4, mats.concrete, -0.5, 0.08, -0.6));
    g.add(voxel(0.45, 0.45, 0.45, mats.concrete, -0.55, 0.08, 0));
    g.add(voxel(0.4, 0.3, 0.4, mats.concrete, 0.55, 0.08, 0.3));
    g.add(voxel(0.1, 1.2, 0.1, mats.wood, -0.75, 0.08, 0.5));
    g.add(voxel(0.8, 0.08, 0.08, mats.wood, -0.35, 1.1, 0.5));
    return g;
}

// Level 2: Wooden scaffolding
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(2.0, 0.15, 2.0, mats.concrete, 0, 0, 0));
    // Pit excavation
    g.add(voxel(1.5, 0.4, 1.5, mats.sand, 0, 0.15, 0));
    // Wooden scaffolding
    g.add(voxel(0.1, 1.8, 0.1, mats.wood, -0.8, 0.15, -0.8));
    g.add(voxel(0.1, 1.8, 0.1, mats.wood, 0.8, 0.15, -0.8));
    g.add(voxel(1.6, 0.1, 0.1, mats.wood, 0, 1.5, -0.8));
    // Bucket hoist
    g.add(voxel(0.3, 0.3, 0.3, mats.metal, 0, 1.2, -0.6));
    g.add(voxel(0.04, 1.2, 0.04, mats.sand, 0, 0.4, -0.6));
    // Stone blocks
    g.add(voxel(0.5, 0.5, 0.5, mats.concrete, 0.5, 0.15, 0.5));
    g.add(voxel(0.4, 0.4, 0.4, mats.concrete, -0.5, 0.15, 0.5));
    return g;
}

// Level 3: Industrial excavator
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(2.2, 0.2, 2.2, mats.concrete, 0, 0, 0));
    // Main excavator arm base
    g.add(voxel(0.8, 0.8, 0.8, mats.blueMetal, -0.6, 0.2, -0.6));
    // Arm
    g.add(voxel(0.3, 1.8, 0.3, mats.metal, -0.6, 1.0, -0.6));
    const jib = voxel(1.5, 0.2, 0.2, mats.hazard, 0, 2.6, -0.6);
    jib.rotation.z = -0.3;
    g.add(jib);
    // Bucket
    g.add(voxel(0.6, 0.6, 0.6, mats.metal, 0.8, 2.2, -0.6));
    // Large cut blocks
    g.add(voxel(0.8, 0.8, 0.8, mats.concrete, 0.5, 0.2, 0.5));
    g.add(voxel(0.6, 0.6, 0.6, mats.concrete, 0.5, 1.0, 0.5));
    // Status light
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.15, 0.1, 0.15, isPowered ? mats.emissiveGreen : mats.emissiveRed, -0.8, 0.6, -0.2));
    }
    return g;
}

// Level 4: Modern automated site
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(2.4, 0.25, 2.4, mats.concrete, 0, 0, 0));
    // Laser cutting gantry (Metal)
    g.add(voxel(0.2, 3.0, 0.2, mats.metalLight, -1.0, 0.25, -1.0));
    g.add(voxel(0.2, 3.0, 0.2, mats.metalLight, 1.0, 0.25, -1.0));
    g.add(voxel(2.2, 0.2, 0.2, mats.metalLight, 0, 3.0, -1.0));
    // Laser cutter head
    g.add(voxel(0.4, 0.4, 0.4, mats.blueMetal, 0, 2.8, -1.0));
    if (!opts?.isUnderConstruction && isPowered) {
        g.add(voxel(0.05, 2.0, 0.05, mats.emissiveCyan, 0, 0.8, -1.0)); // Main cutting beam
    }
    // Automated conveyor
    g.add(voxel(0.8, 0.15, 2.4, mats.darkPipe, 0.8, 0.25, 0));
    // Perfection-cut blocks
    for (let z = -0.8; z <= 0.8; z += 0.8) {
        g.add(voxel(0.6, 0.6, 0.6, mats.concrete, 0.8, 0.4, z));
    }
    // Command kiosk (Concrete)
    g.add(voxel(0.6, 1.2, 0.4, mats.concreteLight, -0.8, 0.25, 0.8));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.4, 0.3, 0.05, isPowered ? mats.emissiveCyan : mats.emissiveRed, -0.8, 0.9, 1.01));
    }
    return g;
}
