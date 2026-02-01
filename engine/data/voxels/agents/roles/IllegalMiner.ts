
import * as THREE from 'three';
import {
    SKIN_COLOR,
    CLOTH_COLOR,
    VoxelDef,
    createLegs,
    createArms,
    createTorso,
    createHead,
    assembleAgent
} from '../common';

const ROLE_COLOR = '#0f172a'; // Very dark (almost black)
const HOOD_COLOR = '#0f172a'; // Matching hood

function createHoodedHead(skinColor: string = SKIN_COLOR): VoxelDef[] {
    const head: VoxelDef[] = [];

    for (let y = 13; y < 19; y++) {
        for (let x = -2; x <= 2; x++) {
            for (let z = -1; z <= 1; z++) {
                // Rounding
                if (y === 13 && (Math.abs(x) === 2 || Math.abs(z) === 1)) continue;
                if (y === 18 && (Math.abs(x) === 2 || Math.abs(z) === 1)) continue;

                let c = skinColor;
                if (y === 16 && (x === -1 || x === 1) && z === 1) c = '#000000'; // Eyes
                // Hood covers all of the top and sides
                if (y >= 17) c = HOOD_COLOR;
                if (y >= 15 && (Math.abs(x) === 2 || z === -1)) c = HOOD_COLOR;

                head.push({ x, y, z, c });
            }
        }
    }

    return head;
}

export function IllegalMinerFactory(): THREE.Group {
    const { legL, legR } = createLegs(CLOTH_COLOR);
    const { armL, armR } = createArms(SKIN_COLOR);
    const torso = createTorso(ROLE_COLOR);
    const head = createHoodedHead();

    return assembleAgent({ head, torso, armL, armR, legL, legR });
}
