import * as THREE from 'three';

import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Survey Drill Factory - Phase 1 Deep Ledger authorization rig. (|/) Klaasvaakie
 */
export const SurveyDrillFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';

    g.add(voxel(1.1, 0.16, 1.1, mats.concrete, 0, 0.02, 0));
    g.add(voxel(0.85, 0.08, 0.85, mats.darkPipe, 0, 0.14, 0));

    g.add(voxel(0.18, 2.4, 0.18, mats.metal, -0.28, 1.2, -0.28));
    g.add(voxel(0.18, 2.4, 0.18, mats.metal, 0.28, 1.2, -0.28));
    g.add(voxel(0.18, 2.4, 0.18, mats.metal, -0.28, 1.2, 0.28));
    g.add(voxel(0.18, 2.4, 0.18, mats.metal, 0.28, 1.2, 0.28));

    g.add(voxel(0.72, 0.12, 0.12, mats.metal, 0, 2.46, -0.28));
    g.add(voxel(0.72, 0.12, 0.12, mats.metal, 0, 2.46, 0.28));
    g.add(voxel(0.12, 0.12, 0.72, mats.metal, -0.28, 2.46, 0));
    g.add(voxel(0.12, 0.12, 0.72, mats.metal, 0.28, 2.46, 0));

    g.add(voxel(0.22, 2.2, 0.22, mats.darkPipe, 0, 1.28, 0));
    g.add(voxel(0.42, 0.22, 0.42, mats.metal, 0, 2.58, 0));
    g.add(voxel(0.76, 0.26, 0.5, mats.metal, -0.52, 1.04, 0));
    g.add(voxel(0.24, 0.18, 0.24, mats.darkPipe, 0.42, 0.54, 0));

    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.12, 0.12, 0.12, isPowered ? mats.emissiveGreen : mats.emissiveOrange, -0.42, 1.02, 0));
        g.add(voxel(0.16, 0.16, 0.16, mats.emissiveCyan, 0, 2.84, 0));
    }

    return g;
};
