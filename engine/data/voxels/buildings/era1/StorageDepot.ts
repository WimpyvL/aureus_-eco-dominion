
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Storage Depot Factory - Multi-level storage facility
 * Level 1: Open wooden shed with crates
 * Level 2: Covered warehouse structure
 * Level 3: Metal warehouse with loading dock
 * Level 4: Automated distribution center
 */
export const StorageDepotFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

// Level 1: Primitive wooden shed
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();

    g.add(voxel(1.8, 0.08, 1.8, mats.concrete, 0, 0, 0));

    // Corner posts
    g.add(voxel(0.1, 1.6, 0.1, mats.wood, -0.8, 0.08, -0.8));
    g.add(voxel(0.1, 1.6, 0.1, mats.wood, -0.8, 0.08, 0.8));
    g.add(voxel(0.1, 1.2, 0.1, mats.wood, 0.8, 0.08, -0.8));
    g.add(voxel(0.1, 1.2, 0.1, mats.wood, 0.8, 0.08, 0.8));

    // Roof beams & thatched roof
    g.add(voxel(1.7, 0.08, 0.08, mats.wood, 0, 1.3, -0.8));
    g.add(voxel(1.7, 0.08, 0.08, mats.wood, 0, 1.3, 0.8));
    g.add(voxel(1.8, 0.06, 1.8, mats.sand, 0, 1.5, 0));

    // Back wall
    g.add(voxel(1.6, 1.0, 0.06, mats.wood, 0, 0.58, -0.85));

    // Crates and barrels
    g.add(voxel(0.4, 0.4, 0.4, mats.wood, -0.5, 0.08, -0.5));
    g.add(voxel(0.35, 0.35, 0.35, mats.wood, 0.1, 0.08, -0.55));
    g.add(voxel(0.3, 0.3, 0.3, mats.wood, -0.5, 0.48, -0.5));
    g.add(voxel(0.25, 0.4, 0.25, mats.wood, 0.6, 0.08, -0.5));
    g.add(voxel(0.3, 0.2, 0.25, mats.sand, -0.5, 0.08, 0.2));

    return g;
}

// Level 2: Covered warehouse
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();

    g.add(voxel(1.9, 0.15, 1.9, mats.concrete, 0, 0, 0));

    // Wooden frame warehouse
    g.add(voxel(1.7, 1.5, 1.5, mats.wood, 0, 0.15, 0));

    // Metal roof
    g.add(voxel(1.8, 0.1, 1.6, mats.metal, 0, 1.65, 0));

    // Large entrance
    g.add(voxel(1.0, 1.2, 0.08, mats.metalLight, 0, 0.15, 0.76));

    // Side loading area
    g.add(voxel(0.6, 0.2, 0.6, mats.concrete, 0.85, 0.15, 0));

    // Interior shelving
    g.add(voxel(0.08, 1.2, 1.2, mats.metal, -0.75, 0.35, 0));

    // Crates on shelves
    g.add(voxel(0.4, 0.4, 0.4, mats.wood, -0.5, 0.35, -0.3));
    g.add(voxel(0.35, 0.35, 0.35, mats.blueMetal, -0.5, 0.75, -0.3));
    g.add(voxel(0.4, 0.4, 0.4, mats.wood, -0.5, 0.35, 0.3));

    // Forklift
    g.add(voxel(0.3, 0.2, 0.45, mats.hazard, 0.3, 0.15, 0.2));
    g.add(voxel(0.08, 0.4, 0.08, mats.metal, 0.2, 0.35, 0.05));

    return g;
}

// Level 3: Metal warehouse
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();

    g.add(voxel(2.0, 0.2, 2.0, mats.concrete, 0, 0, 0));

    // Main structure
    g.add(voxel(1.8, 2.0, 1.8, mats.metalLight, 0, 0.2, 0));

    // Corrugated roof
    g.add(voxel(2.0, 0.15, 2.0, mats.metal, 0, 2.2, 0));

    // Loading dock
    g.add(voxel(1.5, 0.3, 0.4, mats.concrete, 0, 0.2, 1.1));

    // Cargo doors
    g.add(voxel(0.6, 1.5, 0.1, mats.hazard, -0.45, 0.2, 0.91));
    g.add(voxel(0.6, 1.5, 0.1, mats.hazard, 0.45, 0.2, 0.91));

    // Containers
    g.add(voxel(0.5, 0.5, 0.5, mats.wood, -0.5, 0.2, -0.4));
    g.add(voxel(0.5, 0.5, 0.5, mats.blueMetal, 0.5, 0.2, -0.4));
    g.add(voxel(0.6, 0.6, 0.6, mats.metal, 0, 0.2, -0.5));

    // Inventory sign
    g.add(voxel(0.6, 0.4, 0.08, mats.metalLight, 0, 1.8, 0.92));

    // Display
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.4, 0.25, 0.05, mats.emissiveCyan, 0, 1.85, 0.95));
    }

    // Ventilation
    g.add(voxel(0.3, 0.3, 0.3, mats.metal, 0.7, 2.2, 0));

    return g;
}

// Level 4: Automated distribution center
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';

    g.add(voxel(2.0, 0.25, 2.0, mats.concrete, 0, 0, 0));

    // Large modern warehouse
    g.add(voxel(1.9, 2.4, 1.9, mats.concreteLight, 0, 0.25, 0));

    // Blue accent stripes
    g.add(voxel(1.95, 0.1, 1.95, mats.blueMetal, 0, 0.5, 0));
    g.add(voxel(1.95, 0.1, 1.95, mats.blueMetal, 0, 2.4, 0));

    // Flat modern roof
    g.add(voxel(2.0, 0.1, 2.0, mats.metalLight, 0, 2.65, 0));

    // Automated loading bays
    g.add(voxel(0.5, 1.4, 0.1, mats.glass, -0.5, 0.25, 0.96));
    g.add(voxel(0.5, 1.4, 0.1, mats.glass, 0.5, 0.25, 0.96));

    // Conveyor system visible
    g.add(voxel(0.3, 0.1, 1.5, mats.metal, 0, 0.5, 0));
    g.add(voxel(0.25, 0.08, 0.25, mats.hazard, 0, 0.55, -0.4));
    g.add(voxel(0.25, 0.08, 0.25, mats.hazard, 0, 0.55, 0.4));

    // Control tower
    g.add(voxel(0.6, 1.0, 0.6, isPowered ? mats.glass : mats.metalLight, -0.6, 2.65, -0.6));

    // Solar panels on roof
    g.add(voxel(0.8, 0.05, 0.6, mats.solar, 0.4, 2.75, 0.4));

    // Drone pad
    g.add(voxel(0.4, 0.04, 0.4, mats.hazard, 0.6, 2.75, -0.5));

    // Status display
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.5, 0.3, 0.05, isPowered ? mats.emissiveCyan : mats.emissiveRed, 0, 2.0, 0.98));
    }

    return g;
}
