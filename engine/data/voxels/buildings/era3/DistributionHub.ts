
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

export const DistributionHubFactory = () => {
    const g = new THREE.Group();
    // Platform
    g.add(voxel(2.0, 0.2, 2.0, mats.concrete, 0, 0, 0));
    // Warehouse
    g.add(voxel(1.8, 1.0, 1.4, mats.metal, 0, 0.2, -0.2));
    // Loading dock
    g.add(voxel(1.6, 0.1, 0.5, mats.asphalt, 0, 0.2, 0.7));
    // Conveyor belts
    g.add(voxel(0.3, 0.08, 1.5, mats.metalLight, -0.5, 0.5, 0));
    g.add(voxel(0.3, 0.08, 1.5, mats.metalLight, 0.5, 0.5, 0));
    // Crates
    g.add(voxel(0.3, 0.3, 0.3, mats.wood, -0.6, 0.2, 0.6));
    g.add(voxel(0.3, 0.3, 0.3, mats.wood, 0.0, 0.2, 0.6));
    g.add(voxel(0.3, 0.3, 0.3, mats.wood, 0.6, 0.2, 0.6));
    // Forklift
    g.add(voxel(0.4, 0.4, 0.25, mats.hazard, 0.6, 0.2, 0));
    // Office section
    g.add(voxel(0.5, 0.6, 0.5, mats.concreteLight, -0.65, 1.2, -0.65));
    return g;
};
