import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { cylinder, FactoryOptions, taperedCylinder, voxel } from '../../../../render/utils/VoxelBuilder';

export const GeothermalPlantFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();

    g.add(voxel(2.0, 0.28, 2.0, mats.concrete, 0, 0, 0));
    g.add(voxel(1.78, 0.1, 1.78, mats.concreteLight, 0, 0.28, 0));
    g.add(voxel(1.42, 1.36, 1.42, mats.metal, 0, 0.28, 0));

    g.add(cylinder(0.18, 1.12, mats.darkPipe, -0.7, 1.46, -0.7));
    g.add(cylinder(0.18, 1.12, mats.darkPipe, 0.7, 1.46, 0.7));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.36, 0.12, 0.36, mats.emissiveRed, -0.7, 2.54, -0.7));
        g.add(voxel(0.36, 0.12, 0.36, mats.emissiveRed, 0.7, 2.54, 0.7));
    }

    g.add(taperedCylinder(0.18, 0.28, 0.84, mats.concrete, -0.74, 0.28, 0.76));
    g.add(taperedCylinder(0.18, 0.28, 0.84, mats.concrete, 0.74, 0.28, -0.76));
    g.add(voxel(0.24, 0.28, 0.24, mats.darkPipe, 0, 0, 0));
    g.add(voxel(0.44, 0.68, 0.16, mats.metal, 0, 0.72, 0.76));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.18, 0.26, 0.06, mats.emissiveGreen, 0, 0.96, 0.82));
    }

    g.add(voxel(0.92, 0.12, 0.12, mats.darkPipe, 0.58, 0.92, 0));
    g.add(voxel(0.12, 0.62, 0.62, mats.darkPipe, -0.92, 0.62, 0.18));
    g.add(voxel(0.12, 0.62, 0.62, mats.darkPipe, 0.92, 0.62, -0.18));

    return g;
};
