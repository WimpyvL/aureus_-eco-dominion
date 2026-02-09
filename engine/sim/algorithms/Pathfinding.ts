/**
 * Engine Pathfinding Algorithm (A*)
 */

import { GridTile, BuildingType, Chunk } from '../../../types';
import { ChunkStore } from '../../space/ChunkStore';
import { BinaryHeap } from '../../utils/BinaryHeap';


// Costs for different terrains
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
    layer: number;
    f: number;
}

const getDistance3D = (ax: number, az: number, al: number, bx: number, bz: number, bl: number) => {
    // Chebyshev distance + vertical difference
    return Math.max(Math.abs(ax - bx), Math.abs(az - bz)) + Math.abs(al - bl);
};

const getTileCostAtLayer = (tile: GridTile, layer: number): number => {
    if (layer === 0) {
        if (tile.buildingType === BuildingType.ROAD) return COST.ROAD;
        if (tile.buildingType !== BuildingType.EMPTY && !tile.isUnderConstruction && tile.buildingType !== BuildingType.POND) return 1.0; // Indoors

        switch (tile.biome) {
            case 'SAND': return COST.OBSTACLE;
            case 'SNOW': return COST.OBSTACLE;
            case 'STONE': return COST.ROUGH;
            default: return COST.BASE;
        }
    } else {
        // Underground is always "Rough" stone unless we add paths
        const strata = tile.underground?.[layer];
        if (!strata || !strata.excavated) return Infinity; // impassable
        return COST.ROUGH;
    }
};

/**
 * A* Pathfinding (3D Layer Aware)
 * Returns array of { x, z, layer } steps
 */
export function findPath3D(
    startX: number, startZ: number, startLayer: number,
    endX: number, endZ: number, endLayer: number,
    chunks: Record<string, Chunk>
): { x: number, z: number, layer: number }[] | null {
    if (startX === endX && startZ === endZ && startLayer === endLayer) {
        return [{ x: endX, z: endZ, layer: endLayer }];
    }

    const openSet = new BinaryHeap<PathNode>((a, b) => a.f - b.f);
    openSet.push({ x: startX, z: startZ, layer: startLayer, f: getDistance3D(startX, startZ, startLayer, endX, endZ, endLayer) });

    const cameFrom = new Map<string, { x: number, z: number, layer: number }>();
    const gScore = new Map<string, number>();

    const startKey = `${startX},${startZ},${startLayer}`;
    gScore.set(startKey, 0);

    const visited = new Set<string>();

    let iterations = 0;
    const MAX_ITERATIONS = 5000;

    while (openSet.size > 0) {
        iterations++;
        if (iterations > MAX_ITERATIONS) return null;

        const current = openSet.pop()!;
        const { x: cx, z: cz, layer: cL } = current;
        const currentKey = `${cx},${cz},${cL}`;

        if (cx === endX && cz === endZ && cL === endLayer) {
            // Reconstruct
            const path = [{ x: cx, z: cz, layer: cL }];
            let currKey = currentKey;
            while (cameFrom.has(currKey)) {
                const prev = cameFrom.get(currKey)!;
                path.unshift(prev);
                currKey = `${prev.x},${prev.z},${prev.layer}`;
            }
            return path.slice(1);
        }

        if (visited.has(currentKey)) continue;
        visited.add(currentKey);

        const currentTile = ChunkStore.getTile(chunks, cx, cz);
        if (!currentTile) continue;

        // --- 1. Lateral Neighbors (Same Layer) ---
        for (let dz = -1; dz <= 1; dz++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dz === 0) continue;

                const nx = cx + dx, nz = cz + dz;
                const nKey = `${nx},${nz},${cL}`;
                if (visited.has(nKey)) continue;

                const neighborTile = ChunkStore.getTile(chunks, nx, nz);
                if (!neighborTile || neighborTile.locked) continue;

                const cost = getTileCostAtLayer(neighborTile, cL);
                if (cost === Infinity) continue;

                const tentativeG = (gScore.get(currentKey) ?? Infinity) + cost;
                if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
                    cameFrom.set(nKey, { x: cx, z: cz, layer: cL });
                    gScore.set(nKey, tentativeG);
                    openSet.push({ x: nx, z: nz, layer: cL, f: tentativeG + getDistance3D(nx, nz, cL, endX, endZ, endLayer) });
                }
            }
        }

        // --- 2. Vertical Neighbors (Shafts/Entrances) ---
        // Potential layers to check: cL-1 and cL+1
        const layers = [cL - 1, cL + 1];
        for (const nL of layers) {
            if (nL < -10 || nL > 0) continue;

            const nKey = `${cx},${cz},${nL}`;
            if (visited.has(nKey)) continue;

            // Transition Logic
            let canTransition = false;
            if (cL === 0 && nL === -1) {
                if (currentTile.hasEntrance) canTransition = true;
            } else if (cL === -1 && nL === 0) {
                if (currentTile.hasEntrance) canTransition = true;
            } else {
                // Between -1 and -10
                const strataAbove = currentTile.underground?.[Math.max(cL, nL)];
                const strataBelow = currentTile.underground?.[Math.min(cL, nL)];
                if (strataAbove?.excavated && strataBelow?.excavated) canTransition = true;
            }

            if (canTransition) {
                const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1.0; // Vertical move cost
                if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
                    cameFrom.set(nKey, { x: cx, z: cz, layer: cL });
                    gScore.set(nKey, tentativeG);
                    openSet.push({ x: cx, z: cz, layer: nL, f: tentativeG + getDistance3D(cx, cz, nL, endX, endZ, endLayer) });
                }
            }
        }
    }

    return null;
}

/** Legacy wrapper for surface-only pathfinding */
export function findPath(startX: number, startZ: number, endX: number, endZ: number, chunks: Record<string, Chunk>): { x: number, z: number }[] | null {
    const path3d = findPath3D(startX, startZ, 0, endX, endZ, 0, chunks);
    return path3d ? path3d.map(p => ({ x: p.x, z: p.z })) : null;
}
