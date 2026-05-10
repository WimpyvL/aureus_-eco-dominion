
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

const ROLE_COLOR = '#f59e0b'; // Orange/Amber

export function WorkerFactory(): THREE.Group {
    const { legL, legR } = createLegs(CLOTH_COLOR);
    const { armL, armR } = createArms(SKIN_COLOR);
    const torso = createTorso(ROLE_COLOR);
    const head = createHead();

    return assembleAgent({ head, torso, armL, armR, legL, legR });
}
