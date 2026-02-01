
import * as THREE from 'three';
import { buildVoxelGroup } from '../../../../render/utils/VoxelBuilder';

// Common agent colors
export const SKIN_COLOR = '#f1c27d';
export const CLOTH_COLOR = '#1e293b';
export const ACCENT_WHITE = '#ffffff';
export const HAIR_COLOR = '#221100';

// Agent part definition
export interface VoxelDef {
    x: number;
    y: number;
    z: number;
    c: string;
}

// Pivot points for animation
export const PIVOTS = {
    head: { x: 0, y: 13, z: 0.5 },
    armL: { x: -2.5, y: 12, z: 0.5 },
    armR: { x: 2.5, y: 12, z: 0.5 },
    legL: { x: -1.5, y: 6, z: 0.5 },
    legR: { x: 1.5, y: 6, z: 0.5 },
    torso: { x: 0, y: 0, z: 0.5 }
};

// Agent factory options
export interface AgentFactoryOptions {
    skinColor?: string;
    clothColor?: string;
    accentColor?: string;
}

// Build a mesh part from voxel definitions
export function buildPart(voxels: VoxelDef[], pivot: { x: number; y: number; z: number }): THREE.Group {
    const adjusted = voxels.map(v => ({
        x: v.x - pivot.x,
        y: v.y - pivot.y,
        z: v.z - pivot.z,
        c: v.c
    }));
    return buildVoxelGroup(adjusted);
}

// Base leg generation
export function createLegs(clothColor: string = CLOTH_COLOR): { legL: VoxelDef[]; legR: VoxelDef[] } {
    const legL: VoxelDef[] = [];
    const legR: VoxelDef[] = [];

    for (let y = 0; y < 6; y++) {
        for (let x = -2; x <= -1; x++) {
            for (let z = 0; z <= 1; z++) {
                legL.push({ x, y, z, c: clothColor });
            }
        }
        for (let x = 1; x <= 2; x++) {
            for (let z = 0; z <= 1; z++) {
                legR.push({ x, y, z, c: clothColor });
            }
        }
    }

    return { legL, legR };
}

// Base arm generation
export function createArms(skinColor: string = SKIN_COLOR): { armL: VoxelDef[]; armR: VoxelDef[] } {
    const armL: VoxelDef[] = [];
    const armR: VoxelDef[] = [];

    for (let y = 8; y < 13; y++) {
        for (let z = 0; z <= 1; z++) {
            armL.push({ x: -3, y, z, c: skinColor });
            armR.push({ x: 3, y, z, c: skinColor });
        }
    }

    return { armL, armR };
}

// Base torso generation
export function createTorso(roleColor: string, accentColor: string = ACCENT_WHITE): VoxelDef[] {
    const torso: VoxelDef[] = [];

    for (let y = 6; y < 13; y++) {
        for (let x = -2; x <= 2; x++) {
            for (let z = 0; z <= 1; z++) {
                const isBadge = (y === 10 || y === 11) && x === 0 && z === 1;
                torso.push({ x, y, z, c: isBadge ? accentColor : roleColor });
            }
        }
    }

    return torso;
}

// Base head generation
export function createHead(skinColor: string = SKIN_COLOR, hairColor: string = HAIR_COLOR): VoxelDef[] {
    const head: VoxelDef[] = [];

    for (let y = 13; y < 19; y++) {
        for (let x = -2; x <= 2; x++) {
            for (let z = -1; z <= 1; z++) {
                // Rounding
                if (y === 13 && (Math.abs(x) === 2 || Math.abs(z) === 1)) continue;
                if (y === 18 && (Math.abs(x) === 2 || Math.abs(z) === 1)) continue;

                let c = skinColor;
                if (y === 16 && (x === -1 || x === 1) && z === 1) c = '#000000'; // Eyes
                if (y >= 17) c = hairColor; // Hair

                head.push({ x, y, z, c });
            }
        }
    }

    return head;
}

// Assemble agent from parts
export function assembleAgent(parts: {
    head: VoxelDef[];
    torso: VoxelDef[];
    armL: VoxelDef[];
    armR: VoxelDef[];
    legL: VoxelDef[];
    legR: VoxelDef[];
}): THREE.Group {
    const root = new THREE.Group();
    root.userData.parts = {};

    const meshParts: Record<string, THREE.Group> = {
        head: buildPart(parts.head, PIVOTS.head),
        torso: buildPart(parts.torso, PIVOTS.torso),
        armL: buildPart(parts.armL, PIVOTS.armL),
        armR: buildPart(parts.armR, PIVOTS.armR),
        legL: buildPart(parts.legL, PIVOTS.legL),
        legR: buildPart(parts.legR, PIVOTS.legR)
    };

    Object.entries(meshParts).forEach(([name, mesh]) => {
        mesh.name = name;
        if (name !== 'torso') {
            const p = PIVOTS[name as keyof typeof PIVOTS];
            mesh.position.set(p.x, p.y, p.z);
        }
        root.add(mesh);
        root.userData.parts[name] = mesh;
    });

    root.scale.set(0.04, 0.04, 0.04);
    return root;
}
