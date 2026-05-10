import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { cylinder, FactoryOptions, voxel } from '../../../../render/utils/VoxelBuilder';

export const WasteTreatmentFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    const isWatered = opts?.waterStatus === 'CONNECTED';
    const active = isPowered && isWatered;

    g.add(voxel(2.0, 0.24, 2.0, mats.concrete, 0, 0, 0));
    g.add(voxel(1.76, 0.1, 1.76, mats.concreteLight, 0, 0.24, 0));

    g.add(cylinder(0.38, 0.92, mats.blueMetal, -0.52, 0.24, -0.52));
    g.add(cylinder(0.38, 0.92, mats.blueMetal, 0.52, 0.24, -0.52));
    g.add(cylinder(0.38, 0.92, mats.blueMetal, 0, 0.24, 0.58));

    const tankTopMat = active ? mats.emissiveGreen : mats.darkPipe;
    g.add(voxel(0.66, 0.08, 0.66, tankTopMat, -0.52, 1.12, -0.52));
    g.add(voxel(0.66, 0.08, 0.66, tankTopMat, 0.52, 1.12, -0.52));
    g.add(voxel(0.66, 0.08, 0.66, tankTopMat, 0, 1.12, 0.58));

    g.add(voxel(0.18, 0.18, 0.98, mats.darkPipe, 0, 0.68, 0));
    g.add(voxel(0.98, 0.18, 0.18, mats.darkPipe, 0, 0.68, 0));
    g.add(voxel(0.16, 0.52, 0.16, mats.darkPipe, 0, 0.86, -0.02));

    g.add(voxel(0.58, 0.92, 0.58, mats.metal, 0.72, 0.24, 0.72));
    g.add(voxel(0.62, 0.12, 0.62, mats.metalLight, 0.72, 1.16, 0.72));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.16, 0.16, 0.16, active ? mats.emissiveCyan : mats.emissiveRed, 0.72, 1.18, 0.72));
    }

    g.add(voxel(0.16, 0.16, 0.72, mats.blueMetal, -0.94, 0.54, 0.44));
    g.add(voxel(0.72, 0.16, 0.16, mats.blueMetal, -0.58, 0.54, 0.94));
    g.add(voxel(0.18, 0.86, 0.18, mats.metalLight, -0.92, 0.24, -0.96));
    g.add(voxel(0.18, 0.86, 0.18, mats.metalLight, 0.94, 0.24, -0.96));
    g.add(voxel(0.22, 0.22, 0.22, active ? mats.emissiveGreen : mats.emissiveRed, -0.92, 1.08, -0.96));
    g.add(voxel(0.22, 0.22, 0.22, active ? mats.emissiveGreen : mats.emissiveRed, 0.94, 1.08, -0.96));

    return g;
};
