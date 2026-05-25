/**
 * Engine Worker
 * Handles heavy computations in a background thread:
 * - Pathfinding
 * - Terrain Meshing (Surface Shell Optimized)
 * (|/) Klaasvaakie
 */

import { GridTile, Chunk } from '../../types';
import { getTerrainMacroStep } from '../render/utils/TerrainLod';
import { getBiomeAt as getBiomeAtImpl, getFoliageAt as getFoliageAtImpl } from '../worldgen/Core';
import { Job, PathfindJob, PathfindResult, MeshChunkJob, MeshChunkResult, ENGINE_SCHEMA_VERSION } from './jobs.types';
import { findPath } from '../sim/algorithms/Pathfinding';
import { worldToChunk, worldToLocal } from '../utils/coords';

let localChunks: Record<string, Chunk> = {};

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



self.onmessage = (e: MessageEvent) => {
    const msg = e.data;

    if (msg.type === 'SYNC_CHUNKS') {
        localChunks = msg.payload; // Record<string, Chunk>
        return;
    }

    if (msg.type === 'UPDATE_CHUNK') {
        const { key, chunk } = msg.payload;
        // console.log('[Worker] Updating chunk', key);
        localChunks[key] = chunk;
        return;
    }

    const job = msg as Job;
    if (!job.id || !job.kind) return;

    // Protocol validation
    if (job.schemaVersion !== ENGINE_SCHEMA_VERSION) {
        console.warn(`[EngineWorker] Schema version mismatch. Job: ${job.schemaVersion}, Internal: ${ENGINE_SCHEMA_VERSION}. This is normal during hmr/build.`);
    }

    try {
        let result: any = null;

        if (job.kind === 'PATHFIND') {
            result = processPathfind(job as PathfindJob);
        } else if (job.kind === 'MESH_CHUNK') {
            result = processMeshChunk(job as MeshChunkJob);
        }

        if (result) {
            if (job.kind === 'MESH_CHUNK' && result.success) {
                const transfer: Transferable[] = [];
                if (result.solid) transfer.push(result.solid.p.buffer, result.solid.n.buffer, result.solid.c.buffer, result.solid.u.buffer);
                if (result.water) transfer.push(result.water.p.buffer, result.water.n.buffer, result.water.c.buffer, result.water.u.buffer);
                if (result.ghost) transfer.push(result.ghost.p.buffer, result.ghost.n.buffer, result.ghost.c.buffer, result.ghost.u.buffer);
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
            queuedAt: job.queuedAt,
            schemaVersion: ENGINE_SCHEMA_VERSION
        });
    }
};

