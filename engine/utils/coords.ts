/**
 * Coordinate Utilities
 * Handles mathematically correct wrapping and chunking for unbounded worlds.
 */

export const CHUNK_SIZE = 16;

export interface TileCoord {
    x: number;
    z: number;
}

export interface ChunkCoord {
    cx: number;
    cz: number;
}

export type ChunkKey = string; // format "cx,cz"

/**
 * Mathematically correct floor division for negative numbers.
 * floorDiv(-1, 16) = -1
 */
export function floorDiv(n: number, d: number): number {
    return Math.floor(n / d);
}

/**
 * Mathematically correct modulo for negative numbers.
 * mod(-1, 16) = 15
 */
export function mod(n: number, d: number): number {
    return ((n % d) + d) % d;
}

export function toChunkKey(cx: number, cz: number): ChunkKey {
    return `${cx},${cz}`;
}

export function fromChunkKey(key: ChunkKey): ChunkCoord {
    const [cx, cz] = key.split(',').map(Number);
    return { cx, cz };
}

export function worldToChunk(x: number, z: number, chunkSize: number): ChunkCoord {
    return {
        cx: floorDiv(x, chunkSize),
        cz: floorDiv(z, chunkSize)
    };
}

export function worldToLocal(x: number, z: number, chunkSize: number): { lx: number, lz: number } {
    return {
        lx: mod(x, chunkSize),
        lz: mod(z, chunkSize)
    };
}

export function chunkToWorld(cx: number, cz: number, chunkSize: number): { x: number, z: number } {
    return {
        x: cx * chunkSize,
        z: cz * chunkSize
    };
}
