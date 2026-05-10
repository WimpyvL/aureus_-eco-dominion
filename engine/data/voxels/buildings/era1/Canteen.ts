
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Canteen Factory - Multi-level food facility
 * Level 1: Outdoor campfire cooking
 * Level 2: Mess tent with tables
 * Level 3: Kitchen building with dining
 * Level 4: Modern restaurant/cafeteria
 */
export const CanteenFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

// Level 1: Primitive outdoor cooking
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    const isWatered = opts?.waterStatus === 'CONNECTED';

    g.add(voxel(1.8, 0.08, 1.8, mats.concrete, 0, 0, 0));

    // Fire pit
    g.add(voxel(0.5, 0.12, 0.5, mats.concrete, -0.5, 0.08, -0.3));
    if (!opts?.isUnderConstruction && isPowered) {
        g.add(voxel(0.25, 0.2, 0.25, mats.emissiveOrange, -0.5, 0.2, -0.3));
    }

    // Cooking tripod
    g.add(voxel(0.05, 0.7, 0.05, mats.wood, -0.65, 0.08, -0.15));
    g.add(voxel(0.05, 0.7, 0.05, mats.wood, -0.35, 0.08, -0.3));
    g.add(voxel(0.3, 0.04, 0.04, mats.wood, -0.5, 0.7, -0.3));
    g.add(voxel(0.15, 0.12, 0.15, mats.metal, -0.5, 0.55, -0.3));

    // Canopy
    g.add(voxel(0.08, 1.5, 0.08, mats.wood, 0.6, 0.08, -0.6));
    g.add(voxel(0.08, 1.5, 0.08, mats.wood, 0.6, 0.08, 0.6));
    g.add(voxel(0.9, 0.04, 1.4, mats.sand, 0.25, 1.3, 0));

    // Log benches
    g.add(voxel(0.6, 0.2, 0.15, mats.wood, 0.4, 0.08, 0.3));
    g.add(voxel(0.6, 0.2, 0.15, mats.wood, 0.4, 0.08, -0.1));

    // Water barrel
    g.add(voxel(0.25, 0.4, 0.25, mats.wood, -0.65, 0.08, 0.5));
    if (isWatered) {
        g.add(voxel(0.15, 0.05, 0.15, mats.waterMaterial, -0.65, 0.48, 0.5));
    }

    return g;
}

// Level 2: Mess tent with proper tables
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    const isWatered = opts?.waterStatus === 'CONNECTED';

    g.add(voxel(1.9, 0.1, 1.9, mats.concrete, 0, 0, 0));

    // Large tent structure
    g.add(voxel(0.1, 1.8, 0.1, mats.metal, -0.85, 0.1, -0.85));
    g.add(voxel(0.1, 1.8, 0.1, mats.metal, 0.85, 0.1, -0.85));
    g.add(voxel(0.1, 1.5, 0.1, mats.metal, -0.85, 0.1, 0.85));
    g.add(voxel(0.1, 1.5, 0.1, mats.metal, 0.85, 0.1, 0.85));

    // Canvas roof
    g.add(voxel(1.9, 0.06, 1.9, mats.sand, 0, 1.6, 0));
    g.add(voxel(1.6, 0.04, 1.6, mats.sand, 0, 1.75, 0));

    // Kitchen counter (back)
    g.add(voxel(1.4, 0.8, 0.4, mats.metal, 0, 0.1, -0.65));
    g.add(voxel(1.3, 0.06, 0.35, mats.metalLight, 0, 0.9, -0.65));

    // Stove
    g.add(voxel(0.4, 0.3, 0.3, mats.metal, -0.4, 0.9, -0.65));
    if (!opts?.isUnderConstruction && isPowered) {
        g.add(voxel(0.15, 0.05, 0.15, mats.emissiveOrange, -0.4, 1.2, -0.65));
    }

    // Tables
    g.add(voxel(0.7, 0.06, 0.5, mats.wood, -0.3, 0.55, 0.3));
    g.add(voxel(0.7, 0.06, 0.5, mats.wood, 0.5, 0.55, 0.3));

    // Table legs
    g.add(voxel(0.06, 0.45, 0.06, mats.metal, -0.55, 0.1, 0.15));
    g.add(voxel(0.06, 0.45, 0.06, mats.metal, -0.05, 0.1, 0.45));
    g.add(voxel(0.06, 0.45, 0.06, mats.metal, 0.25, 0.1, 0.15));
    g.add(voxel(0.06, 0.45, 0.06, mats.metal, 0.75, 0.1, 0.45));

    // Benches
    g.add(voxel(0.65, 0.25, 0.15, mats.wood, -0.3, 0.1, 0.65));
    g.add(voxel(0.65, 0.25, 0.15, mats.wood, 0.5, 0.1, 0.65));

    // Water station
    g.add(voxel(0.3, 0.5, 0.3, isWatered ? mats.blueMetal : mats.metal, 0.65, 0.1, -0.65));

    return g;
}

