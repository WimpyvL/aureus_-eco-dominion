/**
 * Hierarchical Pathfinding
 * Divides the grid into macro-clusters to speed up long-distance pathfinding.
 * For a 45x45 grid, we use 15x15 chunks (3x3 super-grid).
 */

import { GridTile, BuildingType, Chunk } from '../../../types';
import { COST, findPath } from './Pathfinding';

import { BinaryHeap } from '../../utils/BinaryHeap';

// Hierarchical pathfinding constants for unbounded world
const CHUNK_SIZE = 15;
// Clusters are dynamic in an unbounded world, we derive them from coordinates.


interface ClusterNode {
    id: number; // cluster index (y * CLUSTERS_W + x)
    cx: number; // cluster x
    cy: number; // cluster y
    passable: boolean;
}

/**
 * Perform a hierarchical path search
 * Returns x/z coordinate pairs.
 */
export function findPathHierarchical(
    startX: number, startZ: number,
    endX: number, endZ: number,
    chunks: Record<string, Chunk>
): { x: number, z: number }[] | null {
    const startCx = Math.floor(startX / CHUNK_SIZE);
    const startCz = Math.floor(startZ / CHUNK_SIZE);

    const endCx = Math.floor(endX / CHUNK_SIZE);
    const endCz = Math.floor(endZ / CHUNK_SIZE);

    if (startCx === endCx && startCz === endCz) {
        // Same cluster, just use local A*
        return findPath(startX, startZ, endX, endZ, chunks);
    }

    // Coarse A* on Clusters
    // Determine cluster connectivities
    const coarsePath = findClusterPath(startCx, startCz, endCx, endCz, chunks);

    if (!coarsePath || coarsePath.length === 0) return null;

    // For now, since the world is unbounded and 45x45 was small,
    // we use the coarse path logic as a connectivity check then run detailed A*.
    // Standard A* with BinaryHeap is sufficient for the current scale.
    return findPath(startX, startZ, endX, endZ, chunks);
}


function findClusterPath(startCx: number, startCz: number, endCx: number, endCz: number, chunks: Record<string, Chunk>): { cx: number, cz: number }[] | null {
    // This would be the A* on the Cluster Graph
    // For now, assume all connected if they exist.
    return [{ cx: startCx, cz: startCz }, { cx: endCx, cz: endCz }];
}


/**
 * Precompute cluster connectivity - logic to be refined for dynamic chunks
 */
export function buildClusterGraph(chunks: Record<string, Chunk>) {
    // Determine which clusters are traversable and connected
}

