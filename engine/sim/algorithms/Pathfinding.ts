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
    f: number;
}

const getDistance = (a: number, b: number) => {
    const ax = a % GRID_SIZE, ay = Math.floor(a / GRID_SIZE);
    const bx = b % GRID_SIZE, by = Math.floor(b / GRID_SIZE);
    // Chebyshev distance (8-way movement)
    return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
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
 * A* Pathfinding (Optimized with BinaryHeap)
 * Returns array of tile indices
 */
export function findPath(startIdx: number, endIdx: number, grid: GridTile[]): number[] | null {
    if (startIdx === endIdx) return [endIdx];

    // Priority Queue (Min-Heap based on f-score)
    const openSet = new BinaryHeap<PathNode>((a, b) => a.f - b.f);
    openSet.push({ index: startIdx, f: getDistance(startIdx, endIdx) });

    const cameFrom = new Map<number, number>();
    const gScore = new Map<number, number>();
    gScore.set(startIdx, 0);

    const visited = new Set<number>();

    let iterations = 0;
    const MAX_ITERATIONS = 5000; // Performance limit

    while (openSet.size > 0) {
        iterations++;
        if (iterations > MAX_ITERATIONS) return null;

        const current = openSet.pop()!;
        const cIdx = current.index;

        // Lazy deletion: if we extracted a node that we've already closed with a better path, skip
        // Actually A* guarantees first expand is best, but with duplicates in heap we might see it again.
        // We can just check if gScore is valid.

        if (cIdx === endIdx) {
            // Reconstruct
            const path = [cIdx];
            let curr = cIdx;
            while (cameFrom.has(curr)) {
                curr = cameFrom.get(curr)!;
                path.unshift(curr);
            }
            return path.slice(1);
        }

        // Optimization: Don't expand if we closed it already
        // (Standard A* doesn't need ClosedSet if monotone heuristic, but duplicates in heap require check if we strictly want to avoid work)
        // With lazy heap, we might pop same node twice.
        // We can use gScore to check validity if we wanted. 
        // But simpler: just add to visited (ClosedSet).
        if (visited.has(cIdx)) continue;
        visited.add(cIdx);

        // Neighbors (8-way)
        const cx = cIdx % GRID_SIZE;
        const cy = Math.floor(cIdx / GRID_SIZE);

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;

                const nx = cx + dx;
                const ny = cy + dy;

                if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                    const neighbor = ny * GRID_SIZE + nx;

                    if (visited.has(neighbor)) continue;

                    const tile = grid[neighbor];

                    // Collision check
                    if (tile.buildingType === BuildingType.POND) continue;
                    if (tile.locked) continue;

                    const moveCost = getTileCost(tile);
                    // Diagonal movement cost slightly higher? (Euclidean approx: 1.414). 
                    // Current logic uses Chebyshev, so diagonals are cost 1 (+ terrain).
                    // If we want consistent movement, diagonals should perhaps cost more.
                    // But sticking to existing logic:
                    const tentativeG = (gScore.get(cIdx) ?? Infinity) + moveCost;

                    if (tentativeG < (gScore.get(neighbor) ?? Infinity)) {
                        cameFrom.set(neighbor, cIdx);
                        gScore.set(neighbor, tentativeG);
                        const f = tentativeG + getDistance(neighbor, endIdx);

                        // Push to heap (even if already there, this new one is better and will pop first)
                        openSet.push({ index: neighbor, f });
                    }
                }
            }
        }
    }

    return null;
}
