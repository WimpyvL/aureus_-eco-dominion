
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
    // Add crossbody satchel
    for (let y = 8; y < 12; y++) {
        torso.push({ x: 2.5, y, z: 0.5, c: SATCHEL_COLOR });
    }
    // Satchel strap across body
    for (let x = -2; x <= 2; x++) {
        torso.push({ x, y: 11, z: 1.2, c: SATCHEL_COLOR });
    }
    // Small flower/plant detail
    torso.push({ x: 0, y: 12, z: 1.3, c: '#fbbf24' }); // Yellow flower
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
