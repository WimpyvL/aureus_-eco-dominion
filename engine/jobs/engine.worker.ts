/**
 * Engine Worker
 * Handles heavy computations in a background thread:
 * - Pathfinding
 * - Terrain Meshing (Surface Shell Optimized)
 */

import { GridTile } from '../../types';
import { getBiomeAt as getBiomeAtImpl, getFoliageAt as getFoliageAtImpl } from '../worldgen/Core';
import { Job, PathfindJob, PathfindResult, MeshChunkJob, MeshChunkResult } from './jobs.types';
import { findPath } from '../sim/algorithms/Pathfinding';
import { GRID_SIZE } from '../utils/GameUtils';

let localGrid: GridTile[] | null = null;

const PALETTE: Record<string, number[]> = {
    'grass': [0.36, 0.62, 0.27],
    'grassLight': [0.52, 0.80, 0.09],
    'dirt': [0.47, 0.21, 0.06],
    'sand': [0.92, 0.70, 0.03],
    'stone': [0.39, 0.45, 0.54],
    'snow': [1.0, 1.0, 1.0],
    'water': [0.02, 0.71, 0.83],
    'concrete': [0.58, 0.64, 0.72],
    'wood': [0.55, 0.27, 0.07],
    'leaf': [0.13, 0.55, 0.13],
    'pine': [0.07, 0.35, 0.07],
    'birch': [0.9, 0.85, 0.7],
    'birchLeaf': [0.5, 0.7, 0.2],
    'cactus': [0.2, 0.6, 0.2],
    'rock': [0.5, 0.5, 0.5],
    'flower': [0.8, 0.3, 0.8],
    'flowerYellow': [1.0, 0.8, 0.0],
    'dead': [0.4, 0.3, 0.2],
    'crystal': [0.4, 1.0, 1.0],
    'gold': [1.0, 0.84, 0.0]
};

const LAYER_PALETTE: number[][] = [
    [0.2, 0.3, 0.5], // Layer 1 (Blue-ish)
    [0.2, 0.5, 0.5], // Layer 2 (Teal-ish)
    [0.2, 0.5, 0.3], // Layer 3 (Green-ish)
    [0.4, 0.5, 0.2], // Layer 4 (Lime-ish)
    [0.5, 0.5, 0.2], // Layer 5 (Yellow-ish)
    [0.5, 0.4, 0.2], // Layer 6 (Orange-ish)
    [0.5, 0.3, 0.2], // Layer 7 (Rust-ish)
    [0.5, 0.2, 0.3], // Layer 8 (Pink-ish)
    [0.4, 0.2, 0.5], // Layer 9 (Purple-ish)
    [0.2, 0.2, 0.5], // Layer 10 (Deep Blue)
];

self.onmessage = (e: MessageEvent) => {
    const msg = e.data;

    if (msg.type === 'SYNC_GRID') {
        localGrid = msg.payload;
        return;
    }

    const job = msg as Job;
    if (!job.id || !job.kind) return;

    try {
        let result: any = null;

        if (job.kind === 'PATHFIND') {
            result = processPathfind(job as PathfindJob);
        } else if (job.kind === 'MESH_CHUNK') {
            result = processMeshChunk(job as MeshChunkJob);
        }

        if (result) {
            if (job.kind === 'MESH_CHUNK' && result.solid) {
                const transfer: Transferable[] = [];
                if (result.solid) transfer.push(result.solid.p.buffer, result.solid.n.buffer, result.solid.c.buffer, result.solid.u.buffer);
                if (result.water) transfer.push(result.water.p.buffer, result.water.n.buffer, result.water.c.buffer, result.water.u.buffer);
                (self as unknown as Worker).postMessage(result, transfer);
            } else {
                self.postMessage(result);
            }
        }
    } catch (err) {
        self.postMessage({
            jobId: job.id,
            kind: job.kind,
            success: false,
            error: String(err),
            completedAt: Date.now(),
            queuedAt: job.queuedAt
        });
    }
};

