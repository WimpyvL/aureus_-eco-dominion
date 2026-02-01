
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

export const HydroponicsFactory = () => {
    const g = new THREE.Group();
    // Base
    g.add(voxel(2.0, 0.15, 2.0, mats.concrete, 0, 0, 0));
    // Glass greenhouse structure
    g.add(voxel(1.8, 1.8, 1.8, mats.glass, 0, 0.15, 0));
    // Frame
    g.add(voxel(0.1, 1.8, 0.1, mats.metalLight, -0.9, 0.15, -0.9));
    g.add(voxel(0.1, 1.8, 0.1, mats.metalLight, 0.9, 0.15, -0.9));
    g.add(voxel(0.1, 1.8, 0.1, mats.metalLight, -0.9, 0.15, 0.9));
    g.add(voxel(0.1, 1.8, 0.1, mats.metalLight, 0.9, 0.15, 0.9));
    // Grow beds (stacked)
    for (let y = 0.4; y <= 1.4; y += 0.5) {
        g.add(voxel(1.4, 0.1, 0.4, mats.leaf, 0, y, -0.4));
        g.add(voxel(1.4, 0.1, 0.4, mats.leaf, 0, y, 0.4));
    }
    // Grow lights
    g.add(voxel(1.5, 0.05, 0.1, mats.emissiveCyan, 0, 1.8, 0));
    // Water pipes
    g.add(voxel(0.08, 1.6, 0.08, mats.blueMetal, -0.7, 0.3, 0));
    g.add(voxel(0.08, 1.6, 0.08, mats.blueMetal, 0.7, 0.3, 0));
    return g;
};
