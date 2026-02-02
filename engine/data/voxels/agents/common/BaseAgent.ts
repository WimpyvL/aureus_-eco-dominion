
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
// Pivot points for animation (Scaled 2x)
export const PIVOTS = {
    head: { x: 0, y: 28, z: 1 },
    armL: { x: -5, y: 26, z: 1 },
    armR: { x: 5, y: 26, z: 1 },
    legL: { x: -2, y: 14, z: 1 },
    legR: { x: 2, y: 14, z: 1 },
    torso: { x: 0, y: 0, z: 1 }
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

// High-Res Legs (with shoes and knees)
export function createLegs(clothColor: string = CLOTH_COLOR): { legL: VoxelDef[]; legR: VoxelDef[] } {
    const legL: VoxelDef[] = [];
    const legR: VoxelDef[] = [];

    const shoeColor = '#111111';

    // Helper to add voxel to a specific leg
    const add = (target: VoxelDef[], x: number, y: number, z: number, c: string) => {
        target.push({ x, y, z, c });
    };

    // Generic leg builder
    // Leg center at x=+/- 2
    for (let y = 0; y < 14; y++) {
        const isShoe = y < 3;
        const color = isShoe ? shoeColor : clothColor;

        // Left Leg (x: -3 to -1)
        for (let x = -3; x <= -1; x++) {
            for (let z = -1; z <= 2; z++) { // Thicker legs
                // Shoe detail
                if (isShoe && z === 2 && y === 0) continue; // Toe slope

                // Knee notch
                if (y === 7 && z === 2) continue;

                add(legL, x, y, z, color);
            }
        }

        // Right Leg (x: 1 to 3)
        for (let x = 1; x <= 3; x++) {
            for (let z = -1; z <= 2; z++) {
                if (isShoe && z === 2 && y === 0) continue; // Toe slope
                if (y === 7 && z === 2) continue;
                add(legR, x, y, z, color);
            }
        }
    }

    return { legL, legR };
}

// High-Res Arms (with hands/gloves)
export function createArms(skinColor: string = SKIN_COLOR): { armL: VoxelDef[]; armR: VoxelDef[] } {
    const armL: VoxelDef[] = [];
    const armR: VoxelDef[] = [];

    for (let y = 14; y < 28; y++) {
        const isHand = y < 17;
        const color = isHand ? skinColor : CLOTH_COLOR;

        // Left Arm (x: -6 to -4)
        for (let x = -6; x <= -4; x++) {
            for (let z = 0; z <= 2; z++) {
                // Hand detail (thumb)
                if (isHand && y === 14 && z === 2 && x === -4) {
                    // Thumb filler if we wanted
                } else if (isHand && y < 16 && x === -4 && z === 1) {
                    continue; // Gap for fingers
                }

                armL.push({ x, y, z, c: color });
            }
        }

        // Right Arm (x: 4 to 6)
        for (let x = 4; x <= 6; x++) {
            for (let z = 0; z <= 2; z++) {
                // Mirrored hand details could go here
                armR.push({ x, y, z, c: color });
            }
        }
    }

    // Shoulder pads
    for (let x = -6; x <= -4; x++) {
        for (let z = -1; z <= 3; z++) armL.push({ x, y: 27, z, c: CLOTH_COLOR });
    }
    for (let x = 4; x <= 6; x++) {
        for (let z = -1; z <= 3; z++) armR.push({ x, y: 27, z, c: CLOTH_COLOR });
    }

    return { armL, armR };
}

// High-Res Torso
export function createTorso(roleColor: string, accentColor: string = ACCENT_WHITE): VoxelDef[] {
    const torso: VoxelDef[] = [];

    // Body Block Y: 12 to 28
    for (let y = 12; y < 28; y++) {
        for (let x = -3; x <= 3; x++) {
            for (let z = -1; z <= 3; z++) {
                // Waist narrowing
                if (y < 16 && (Math.abs(x) === 3)) continue;

                // Neck area removal
                if (y > 26 && (Math.abs(x) >= 2)) continue;

                let c = roleColor;

                // Belt
                if (y === 14 || y === 15) c = '#0b1116';

                // Chest Accent / Logo
                if (y >= 20 && y <= 24 && z === 3 && Math.abs(x) <= 1) {
                    c = accentColor;
                }

                // Backpack / Equipment pack on back
                if (z === -1 && y > 18 && y < 26 && Math.abs(x) <= 2) {
                    c = '#333333';
                }

                torso.push({ x, y, z, c });
            }
        }
    }

    return torso;
}

// High-Res Head
export function createHead(skinColor: string = SKIN_COLOR, hairColor: string = HAIR_COLOR): VoxelDef[] {
    const head: VoxelDef[] = [];

    const startY = 28;
    const endY = 40;

    for (let y = startY; y < endY; y++) {
        for (let x = -3; x <= 3; x++) { // Wider head 7 wide
            for (let z = -2; z <= 3; z++) { // Deeper head 6 deep

                // Rounding corners
                if (x === -3 && z === -2) continue;
                if (x === 3 && z === -2) continue;
                if (x === -3 && z === 3) continue;
                if (x === 3 && z === 3) continue;

                // Chin taper
                if (y === startY && (Math.abs(x) === 3 || z === 3 || z === -2)) continue;

                let c = skinColor;

                // Hair (Side and back)
                if (y > 36 || z === -2 || Math.abs(x) === 3) {
                    c = hairColor;
                }

                // Face Override
                if (z === 3 && Math.abs(x) < 3 && y < 36 && y > startY) {
                    c = skinColor;

                    // Eyes
                    if (y === 33 && (x === -1 || x === 1)) c = '#111';

                    // Mouth
                    if (y === 30 && Math.abs(x) <= 1) c = '#a17a5b';
                }

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

    // Scale down 0.02 (half of previous 0.04) because our model is 2x larger in voxels
    root.scale.set(0.02, 0.02, 0.02);
    return root;
}
