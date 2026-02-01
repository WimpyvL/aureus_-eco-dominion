
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Water Well Factory - Multi-level water extraction
 * Level 1: Hand-dug well with windlass
 * Level 2: Wind-powered pump
 * Level 3: Industrial electric pump
 * Level 4: Modern purification tower
 */
export const WaterWellFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

// Level 1: Hand-dug well with windlass
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.0, 0.15, 1.0, mats.concrete, 0, 0, 0));
    g.add(voxel(0.8, 0.4, 0.8, mats.concrete, 0, 0.15, 0));
    g.add(voxel(0.45, 0.15, 0.45, mats.darkPipe, 0, 0.45, 0));
    g.add(voxel(0.1, 1.2, 0.1, mats.wood, -0.35, 0.15, 0));
    g.add(voxel(0.1, 1.2, 0.1, mats.wood, 0.35, 0.15, 0));
    g.add(voxel(0.8, 0.1, 0.1, mats.wood, 0, 1.25, 0));
    g.add(voxel(0.5, 0.15, 0.15, mats.wood, 0, 1.0, 0));
    g.add(voxel(0.04, 0.2, 0.04, mats.wood, 0.35, 1.0, 0.12));
    g.add(voxel(0.03, 0.8, 0.03, mats.sand, 0, 0.6, 0));
    g.add(voxel(0.15, 0.2, 0.15, mats.wood, 0, 0.6, 0));
    return g;
}

// Level 2: Wind-powered pump
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(1.4, 0.2, 1.4, mats.concrete, 0, 0, 0));
    // Metal pump housing
    g.add(voxel(0.6, 0.8, 0.6, mats.metal, 0, 0.2, 0));
    // Windmill tower
    g.add(voxel(0.15, 2.5, 0.15, mats.metalLight, -0.3, 0.2, -0.3));
    g.add(voxel(0.15, 2.5, 0.15, mats.metalLight, 0.3, 0.2, -0.3));
    g.add(voxel(0.15, 2.5, 0.15, mats.metalLight, -0.3, 0.2, 0.3));
    g.add(voxel(0.15, 2.5, 0.15, mats.metalLight, 0.3, 0.2, 0.3));
    // Windmill fan (placeholder)
    const fan = new THREE.Group();
    fan.position.set(0, 2.7, 0);
    fan.add(voxel(0.1, 1.2, 1.2, mats.metal, 0, 0, 0));
    fan.add(voxel(0.4, 0.1, 0.1, mats.metal, -0.25, 0, 0));
    g.add(fan);
    // Water outlet
    g.add(voxel(0.4, 0.15, 0.15, mats.darkPipe, 0.3, 0.5, 0));
    return g;
}

// Level 3: Industrial electric pump
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(1.6, 0.25, 1.6, mats.concrete, 0, 0, 0));
    // Heavy pump unit
    g.add(voxel(1.0, 1.0, 1.0, mats.metalLight, 0, 0.25, 0));
    // Motor housing
    g.add(voxel(1.1, 0.6, 0.6, mats.blueMetal, 0, 0.25, 0));
    // Large intake pipe
    g.add(voxel(0.3, 0.8, 0.3, mats.darkPipe, 0.4, 0.25, 0.4));
    // Large discharge pipe
    g.add(voxel(0.8, 0.3, 0.3, mats.darkPipe, 0.6, 0.6, 0));
    // Control panel
    g.add(voxel(0.4, 0.7, 0.2, mats.metal, -0.5, 0.25, -0.5));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.2, 0.2, 0.05, isPowered ? mats.emissiveCyan : mats.emissiveRed, -0.5, 0.7, -0.31));
    }
    return g;
}

// Level 4: Modern purification tower
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(2.0, 0.3, 2.0, mats.concrete, 0, 0, 0));
    // Tower structure (Concrete)
    g.add(voxel(1.2, 3.5, 1.2, mats.concreteLight, 0, 0.3, 0));
    // Glow rings
    g.add(voxel(1.3, 0.1, 1.3, mats.emissiveCyan, 0, 1.5, 0));
    g.add(voxel(1.3, 0.1, 1.3, mats.emissiveCyan, 0, 2.8, 0));
    // Filtration tanks
    g.add(voxel(0.6, 1.5, 0.6, mats.blueMetal, 0.7, 0.3, 0.7));
    g.add(voxel(0.6, 1.5, 0.6, mats.blueMetal, -0.7, 0.3, 0.7));
    // High-tech status display
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.6, 0.4, 0.05, isPowered ? mats.emissiveCyan : mats.emissiveRed, 0, 2.0, 0.61));
    }
    // Main outlet manifold
    g.add(voxel(0.4, 0.4, 0.8, mats.metal, 0, 0.3, 0.8));
    return g;
}
