
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as THREE from 'three';
import { mats } from '../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../render/utils/VoxelBuilder';
import { pseudoRandom } from '../../utils/GameUtils';

export const NatureFactory = {
    'OAK_TREE': () => {
        const g = new THREE.Group();
        g.add(voxel(0.3, 0.5, 0.3, mats.wood, 0, 0, 0));
        g.add(voxel(1.0, 0.6, 1.0, mats.leaf, 0, 0.5, 0));
        g.add(voxel(0.8, 0.5, 0.8, mats.leaf, 0, 1.1, 0));
        g.add(voxel(0.1, 0.1, 0.1, mats.emissiveRed, 0.3, 0.8, 0.3));
        g.add(voxel(0.1, 0.1, 0.1, mats.emissiveRed, -0.4, 0.6, -0.2));
        return g;
    },

    'PINE_TREE': () => {
        const g = new THREE.Group();
        g.add(voxel(0.2, 0.6, 0.2, mats.wood, 0, 0, 0));
        g.add(voxel(0.8, 0.5, 0.8, mats.pine, 0, 0.6, 0));
        g.add(voxel(0.6, 0.5, 0.6, mats.pine, 0, 1.1, 0));
        return g;
    },

    'MINE_HOLE': () => {
        const g = new THREE.Group();
        // Inner pit darkness
        g.add(voxel(0.85, 0.1, 0.85, mats.pit, 0, -0.05, 0));
        g.add(voxel(0.6, 0.2, 0.6, mats.pit, 0, -0.15, 0));

        // Rock border
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const r = 0.42;
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            const s = 0.15 + Math.random() * 0.15;
            g.add(voxel(s, 0.1, s, Math.random() > 0.5 ? mats.rock : mats.dirt, x, 0.02, z));
        }

        // Wooden support beams poking out
        g.add(voxel(0.1, 0.4, 0.1, mats.wood, 0.35, -0.1, 0.35));
        g.add(voxel(0.1, 0.4, 0.1, mats.wood, -0.35, -0.1, -0.35));

        return g;
    },

    'TRENCH': () => {
        const g = new THREE.Group();
        // Central depression
        g.add(voxel(0.7, 0.1, 0.7, mats.pit, 0, -0.06, 0));

        // Messy dirt mounds
        for (let i = 0; i < 6; i++) {
            const side = i < 3 ? 0.4 : -0.4;
            const pos = (i % 3 - 1) * 0.35;
            const h = 0.1 + Math.random() * 0.25;
            const w = 0.25 + Math.random() * 0.2;
            g.add(voxel(w, h, w, mats.dirt, side, h / 2 - 0.05, pos));
        }

        // Small hazard markers/cones
        g.add(voxel(0.1, 0.15, 0.1, mats.emissiveRed, 0.45, 0.08, 0.45));
        g.add(voxel(0.1, 0.15, 0.1, mats.emissiveRed, -0.45, 0.08, -0.45));

        return g;
    },

    // Simplified gold ore - procedural rocks with gold veins
    'GOLD_VEIN': (opts?: FactoryOptions) => {
        const seed = opts?.seed ?? 0;
        const rng = pseudoRandom(seed);
        const g = new THREE.Group();

        // Main rock base
        g.add(voxel(0.6, 0.35, 0.5, mats.rock, 0, 0, 0));
        g.add(voxel(0.4, 0.25, 0.45, mats.rock, 0.2, 0.2, 0.1));
        g.add(voxel(0.35, 0.3, 0.4, mats.rock, -0.15, 0.1, -0.1));

        // Gold nuggets scattered on surface
        g.add(voxel(0.15, 0.12, 0.15, mats.gold, 0.1, 0.35, 0.05));
        g.add(voxel(0.12, 0.1, 0.12, mats.gold, -0.1, 0.28, 0.15));
        g.add(voxel(0.1, 0.08, 0.1, mats.gold, 0.2, 0.3, -0.1));
        g.add(voxel(0.08, 0.06, 0.08, mats.gold, -0.2, 0.22, -0.05));

        // Random rotation
        g.rotation.y = rng() * Math.PI * 2;

        return g;
    }
}
