/**
 * ChunkStore
 * 
 * Manages chunked world storage, retrieval, and generation.
 * Operates on an infinite tile plane using (x, z) coordinates.
 */

import { Chunk, GridTile, BuildingType, BiomeType } from '../../types';
import { floorDiv, mod, toChunkKey, worldToChunk, worldToLocal } from '../utils/coords';
import { getBiomeAt, getFoliageAt } from '../worldgen/Core';
// import { VOXEL_BUFFER_SIZE, getVoxelIndex, VoxelBits, V_ORE_MASK } from '../types/voxels';

export const CHUNK_SIZE = 16;


export class ChunkStore {
    /**
     * Ensures a chunk exists in the provided storage.
     * Generates it if missing.
     */
    public static ensureChunk(chunks: Record<string, Chunk>, cx: number, cz: number, seed: number): Chunk {
        const key = toChunkKey(cx, cz);
        if (chunks[key]) return chunks[key];

        const chunk = this.createChunk(cx, cz, seed);
        chunks[key] = chunk;
        return chunk;
    }

    /**
     * Generates a new chunk deterministically based on coordinates and seed.
     */
    public static createChunk(cx: number, cz: number, seed: number = 0): Chunk {
        const tiles: GridTile[] = [];
        const worldOriginX = cx * CHUNK_SIZE;
        const worldOriginZ = cz * CHUNK_SIZE;

        for (let lz = 0; lz < CHUNK_SIZE; lz++) {
            for (let lx = 0; lx < CHUNK_SIZE; lx++) {
                const worldX = worldOriginX + lx;
                const worldZ = worldOriginZ + lz;

                const { biome, height, detail } = getBiomeAt(worldX, worldZ);
                const isWater = height === 0;
                const foliage = getFoliageAt(worldX, worldZ, biome, height, detail);

                tiles.push({
                    id: worldX * 1000000 + worldZ, // Temporal unique-ish ID
                    x: worldX,
                    z: worldZ,
                    buildingType: isWater ? BuildingType.POND : BuildingType.EMPTY,
                    level: 0,
                    terrainHeight: height,
                    biome: biome as BiomeType,
                    foliage,
                    locked: false,
                    revealed: false,
                    explored: true,
                    markedForHarvest: false
                });
            }
        }

        return {
            cx,
            cz,
            tiles,
            meshDirty: true,
            simDirty: true,
            lastAccessTime: Date.now(),
            version: 1
        };
    }

    /**
     * Resolves a tile at world coordinates (x, z).
     * Optional: creates chunk if missing.
     */
    public static getTile(chunks: Record<string, Chunk>, x: number, z: number): GridTile | null {
        const { cx, cz } = worldToChunk(x, z, CHUNK_SIZE);
        const chunk = chunks[toChunkKey(cx, cz)];
        if (!chunk) return null;

        const { lx, lz } = worldToLocal(x, z, CHUNK_SIZE);
        return chunk.tiles[lz * CHUNK_SIZE + lx];
    }

    /**
     * Marks a chunk as dirty for meshing.
     */
    public static markDirty(chunks: Record<string, Chunk>, x: number, z: number): void {
        const { cx, cz } = worldToChunk(x, z, CHUNK_SIZE);
        const chunk = chunks[toChunkKey(cx, cz)];
        if (chunk) {
            chunk.meshDirty = true;
            chunk.version++;
        }
    }
}
