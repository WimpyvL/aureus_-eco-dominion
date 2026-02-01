
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

export const SupportPillarFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    // Heavy timber pillar
    g.add(voxel(0.4, 3.0, 0.4, mats.wood, 0, 0, 0));
    // Metal bracket top
    g.add(voxel(0.6, 0.2, 0.6, mats.metal, 0, 2.8, 0));
    // Metal bracket base
    g.add(voxel(0.6, 0.2, 0.6, mats.metal, 0, 0, 0));

    return g;
};
