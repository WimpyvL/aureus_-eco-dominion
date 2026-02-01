
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

const ROLE_COLOR = '#e11d48'; // Rose/Red
const ARMOR_COLOR = '#1e293b'; // Dark slate

function addShoulderPads(torso: VoxelDef[]): VoxelDef[] {
    // Add shoulder pads for security look
    for (const x of [-3, 3]) {
        for (let y = 11; y < 14; y++) {
            for (let z = -1; z <= 2; z++) {
                torso.push({ x, y, z, c: ARMOR_COLOR });
            }
        }
    }
    // Badge on chest
    torso.push({ x: -1, y: 10, z: 1.2, c: '#fbbf24' }); // Gold badge
    return torso;
}

export function SecurityFactory(): THREE.Group {
    const { legL, legR } = createLegs(CLOTH_COLOR);
    const { armL, armR } = createArms(SKIN_COLOR);
    let torso = createTorso(ROLE_COLOR);
    torso = addShoulderPads(torso);
    const head = createHead();

    return assembleAgent({ head, torso, armL, armR, legL, legR });
}
