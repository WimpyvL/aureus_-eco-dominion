/**
 * Engine Pathfinding Algorithm (A*)
 * Surface-only 2D implementation.
 */

import { GridTile, BuildingType, Chunk } from '../../../types';
import { ChunkStore } from '../../space/ChunkStore';
import { BinaryHeap } from '../../utils/BinaryHeap';
import { CHUNK_SIZE, worldToChunk, worldToLocal } from '../../utils/coords';

// Costs for different terrains
export const COST = {
    ROAD: 0.5,
    BASE: 1.0,
    ROUGH: 1.5,
    OBSTACLE: 2.0
};

// Node wrapper for Heap
interface PathNode {
    x: number;
    z: number;
    f: number;
}

const getDistance2D = (ax: number, az: number, bx: number, bz: number) => {
    // Chebyshev distance for 8-way movement
    return Math.max(Math.abs(ax - bx), Math.abs(az - bz));
};

const getTileCost = (tile: GridTile): number => {
    if (tile.buildingType === BuildingType.ROAD) return COST.ROAD;
    if (tile.buildingType !== BuildingType.EMPTY && !tile.isUnderConstruction && tile.buildingType !== BuildingType.POND) return 1.0; // Indoors

    switch (tile.biome) {
        case 'SAND': return COST.OBSTACLE;
        case 'SNOW': return COST.OBSTACLE;
        case 'STONE': return COST.ROUGH;
        default: return COST.BASE;
    }
};

/**
 * A* Pathfinding (Surface 2D)
 * Returns array of { x, z } steps
 */
export function findPath(
    startX: number, startZ: number,
    endX: number, endZ: number,
    chunks: Record<string, Chunk>
): { x: number, z: number }[] | null {
    if (startX === endX && startZ === endZ) {
        return [{ x: endX, z: endZ }];
    }

    const openSet = new BinaryHeap<PathNode>((a, b) => a.f - b.f);
    openSet.push({ x: startX, z: startZ, f: getDistance2D(startX, startZ, endX, endZ) });

    const cameFrom = new Map<string, { x: number, z: number }>();
    const gScore = new Map<string, number>();

    const startKey = `${startX},${startZ}`;
    gScore.set(startKey, 0);

    const visited = new Set<string>();

    let iterations = 0;
    const MAX_ITERATIONS = 5000;

    while (openSet.size > 0) {
        iterations++;
        if (iterations > MAX_ITERATIONS) return null;

        const current = openSet.pop()!;
        const { x: cx, z: cz } = current;
        const currentKey = `${cx},${cz}`;

        if (cx === endX && cz === endZ) {
            // Reconstruct
            const path = [{ x: cx, z: cz }];
            let currKey = currentKey;
            while (cameFrom.has(currKey)) {
                const prev = cameFrom.get(currKey)!;
                path.unshift(prev);
                currKey = `${prev.x},${prev.z}`;
            }
            return path.slice(1);
        }

        if (visited.has(currentKey)) continue;
        visited.add(currentKey);

        // --- Lateral Neighbors ---
        for (let dz = -1; dz <= 1; dz++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dz === 0) continue;

                const nx = cx + dx, nz = cz + dz;
                const nKey = `${nx},${nz}`;
                if (visited.has(nKey)) continue;

                const { cx: ncx, cz: ncz } = worldToChunk(nx, nz, CHUNK_SIZE);
                const nChunk = chunks[`${ncx},${ncz}`];
                if (!nChunk) continue;

                const { lx, lz } = worldToLocal(nx, nz, CHUNK_SIZE);
                const neighborTile = nChunk.tiles[lx + lz * CHUNK_SIZE];
                if (!neighborTile || neighborTile.locked) continue;

                let cost = getTileCost(neighborTile);

                // Special case: Allow reaching the destination even if it's technically impassable (e.g. for construction)
                if (cost === Infinity) {
                    if (nx === endX && nz === endZ) {
                        cost = COST.OBSTACLE;
                    } else {
                        continue;
                    }
                }

                const tentativeG = (gScore.get(currentKey) ?? Infinity) + cost;
                if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
                    cameFrom.set(nKey, { x: cx, z: cz });
                    gScore.set(nKey, tentativeG);
                    openSet.push({ x: nx, z: nz, f: tentativeG + getDistance2D(nx, nz, endX, endZ) });
                }
            }
        }
    }

    return null;
}
