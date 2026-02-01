
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Training Center Factory - Multi-level education/fitness
 * Level 1: Outdoor exercise yard (wooden poles and dirt)
 * Level 2: Modern metal building (Original)
 * Level 3: Dual-wing complex with glass windows
 * Level 4: High-tech academy with holographic simulators
 */
export const TrainingCenterFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

// Level 1: Outdoor exercise yard
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.8, 0.1, 1.8, mats.dirt, 0, 0, 0));

    // Wooden climbing poles
    g.add(voxel(0.1, 1.5, 0.1, mats.wood, -0.6, 0.1, -0.6));
    g.add(voxel(0.1, 1.2, 0.1, mats.wood, -0.4, 0.1, -0.6));

    // Simple obstacle course
    g.add(voxel(0.3, 0.2, 0.08, mats.wood, 0, 0.1, 0.5));
    g.add(voxel(0.3, 0.2, 0.08, mats.wood, 0.3, 0.1, 0.5));
    g.add(voxel(0.3, 0.2, 0.08, mats.wood, 0.6, 0.1, 0.5));

    // Sand pit
    g.add(voxel(0.8, 0.05, 0.8, mats.sand, 0.4, 0.1, -0.4));

    // Flag pole (simple log)
    g.add(voxel(0.08, 2.0, 0.08, mats.wood, -0.8, 0.1, 0.8));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.4, 0.3, 0.02, mats.hazard, -0.8, 1.7, 0.85)); // Rag flag
    }

    return g;
}

// Level 2: Modern building (Original)
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(2.0, 0.2, 2.0, mats.concrete, 0, 0, 0));
    g.add(voxel(1.8, 1.5, 1.6, mats.metal, 0, 0.2, 0.1));
    const windowMat = isPowered ? mats.glass : mats.darkPipe;
    for (let i = -0.5; i <= 0.5; i += 0.5) {
        g.add(voxel(0.35, 0.5, 0.05, windowMat, i, 1.0, 0.81));
    }
    g.add(voxel(1.6, 0.05, 0.5, mats.asphalt, 0, 0.2, -0.7));
    g.add(voxel(0.15, 0.4, 0.15, mats.wood, -0.5, 0.25, -0.7));
    g.add(voxel(0.15, 0.4, 0.15, mats.wood, 0, 0.25, -0.7));
    g.add(voxel(0.15, 0.4, 0.15, mats.wood, 0.5, 0.25, -0.7));
    g.add(voxel(0.06, 1.5, 0.06, mats.metal, -0.85, 0.2, -0.85));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.3, 0.2, 0.05, isPowered ? mats.emissiveGreen : mats.emissiveRed, -0.7, 1.5, -0.85));
    }
    g.add(voxel(1.9, 0.1, 1.7, mats.metalLight, 0, 1.7, 0.1));
    return g;
}

// Level 3: Dual-wing complex
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(2.2, 0.25, 2.2, mats.concrete, 0, 0, 0));

    // Two wings
    g.add(voxel(0.9, 1.8, 1.6, mats.metalLight, -0.5, 0.25, 0));
    g.add(voxel(0.9, 1.8, 1.6, mats.metalLight, 0.5, 0.25, 0));

    // Connecting corridor
    g.add(voxel(0.2, 0.8, 0.8, mats.blueMetal, 0, 0.25, 0));

    // Large glass windows on wings
    const windowMat = isPowered ? mats.glass : mats.darkPipe;
    g.add(voxel(0.05, 1.2, 1.2, windowMat, -0.96, 0.6, 0));
    g.add(voxel(0.05, 1.2, 1.2, windowMat, 0.96, 0.6, 0));

    // Rooftop solar integration
    g.add(voxel(0.8, 0.05, 1.4, mats.solar, -0.5, 2.05, 0));
    g.add(voxel(0.8, 0.05, 1.4, mats.solar, 0.5, 2.05, 0));

    return g;
}

// Level 4: High-Tech Academy
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(2.4, 0.3, 2.4, mats.concrete, 0, 0, 0));

    // Modern academy building
    g.add(voxel(2.0, 2.5, 2.0, mats.concreteLight, 0, 0.3, 0));
    g.add(voxel(2.05, 0.15, 2.05, mats.blueMetal, 0, 1.0, 0));
    g.add(voxel(2.05, 0.15, 2.05, mats.blueMetal, 0, 2.0, 0));

    // Holographic simulation pods on roof
    if (!opts?.isUnderConstruction && isPowered) {
        g.add(voxel(0.6, 0.6, 0.6, mats.glass, 0, 2.8, 0));
        g.add(voxel(0.4, 0.4, 0.4, mats.emissiveCyan, 0, 2.9, 0)); // Hologram
    }

    // Modern entrance with glowing status
    g.add(voxel(0.8, 1.2, 0.05, mats.glass, 0, 0.3, 1.01));
    if (isPowered) {
        g.add(voxel(0.12, 0.12, 0.12, mats.emissiveCyan, 0, 1.5, 1.05));
    }

    // Decorative landscaping
    g.add(voxel(0.4, 0.2, 0.4, mats.leaf, -0.9, 0.3, -0.9));
    g.add(voxel(0.4, 0.2, 0.4, mats.leaf, 0.9, 0.3, -0.9));

    return g;
}
