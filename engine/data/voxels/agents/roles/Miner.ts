
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

const ROLE_COLOR = '#ef4444'; // Red
const BACKPACK_COLOR = '#451a03'; // Dark brown

function addBackpack(torso: VoxelDef[]): VoxelDef[] {
    // Add backpack on the back (High Res)
    for (let y = 16; y < 24; y++) {
        for (let x = -4; x <= 4; x++) {
            for (let z = -2; z < 0; z++) {
                torso.push({ x, y, z, c: BACKPACK_COLOR });
            }
        }
    }
    return torso;
}

export function MinerFactory(): THREE.Group {
    const { legL, legR } = createLegs(CLOTH_COLOR);
    const { armL, armR } = createArms(SKIN_COLOR);
    let torso = createTorso(ROLE_COLOR);
    torso = addBackpack(torso);
    const head = createHead();

    return assembleAgent({ head, torso, armL, armR, legL, legR });
}
