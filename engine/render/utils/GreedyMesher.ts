/**
 * Greedy Meshing Algorithm for Voxel Optimization
 * Merges adjacent faces with identical attributes into larger quads.
 */

export interface VoxelFace {
    dir: number; // 0..5
    x: number;
    y: number;
    z: number;
    c: string; // color/material key
}

export interface Quad {
    x: number; y: number; z: number;
    w: number; h: number;
    c: string;
    dir: number; // 0=Right,1=Left,2=Top,3=Bottom,4=Front,5=Back
}

// Direction Constants
// 0: +x, 1: -x, 2: +y, 3: -y, 4: +z, 5: -z

export function greedyMesh(
    voxels: { x: number, y: number, z: number, c: string }[]
): Quad[] {
    const quads: Quad[] = [];
    if (voxels.length === 0) return quads;

    // 1. Build a sparse map for fast lookup
    // Key: "x,y,z" -> { c, visitedFlags } (visited bits per face)
    const map = new Map<string, { c: string }>();
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const v of voxels) {
        // Ensure integer coordinates for meshing
        const ix = Math.round(v.x);
        const iy = Math.round(v.y);
        const iz = Math.round(v.z);

        map.set(`${ix},${iy},${iz}`, { c: v.c }); // Use integer keys
        if (ix < minX) minX = ix; if (ix > maxX) maxX = ix;
        if (iy < minY) minY = iy; if (iy > maxY) maxY = iy;
        if (iz < minZ) minZ = iz; if (iz > maxZ) maxZ = iz;
    }

    // Dimensions
    const dims = [maxX - minX + 1, maxY - minY + 1, maxZ - minZ + 1];

    // Iterate over each of the 6 directions
    // 0: Right (+x), 1: Left (-x), 2: Top (+y), 3: Bottom (-y), 4: Front (+z), 5: Back (-z)
    for (let d = 0; d < 6; d++) {
        const isBackFace = (d % 2 !== 0); // 1, 3, 5 are negative directions

        // Axis permutations based on primary direction
        // u, v are the axes of the face plane
        let u = 0, v = 0, k = 0; // k is the depth axis
        let uAxis = [0, 0, 0], vAxis = [0, 0, 0], kAxis = [0, 0, 0];

        // Assign axes
        if (d === 0 || d === 1) { // X-axis (Right/Left) -> Face is in Y/Z plane
            k = 0; u = 1; v = 2; // k=x, u=y, v=z
        } else if (d === 2 || d === 3) { // Y-axis (Top/Bottom) -> Face is in X/Z plane
            k = 1; u = 0; v = 2; // k=y, u=x, v=z
        } else { // Z-axis (Front/Back) -> Face is in X/Y plane
            k = 2; u = 0; v = 1; // k=z, u=x, v=y
        }

        const offset = [0, 0, 0];
        if (d === 0) offset[0] = 1;
        if (d === 1) offset[0] = -1;
        if (d === 2) offset[1] = 1;
        if (d === 3) offset[1] = -1;
        if (d === 4) offset[2] = 1;
        if (d === 5) offset[2] = -1;

        // Iterate through slices K
        // Range from min[k] to max[k]
        for (let i = (d % 2 === 0 ? minX : minX); i <= (d % 2 === 0 ? maxX : maxX); i++) {
            // Actually, generalized iteration is hard.
            // Simpler approach: Iterate 3 axes as "Normal Axis".
        }
    }

    // Restarting with simpler approach:
    // For each Axis (X, Y, Z) being the Normal:
    //   Scan binary mask of faces.
    //   Greedy merge.

    // We'll call a helper for each direction pair to keep code clean.

    // X-Pass (Right/Left)
    computeGreedyFaces(map, minX, maxX, minY, maxY, minZ, maxZ, 0, quads); // Right (+x)
    computeGreedyFaces(map, minX, maxX, minY, maxY, minZ, maxZ, 1, quads); // Left (-x)

    // Y-Pass (Top/Bottom)
    computeGreedyFaces(map, minX, maxX, minY, maxY, minZ, maxZ, 2, quads); // Top (+y)
    computeGreedyFaces(map, minX, maxX, minY, maxY, minZ, maxZ, 3, quads); // Bottom (-y)

    // Z-Pass (Front/Back)
    computeGreedyFaces(map, minX, maxX, minY, maxY, minZ, maxZ, 4, quads); // Front (+z)
    computeGreedyFaces(map, minX, maxX, minY, maxY, minZ, maxZ, 5, quads); // Back (-z)

    return quads;
}