// Level 3: Kitchen building
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    const isWatered = opts?.waterStatus === 'CONNECTED';

    g.add(voxel(2.0, 0.2, 2.0, mats.concrete, 0, 0, 0));

    // Main building
    g.add(voxel(1.7, 1.6, 1.5, mats.brick, 0, 0.2, 0));

    // Large windows (dining area view)
    const windowMat = isPowered ? mats.glass : mats.darkPipe;
    g.add(voxel(0.5, 0.6, 0.08, windowMat, -0.4, 0.6, 0.76));
    g.add(voxel(0.5, 0.6, 0.08, windowMat, 0.4, 0.6, 0.76));

    // Kitchen exhaust hood
    g.add(voxel(0.5, 0.3, 0.4, mats.metal, -0.4, 1.3, -0.5));
    g.add(voxel(0.2, 0.8, 0.2, mats.metal, -0.4, 1.6, -0.5));

    // Entrance
    g.add(voxel(0.5, 0.9, 0.08, mats.glass, 0, 0.2, 0.76));

    // Roof
    g.add(voxel(1.8, 0.12, 1.6, mats.metal, 0, 1.8, 0));

    // Rooftop AC/ventilation
    g.add(voxel(0.4, 0.3, 0.4, mats.metalLight, 0.5, 1.8, -0.4));

    // Outdoor seating (patio)
    g.add(voxel(0.8, 0.04, 0.6, mats.concrete, 0, 0.2, 0.95));
    g.add(voxel(0.5, 0.06, 0.4, mats.wood, 0, 0.55, 0.95));

    // Status light
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.1, 0.1, 0.1, isPowered && isWatered ? mats.emissiveGreen : mats.emissiveRed, 0.7, 0.5, 0.76));
    }

    return g;
}

// Level 4: Modern cafeteria/restaurant
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    const isWatered = opts?.waterStatus === 'CONNECTED';

    g.add(voxel(2.0, 0.2, 2.0, mats.concrete, 0, 0, 0));

    // Modern building with glass facade
    g.add(voxel(1.8, 2.0, 1.6, mats.concreteLight, 0, 0.2, 0));

    // Large glass windows (greenhouse style dining)
    const windowMat = isPowered ? mats.glass : mats.darkPipe;
    g.add(voxel(1.5, 1.2, 0.08, windowMat, 0, 0.6, 0.81));
    g.add(voxel(0.08, 1.2, 0.8, windowMat, 0.91, 0.6, 0));

    // Metal frame accents
    g.add(voxel(1.6, 0.06, 0.06, mats.blueMetal, 0, 0.35, 0.81));
    g.add(voxel(1.6, 0.06, 0.06, mats.blueMetal, 0, 1.8, 0.81));
    g.add(voxel(0.06, 1.5, 0.06, mats.blueMetal, -0.75, 0.35, 0.81));
    g.add(voxel(0.06, 1.5, 0.06, mats.blueMetal, 0.75, 0.35, 0.81));

    // Modern roof with skylights
    g.add(voxel(1.9, 0.1, 1.7, mats.metalLight, 0, 2.2, 0));
    g.add(voxel(0.5, 0.06, 0.5, mats.glass, 0, 2.3, 0.3));

    // Industrial kitchen exhaust
    g.add(voxel(0.6, 0.4, 0.5, mats.metal, 0, 2.2, -0.5));
    g.add(voxel(0.3, 0.6, 0.3, mats.metal, 0, 2.5, -0.5));

    // Outdoor terrace
    g.add(voxel(1.0, 0.08, 0.5, mats.wood, 0, 0.2, 1.0));
    g.add(voxel(0.08, 0.5, 0.08, mats.metal, -0.4, 0.28, 1.15));
    g.add(voxel(0.08, 0.5, 0.08, mats.metal, 0.4, 0.28, 1.15));
    g.add(voxel(0.9, 0.04, 0.04, mats.metal, 0, 0.78, 1.15));

    // Hydroponic garden visible through glass
    if (isWatered) {
        g.add(voxel(0.4, 0.3, 0.3, mats.leaf, -0.5, 0.2, 0.4));
        g.add(voxel(0.3, 0.35, 0.25, mats.progressGreen, 0.5, 0.2, 0.4));
    }

    // Status beacon
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.1, 0.15, 0.1, isPowered && isWatered ? mats.emissiveCyan : mats.emissiveRed, 0, 3.1, -0.5));
    }

    return g;
}
