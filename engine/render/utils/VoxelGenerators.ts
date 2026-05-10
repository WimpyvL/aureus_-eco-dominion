
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as THREE from 'three';
import { NatureFactory } from '../../data/voxels/Nature';
import { BuildingsFactory } from '../../data/voxels/buildings';
import { GrassTrees, SnowTrees, SandTrees, DirtTrees, StoneTrees } from '../../data/voxels/BiomeTrees';
import { FactoryOptions } from './VoxelBuilder';

// Re-export shared assets for VoxelEngine compatibility
export { waterFlowMaterial, terrainMats } from '../materials/VoxelMaterials';
export { sharedBoxGeo } from './VoxelBuilder';

export const BuildingFactory: Record<string, (opts?: FactoryOptions) => THREE.Group> = {
    ...NatureFactory,
    ...BuildingsFactory,
    ...GrassTrees,
    ...SnowTrees,
    ...SandTrees,
    ...DirtTrees,
    ...StoneTrees
};
