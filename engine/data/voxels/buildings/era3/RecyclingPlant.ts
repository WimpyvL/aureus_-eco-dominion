
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

export const RecyclingPlantFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    const isWatered = opts?.waterStatus === 'CONNECTED';

    // Foundation
    g.add(voxel(2.0, 0.35, 2.0, mats.concrete, 0, 0, 0));

    // Main clean building
    g.add(voxel(1.4, 1.8, 1.4, mats.concreteLight, -0.2, 0.35, -0.2));
    g.add(voxel(1.2, 0.6, 1.2, isPowered ? mats.glass : mats.darkPipe, -0.2, 1.8, -0.2));

    // Green tech core
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.5, 0.5, 0.5, isPowered ? mats.emissiveCyan : mats.metal, -0.2, 1.5, -0.2));
    }

    // Processing cylinders
    g.add(voxel(0.7, 2.2, 0.7, mats.greenMetal, 0.55, 0.35, 0.55));
    g.add(voxel(0.75, 0.1, 0.75, mats.metal, 0.55, 1.2, 0.55));
    g.add(voxel(0.75, 0.1, 0.75, mats.metal, 0.55, 1.8, 0.55));

    // Status light on cylinder
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.25, 0.25, 0.08, isPowered && isWatered ? mats.emissiveGreen : mats.emissiveRed, 0.55, 1.5, 0.92));
    }

    // Secondary cylinder
    g.add(voxel(0.6, 1.6, 0.6, mats.greenMetal, 0.55, 0.35, -0.55));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.2, 0.2, 0.05, isPowered ? mats.emissiveCyan : mats.metal, 0.55, 1.0, -0.24));
    }

    // Exhaust tower (clean steam)
    g.add(voxel(0.35, 3.5, 0.35, mats.concreteLight, -0.75, 0.35, 0.75));
    g.add(voxel(0.45, 0.08, 0.45, mats.metal, -0.75, 2.2, 0.75));
    g.add(voxel(0.45, 0.08, 0.45, mats.metal, -0.75, 2.8, 0.75));
    g.add(voxel(0.5, 0.15, 0.5, mats.glass, -0.75, 3.5, 0.75));

    // Solar panels on roof
    g.add(voxel(0.6, 0.08, 0.4, mats.solar, -0.2, 2.45, -0.2));

    return g;
};
