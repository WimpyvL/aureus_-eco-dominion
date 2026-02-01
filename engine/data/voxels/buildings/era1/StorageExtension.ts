
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Storage Extension Factory - Multi-level capacity expander
 * Level 1: Wooden crate stack (primitive)
 * Level 2: Industrial storage racks (Original)
 * Level 3: Dual-bay container module
 * Level 4: Nanotech compressed vault extension
 */
export const StorageExtensionFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

// Level 1: Simple wood crates
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.8, 0.1, 0.8, mats.dirt, 0, 0, 0));
    // Three wooden crates
    g.add(voxel(0.5, 0.5, 0.5, mats.wood, -0.6, 0.1, 0));
    g.add(voxel(0.5, 0.5, 0.5, mats.wood, 0, 0.1, 0));
    g.add(voxel(0.5, 0.5, 0.5, mats.wood, 0.6, 0.1, 0));
    return g;
}

// Level 2: Industrial racks (Original)
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(2.0, 0.2, 1.0, mats.concrete, 0, 0, 0));
    g.add(voxel(1.8, 1.5, 0.8, mats.metal, 0, 0.2, 0));
    g.add(voxel(0.5, 0.5, 0.5, mats.wood, -0.5, 0.25, 0));
    g.add(voxel(0.5, 0.5, 0.5, mats.blueMetal, 0.5, 0.25, 0));
    g.add(voxel(0.4, 0.4, 0.4, mats.wood, -0.5, 0.75, 0));
    return g;
}

// Level 3: Dual-bay module
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(2.0, 0.3, 1.0, mats.concrete, 0, 0, 0));
    // Two high-capacity metal containers
    g.add(voxel(0.9, 1.8, 0.8, mats.blueMetal, -0.48, 0.3, 0));
    g.add(voxel(0.9, 1.8, 0.8, mats.blueMetal, 0.48, 0.3, 0));
    // Hazard stripes
    g.add(voxel(1.9, 0.1, 0.1, mats.hazard, 0, 0.1, 0.46));
    return g;
}

// Level 4: Nanotech Compressed Vault
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(2.0, 0.4, 1.0, mats.concrete, 0, 0, 0));
    // Sleek white hex shell
    g.add(voxel(1.8, 1.2, 0.8, mats.concreteLight, 0, 0.4, 0));
    // Glowing nanotech core
    g.add(voxel(1.2, 0.8, 0.1, mats.emissiveCyan, 0, 0.6, 0.41));
    g.add(voxel(0.1, 1.2, 0.1, mats.emissiveCyan, 0.86, 0.4, 0));
    g.add(voxel(0.1, 1.2, 0.1, mats.emissiveCyan, -0.86, 0.4, 0));
    return g;
}
