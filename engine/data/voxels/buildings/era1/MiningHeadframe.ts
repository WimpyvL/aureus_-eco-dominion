
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Mining Headframe Factory - Multi-level mine entrance
 * Level 1: Wooden scaffold with rope hoist
 * Level 2: Steel scaffold with pulley
 * Level 3: Industrial derrick
 * Level 4: Modern automated headframe
 */
export const MiningHeadframeFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

// Level 1: Primitive wooden scaffold
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';

    // Foundation with shaft
    g.add(voxel(2.5, 0.25, 2.5, mats.concrete, 0, 0, 0));
    g.add(voxel(0.8, 0.15, 0.8, mats.darkPipe, 0, 0.15, 0));

    // Wooden A-frame
    g.add(voxel(0.15, 3.5, 0.15, mats.wood, -0.6, 0.25, -0.6));
    g.add(voxel(0.15, 3.5, 0.15, mats.wood, 0.6, 0.25, -0.6));
    g.add(voxel(0.15, 3.5, 0.15, mats.wood, -0.6, 0.25, 0.6));
    g.add(voxel(0.15, 3.5, 0.15, mats.wood, 0.6, 0.25, 0.6));

    // Cross bracing
    for (let y = 1.0; y < 3.5; y += 1.2) {
        g.add(voxel(1.2, 0.08, 0.08, mats.wood, 0, y, -0.6));
        g.add(voxel(1.2, 0.08, 0.08, mats.wood, 0, y, 0.6));
    }

    // Top beam
    g.add(voxel(1.5, 0.15, 1.5, mats.wood, 0, 3.75, 0));

    // Windlass
    g.add(voxel(0.3, 0.3, 0.5, mats.wood, 0, 3.9, 0));
    g.add(voxel(0.04, 3.0, 0.04, mats.sand, 0, 1.5, 0)); // Rope
    g.add(voxel(0.25, 0.3, 0.25, mats.metal, 0, 3.0, 0)); // Bucket

    // Worker shelter
    g.add(voxel(0.9, 0.04, 1.2, mats.sand, -0.7, 0.95, -0.25));

    // Ore cart
    g.add(voxel(0.35, 0.25, 0.5, mats.wood, 1.02, 0.33, 0.3));

    // Lantern
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.1, 0.15, 0.1, isPowered ? mats.emissiveYellow : mats.emissiveRed, -0.6, 3.75, -0.6));
    }

    return g;
}

// Level 2: Steel scaffold with pulley
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';

    g.add(voxel(2.8, 0.3, 2.8, mats.concrete, 0, 0, 0));
    g.add(voxel(1.0, 0.2, 1.0, mats.metal, 0, 0.2, 0));

    // Steel frame posts
    g.add(voxel(0.2, 5.0, 0.2, mats.metal, -0.8, 0.3, -0.8));
    g.add(voxel(0.2, 5.0, 0.2, mats.metal, 0.8, 0.3, -0.8));
    g.add(voxel(0.2, 5.0, 0.2, mats.metal, -0.8, 0.3, 0.8));
    g.add(voxel(0.2, 5.0, 0.2, mats.metal, 0.8, 0.3, 0.8));

    // Cross bracing (steel)
    for (let y = 1.5; y < 5.0; y += 1.5) {
        g.add(voxel(1.6, 0.1, 0.1, mats.metalLight, 0, y, -0.8));
        g.add(voxel(1.6, 0.1, 0.1, mats.metalLight, 0, y, 0.8));
        g.add(voxel(0.1, 0.1, 1.6, mats.metalLight, -0.8, y, 0));
        g.add(voxel(0.1, 0.1, 1.6, mats.metalLight, 0.8, y, 0));
    }

    // Top platform
    g.add(voxel(2.0, 0.15, 2.0, mats.metal, 0, 5.3, 0));

    // Pulley wheel
    g.add(voxel(0.8, 0.8, 0.15, mats.hazard, 0, 5.8, 0));

    // Cables
    g.add(voxel(0.05, 5.0, 0.05, mats.metalLight, 0.2, 2.8, 0));
    g.add(voxel(0.05, 5.0, 0.05, mats.metalLight, -0.2, 2.8, 0));

    // Winding house
    g.add(voxel(1.0, 1.0, 1.0, mats.metalLight, -1.2, 0.3, 1.0));

    // Status light
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.15, 0.15, 0.15, isPowered ? mats.emissiveGreen : mats.emissiveRed, -0.8, 5.3, -0.8));
    }

    return g;
}

