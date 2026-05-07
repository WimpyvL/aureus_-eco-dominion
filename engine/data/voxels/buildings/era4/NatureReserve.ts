import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { cylinder, FactoryOptions, voxel } from '../../../../render/utils/VoxelBuilder';

export const NatureReserveFactory = () => {
    const g = new THREE.Group();

    const addTree = (x: number, z: number, height: number, canopy: number) => {
        g.add(cylinder(0.08, height, mats.wood, x, 0.12, z));
        g.add(voxel(canopy, canopy * 0.72, canopy, mats.leaf, x, height * 0.72, z));
        g.add(voxel(canopy * 0.62, canopy * 0.52, canopy * 0.62, mats.leafDark, x + 0.08, height * 0.96, z - 0.06));
    };

    g.add(voxel(4.0, 0.14, 4.0, mats.dirt, 0, 0, 0));
    g.add(voxel(2.0, 0.16, 1.7, mats.grass, -1.0, 0.12, -1.0));
    g.add(voxel(1.8, 0.16, 1.8, mats.grass, 1.0, 0.12, 1.0));
    g.add(voxel(1.2, 0.12, 1.4, mats.savannaGreen, -0.2, 0.12, 1.2));

    addTree(-1.2, -1.18, 1.8, 0.86);
    addTree(1.04, -0.86, 1.42, 0.68);
    addTree(-0.56, 1.24, 2.08, 1.08);
    addTree(0.92, 1.48, 1.62, 0.78);

    g.add(voxel(1.22, 0.12, 0.84, mats.reservoirWater, 0.96, 0.12, 0.92));
    g.add(voxel(0.18, 0.22, 0.18, mats.leaf, 0.48, 0.18, 0.52));
    g.add(voxel(0.18, 0.26, 0.18, mats.progressGreen, 0.76, 0.18, 1.24));

    g.add(voxel(4.0, 0.42, 0.08, mats.wood, 0, 0.2, -1.96));
    g.add(voxel(4.0, 0.42, 0.08, mats.wood, 0, 0.2, 1.96));
    g.add(voxel(0.08, 0.42, 4.0, mats.wood, -1.96, 0.2, 0));
    g.add(voxel(0.08, 0.42, 4.0, mats.wood, 1.96, 0.2, 0));

    g.add(voxel(0.72, 0.72, 0.72, mats.wood, 1.48, 0.12, -1.48));
    g.add(voxel(0.8, 0.12, 0.8, mats.metalLight, 1.48, 0.84, -1.48));
    g.add(voxel(0.22, 0.36, 0.1, mats.glass, 1.48, 0.42, -1.08));
    g.add(voxel(0.42, 0.08, 0.18, mats.hazard, 1.48, 0.62, -1.02));

    g.add(voxel(0.18, 0.5, 1.02, mats.wood, -1.42, 0.12, 0.62));
    g.add(voxel(0.18, 0.32, 0.18, mats.wood, -1.42, 0.62, 0.16));
    g.add(voxel(0.18, 0.32, 0.18, mats.wood, -1.42, 0.62, 1.08));

    return g;
};
