
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

const ROLE_COLOR = '#22c55e'; // Green
const SATCHEL_COLOR = '#65a30d'; // Lime green

function addSatchel(torso: VoxelDef[]): VoxelDef[] {
    // Add crossbody satchel (High Res)
    for (let y = 16; y < 22; y++) {
        for (let z = 0; z <= 2; z++) {
            torso.push({ x: 4, y, z, c: SATCHEL_COLOR });
        }
    }
    // Satchel strap across body
    for (let x = -4; x <= 4; x++) {
        torso.push({ x, y: 22, z: 3.2, c: SATCHEL_COLOR });
    }
    // Small flower/plant detail
    torso.push({ x: 0, y: 23, z: 3.5, c: '#fbbf24' }); // Yellow flower
    return torso;
}

export function BotanistFactory(): THREE.Group {
    const { legL, legR } = createLegs(CLOTH_COLOR);
    const { armL, armR } = createArms(SKIN_COLOR);
    let torso = createTorso(ROLE_COLOR);
    torso = addSatchel(torso);
    const head = createHead();

    return assembleAgent({ head, torso, armL, armR, legL, legR });
}
