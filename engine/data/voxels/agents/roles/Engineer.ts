
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

const ROLE_COLOR = '#3b82f6'; // Blue
const TOOL_BELT_COLOR = '#78350f'; // Brown leather

function addToolBelt(torso: VoxelDef[]): VoxelDef[] {
    // Add tool belt around waist
    for (let x = -3; x <= 3; x++) {
        torso.push({ x, y: 6, z: 1.2, c: TOOL_BELT_COLOR });
    }
    // Add tools on belt
    torso.push({ x: -2.5, y: 6, z: 1.4, c: '#94a3b8' }); // Wrench
    torso.push({ x: 2.5, y: 6, z: 1.4, c: '#94a3b8' }); // Screwdriver
    return torso;
}

export function EngineerFactory(): THREE.Group {
    const { legL, legR } = createLegs(CLOTH_COLOR);
    const { armL, armR } = createArms(SKIN_COLOR);
    let torso = createTorso(ROLE_COLOR);
    torso = addToolBelt(torso);
    const head = createHead();

    return assembleAgent({ head, torso, armL, armR, legL, legR });
}
