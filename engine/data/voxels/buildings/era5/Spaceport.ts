
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

export const SpaceportFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    // Large launch pad
    g.add(voxel(5.0, 0.3, 5.0, mats.concrete, 0, 0, 0));
    // Launch flame trench
    g.add(voxel(1.0, 0.2, 3.0, mats.asphalt, 0, 0.05, 0));
    // Rocket/shuttle placeholder
    g.add(voxel(0.8, 3.0, 0.8, mats.concreteLight, 0, 0.3, 0));
    g.add(voxel(0.6, 0.8, 0.6, mats.metal, 0, 3.3, 0));
    // Nose cone
    g.add(voxel(0.4, 0.5, 0.4, mats.metalLight, 0, 4.1, 0));
    // Launch tower
    g.add(voxel(0.3, 4.0, 0.3, mats.metal, -1.2, 0.3, 0));
    g.add(voxel(0.8, 0.15, 0.3, mats.metal, -0.8, 2.0, 0));
    g.add(voxel(0.8, 0.15, 0.3, mats.metal, -0.8, 3.0, 0));
    // Control building
    g.add(voxel(1.5, 1.0, 1.2, mats.metal, -1.5, 0.3, -1.8));
    g.add(voxel(1.0, 0.5, 0.8, mats.glass, -1.5, 1.3, -1.8));
    // Fuel tanks
    g.add(voxel(0.6, 1.2, 0.6, mats.concreteLight, 1.8, 0.3, -1.5));
    g.add(voxel(0.6, 1.2, 0.6, mats.hazard, 1.8, 0.3, -0.5));
    // Landing lights
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.2, 0.2, 0.2, mats.emissiveRed, -2.2, 0.35, -2.2));
        g.add(voxel(0.2, 0.2, 0.2, mats.emissiveRed, 2.2, 0.35, -2.2));
        g.add(voxel(0.2, 0.2, 0.2, mats.emissiveRed, -2.2, 0.35, 2.2));
        g.add(voxel(0.2, 0.2, 0.2, mats.emissiveRed, 2.2, 0.35, 2.2));
    }
    // Service road
    g.add(voxel(2.0, 0.05, 0.6, mats.asphalt, -1.5, 0.3, 1.5));
    return g;
};
