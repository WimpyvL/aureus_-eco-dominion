
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

    'MINE_HOLE': (opts?: FactoryOptions) => {
        const g = new THREE.Group();
        const rng = pseudoRandom(opts?.seed || 42);
        // Inner pit darkness
        g.add(voxel(0.85, 0.1, 0.85, mats.pit, 0, -0.05, 0));
        g.add(voxel(0.6, 0.2, 0.6, mats.pit, 0, -0.15, 0));

        // Rock border
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const r = 0.42;
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            const s = 0.15 + rng() * 0.15;
            g.add(voxel(s, 0.1, s, rng() > 0.5 ? mats.rock : mats.dirt, x, 0.02, z));
        }

        // Wooden support beams poking out
        g.add(voxel(0.1, 0.4, 0.1, mats.wood, 0.35, -0.1, 0.35));
        g.add(voxel(0.1, 0.4, 0.1, mats.wood, -0.35, -0.1, -0.35));

        return g;
    },

    'TRENCH': (opts?: FactoryOptions) => {
        const g = new THREE.Group();
        const rng = pseudoRandom(opts?.seed || 42);
        // Central depression
        g.add(voxel(0.7, 0.1, 0.7, mats.pit, 0, -0.06, 0));

        // Messy dirt mounds
        for (let i = 0; i < 6; i++) {
            const side = i < 3 ? 0.4 : -0.4;
            const pos = (i % 3 - 1) * 0.35;
            const h = 0.1 + rng() * 0.25;
            const w = 0.25 + rng() * 0.2;
            g.add(voxel(w, h, w, mats.dirt, side, h / 2 - 0.05, pos));
        }

        // Small hazard markers/cones
        g.add(voxel(0.1, 0.15, 0.1, mats.emissiveRed, 0.45, 0.08, 0.45));
        g.add(voxel(0.1, 0.15, 0.1, mats.emissiveRed, -0.45, 0.08, -0.45));

        return g;
    },

    // Natural gold ore - a grounded pile of rocks with nuggets
    'GOLD_VEIN': (opts?: FactoryOptions) => {
        const seed = opts?.seed ?? 42;
        const rng = pseudoRandom(seed);
        const g = new THREE.Group();

        // 1. Base Rocks (3-5 solid grounded rocks)
        const rockCount = 4;
        for (let i = 0; i < rockCount; i++) {
            const w = 0.35 + rng() * 0.25;
            const h = 0.15 + rng() * 0.2;
            const d = 0.35 + rng() * 0.25;
            const px = (rng() - 0.5) * 0.5;
            const pz = (rng() - 0.5) * 0.5;
            g.add(voxel(w, h, d, mats.rock, px, 0, pz));

            // 2. Nuggets on top of these rocks
            if (rng() > 0.3) {
                const s = 0.08 + rng() * 0.08;
                g.add(voxel(s, s, s, mats.gold, px + (rng() - 0.5) * w * 0.5, h, pz + (rng() - 0.5) * d * 0.5));
            }
        }

        // 3. Smaller debris rocks around the base
        for (let i = 0; i < 6; i++) {
            const s = 0.12 + rng() * 0.12;
            const angle = (i / 6) * Math.PI * 2 + rng() * 0.4;
            const dist = 0.4 + rng() * 0.2;
            g.add(voxel(s, s * 0.6, s, mats.rock, Math.cos(angle) * dist, 0, Math.sin(angle) * dist));
        }

        g.rotation.y = rng() * Math.PI * 2;
        return g;
    },

    'GOLD_VEIN_VAR': (opts?: FactoryOptions) => {
        const seed = opts?.seed ?? 123;
        const rng = pseudoRandom(seed);
        const g = new THREE.Group();

        // 1. Main flattened rock slab
        const mw = 0.6 + rng() * 0.2;
        const mh = 0.2;
        const md = 0.6 + rng() * 0.2;
        g.add(voxel(mw, mh, md, mats.rock, 0, 0, 0));

        // 2. Gold seam on surface
        const seamCount = 3;
        for (let i = 0; i < seamCount; i++) {
            const s = 0.15 + rng() * 0.1;
            g.add(voxel(s, 0.05, s, mats.gold, (rng() - 0.5) * 0.4, mh, (rng() - 0.5) * 0.4));
        }

        // 3. Smaller debris rocks resting at the sides
        for (let i = 0; i < 4; i++) {
            const angle = rng() * Math.PI * 2;
            const r = 0.45;
            const s = 0.15 + rng() * 0.2;
            g.add(voxel(s, s * 0.7, s, mats.rock, Math.cos(angle) * r, 0, Math.sin(angle) * r));
        }

        g.rotation.y = rng() * Math.PI * 2;
        return g;
    }
}
