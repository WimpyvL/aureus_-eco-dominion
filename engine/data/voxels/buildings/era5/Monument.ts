import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { cylinder, dome, FactoryOptions, taperedCylinder, torusRing, voxel } from '../../../../render/utils/VoxelBuilder';

export const MonumentFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    const detailLevel = opts?.detailLevel ?? 'MEDIUM';
    const isHighDetail = detailLevel === 'HIGH';

    const addCornerSpire = (x: number, z: number) => {
        g.add(voxel(0.42, 1.48, 0.42, mats.metalLight, x, 0.5, z));
        g.add(taperedCylinder(0.12, 0.18, 1.2, mats.gold, x, 1.98, z));
        g.add(voxel(0.24, 0.28, 0.24, mats.emissiveGreen, x, 3.08, z));
    };

    g.add(voxel(7.0, 0.28, 7.0, mats.concrete, 0, 0, 0));
    g.add(voxel(6.4, 0.16, 6.4, mats.concreteLight, 0, 0.28, 0));
    g.add(voxel(5.4, 0.24, 5.4, mats.concrete, 0, 0.44, 0));
    g.add(voxel(4.2, 0.24, 4.2, mats.concreteLight, 0, 0.68, 0));
    g.add(voxel(3.1, 0.22, 3.1, mats.concrete, 0, 0.92, 0));

    g.add(voxel(1.34, 5.25, 1.34, mats.metalLight, 0, 1.14, 0));
    g.add(voxel(1.72, 0.18, 1.72, mats.gold, 0, 2.28, 0));
    g.add(voxel(1.56, 0.18, 1.56, mats.gold, 0, 3.76, 0));
    g.add(cylinder(0.42, 2.05, mats.gold, 0, 5.02, 0));
    g.add(taperedCylinder(0.26, 0.38, 1.35, mats.metalLight, 0, 7.0, 0));
    g.add(dome(0.72, mats.gold, 0, 8.24, 0, { detailLevel }));
    g.add(voxel(0.3, 0.3, 0.3, mats.emissiveGreen, 0, 8.78, 0));

    g.add(voxel(2.3, 0.18, 0.24, mats.gold, 0, 4.28, 0));
    g.add(voxel(0.24, 0.18, 2.3, mats.gold, 0, 4.28, 0));
    g.add(voxel(1.54, 0.12, 0.16, mats.metal, 0, 5.0, 0));
    g.add(voxel(0.16, 0.12, 1.54, mats.metal, 0, 5.0, 0));
    g.add(torusRing(0.94, 0.07, mats.gold, 0, 7.74, 0, { detailLevel, rotationX: Math.PI / 2 }));

    addCornerSpire(-2.18, -2.18);
    addCornerSpire(2.18, -2.18);
    addCornerSpire(-2.18, 2.18);
    addCornerSpire(2.18, 2.18);

    g.add(voxel(1.54, 0.5, 0.12, mats.metal, 0, 0.58, 2.38));
    g.add(voxel(1.28, 0.1, 0.72, mats.gold, 0, 1.06, 2.22));

    g.add(voxel(0.28, 1.0, 0.28, mats.gold, -1.24, 1.2, 0));
    g.add(voxel(0.28, 1.0, 0.28, mats.gold, 1.24, 1.2, 0));
    g.add(voxel(0.28, 1.0, 0.28, mats.gold, 0, 1.2, -1.24));
    g.add(voxel(0.28, 1.0, 0.28, mats.gold, 0, 1.2, 1.24));

    g.add(voxel(2.0, 0.12, 0.48, mats.concreteLight, 0, 0.28, 2.9));
    g.add(voxel(1.2, 0.08, 0.22, mats.gold, 0, 0.42, 2.86));
    g.add(voxel(1.7, 0.12, 0.42, mats.concreteLight, -2.58, 0.28, 0));
    g.add(voxel(1.7, 0.12, 0.42, mats.concreteLight, 2.58, 0.28, 0));
    g.add(voxel(0.42, 0.12, 1.7, mats.concreteLight, 0, 0.28, -2.58));

    g.add(voxel(0.92, 0.14, 0.92, mats.glass, -1.92, 0.32, 1.26));
    g.add(voxel(0.92, 0.14, 0.92, mats.glass, 1.92, 0.32, 1.26));
    g.add(voxel(0.12, 0.24, 0.12, mats.emissiveCyan, -1.92, 0.38, 1.26));
    g.add(voxel(0.12, 0.24, 0.12, mats.emissiveCyan, 1.92, 0.38, 1.26));

    g.add(voxel(0.24, 1.52, 0.24, mats.metalLight, -3.02, 0.28, 0));
    g.add(voxel(0.24, 1.52, 0.24, mats.metalLight, 3.02, 0.28, 0));
    g.add(voxel(0.24, 1.52, 0.24, mats.metalLight, 0, 0.28, -3.02));
    g.add(voxel(0.24, 1.52, 0.24, mats.metalLight, 0, 0.28, 3.02));
    g.add(voxel(0.18, 0.22, 0.18, mats.emissiveGreen, -3.02, 1.84, 0));
    g.add(voxel(0.18, 0.22, 0.18, mats.emissiveGreen, 3.02, 1.84, 0));
    g.add(voxel(0.18, 0.22, 0.18, mats.emissiveGreen, 0, 1.84, -3.02));
    g.add(voxel(0.18, 0.22, 0.18, mats.emissiveGreen, 0, 1.84, 3.02));

    if (isHighDetail) {
        g.add(voxel(0.18, 0.18, 0.18, mats.emissiveGreen, -2.54, 1.2, -2.54));
        g.add(voxel(0.18, 0.18, 0.18, mats.emissiveGreen, 2.54, 1.2, -2.54));
        g.add(voxel(0.18, 0.18, 0.18, mats.emissiveGreen, -2.54, 1.2, 2.54));
        g.add(voxel(0.18, 0.18, 0.18, mats.emissiveGreen, 2.54, 1.2, 2.54));
        g.add(voxel(0.64, 0.16, 0.2, mats.gold, -1.88, 0.74, 2.12));
        g.add(voxel(0.64, 0.16, 0.2, mats.gold, 1.88, 0.74, 2.12));
    }

    return g;
};
