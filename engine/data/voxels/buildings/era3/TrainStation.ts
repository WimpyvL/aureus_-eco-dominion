
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

export const TrainStationFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';

    // 1. Large platform foundation
    g.add(voxel(3.0, 0.4, 3.0, mats.concrete, 0, 0, 0));

    // 2. Railway tracks (2 sets)
    // Left Track
    g.add(voxel(0.1, 0.1, 3.0, mats.metal, -1.0, 0.4, 0));
    g.add(voxel(0.1, 0.1, 3.0, mats.metal, -0.6, 0.4, 0));
    // Sleepers for left track
    for (let i = -1.4; i <= 1.4; i += 0.4) {
        g.add(voxel(0.6, 0.05, 0.15, mats.wood, -0.8, 0.4, i));
    }

    // Right Track
    g.add(voxel(0.1, 0.1, 3.0, mats.metal, 0.6, 0.4, 0));
    g.add(voxel(0.1, 0.1, 3.0, mats.metal, 1.0, 0.4, 0));
    // Sleepers for right track
    for (let i = -1.4; i <= 1.4; i += 0.4) {
        g.add(voxel(0.6, 0.05, 0.15, mats.wood, 0.8, 0.4, i));
    }

    // 3. Central loading platform
    g.add(voxel(0.8, 0.6, 3.0, mats.concrete, 0, 0.4, 0));
    g.add(voxel(0.75, 0.05, 3.0, mats.hazard, 0, 1.0, 0)); // Yellow safety edge

    // 4. Station Roof Structure
    // Supports
    g.add(voxel(0.2, 2.0, 0.2, mats.metal, -1.4, 0.4, -1.4));
    g.add(voxel(0.2, 2.0, 0.2, mats.metal, 1.4, 0.4, -1.4));
    g.add(voxel(0.2, 2.0, 0.2, mats.metal, -1.4, 0.4, 1.4));
    g.add(voxel(0.2, 2.0, 0.2, mats.metal, 1.4, 0.4, 1.4));

    // Arched roof frames
    g.add(voxel(3.0, 0.1, 0.2, mats.metal, 0, 2.4, -1.4));
    g.add(voxel(3.0, 0.1, 0.2, mats.metal, 0, 2.4, 1.4));
    g.add(voxel(0.2, 0.1, 3.0, mats.metal, -1.4, 2.4, 0));
    g.add(voxel(0.2, 0.1, 3.0, mats.metal, 1.4, 2.4, 0));

    // Glass roof panels
    g.add(voxel(2.8, 0.05, 1.4, mats.glass, 0, 2.45, -0.75));
    g.add(voxel(2.8, 0.05, 1.4, mats.glass, 0, 2.45, 0.75));

    // 5. Control Room / Office (Elevated)
    g.add(voxel(1.2, 1.2, 0.8, mats.blueMetal, 0, 1.4, 1.1));
    g.add(voxel(1.0, 0.6, 0.05, mats.glass, 0, 1.7, 1.5)); // Main window

    // Status lights
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.2, 0.2, 0.1, isPowered ? mats.emissiveGreen : mats.emissiveRed, -0.4, 2.3, 1.1));
        g.add(voxel(0.2, 0.2, 0.1, isPowered ? mats.emissiveCyan : mats.emissiveRed, 0.4, 2.3, 1.1));
    }

    // 6. Cargo Crates on platform
    g.add(voxel(0.4, 0.4, 0.4, mats.wood, -0.2, 1.05, -0.5));
    g.add(voxel(0.4, 0.4, 0.4, mats.metal, 0.2, 1.05, 0.2));
    g.add(voxel(0.3, 0.3, 0.3, mats.blueMetal, 0, 1.05, -1.0));

    // 7. Decorative Station Name Sign
    g.add(voxel(1.0, 0.4, 0.1, mats.metal, 0, 2.0, -1.45));

    return g;
};
