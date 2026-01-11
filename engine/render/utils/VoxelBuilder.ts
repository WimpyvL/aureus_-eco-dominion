

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as THREE from 'three';
import { BiomeType } from '../../../types';
import { mats } from '../materials/VoxelMaterials';
import { greedyMesh } from './GreedyMesher';

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

    // Use Greedy Mesher
    const quads = greedyMesh(voxels);

    for (const q of quads) {
        // Determine transparency
        const isTransparent = q.c === 'glass' || q.c === 'water' || (materialMap && materialMap[q.c]?.transparent);
        const target = isTransparent ? transGeom : opaqueGeom;
        const rgb = getRgb(q.c, materialMap);

        // Generate Quad Geometry
        // Quad is defined by x,y,z (origin) and w,h (dimensions in plane)
        // Direction tells us the plane and normal.

        // Convert to 3D corners based on direction
        /*
          Quad Properties:
          x,y,z: Origin corner of the quad (in world-ish coords)
          w,h: Extent along the two axes of the face
          dir: 0..5 
        */

        const dirIdx = q.dir;
        const nx = FACE_NORMALS[dirIdx][0];
        const ny = FACE_NORMALS[dirIdx][1];
        const nz = FACE_NORMALS[dirIdx][2];

        // Resolve Basis Vectors for the Face
        let u = [0, 0, 0], v = [0, 0, 0];

        if (dirIdx === 0 || dirIdx === 1) { // X-Facing
            u = [0, 1, 0]; v = [0, 0, 1]; // u=y, v=z
        } else if (dirIdx === 2 || dirIdx === 3) { // Y-Facing
            u = [1, 0, 0]; v = [0, 0, 1]; // u=x, v=z
        } else { // Z-Facing
            u = [1, 0, 0]; v = [0, 1, 0]; // u=x, v=y
        }

        // Quad Corners applied to origin (q.x, q.y, q.z)
        // The origin q.x,y,z is the bottom-left corner of the face in the plane
        // BUT we need to account for the face offset from the voxel center (or corner? Greedy mesher uses ints)
        // Voxel Mesher usually centers voxels at x,y,z (if they are 1x1). 
        // My GreedyMesher returns integer coordinates of the start voxel.
        // A voxel at V(x,y,z) has center C(x,y,z).
        // Face 0 (+time) is at x+0.5. Face 1 (-x) is at x-0.5.

        // Let's compute center of the quad first?
        // Or just compute corners.

        // Start Point (at face plane)
        // If dir is +, offset is +0.5. If -, offset is -0.5.
        // Wait, GreedyMesher loops were integers.
        // If dir=0 (+x), Plane is at x+0.5 relative to voxel center?
        // No, typically voxel coords are centers.
        // Assuming standard 1 unit size.

        // Correct Offset logic:
        const x = q.x;
        const y = q.y;
        const z = q.z;

        // W and H extend along U and V
        // p0 = origin
        // p1 = origin + H*u (Wait, my loop usually does width first? verify)
        // In greedyMesher: w was inner loop (v-axis), h was outer loop (u-axis).
        // So Width corresponds to V-axis, Height corresponds to U-axis in my basises above?
        // Let's check GreedyMesher:
        // Dir 0/1 (X): W=v(z), H=u(y). So Width is along Z (v), Height along Y (u).
        // My U=[0,1,0] (y), V=[0,0,1] (z). MATCHES.

        // Corners:
        // c1 = Origin
        // c2 = Origin + W*v
        // c3 = Origin + W*v + H*u
        // c4 = Origin + H*u

        // Origin needs to be adjusted.
        // GreedyMesher x,y,z is the "min" voxel index.
        // For +Face, plane is at index + 0.5.
        // For -Face, plane is at index - 0.5.

        const offset = 0.5;
        const sign = (dirIdx % 2 === 0) ? 1 : -1;

        // Center position of the face plane logic:
        // Since x,y,z are integers, the face plane is at val + sign*0.5?
        // Let's assume standard ThreeJS BoxGeometry layout.

        let cx = x, cy = y, cz = z;
        if (dirIdx === 0 || dirIdx === 1) cx += sign * 0.5;
        if (dirIdx === 2 || dirIdx === 3) cy += sign * 0.5;
        if (dirIdx === 4 || dirIdx === 5) cz += sign * 0.5;

        // Wait, if it's a quad of size W,H starting at x,y,z...
        // The center of the quad would be x + (axis1 * H/2) + (axis2 * W/2)?
        // Rather than dealing with centers, let's explicit corners.

        const px = cx;
        const py = cy;
        const pz = cz;

        // Shift to corner of the quad area (since x,y,z is the 'min' voxel)
        // Face is 1x1 centered at 0,0.
        // Min corner is -0.5, -0.5 relative to center.
        // Here x,y,z is the "Coord".
        // So start corner is pos - 0.5 * basis? 
        // NO, if x=0, face is at x=0 (center).
        // The face EXITS from x-0.5 to x+0.5? 
        // Let's assume x,y,z is center of the starting voxel.
        // Then the face starts at (x - 0.5*w_axis - 0.5*h_axis) NO.

        // Simpler: 
        // Corner 1 is at (x,y,z) adjusted for face offset.
        // Actually, x,y,z are integers. The voxel occupies [x-0.5, x+0.5].
        // So the face surface starts at x-0.5 (for U/V axes).

        const startX = x - (dirIdx < 2 ? 0 : 0.5); // If X-face, X is fixed. Else X starts at -0.5
        // This is getting confusing.

        // Let's use vectors.
        // P = [x,y,z] (Integers)
        // Offset to corner of the face in P's space:
        // If Dir=Right (+X), Face is at X+0.5. Y range [Y-0.5, Y-0.5+H]. Z range [Z-0.5, Z-0.5+W].
        // Yes!

        const C = [x, y, z];
        const half = 0.5;

        // Adjust C to be the "Bottom-Left" corner of the quad in 3D
        if (dirIdx === 0 || dirIdx === 1) { // X fixed
            C[0] += (dirIdx === 0 ? half : -half);
            C[1] -= half;
            C[2] -= half;
        } else if (dirIdx === 2 || dirIdx === 3) { // Y fixed
            C[1] += (dirIdx === 2 ? half : -half);
            C[0] -= half;
            C[2] -= half;
        } else { // Z fixed
            C[2] += (dirIdx === 4 ? half : -half);
            C[0] -= half;
            C[1] -= half;
        }

        // Bases (u = Height Dir, v = Width Dir) - Check GreedyMesher again
        // X-Pass: W=v(z), H=u(y).
        // Y-Pass: W=v(z), H=u(x).
        // Z-Pass: W=v(y), H=u(x).

        let U = [0, 0, 0], V = [0, 0, 0];
        if (dirIdx < 2) { U = [0, 1, 0]; V = [0, 0, 1]; }
        else if (dirIdx < 4) { U = [1, 0, 0]; V = [0, 0, 1]; }
        else { U = [1, 0, 0]; V = [0, 1, 0]; }

        // Dimensions
        const H = q.h;
        const W = q.w;

        const c1 = [C[0], C[1], C[2]];
        const c2 = [C[0] + V[0] * W, C[1] + V[1] * W, C[2] + V[2] * W];
        const c3 = [C[0] + V[0] * W + U[0] * H, C[1] + V[1] * W + U[1] * H, C[2] + V[2] * W + U[2] * H];
        const c4 = [C[0] + U[0] * H, C[1] + U[1] * H, C[2] + U[2] * H];

        // Winding
        // If dir is negative (1, 3, 5), swap order?
        // Standard (0,2,4): c1->c2->c3?
        // Let's verify normal.
        // X+ (0): Right hand rule. Y(Up) x Z(Front) = X+.
        // My U=Y, V=Z. U x V = X+.
        // So c1 -> c4 -> c3 -> c2? (CCW?)
        // Verts: 1, 2, 3. (0,0) -> (1,0) -> (1,1).
        // (1,0)-(0,0) = (1,0). (1,1)-(1,0) = (0,1). X x Y = Z.
        // So V x U = Normal?
        // V=Z, U=Y. Z x Y = -X.
        // So U x V = X.
        // Quad corner sequence: c1(0,0), c2(W,0) [V], c3(W,H) [V+U], c4(0,H) [U].
        // 1->2->3: (W,0) x (0,H) = Z x Y = -X. WRONG.
        // 1->2 is V. 2->3 is U. V x U is -Normal.
        // So we want U x V order? 1->4->3?

        // Let's stick to explicit push.

        const pushQuad = (p1: number[], p2: number[], p3: number[], p4: number[]) => {
            // Tri 1: p1, p2, p3
            target.positions.push(...p1, ...p2, ...p3);
            target.normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
            target.colors.push(rgb[0], rgb[1], rgb[2], rgb[0], rgb[1], rgb[2], rgb[0], rgb[1], rgb[2]);

            // Tri 2: p1, p3, p4
            target.positions.push(...p1, ...p3, ...p4);
            target.normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
            target.colors.push(rgb[0], rgb[1], rgb[2], rgb[0], rgb[1], rgb[2], rgb[0], rgb[1], rgb[2]);
        };

        if (dirIdx % 2 !== 0) {
            // Negative faces (Left, Bottom, Back)
            // Need to flip to face "outwards" (in negative direction)
            // U x V gives Positive.
            // So we want V x U logic?
            // Actually just swap winding.
            pushQuad(c1, c4, c3, c2); // c1->c4 is U. c4->c3 is V. U x V = Pos.
            // Wait, if normal is neg, we want tri normal to be neg.
            // U x V is Pos.
            // So c1->c4->c3 generates Pos normal.
            // We want Neg normal.
            // So use c1->c2->c3 (V x U = Neg).
            pushQuad(c1, c2, c3, c4);
        } else {
            // Positive faces (Right, Top, Front)
            // Normal is Pos.
            // c1->c2 is V. c2->c3 is U. V x U = Neg.
            // We want Pos.
            // So c1->c4->c3 (U x V = Pos).
            pushQuad(c1, c4, c3, c2);
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
