
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

export const GemRefineryFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    const isWatered = opts?.waterStatus === 'CONNECTED';

    // Foundation
    g.add(voxel(2.0, 0.25, 2.0, mats.concrete, 0, 0, 0));
    // Main structure
    g.add(voxel(1.6, 1.4, 1.6, mats.metal, 0, 0.25, 0));
    // Glass dome top (sorting room)
    g.add(voxel(1.0, 0.6, 1.0, isPowered ? mats.glass : mats.darkPipe, 0, 1.65, 0));
    // Gem sorting conveyor
    g.add(voxel(1.8, 0.1, 0.3, mats.metalLight, 0, 0.5, 0));

    // Laser cutters (glowing when powered)
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.1, 0.3, 0.1, isPowered ? mats.emissiveCyan : mats.metal, -0.4, 1.0, 0));
        g.add(voxel(0.1, 0.3, 0.1, isPowered ? mats.emissiveCyan : mats.metal, 0.4, 1.0, 0));
    }

    // Output bins
    g.add(voxel(0.3, 0.3, 0.3, mats.metal, -0.6, 0.25, 0.6));
    g.add(voxel(0.3, 0.3, 0.3, mats.metal, 0.6, 0.25, 0.6));
    // Pipes
    g.add(voxel(0.15, 0.8, 0.15, mats.darkPipe, 0.8, 0.25, -0.8));

    // Status light
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.12, 0.12, 0.12, isPowered && isWatered ? mats.emissiveGreen : mats.emissiveRed, 0.8, 1.05, -0.8));
    }

    return g;
};
