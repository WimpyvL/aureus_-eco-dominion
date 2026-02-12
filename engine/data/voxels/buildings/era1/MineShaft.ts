
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Mine Shaft Factory - Gateway to the underground
 * Level 1: Simple wooden shaft entrance with pulley
 */
export const MineShaftFactory = (opts?: FactoryOptions) => {
    // Current design only supports level 1 for the unlock building
    return buildLevel1(opts);
};

function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';

    // Base Pad (Concrete) - 2x2 area
    // Center it on (0,0,0) in the factory space, which is then positioned by BuildingRenderSystem
    // Since BuildingRenderSystem centers the group, we just build around origin.
    g.add(voxel(1.8, 0.2, 1.8, mats.concrete, 0, 0, 0));

    // The Shaft Hole (Dark/Deep look)
    g.add(voxel(0.8, 0.1, 0.8, mats.darkPipe, 0, 0.15, 0));

    // Wooden Structural frame
    const postHeight = 2.5;
    const postMat = mats.wood;

    // 4 Corner Posts
    g.add(voxel(0.15, postHeight, 0.15, postMat, -0.6, 0.2, -0.6));
    g.add(voxel(0.15, postHeight, 0.15, postMat, 0.6, 0.2, -0.6));
    g.add(voxel(0.15, postHeight, 0.15, postMat, -0.6, 0.2, 0.6));
    g.add(voxel(0.15, postHeight, 0.15, postMat, 0.6, 0.2, 0.6));

    // Cross Beams at top
    g.add(voxel(1.4, 0.15, 0.15, postMat, 0, postHeight + 0.1, -0.6));
    g.add(voxel(1.4, 0.15, 0.15, postMat, 0, postHeight + 0.1, 0.6));
    g.add(voxel(0.15, 0.15, 1.4, postMat, -0.6, postHeight + 0.1, 0));
    g.add(voxel(0.15, 0.15, 1.4, postMat, 0.6, postHeight + 0.1, 0));

    // Simple roof / Crane arm
    g.add(voxel(1.2, 0.1, 1.2, mats.metal, 0, postHeight + 0.3, 0));

    // Hoist Cable
    const cableMat = mats.darkPipe;
    g.add(voxel(0.04, 2.0, 0.04, cableMat, 0, 1.3, 0));

    // Status Light
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.2, 0.2, 0.2, isPowered ? mats.emissiveGreen : mats.emissiveRed, 0, postHeight + 0.5, 0));
    }

    return g;
}
