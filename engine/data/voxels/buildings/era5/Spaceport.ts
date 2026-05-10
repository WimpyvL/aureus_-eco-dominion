import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { cylinder, FactoryOptions, taperedCylinder, voxel } from '../../../../render/utils/VoxelBuilder';

export const SpaceportFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    const detailLevel = opts?.detailLevel ?? 'MEDIUM';
    const isHighDetail = detailLevel === 'HIGH';

    const addPadLight = (x: number, z: number) => {
        g.add(voxel(0.18, 0.18, 0.18, mats.emissiveRed, x, 0.36, z));
        g.add(voxel(0.24, 0.05, 0.24, mats.metalLight, x, 0.31, z));
    };

    const addFuelTank = (x: number, z: number, height: number) => {
        g.add(cylinder(0.24, height, mats.concreteLight, x, 0.32, z));
        g.add(voxel(0.16, 0.18, 0.16, mats.hazard, x, height + 0.32, z));
        g.add(voxel(0.12, height * 0.7, 0.12, mats.metal, x + 0.28, 0.32, z));
    };

    g.add(voxel(7.0, 0.36, 7.0, mats.concrete, 0, 0, 0));
    g.add(voxel(6.4, 0.12, 6.4, mats.concreteLight, 0, 0.36, 0));
    g.add(voxel(2.5, 0.18, 4.9, mats.asphalt, 0.1, 0.38, 0.15));
    g.add(voxel(1.28, 0.14, 5.8, mats.asphalt, 2.6, 0.38, 0));
    g.add(voxel(1.22, 0.14, 2.2, mats.asphalt, -2.62, 0.38, -1.9));
    g.add(voxel(3.4, 0.1, 0.82, mats.asphalt, -1.2, 0.38, 2.44));

    g.add(voxel(1.44, 5.2, 1.44, mats.concreteLight, 0, 0.36, 0));
    g.add(voxel(1.08, 2.9, 1.08, mats.white, 0, 5.56, 0));
    g.add(voxel(0.72, 1.7, 0.72, mats.metal, 0, 8.42, 0));
    g.add(voxel(0.46, 1.18, 0.46, mats.blueMetal, 0, 10.02, 0));
    g.add(voxel(0.28, 0.56, 0.28, mats.emissiveCyan, 0, 11.04, 0));
    g.add(taperedCylinder(0.08, 0.34, 1.22, mats.emissiveOrange, 0, 0.36, 0));
    g.add(voxel(0.62, 0.14, 0.62, mats.blueMetal, 0, 2.14, 0));
    g.add(voxel(0.54, 0.14, 0.54, mats.blueMetal, 0, 4.2, 0));
    g.add(voxel(0.48, 0.14, 0.48, mats.blueMetal, 0, 6.56, 0));
    g.add(voxel(0.42, 0.14, 0.42, mats.blueMetal, 0, 8.9, 0));

    g.add(voxel(0.42, 7.8, 0.42, mats.metal, -2.34, 0.36, 0));
    g.add(voxel(0.42, 6.6, 0.42, mats.metal, -1.76, 0.36, 0));
    g.add(voxel(0.42, 5.2, 0.42, mats.metal, -1.18, 0.36, 0));
    g.add(voxel(1.68, 0.16, 0.32, mats.metal, -1.72, 1.98, 0));
    g.add(voxel(1.48, 0.16, 0.32, mats.metal, -1.48, 3.28, 0));
    g.add(voxel(1.28, 0.16, 0.32, mats.metal, -1.18, 4.64, 0));
    g.add(voxel(1.1, 0.16, 0.32, mats.metal, -0.92, 6.08, 0));
    g.add(voxel(0.34, 0.34, 0.34, mats.emissiveGreen, -2.34, 8.18, 0));

    g.add(voxel(2.5, 1.68, 2.0, mats.metal, -2.42, 0.36, -2.5));
    g.add(voxel(1.86, 0.9, 1.56, mats.glass, -2.42, 2.04, -2.5));
    g.add(voxel(2.62, 0.18, 2.14, mats.concreteLight, -2.42, 2.9, -2.5));
    g.add(voxel(0.44, 1.44, 0.44, mats.metal, -3.34, 0.36, -1.54));
    g.add(voxel(0.44, 1.44, 0.44, mats.metal, -1.5, 0.36, -1.54));
    g.add(voxel(1.9, 0.12, 0.82, mats.asphalt, -2.42, 0.36, -1.02));
    g.add(voxel(1.2, 0.12, 0.42, mats.glass, -2.4, 1.2, -1.34));

    g.add(voxel(1.82, 1.12, 1.22, mats.concreteLight, 2.34, 0.36, 2.26));
    g.add(voxel(1.3, 0.62, 0.88, mats.metal, 2.34, 1.48, 2.26));
    g.add(voxel(0.52, 0.22, 0.52, mats.blueMetal, 2.34, 2.12, 2.26));
    g.add(voxel(0.18, 0.18, 0.18, mats.emissiveCyan, 2.34, 2.4, 2.26));

    g.add(voxel(2.36, 0.18, 1.08, mats.concrete, 2.48, 0.36, -2.54));
    addFuelTank(2.02, -2.52, 2.28);
    addFuelTank(2.72, -2.52, 2.02);
    addFuelTank(2.36, -1.54, 2.54);
    addFuelTank(3.02, -1.7, 1.72);

    g.add(voxel(0.28, 0.24, 4.9, mats.hazard, 0, 0.38, 0.14));
    g.add(voxel(2.18, 0.06, 0.28, mats.white, 0, 0.4, 2.16));
    g.add(voxel(0.28, 0.06, 2.18, mats.white, 0, 0.4, 2.16));
    g.add(voxel(1.34, 0.06, 0.2, mats.white, 0, 0.4, -2.42));
    g.add(voxel(0.2, 0.06, 1.34, mats.white, 0, 0.4, -2.42));

    addPadLight(-3.08, -3.08);
    addPadLight(3.08, -3.08);
    addPadLight(-3.08, 3.08);
    addPadLight(3.08, 3.08);
    addPadLight(-3.08, 0);
    addPadLight(3.08, 0);
    addPadLight(0, -3.08);
    addPadLight(0, 3.08);
    addPadLight(-1.88, 2.62);
    addPadLight(1.88, 2.62);

    if (isHighDetail) {
        g.add(voxel(0.24, 2.8, 0.24, mats.metal, 3.02, 0.36, 2.82));
        g.add(voxel(0.24, 2.8, 0.24, mats.metal, -3.02, 0.36, 2.82));
        g.add(voxel(0.28, 0.28, 0.28, mats.emissiveCyan, 3.02, 3.18, 2.82));
        g.add(voxel(0.28, 0.28, 0.28, mats.emissiveCyan, -3.02, 3.18, 2.82));
        g.add(voxel(0.42, 0.26, 0.42, mats.metalLight, 1.32, 0.36, 2.0));
        g.add(voxel(0.16, 0.16, 0.16, mats.emissiveGreen, 1.32, 0.64, 2.0));
        g.add(voxel(0.42, 0.26, 0.42, mats.metalLight, -1.32, 0.36, 2.0));
        g.add(voxel(0.16, 0.16, 0.16, mats.emissiveGreen, -1.32, 0.64, 2.0));
        g.add(voxel(0.62, 0.2, 0.34, mats.metalLight, 2.74, 0.52, -0.42));
        g.add(voxel(0.18, 0.18, 0.18, mats.emissiveOrange, 2.74, 0.78, -0.42));
    }

    return g;
};
