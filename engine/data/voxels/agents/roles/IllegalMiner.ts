
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

    // High Res Head dimensions
    const startY = 28;
    const endY = 40;

    for (let y = startY; y < endY; y++) {
        for (let x = -3; x <= 3; x++) {
            for (let z = -2; z <= 3; z++) {
                // Rounding
                if (x === -3 && z === -2) continue;
                if (x === 3 && z === -2) continue;
                if (x === -3 && z === 3) continue;
                if (x === 3 && z === 3) continue;

                // Chin taper
                if (y === startY && (Math.abs(x) === 3 || z === 3 || z === -2)) continue;

                let c = skinColor;

                // Eyes
                if (y === 33 && (x === -1 || x === 1) && z === 3) c = '#000000';

                // Hood Logic (Covers hair area + more)
                // Top
                if (y >= 36) c = HOOD_COLOR;
                // Back and Sides
                if (y >= 30 && (z <= -1 || Math.abs(x) === 3)) c = HOOD_COLOR;

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