function computeGreedyFaces(
    map: Map<string, { c: string }>,
    minX: number, maxX: number,
    minY: number, maxY: number,
    minZ: number, maxZ: number,
    dir: number,
    quads: Quad[]
) {
    // Setup axes
    let kMin = 0, kMax = 0, uMin = 0, uMax = 0, vMin = 0, vMax = 0;

    if (dir === 0 || dir === 1) { // X-axis normal. Plane YZ.
        kMin = minX; kMax = maxX; uMin = minY; uMax = maxY; vMin = minZ; vMax = maxZ;
    } else if (dir === 2 || dir === 3) { // Y-axis normal. Plane XZ.
        kMin = minY; kMax = maxY; uMin = minX; uMax = maxX; vMin = minZ; vMax = maxZ;
    } else { // Z-axis normal. Plane XY.
        kMin = minZ; kMax = maxZ; uMin = minX; uMax = maxX; vMin = minY; vMax = maxY;
    }

    // Direction vector for checking neighbor validity
    const dk = (dir % 2 === 0) ? 1 : -1;

    // Helper to get voxel key from K, U, V
    const getK = (k: number, u: number, v: number) => {
        if (dir === 0 || dir === 1) return `${k},${u},${v}`; // x,y,z
        if (dir === 2 || dir === 3) return `${u},${k},${v}`; // x,y,z
        return `${u},${v},${k}`; // x,y,z
    };

    // Mask for current slice
    // mask[u][v] stores color if face present, null otherwise
    const uLen = uMax - uMin + 1;
    const vLen = vMax - vMin + 1;

    for (let k = kMin; k <= kMax; k++) {
        // 1. Build Mask for Slice K
        const mask: (string | null)[] = new Array(uLen * vLen).fill(null);

        for (let u = 0; u < uLen; u++) {
            for (let v = 0; v < vLen; v++) {
                const worldU = u + uMin;
                const worldV = v + vMin;

                const currentKey = getK(k, worldU, worldV);
                const neighborKey = getK(k + dk, worldU, worldV);

                const current = map.get(currentKey);
                const neighbor = map.get(neighborKey);

                // Face is visible if current exists AND (neighbor doesn't exist OR neighbor is transparent/glass)
                // Assuming simple occlusion for now: if neighbor exists, no face.
                // NOTE: VoxelBuilder handles transparency. We simplified here: opaque blocks only for solid meshing.
                // Assuming all input voxels are solid for this pass.

                if (current && !neighbor) {
                    mask[u * vLen + v] = current.c;
                }
            }
        }

        // 2. Greedy Quad Generation on Mask
        let n = 0;
        for (let u = 0; u < uLen; u++) {
            for (let v = 0; v < vLen; v++) {
                const c = mask[n];
                if (c !== null) {
                    // Compute width (v-axis)
                    let w = 1;
                    while (v + w < vLen && mask[n + w] === c) {
                        w++;
                    }

                    // Compute height (u-axis)
                    let h = 1;
                    let match = true;
                    while (u + h < uLen) {
                        for (let checkV = 0; checkV < w; checkV++) {
                            if (mask[(u + h) * vLen + v + checkV] !== c) {
                                match = false;
                                break;
                            }
                        }
                        if (!match) break;
                        h++;
                    }

                    // Add Quad
                    // Convert local K,U,V back to X,Y,Z
                    // Quad origin is at (u, v) in the slice
                    // Position depends on direction.
                    // If dir is negative, face is at k. If positive, face is at k+1? 
                    // No, existing VoxelBuilder puts face at x +/- 0.5.
                    // Here we output integer coords + size.

                    // Origin in World Coords
                    let ox = 0, oy = 0, oz = 0;
                    let ow = 0, oh = 0; // World Width/Height dimensions for the quad geometry

                    /*
                       Quad dimensions map to:
                       Dir 0/1 (X): W=v(z), H=u(y)
                       Dir 2/3 (Y): W=v(z), H=u(x) -> Wait, u is x here.
                       Dir 4/5 (Z): W=v(y), H=u(x)
                     */

                    const worldU = u + uMin;
                    const worldV = v + vMin;

                    if (dir === 0 || dir === 1) { // X-axis
                        ox = k; oy = worldU; oz = worldV;
                    } else if (dir === 2 || dir === 3) { // Y-axis
                        ox = worldU; oy = k; oz = worldV;
                    } else { // Z-axis
                        ox = worldU; oy = worldV; oz = k;
                    }

                    quads.push({
                        x: ox, y: oy, z: oz,
                        w: w, h: h, // These are in v-axis and u-axis of the slice
                        c: c,
                        dir: dir
                    });

                    // Clear visited in mask
                    for (let du = 0; du < h; du++) {
                        for (let dv = 0; dv < w; dv++) {
                            mask[(u + du) * vLen + v + dv] = null;
                        }
                    }

                    // Skip processed v's
                    // v += w - 1; // Loop increments v
                }
                n++;
            }
        }
    }
}
