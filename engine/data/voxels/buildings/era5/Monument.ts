
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

export const MonumentFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    // Grand base
    g.add(voxel(2.0, 0.4, 2.0, mats.concrete, 0, 0, 0));
    g.add(voxel(1.6, 0.3, 1.6, mats.concrete, 0, 0.4, 0));
    g.add(voxel(1.2, 0.2, 1.2, mats.concrete, 0, 0.7, 0));
    // Central pillar
    g.add(voxel(0.5, 2.5, 0.5, mats.metalLight, 0, 0.9, 0));
    // Top orb (golden/glowing)
    g.add(voxel(0.6, 0.6, 0.6, mats.emissiveGreen, 0, 3.4, 0));
    // Decorative wings
    g.add(voxel(0.8, 0.1, 0.15, mats.metal, 0, 2.5, 0));
    g.add(voxel(0.15, 0.1, 0.8, mats.metal, 0, 2.5, 0));
    // Corner accents
    g.add(voxel(0.2, 0.8, 0.2, mats.metalLight, -0.7, 0.4, -0.7));
    g.add(voxel(0.2, 0.8, 0.2, mats.metalLight, 0.7, 0.4, -0.7));
    g.add(voxel(0.2, 0.8, 0.2, mats.metalLight, -0.7, 0.4, 0.7));
    g.add(voxel(0.2, 0.8, 0.2, mats.metalLight, 0.7, 0.4, 0.7));
    // Plaque
    g.add(voxel(0.6, 0.3, 0.05, mats.metal, 0, 0.5, 0.81));
    return g;
};
