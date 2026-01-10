

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as THREE from 'three';
import { BiomeType } from '../../../types';
import { mats } from '../materials/VoxelMaterials';

// --- GEOMETRY CACHE (For standard primitives) ---
const boxGeoCache: Record<string, THREE.BoxGeometry> = {};

function getBoxGeo(w: number, h: number, d: number) {
    const key = `${w.toFixed(2)},${h.toFixed(2)},${d.toFixed(2)} `;
    if (!boxGeoCache[key]) boxGeoCache[key] = new THREE.BoxGeometry(w, h, d);
    return boxGeoCache[key];
}

export const sharedBoxGeo = new THREE.BoxGeometry(1, 1, 1);
export const nuggetGeo = new THREE.DodecahedronGeometry(0.5, 0);

// --- LEGACY BUILDER (Kept for fallback/particles) ---
export function voxel(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(getBoxGeo(w, h, d), mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

export function buildVoxelGroup(voxels: { x: number, y: number, z: number, c: string }[], materialMap?: Record<string, THREE.Material>) {
    // Forward to new mesher for performance
    return buildMeshedVoxelGroup(voxels, materialMap);
}

// --- OPTIMIZED MESHER ---

const FACE_NORMALS = [
    [1, 0, 0],  // Right (0)
    [-1, 0, 0], // Left (1)
    [0, 1, 0],  // Top (2)
    [0, -1, 0], // Bottom (3)
    [0, 0, 1],  // Front (4)
    [0, 0, -1]  // Back (5)
];

// Helper to convert hex string to r,g,b array
const hexToRgbCache: Record<string, number[]> = {};
function getRgb(hexOrKey: string, matMap?: Record<string, THREE.Material>): number[] {
    // If it's a material key that resolves to a color
    if (matMap && matMap[hexOrKey] && (matMap[hexOrKey] as any).color) {
        const c = (matMap[hexOrKey] as any).color;
        return [c.r, c.g, c.b];
    }

    // Fallback if it's a hex string
    if (!hexToRgbCache[hexOrKey]) {
        const c = new THREE.Color(hexOrKey);
        hexToRgbCache[hexOrKey] = [c.r, c.g, c.b];
    }
    return hexToRgbCache[hexOrKey];
}

/**
 * Merges a list of voxels into a SINGLE mesh with Vertex Colors.
 * Performs internal face culling (does not draw faces between touching voxels).
 */
export function buildMeshedVoxelGroup(
    voxels: { x: number, y: number, z: number, c: string }[],
    materialMap?: Record<string, THREE.Material>
): THREE.Group {

    // Use robust integer keys for map lookup to avoid float precision issues (0.1 + 0.2 != 0.3)
    // We multiply by 100 to handle 0.5 offsets safely
    const getKey = (x: number, y: number, z: number) =>
        `${Math.round(x * 100)},${Math.round(y * 100)},${Math.round(z * 100)} `;

    const occupied = new Map<string, boolean>();
    voxels.forEach(v => occupied.set(getKey(v.x, v.y, v.z), true));

    const opaqueGeom = { positions: [] as number[], normals: [] as number[], colors: [] as number[] };
    const transGeom = { positions: [] as number[], normals: [] as number[], colors: [] as number[] };

    for (const v of voxels) {
        // Determine transparency
        const isTransparent = v.c === 'glass' || v.c === 'water' || (materialMap && materialMap[v.c]?.transparent);
        const target = isTransparent ? transGeom : opaqueGeom;
        const rgb = getRgb(v.c, materialMap);

        // Check 6 neighbors
        for (let i = 0; i < 6; i++) {
            const dir = FACE_NORMALS[i];
            const nx = v.x + dir[0];
            const ny = v.y + dir[1];
            const nz = v.z + dir[2];

            // If neighbor exists, don't draw face
            if (occupied.has(getKey(nx, ny, nz))) continue;

            // Add Face
            // A 1x1 face at the correct side
            // Basis: Center v.x, v.y, v.z. Size 1.

            const dx = dir[0], dy = dir[1], dz = dir[2];
            const s = 0.5; // Half size

            // Corner Offsets
            let c1 = [0, 0, 0], c2 = [0, 0, 0], c3 = [0, 0, 0], c4 = [0, 0, 0];

            if (dx !== 0) { // Right/Left
                c1 = [dx * s, -s, s]; c2 = [dx * s, -s, -s]; c3 = [dx * s, s, -s]; c4 = [dx * s, s, s];
            } else if (dy !== 0) { // Top/Bottom
                c1 = [-s, dy * s, s]; c2 = [s, dy * s, s]; c3 = [s, dy * s, -s]; c4 = [-s, dy * s, -s];
            } else { // Front/Back
                c1 = [-s, -s, dz * s]; c2 = [s, -s, dz * s]; c3 = [s, s, dz * s]; c4 = [-s, s, dz * s];
            }

            // Verts relative to center
            const x = v.x, y = v.y, z = v.z;

            // Winding Order Logic:
            // For faces pointing in negative directions (Left, Bottom, Back -> indices 1, 3, 5),
            // the standard winding produces inverted normals. We must flip vertex order.

            if (i % 2 !== 0) {
                // FLIPPED WINDING (c1 -> c3 -> c2)
                target.positions.push(x + c1[0], y + c1[1], z + c1[2]);
                target.positions.push(x + c3[0], y + c3[1], z + c3[2]);
                target.positions.push(x + c2[0], y + c2[1], z + c2[2]);

                target.positions.push(x + c1[0], y + c1[1], z + c1[2]);
                target.positions.push(x + c4[0], y + c4[1], z + c4[2]);
                target.positions.push(x + c3[0], y + c3[1], z + c3[2]);
            } else {
                // STANDARD WINDING (c1 -> c2 -> c3)
                target.positions.push(x + c1[0], y + c1[1], z + c1[2]);
                target.positions.push(x + c2[0], y + c2[1], z + c2[2]);
                target.positions.push(x + c3[0], y + c3[1], z + c3[2]);

                target.positions.push(x + c1[0], y + c1[1], z + c1[2]);
                target.positions.push(x + c3[0], y + c3[1], z + c3[2]);
                target.positions.push(x + c4[0], y + c4[1], z + c4[2]);
            }

            // Normals & Colors (6 verts)
            for (let k = 0; k < 6; k++) {
                target.normals.push(dx, dy, dz);
                target.colors.push(rgb[0], rgb[1], rgb[2]);
            }
        }
    }

    const group = new THREE.Group();

    // 1. Opaque Mesh
    if (opaqueGeom.positions.length > 0) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(opaqueGeom.positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(opaqueGeom.normals, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(opaqueGeom.colors, 3));

        const mat = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.8,
            metalness: 0.1
        });
        const mesh = new THREE.Mesh(geometry, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
    }

    // 2. Transparent Mesh
    if (transGeom.positions.length > 0) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(transGeom.positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(transGeom.normals, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(transGeom.colors, 3));

        const mat = new THREE.MeshStandardMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            roughness: 0.1,
            metalness: 0.8,
            side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, mat);
        mesh.castShadow = false;
        mesh.receiveShadow = true;
        group.add(mesh);
    }

    return group;
}

export interface FactoryOptions {
    neighbors?: number;
    integrity?: number;
    progress?: number;
    seed?: number;
    width?: number;
    depth?: number;
    waterStatus?: 'CONNECTED' | 'DISCONNECTED';
    isUnderConstruction?: boolean;
    connections?: {
        north?: boolean;
        south?: boolean;
        east?: boolean;
        west?: boolean;
    };
}
