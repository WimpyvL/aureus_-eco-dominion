
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

export const WasteTreatmentFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    const isWatered = opts?.waterStatus === 'CONNECTED';

    // Base
    g.add(voxel(2.0, 0.2, 2.0, mats.concrete, 0, 0, 0));
    // Treatment tanks (circular-ish)
    g.add(voxel(0.8, 0.8, 0.8, mats.blueMetal, -0.5, 0.2, -0.5));
    g.add(voxel(0.8, 0.8, 0.8, mats.blueMetal, 0.5, 0.2, -0.5));
    g.add(voxel(0.8, 0.8, 0.8, mats.blueMetal, 0, 0.2, 0.5));

    // Tank tops (green = clean when active)
    const tankTopMat = (isPowered && isWatered) ? mats.emissiveGreen : mats.darkPipe;
    g.add(voxel(0.7, 0.1, 0.7, tankTopMat, -0.5, 1.0, -0.5));
    g.add(voxel(0.7, 0.1, 0.7, tankTopMat, 0.5, 1.0, -0.5));
    g.add(voxel(0.7, 0.1, 0.7, tankTopMat, 0, 1.0, 0.5));

    // Connecting pipes
    g.add(voxel(0.15, 0.15, 0.8, mats.darkPipe, 0, 0.6, 0));
    g.add(voxel(0.8, 0.15, 0.15, mats.darkPipe, 0, 0.6, 0));
    // Control booth
    g.add(voxel(0.5, 0.8, 0.5, mats.metal, 0.7, 0.2, 0.7));

    // Status light on booth
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.15, 0.15, 0.15, (isPowered && isWatered) ? mats.emissiveCyan : mats.emissiveRed, 0.7, 1.0, 0.7));
    }

    return g;
};
