
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

export const ConstructionFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    const w = opts?.width || 1;
    const d = opts?.depth || 1;
    const halfW = (w / 2) - 0.05;
    const halfD = (d / 2) - 0.05;

    // 4 Corner pillars
    g.add(voxel(0.12, 2.0, 0.12, mats.metal, -halfW, 0, -halfD));
    g.add(voxel(0.12, 2.0, 0.12, mats.metal, halfW, 0, -halfD));
    g.add(voxel(0.12, 2.0, 0.12, mats.metal, -halfW, 0, halfD));
    g.add(voxel(0.12, 2.0, 0.12, mats.metal, halfW, 0, halfD));

    // Cross bracing
    g.add(voxel(w, 0.08, 0.08, mats.metal, 0, 0.5, -halfD));
    g.add(voxel(w, 0.08, 0.08, mats.metal, 0, 0.5, halfD));
    g.add(voxel(w, 0.08, 0.08, mats.metal, 0, 1.2, -halfD));
    g.add(voxel(w, 0.08, 0.08, mats.metal, 0, 1.2, halfD));
    g.add(voxel(0.08, 0.08, d, mats.metal, -halfW, 1.2, 0));
    g.add(voxel(0.08, 0.08, d, mats.metal, halfW, 1.2, 0));

    // Top hazard rail
    g.add(voxel(w, 0.12, d, mats.hazard, 0, 2.0, 0));

    // Partial floor/progress indicator
    const progress = opts?.progress || 0.5;
    g.add(voxel(w * progress, 0.15, d * 0.8, mats.wood, -halfW * (1 - progress), 0.6, 0));

    return g;
};
