
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

export const NatureReserveFactory = () => {
    const g = new THREE.Group();
    // Natural ground
    g.add(voxel(4.0, 0.1, 4.0, mats.dirt, 0, 0, 0));
    // Grass patches
    g.add(voxel(1.5, 0.15, 1.5, mats.grass, -1.0, 0.1, -1.0));
    g.add(voxel(1.5, 0.15, 1.5, mats.grass, 1.0, 0.1, 1.0));
    // Trees
    g.add(voxel(0.2, 1.5, 0.2, mats.wood, -1.2, 0.1, -1.2));
    g.add(voxel(0.8, 0.8, 0.8, mats.leaf, -1.2, 1.4, -1.2));
    g.add(voxel(0.2, 1.2, 0.2, mats.wood, 1.0, 0.1, -0.8));
    g.add(voxel(0.6, 0.6, 0.6, mats.leaf, 1.0, 1.1, -0.8));
    g.add(voxel(0.2, 1.8, 0.2, mats.wood, -0.5, 0.1, 1.2));
    g.add(voxel(1.0, 1.0, 1.0, mats.leaf, -0.5, 1.6, 1.2));
    // Small pond
    g.add(voxel(1.2, 0.1, 0.8, mats.reservoirWater, 0.8, 0.1, 0.8));
    // Wooden fence perimeter
    g.add(voxel(4.0, 0.4, 0.08, mats.wood, 0, 0.2, -1.96));
    g.add(voxel(4.0, 0.4, 0.08, mats.wood, 0, 0.2, 1.96));
    // Ranger station
    g.add(voxel(0.6, 0.6, 0.6, mats.wood, 1.5, 0.1, -1.5));
    g.add(voxel(0.7, 0.1, 0.7, mats.metalLight, 1.5, 0.7, -1.5));
    return g;
};
