import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { cylinder, FactoryOptions, voxel } from '../../../../render/utils/VoxelBuilder';

export const ReservoirFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';

    g.add(voxel(3.0, 0.34, 3.0, mats.concrete, 0, 0, 0));
    g.add(voxel(2.7, 0.12, 2.7, mats.concreteLight, 0, 0.34, 0));

    g.add(voxel(3.0, 1.2, 0.24, mats.concrete, 0, 0.34, -1.38));
    g.add(voxel(3.0, 1.2, 0.24, mats.concrete, 0, 0.34, 1.38));
    g.add(voxel(0.24, 1.2, 2.76, mats.concrete, -1.38, 0.34, 0));
    g.add(voxel(0.24, 1.2, 2.76, mats.concrete, 1.38, 0.34, 0));

    g.add(voxel(2.48, 0.2, 2.48, isPowered ? mats.reservoirWater : mats.oilWater, 0, 1.0, 0));
    g.add(voxel(2.1, 0.08, 2.1, isPowered ? mats.glass : mats.darkPipe, 0, 1.18, 0));

    g.add(voxel(3.0, 0.12, 0.46, mats.metal, 0, 1.54, 0));
    g.add(voxel(0.14, 0.94, 0.14, mats.metal, -1.26, 0.9, 0));
    g.add(voxel(0.14, 0.94, 0.14, mats.metal, 1.26, 0.9, 0));
    g.add(voxel(3.0, 0.36, 0.05, mats.metalLight, 0, 1.72, 0.2));
    g.add(voxel(3.0, 0.36, 0.05, mats.metalLight, 0, 1.72, -0.2));

    g.add(voxel(0.96, 1.72, 0.96, mats.metal, -0.98, 0.34, -0.98));
    g.add(voxel(1.02, 0.12, 1.02, mats.metalLight, -0.98, 2.02, -0.98));
    g.add(voxel(0.32, 0.42, 0.12, mats.blueMetal, -0.62, 1.02, -0.54));
    g.add(voxel(0.14, 0.68, 0.14, mats.blueMetal, -0.72, 0.54, -0.98));
    g.add(voxel(0.34, 0.46, 0.12, mats.metal, -0.64, 1.16, -0.5));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.16, 0.2, 0.06, isPowered ? mats.emissiveGreen : mats.emissiveRed, -0.62, 1.34, -0.46));
    }

    g.add(voxel(0.22, 0.22, 1.0, mats.blueMetal, 1.22, 0.58, 0.84));
    g.add(voxel(0.36, 0.34, 0.58, mats.metal, 1.46, 0.48, 1.22));
    g.add(voxel(0.1, 0.96, 0.1, mats.glass, 1.34, 0.76, -0.86));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.12, 0.34, 0.12, isPowered ? mats.emissiveCyan : mats.metal, 1.34, 1.16, -0.86));
    }

    g.add(voxel(0.46, 0.34, 0.06, mats.hazard, 0, 1.16, 1.42));
    g.add(voxel(0.1, 1.28, 0.18, mats.metal, 0.84, 0.66, 1.34));
    g.add(voxel(0.48, 0.06, 0.48, mats.metalLight, 1.08, 0.38, 1.08));

    g.add(cylinder(0.16, 1.24, mats.concreteLight, -1.38, 0.34, 1.06));
    g.add(cylinder(0.16, 1.24, mats.concreteLight, 1.38, 0.34, -1.06));
    g.add(voxel(0.18, 0.18, 0.18, isPowered ? mats.emissiveGreen : mats.emissiveRed, -1.38, 1.56, 1.06));
    g.add(voxel(0.18, 0.18, 0.18, isPowered ? mats.emissiveGreen : mats.emissiveRed, 1.38, 1.56, -1.06));

    return g;
};
