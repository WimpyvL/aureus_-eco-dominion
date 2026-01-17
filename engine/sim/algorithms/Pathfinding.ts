/**
 * Engine Pathfinding Algorithm (A*)
 */

import { GridTile, BuildingType } from '../../../types';
import { GRID_SIZE } from '../../utils/GameUtils';
import { BinaryHeap } from '../../utils/BinaryHeap';
export { GRID_SIZE };

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
    index: number;
    layer: number;
    f: number;
}

const getDistance3D = (a: number, al: number, b: number, bl: number) => {
    const ax = a % GRID_SIZE, az = Math.floor(a / GRID_SIZE);
    const bx = b % GRID_SIZE, bz = Math.floor(b / GRID_SIZE);
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
 * Returns array of { index, layer } steps
 */
export function findPath3D(
    startIdx: number, startLayer: number,
    endIdx: number, endLayer: number,
    grid: GridTile[]
): { index: number, layer: number }[] | null {
    if (startIdx === endIdx && startLayer === endLayer) return [{ index: endIdx, layer: endLayer }];

    const openSet = new BinaryHeap<PathNode>((a, b) => a.f - b.f);
    openSet.push({ index: startIdx, layer: startLayer, f: getDistance3D(startIdx, startLayer, endIdx, endLayer) });

    const cameFrom = new Map<string, { index: number, layer: number }>();
    const gScore = new Map<string, number>();

    const startKey = `${startIdx},${startLayer}`;
    gScore.set(startKey, 0);

    const visited = new Set<string>();

    let iterations = 0;
    const MAX_ITERATIONS = 5000;

    while (openSet.size > 0) {
        iterations++;
        if (iterations > MAX_ITERATIONS) return null;

        const current = openSet.pop()!;
        const { index: cIdx, layer: cL } = current;
        const currentKey = `${cIdx},${cL}`;

        if (cIdx === endIdx && cL === endLayer) {
            // Reconstruct
            const path = [{ index: cIdx, layer: cL }];
            let currKey = currentKey;
            while (cameFrom.has(currKey)) {
                const prev = cameFrom.get(currKey)!;
                path.unshift(prev);
                currKey = `${prev.index},${prev.layer}`;
            }
            return path.slice(1);
        }

        if (visited.has(currentKey)) continue;
        visited.add(currentKey);

        const cx = cIdx % GRID_SIZE;
        const cz = Math.floor(cIdx / GRID_SIZE);
        const currentTile = grid[cIdx];

        // --- 1. Lateral Neighbors (Same Layer) ---
        for (let dz = -1; dz <= 1; dz++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dz === 0) continue;

                const nx = cx + dx, nz = cz + dz;
                if (nx >= 0 && nx < GRID_SIZE && nz >= 0 && nz < GRID_SIZE) {
                    const nIdx = nz * GRID_SIZE + nx;
                    const nKey = `${nIdx},${cL}`;
                    if (visited.has(nKey)) continue;

                    const neighborTile = grid[nIdx];
                    if (neighborTile.locked) continue;

                    const cost = getTileCostAtLayer(neighborTile, cL);
                    if (cost === Infinity) continue;

                    const tentativeG = (gScore.get(currentKey) ?? Infinity) + cost;
                    if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
                        cameFrom.set(nKey, { index: cIdx, layer: cL });
                        gScore.set(nKey, tentativeG);
                        openSet.push({ index: nIdx, layer: cL, f: tentativeG + getDistance3D(nIdx, cL, endIdx, endLayer) });
                    }
                }
            }
        }

        // --- 2. Vertical Neighbors (Shafts/Entrances) ---
        // Potential layers to check: cL-1 and cL+1
        const layers = [cL - 1, cL + 1];
        for (const nL of layers) {
            if (nL < -10 || nL > 0) continue;

            const nKey = `${cIdx},${nL}`;
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
                    cameFrom.set(nKey, { index: cIdx, layer: cL });
                    gScore.set(nKey, tentativeG);
                    openSet.push({ index: cIdx, layer: nL, f: tentativeG + getDistance3D(cIdx, nL, endIdx, endLayer) });
                }
            }
        }
    }

    return null;
}

/** Legacy wrapper for surface-only pathfinding */
export function findPath(startIdx: number, endIdx: number, grid: GridTile[]): number[] | null {
    const path3d = findPath3D(startIdx, 0, endIdx, 0, grid);
    return path3d ? path3d.map(p => p.index) : null;
}