// Level 3: Industrial derrick
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';

    g.add(voxel(3.4, 0.35, 3.4, mats.concrete, 0, 0, 0));
    g.add(voxel(1.1, 0.15, 1.1, mats.metal, 0, 0.25, 0));

    // Main A-Frame Derrick
    g.add(voxel(0.3, 6.5, 0.3, mats.metal, -1.0, 0.35, -1.0));
    g.add(voxel(0.3, 6.5, 0.3, mats.metal, 1.0, 0.35, -1.0));
    g.add(voxel(0.3, 6.5, 0.3, mats.metal, -1.0, 0.35, 1.0));
    g.add(voxel(0.3, 6.5, 0.3, mats.metal, 1.0, 0.35, 1.0));

    // Heavy bracing
    for (let y = 1.5; y < 6.5; y += 1.8) {
        g.add(voxel(2.0, 0.12, 0.12, mats.metalLight, 0, y, -1.0));
        g.add(voxel(2.0, 0.12, 0.12, mats.metalLight, 0, y, 1.0));
        g.add(voxel(0.12, 0.12, 2.0, mats.metalLight, -1.0, y, 0));
        g.add(voxel(0.12, 0.12, 2.0, mats.metalLight, 1.0, y, 0));
    }

    // Top sheave deck with dual pulleys
    g.add(voxel(2.6, 0.18, 2.6, mats.metal, 0, 6.85, 0));
    g.add(voxel(1.5, 1.5, 0.18, mats.hazard, 0.35, 7.6, 0));
    g.add(voxel(1.5, 1.5, 0.18, mats.hazard, -0.35, 7.6, 0));

    // Cables
    g.add(voxel(0.05, 7.0, 0.05, mats.metalLight, 0.35, 3.85, 0));
    g.add(voxel(0.05, 7.0, 0.05, mats.metalLight, -0.35, 3.85, 0));

    // Ore chute and conveyor
    g.add(voxel(0.9, 2.5, 0.9, mats.metal, 1.3, 1.6, 1.3));
    g.add(voxel(2.2, 0.25, 0.7, mats.hazard, 2.3, 2.35, 1.3));

    // Control shack
    g.add(voxel(1.1, 1.1, 1.1, mats.metalLight, -1.6, 0.35, 1.1));
    g.add(voxel(0.7, 0.5, 0.08, isPowered ? mats.glass : mats.darkPipe, -1.6, 0.7, 1.7));

    // Warning light
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.18, 0.18, 0.18, isPowered ? mats.emissiveGreen : mats.emissiveRed, -1.2, 6.85, -1.2));
    }

    return g;
}

// Level 4: Modern automated headframe
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';

    g.add(voxel(3.8, 0.4, 3.8, mats.concrete, 0, 0, 0));
    g.add(voxel(1.2, 0.2, 1.2, mats.blueMetal, 0, 0.3, 0));

    // Modern enclosed tower structure
    g.add(voxel(1.8, 8.0, 1.8, mats.concreteLight, 0, 0.4, 0));

    // Blue accent stripes
    for (let y = 2.0; y < 8.0; y += 2.0) {
        g.add(voxel(1.85, 0.08, 1.85, mats.blueMetal, 0, y, 0));
    }

    // Glass elevator shaft section
    g.add(voxel(0.6, 6.0, 0.1, isPowered ? mats.glass : mats.metalLight, 0, 1.4, 0.95));

    // Top machinery housing
    g.add(voxel(2.2, 1.2, 2.2, mats.metalLight, 0, 8.4, 0));
    g.add(voxel(1.8, 0.8, 0.2, mats.hazard, 0, 9.4, 0));

    // Automated conveyor system
    g.add(voxel(1.2, 3.0, 1.2, mats.blueMetal, 1.8, 1.9, 1.5));
    g.add(voxel(3.0, 0.3, 1.0, mats.metalLight, 3.0, 3.0, 1.5));

    // Control building
    g.add(voxel(1.4, 1.4, 1.4, mats.concreteLight, -1.8, 0.4, 1.2));
    g.add(voxel(1.0, 0.8, 0.08, isPowered ? mats.glass : mats.darkPipe, -1.8, 0.8, 1.9));

    // Solar panels
    g.add(voxel(1.0, 0.05, 0.6, mats.solar, 0.8, 9.6, 0.6));

    // Helipad marking
    g.add(voxel(0.8, 0.04, 0.8, mats.hazard, -0.5, 9.6, -0.5));

    // Status beacon
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.2, 0.3, 0.2, isPowered ? mats.emissiveCyan : mats.emissiveRed, 0, 10.0, 0));
    }

    return g;
}
