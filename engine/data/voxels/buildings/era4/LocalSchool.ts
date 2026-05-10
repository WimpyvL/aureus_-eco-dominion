import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { cylinder, FactoryOptions, voxel } from '../../../../render/utils/VoxelBuilder';

export const LocalSchoolFactory = () => {
    const g = new THREE.Group();

    g.add(voxel(3.0, 0.24, 3.0, mats.concrete, 0, 0, 0));
    g.add(voxel(2.7, 0.1, 2.7, mats.concreteLight, 0, 0.24, 0));

    g.add(voxel(2.6, 2.9, 0.92, mats.brick, 0, 0.24, -0.98));
    g.add(voxel(0.92, 2.9, 1.92, mats.brick, -0.98, 0.24, 0.14));

    for (let y = 0.7; y <= 2.3; y += 0.8) {
        for (let x = -1.0; x <= 1.0; x += 0.5) {
            g.add(voxel(0.34, 0.48, 0.1, mats.glass, x, y, -0.48));
        }
    }

    for (let y = 0.7; y <= 2.3; y += 0.8) {
        for (let z = -0.46; z <= 0.88; z += 0.62) {
            g.add(voxel(0.1, 0.48, 0.38, mats.glass, -0.48, y, z));
        }
    }

    g.add(voxel(0.84, 1.26, 0.16, mats.wood, 0, 0.24, -0.42));
    g.add(voxel(1.28, 0.12, 0.72, mats.metal, 0, 1.7, -0.18));
    g.add(voxel(0.12, 0.92, 0.12, mats.metal, -0.52, 0.84, 0));
    g.add(voxel(0.12, 0.92, 0.12, mats.metal, 0.52, 0.84, 0));

    g.add(voxel(2.82, 0.28, 1.08, mats.metal, 0, 3.08, -0.98));
    g.add(voxel(1.12, 0.28, 2.08, mats.metal, -0.98, 3.08, 0.14));

    g.add(voxel(0.58, 4.42, 0.58, mats.brick, 1.14, 0.24, -1.12));
    g.add(voxel(0.68, 0.18, 0.68, mats.concrete, 1.14, 4.56, -1.12));
    g.add(voxel(0.34, 0.42, 0.34, mats.gold, 1.14, 4.72, -1.12));
    g.add(voxel(0.16, 0.16, 0.16, mats.emissiveGreen, 1.14, 5.14, -1.12));

    g.add(cylinder(0.05, 3.08, mats.metal, 1.26, 0.24, 1.18));
    g.add(voxel(0.44, 0.28, 0.05, mats.hazard, 1.26, 3.16, 1.18));

    g.add(voxel(1.28, 0.08, 1.28, mats.asphalt, 0.84, 0.24, 0.86));
    g.add(voxel(0.12, 1.24, 0.12, mats.metal, 0.54, 0.32, 0.52));
    g.add(voxel(0.12, 1.24, 0.12, mats.metal, 1.14, 0.32, 0.52));
    g.add(voxel(0.72, 0.08, 0.08, mats.metal, 0.84, 1.52, 0.52));
    g.add(voxel(0.05, 0.52, 0.05, mats.metal, 0.7, 1.02, 0.52));
    g.add(voxel(0.16, 0.08, 0.1, mats.wood, 0.7, 0.54, 0.52));
    g.add(voxel(0.05, 0.52, 0.05, mats.metal, 0.98, 1.02, 0.52));
    g.add(voxel(0.16, 0.08, 0.1, mats.wood, 0.98, 0.54, 0.52));

    g.add(voxel(0.16, 1.06, 0.16, mats.metal, 1.06, 0.32, 1.06));
    g.add(voxel(0.44, 0.08, 0.44, mats.metal, 1.06, 1.34, 1.06));
    const slide = voxel(0.28, 0.08, 0.92, mats.blueMetal, 1.04, 0.84, 0.58);
    slide.rotation.x = 0.5;
    g.add(slide);

    g.add(voxel(0.72, 0.32, 0.22, mats.wood, -0.28, 0.24, 0.54));
    g.add(voxel(0.72, 0.32, 0.22, mats.wood, 0.48, 0.24, 1.24));
    g.add(voxel(0.42, 0.34, 0.42, mats.concrete, -1.18, 0.24, 1.04));
    g.add(voxel(0.2, 0.86, 0.2, mats.wood, -1.18, 0.58, 1.04));
    g.add(voxel(0.58, 0.58, 0.58, mats.leaf, -1.18, 1.18, 1.04));
    g.add(voxel(0.68, 0.44, 0.16, mats.metal, 0.34, 0.24, -0.12));

    g.add(voxel(0.94, 0.56, 0.12, mats.concreteLight, 0, 2.56, -0.4));
    g.add(voxel(0.72, 0.34, 0.06, mats.blueMetal, 0, 2.64, -0.34));
    g.add(voxel(0.52, 0.22, 0.03, mats.glass, 0, 2.72, -0.31));
    g.add(voxel(0.2, 0.08, 0.01, mats.emissiveCyan, 0, 2.78, -0.29));

    return g;
};