function processMeshChunk(job: MeshChunkJob): MeshChunkResult {
    const { cx, cz, tiles, lod = 1 } = job.payload;
    const CHUNK_SIZE = 16;
    const macroStep = getTerrainMacroStep(lod);

    const startX = cx * CHUNK_SIZE;
    const startZ = cz * CHUNK_SIZE;

    // FIX: Update localChunks with this fresh data so neighbors can see it later
    const chunkKey = `${cx},${cz}`;
    if (!localChunks[chunkKey]) {
        localChunks[chunkKey] = {
            id: job.payload.chunkId,
            x: cx,
            z: cz,
            tiles: tiles || [], // Ensure tiles is array
            buildings: {}, // Placeholder if needed
        } as any;
    } else {
        localChunks[chunkKey].tiles = tiles || [];
    }

    const foliageItems: any[] = [];
    const solid = { p: [] as number[], n: [] as number[], c: [] as number[], u: [] as number[] };
    const water = { p: [] as number[], n: [] as number[], c: [] as number[], u: [] as number[] };
    const ghost = { p: [] as number[], n: [] as number[], c: [] as number[], u: [] as number[] };

    const tileMap = new Map<string, GridTile>();
    if (tiles) tiles.forEach(t => tileMap.set(`${t.x},${t.z}`, t));

    function pRand(x: number, z: number) {
        return Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
    }

    const addFace = (
        dest: any,
        sx: number,
        sy: number,
        sz: number,
        type: number,
        color: number[],
        hx: number = 0.5,
        hy: number = 0.5,
        hz: number = 0.5
    ) => {
        let v1, v2, v3, v4, nx, ny, nz;
        // 0: +X, 1: -X, 2: +Y (Top), 3: -Y (Bottom), 4: +Z, 5: -Z
        if (type === 0) { v1 = [hx, -hy, hz]; v2 = [hx, -hy, -hz]; v3 = [hx, hy, -hz]; v4 = [hx, hy, hz]; nx = 1; ny = 0; nz = 0; }
        else if (type === 1) { v1 = [-hx, -hy, -hz]; v2 = [-hx, -hy, hz]; v3 = [-hx, hy, hz]; v4 = [-hx, hy, -hz]; nx = -1; ny = 0; nz = 0; }
        else if (type === 2) { v1 = [-hx, hy, hz]; v2 = [hx, hy, hz]; v3 = [hx, hy, -hz]; v4 = [-hx, hy, -hz]; nx = 0; ny = 1; nz = 0; }
        else if (type === 3) { v1 = [-hx, -hy, -hz]; v2 = [hx, -hy, -hz]; v3 = [hx, -hy, hz]; v4 = [-hx, -hy, hz]; nx = 0; ny = -1; nz = 0; }
        else if (type === 4) { v1 = [-hx, -hy, hz]; v2 = [hx, -hy, hz]; v3 = [hx, hy, hz]; v4 = [-hx, hy, hz]; nx = 0; ny = 0; nz = 1; }
        else { v1 = [hx, -hy, -hz]; v2 = [-hx, -hy, -hz]; v3 = [-hx, hy, -hz]; v4 = [hx, hy, -hz]; nx = 0; ny = 0; nz = -1; }

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

    const getTile = (gx: number, gz: number): GridTile | null => {
        const key = `${gx},${gz}`;
        if (tileMap.has(key)) return tileMap.get(key)!;

        // Fallback to localChunks
        const chunkX = Math.floor(gx / CHUNK_SIZE);
        const chunkZ = Math.floor(gz / CHUNK_SIZE);
        const chunkKey = `${chunkX},${chunkZ}`;
        const chunk = localChunks[chunkKey];
        if (chunk) {
            return chunk.tiles.find(t => t.x === gx && t.z === gz) || null;
        }
        return null;
    };

    const getData = (gx: number, gz: number) => {
        const t = getTile(gx, gz);
        if (t) {
            return { h: t.terrainHeight, b: t.biome, bt: t.buildingType, f: t.foliage || 'NONE', in: true, marked: t.markedForHarvest };
        }

        const data = getBiomeAtImpl(gx, gz);
        return { h: data.height, b: data.biome, bt: 'EMPTY', f: 'NONE', in: false, marked: false };
    };

    const getMacroData = (worldX: number, worldZ: number, cellWidth: number, cellDepth: number) => {
        const sampleX = Math.min(worldX + Math.floor((cellWidth - 1) * 0.5), startX + CHUNK_SIZE - 1);
        const sampleZ = Math.min(worldZ + Math.floor((cellDepth - 1) * 0.5), startZ + CHUNK_SIZE - 1);
        const data = getData(sampleX, sampleZ);

        let fType = data.f;
        if ((!fType || fType === 'NONE') && data.bt === 'EMPTY' && data.h > 0) {
            const bd = getBiomeAtImpl(sampleX, sampleZ);
            fType = getFoliageAtImpl(sampleX, sampleZ, data.b, data.h, bd.detail);
            if (fType === 'GOLD_VEIN') {
                fType = 'NONE';
            }
        }

        return {
            worldX,
            worldZ,
            sampleX,
            sampleZ,
            cellWidth,
            cellDepth,
            localCenterX: (worldX - startX) + (cellWidth - 1) * 0.5,
            localCenterZ: (worldZ - startZ) + (cellDepth - 1) * 0.5,
            data,
            foliageType: fType,
        };
    };

    for (let z = 0; z < CHUNK_SIZE; z += macroStep) {
        for (let x = 0; x < CHUNK_SIZE; x += macroStep) {
            const worldX = startX + x;
            const worldZ = startZ + z;
            const cellWidth = Math.min(macroStep, CHUNK_SIZE - x);
            const cellDepth = Math.min(macroStep, CHUNK_SIZE - z);
            const macro = getMacroData(worldX, worldZ, cellWidth, cellDepth);
            const data = macro.data;

            // Foliage Logic (Infinite)
            if (macro.foliageType && macro.foliageType !== 'NONE' && macro.foliageType !== 'GOLD_VEIN') {
                foliageItems.push({
                    x: macro.sampleX,
                    y: data.h * 0.5,
                    z: macro.sampleZ,
                    type: macro.foliageType,
                    marked: data.marked
                });
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
            addFace(
                solid,
                macro.localCenterX,
                topY,
                macro.localCenterZ,
                2,
                color,
                cellWidth * 0.5,
                0.5,
                cellDepth * 0.5
            );

            // Sides (cliff edges)
            [
                [cellWidth, 0, 0],
                [-macroStep, 0, 1],
                [0, cellDepth, 4],
                [0, -macroStep, 5]
            ].forEach(([dx, dz, type]) => {
                const neighbor = getMacroData(
                    worldX + dx,
                    worldZ + dz,
                    cellWidth,
                    cellDepth
                ).data;
                let nTop = (neighbor.h * 0.5) - 0.5;
                if (neighbor.bt === 'POND' || neighbor.bt === 'RESERVOIR') nTop -= 1;
                else if (!neighbor.in && neighbor.h === 0) nTop = -2;

                for (let y = topY; y > nTop; y--) {
                    addFace(
                        solid,
                        macro.localCenterX,
                        y,
                        macro.localCenterZ,
                        type,
                        color,
                        cellWidth * 0.5,
                        0.5,
                        cellDepth * 0.5
                    );
                }
            });

            // Water
            if (isWater) {
                const waterY = data.h === 0 ? 0 : surfaceY;
                addFace(
                    water,
                    macro.localCenterX,
                    waterY,
                    macro.localCenterZ,
                    2,
                    PALETTE['water'],
                    cellWidth * 0.5,
                    0.5,
                    cellDepth * 0.5
                );
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
        queuedAt: job.queuedAt,
        schemaVersion: ENGINE_SCHEMA_VERSION
    };
}

function processPathfind(job: PathfindJob): PathfindResult {
    const path = findPath(job.startX, job.startZ, job.endX, job.endZ, localChunks);
    return {
        jobId: job.id,
        kind: 'PATHFIND',
        success: !!path,
        completedAt: Date.now(),
        queuedAt: job.queuedAt,
        agentId: job.agentId,
        path: path,
        schemaVersion: ENGINE_SCHEMA_VERSION
    };
}