function processMeshChunk(job: MeshChunkJob): MeshChunkResult {
    const { cx, cz, tiles, gridSize, viewMode = 'SURFACE', lod = 1 } = job.payload;
    const CHUNK_SIZE = 16;
    const isUnderground = viewMode === 'UNDERGROUND';
    const cavernFloorY = -30; // Fixed cavern floor height
    const cavernCeilingOffset = 20; // Ceiling is 20 units above floor (at -10)

    const offsetX = (gridSize - 1) / 2;
    const offsetZ = (gridSize - 1) / 2;
    const startX = cx * CHUNK_SIZE;
    const startZ = cz * CHUNK_SIZE;

    const foliageItems: any[] = [];
    const solid = { p: [] as number[], n: [] as number[], c: [] as number[], u: [] as number[] };
    const water = { p: [] as number[], n: [] as number[], c: [] as number[], u: [] as number[] };
    const ghost = { p: [] as number[], n: [] as number[], c: [] as number[], u: [] as number[] };

    const tileMap = new Map<string, GridTile>();
    if (tiles) tiles.forEach(t => tileMap.set(`${t.x},${t.y}`, t));

    function pRand(x: number, z: number) {
        return Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
    }

    // Default half-height for standard blocks (1 unit tall)
    const stdH = 0.5;

    const addFace = (dest: any, sx: number, sy: number, sz: number, type: number, color: number[], h: number = 0.5) => {
        let v1, v2, v3, v4, nx, ny, nz;
        // 0: +X, 1: -X, 2: +Y (Top), 3: -Y (Bottom), 4: +Z, 5: -Z
        if (type === 0) { v1 = [h, -h, h]; v2 = [h, -h, -h]; v3 = [h, h, -h]; v4 = [h, h, h]; nx = 1; ny = 0; nz = 0; }
        else if (type === 1) { v1 = [-h, -h, -h]; v2 = [-h, -h, h]; v3 = [-h, h, h]; v4 = [-h, h, -h]; nx = -1; ny = 0; nz = 0; }
        else if (type === 2) { v1 = [-h, h, h]; v2 = [h, h, h]; v3 = [h, h, -h]; v4 = [-h, h, -h]; nx = 0; ny = 1; nz = 0; }
        else if (type === 3) { v1 = [-h, -h, -h]; v2 = [h, -h, -h]; v3 = [h, -h, h]; v4 = [-h, -h, h]; nx = 0; ny = -1; nz = 0; }
        else if (type === 4) { v1 = [-h, -h, h]; v2 = [h, -h, h]; v3 = [h, h, h]; v4 = [-h, h, h]; nx = 0; ny = 0; nz = 1; }
        else { v1 = [h, -h, -h]; v2 = [-h, -h, -h]; v3 = [-h, h, -h]; v4 = [h, h, -h]; nx = 0; ny = 0; nz = -1; }

        dest.p.push(sx + v1[0], sy + v1[1], sz + v1[2]);
        dest.p.push(sx + v2[0], sy + v2[1], sz + v2[2]);
        dest.p.push(sx + v3[0], sy + v3[1], sz + v3[2]);
        dest.p.push(sx + v1[0], sy + v1[1], sz + v1[2]);
        dest.p.push(sx + v3[0], sy + v3[1], sz + v3[2]);
        dest.p.push(sx + v4[0], sy + v4[1], sz + v4[2]);

        for (let k = 0; k < 6; k++) {
            dest.n.push(nx, ny, nz);
            dest.c.push(color[0], color[1], color[2]);
        }
        dest.u.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
    };

    const getData = (wx: number, wz: number) => {
        const key = `${wx},${wz}`;
        if (tileMap.has(key)) {
            const t = tileMap.get(key)!;
            return { h: t.terrainHeight, b: t.biome, bt: t.buildingType, f: t.foliage, in: true, marked: t.markedForHarvest };
        }
        const nx = wx - offsetX;
        const nz = wz - offsetZ;
        const data = getBiomeAtImpl(nx, nz);
        return { h: data.height, b: data.biome, bt: 'EMPTY', f: null, in: false, marked: false };
    };

    for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
            const worldX = startX + x;
            const worldZ = startZ + z;
            const data = getData(worldX, worldZ);

            const key = `${worldX},${worldZ}`;
            const tile = tileMap.get(key);

            // Underground meshing: 10 levels deep + ghost surface
            if (isUnderground) {
                const surfaceY = data.h * 0.5;
                const floorColor = PALETTE['stone'];
                const ceilingColor = PALETTE['dirt'];
                const ghostColor = PALETTE[data.b] || PALETTE['grass'];

                // Render Underground Layers (-1 to -10) with Neighbor Culling
                for (let layer = -1; layer >= -10; layer--) {
                    try {
                        // FIX: Use 2.0 depth scaling to match logic & camera
                        // Surface is at surfaceY. Layer -1 is from surfaceY to surfaceY-2. Center is surfaceY-1.
                        const layerY = surfaceY + (layer * 2.0) + 1.0;
                        const layerH = 1.0; // 2.0 units tall, so half-height is 1.0

                        const myU = tile?.underground;
                        const amISolid = !myU || !myU[layer] || !myU[layer].excavated;

                        if (amISolid) {
                            const myStrata = myU ? myU[layer] : null;
                            const ore = myStrata?.oreVisible ? myStrata.oreType : null;

                            // Use layer palette for visual distinctiveness
                            const layerIndex = Math.abs(layer) - 1;
                            let color = LAYER_PALETTE[layerIndex % 10];

                            // Blend with ore color if present
                            if (ore === 'GOLD') color = [color[0] * 0.5 + 0.5, color[1] * 0.5 + 0.42, color[2] * 0.5];
                            else if (ore === 'GEM') color = [color[0] * 0.5 + 0.2, color[1] * 0.5 + 0.5, color[2] * 0.5 + 0.5];
                            else if (ore === 'IRON') color = [color[0] * 0.5 + 0.3, color[1] * 0.5 + 0.2, color[2] * 0.5 + 0.15];
                            else if (ore === 'COAL') color = [color[0] * 0.2, color[1] * 0.2, color[2] * 0.2];

                            // Check 6 neighbors
                            const isNeighborSolid = (nx: number, nz: number, nLayer: number) => {
                                // Bedrock is solid
                                if (nLayer < -10) return true;

                                // Surface transition (Layer 0)
                                if (nLayer === 0) {
                                    const nKey = `${nx},${nz}`;
                                    const nTile = tileMap.get(nKey);
                                    // If the tile has an entrance (hole), it's open (not solid)
                                    // Otherwise it's the solid surface of the world
                                    return !nTile?.hasEntrance;
                                }

                                const nKey = `${nx},${nz}`;
                                const nTile = tileMap.get(nKey);
                                if (nTile && nTile.underground && nTile.underground[nLayer]) {
                                    return !nTile.underground[nLayer].excavated;
                                }
                                // Outside map or uninitialized = solid earth
                                return true;
                            };

                            // Top (2) - Only if neighbor above is NOT solid (excavated)
                            if (!isNeighborSolid(worldX, worldZ, layer + 1)) addFace(solid, x, layerY, z, 2, color, layerH);
                            // Bottom (3)
                            if (!isNeighborSolid(worldX, worldZ, layer - 1)) addFace(solid, x, layerY, z, 3, color, layerH);
                            // +X (0)
                            if (!isNeighborSolid(worldX + 1, worldZ, layer)) addFace(solid, x, layerY, z, 0, color, layerH);
                            // -X (1)
                            if (!isNeighborSolid(worldX - 1, worldZ, layer)) addFace(solid, x, layerY, z, 1, color, layerH);
                            // +Z (4)
                            if (!isNeighborSolid(worldX, worldZ + 1, layer)) addFace(solid, x, layerY, z, 4, color, layerH);
                            // -Z (5)
                            if (!isNeighborSolid(worldX, worldZ - 1, layer)) addFace(solid, x, layerY, z, 5, color, layerH);
                        } else {
                            // I am excavated. Render rubble?
                            if (myU && myU[layer] && myU[layer].collapsed) {
                                const rubbleColor = [0.3, 0.2, 0.1];
                                addFace(solid, x, layerY - 0.9, z, 2, rubbleColor, 0.1); // Small rubble
                            }
                        }
                    } catch (err) {
                        console.warn(`Worker: Error meshing underground layer ${layer} at ${worldX},${worldZ}:`, err);
                    }
                }
                continue;
            }

            // --- Surface Logic (only if not underground) ---
            // Foliage Logic (Infinite)
            let fType = data.f;

            // Try procedural generation if no explicit foliage
            // This runs for both existing tiles (that are empty) and procedural chunks
            if ((!fType || fType === 'NONE') && data.bt === 'EMPTY' && data.h > 0) {
                const nx = worldX - offsetX;
                const nz = worldZ - offsetZ;
                const bd = getBiomeAtImpl(nx, nz);
                const dist = Math.sqrt(nx * nx + nz * nz);
                const gen = getFoliageAtImpl(data.b, data.h, bd.detail, dist, pRand(worldX, worldZ));

                // Do not spawn gold outside playable area (can't mine it)
                if (gen !== 'NONE' && gen !== 'GOLD_VEIN') {
                    fType = gen;
                }
            }

            if (fType && fType !== 'NONE' && fType !== 'GOLD_VEIN') {
                foliageItems.push({ x: worldX, y: data.h * 0.5, z: worldZ, type: fType, marked: data.marked });
            }

            // Hole Visibility on Surface
            if (tile?.hasEntrance) {
                foliageItems.push({ x: worldX, y: data.h * 0.5, z: worldZ, type: 'MINE_HOLE' });
            }

            let matKey = data.b.toLowerCase();
            if (data.b === 'GRASS' && data.h > 2) matKey = 'grassLight';
            const color = PALETTE[matKey] || [1, 1, 1];

            const surfaceY = (data.h * 0.5) - 0.5;
            let topY = surfaceY;
            const isWater = data.bt === 'POND' || data.bt === 'RESERVOIR' || (!data.in && data.h === 0);

            if (data.bt === 'POND') topY = (data.h * 0.5) - 1.5;
            else if (data.bt === 'RESERVOIR') topY = (data.h * 0.5) - 1.5;
            else if (!data.in && data.h === 0) topY = -2;

            // Surface
            if (!tile?.hasEntrance) {
                addFace(solid, x, topY, z, 2, color);
            }

            // Sides (cliff edges)
            [[1, 0, 0], [-1, 0, 1], [0, 1, 4], [0, -1, 5]].forEach(([dx, dz, type]) => {
                const neighbor = getData(worldX + dx, worldZ + dz);
                let nTop = (neighbor.h * 0.5) - 0.5;
                if (neighbor.bt === 'POND' || neighbor.bt === 'RESERVOIR') nTop -= 1;
                else if (!neighbor.in && neighbor.h === 0) nTop = -2;

                for (let y = topY; y > nTop; y--) {
                    addFace(solid, x, y, z, type, color);
                }
            });

            // Water
            if (isWater) {
                const waterY = data.h === 0 ? 0 : surfaceY;
                addFace(water, x, waterY, z, 2, PALETTE['water']);
            }
        }
    }

    const serialize = (geo: any) => {
        if (geo.p.length === 0) return null;
        return {
            p: new Float32Array(geo.p),
            n: new Float32Array(geo.n),
            c: new Float32Array(geo.c),
            u: new Float32Array(geo.u)
        };
    };

    return {
        jobId: job.id,
        kind: 'MESH_CHUNK',
        success: true,
        completedAt: Date.now(),
        chunkId: job.payload.chunkId,
        solid: serialize(solid),
        water: serialize(water),
        ghost: serialize(ghost),
        foliage: foliageItems,
        cx, cz, lod,
        queuedAt: job.queuedAt
    };
}

function processPathfind(job: PathfindJob): PathfindResult {
    if (!localGrid || localGrid.length === 0) throw new Error("Worker has no grid data");
    const startIdx = job.startZ * GRID_SIZE + job.startX;
    const endIdx = job.endZ * GRID_SIZE + job.endX;
    const path = findPath(startIdx, endIdx, localGrid);
    return {
        jobId: job.id,
        kind: 'PATHFIND',
        success: !!path,
        completedAt: Date.now(),
        queuedAt: job.queuedAt,
        agentId: job.agentId,
        path: path
    };
}
