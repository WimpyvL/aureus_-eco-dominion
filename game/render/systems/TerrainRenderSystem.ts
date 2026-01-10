/**
 * Terrain Render System
 * Manages terrain chunk lifecycle, meshing, and rendering.
 * Uses a simple 2D chunk grid matching the game's heightmap-based terrain.
 */

import * as THREE from 'three';
import { JobSystem, MeshChunkResult, MeshChunkJob } from '../../../engine/jobs';
import { GridTile } from '../../../types';
import { matMaster, mats } from '../../../engine/render/materials/VoxelMaterials';
import { CHUNK_SIZE, getChunkId, getChunkKey } from '../../../engine/utils/ChunkUtils';

interface ChunkRenderData {
    mesh: THREE.Mesh | null;
    waterMesh: THREE.Mesh | null;
    dirty: boolean;
    loading: boolean;
}

export class TerrainRenderSystem {
    private scene: THREE.Scene;
    private gridSize: number;
    private jobSystem: JobSystem;

    private chunks: Map<string, ChunkRenderData & { lod: number }> = new Map();
    private tileCache: Map<string, GridTile[]> = new Map();

    // View radius in chunks
    private viewRadius = 6;

    // Track last camera chunk to avoid redundant updates
    private lastCameraCx = -999;
    private lastCameraCz = -999;

    // Callbacks for foliage system
    public onFoliageUpdate?: (key: string, items: any[]) => void;
    public onChunkDispose?: (key: string) => void;

    constructor(scene: THREE.Scene, gridSize: number, jobSystem: JobSystem) {
        this.scene = scene;
        this.gridSize = gridSize;
        this.jobSystem = jobSystem;
    }

    /**
     * Called every visual frame with the camera focus position (world coords)
     */
    update(cameraFocus: THREE.Vector3): void {
        // Convert world position to grid position, then to chunk coordinates
        // World (0,0) = center of grid. Grid tile (64,64) for 128x128.
        const offset = (this.gridSize - 1) / 2;
        const gridX = cameraFocus.x + offset;
        const gridZ = cameraFocus.z + offset;

        const cameraCx = Math.floor(gridX / CHUNK_SIZE);
        const cameraCz = Math.floor(gridZ / CHUNK_SIZE);

        // Only recalculate if camera moved to different chunk
        if (cameraCx === this.lastCameraCx && cameraCz === this.lastCameraCz) {
            return; // No change, skip expensive iteration
        }
        this.lastCameraCx = cameraCx;
        this.lastCameraCz = cameraCz;

        // Calculate which chunks should be visible (infinite world - no bounds limit)
        const visibleChunks = new Set<string>();

        for (let dx = -this.viewRadius; dx <= this.viewRadius; dx++) {
            for (let dz = -this.viewRadius; dz <= this.viewRadius; dz++) {
                const cx = cameraCx + dx;
                const cz = cameraCz + dz;

                const key = getChunkKey(cx, cz);
                visibleChunks.add(key);

                const dist = Math.max(Math.abs(dx), Math.abs(dz));
                // Simplified LOD: only LOD 1 for now to prevent thrashing
                // Future: add proper LOD hysteresis
                const lod = 1;

                // Load chunk if not already present
                if (!this.chunks.has(key)) {
                    this.chunks.set(key, { mesh: null, waterMesh: null, dirty: true, loading: false, lod });
                }

                const chunk = this.chunks.get(key)!;
                // Only rebuild if dirty AND not already loading
                if (chunk.dirty && !chunk.loading) {
                    this.requestChunkBuild(cx, cz, lod);
                }
            }
        }

        // Unload chunks that are no longer visible
        for (const [key, chunk] of this.chunks) {
            if (!visibleChunks.has(key)) {
                this.disposeChunk(key, chunk);
                this.chunks.delete(key);
            }
        }
    }

    /**
     * Process completed mesh jobs from worker
     */
    public processResults(results: MeshChunkResult[]): void {
        for (const res of results) {
            if (res.success) {
                this.applyChunkUpdate(res);
            }
        }
    }

    /**
     * Sync grid state from game state
     */
    public syncGrid(grid: GridTile[]): void {
        const newCache = new Map<string, GridTile[]>();

        for (const tile of grid) {
            const { x: cx, z: cz } = getChunkId(tile.id);
            const key = getChunkKey(cx, cz);

            if (!newCache.has(key)) {
                newCache.set(key, []);
            }
            newCache.get(key)!.push(tile);
        }

        // Update tile cache and mark affected chunks dirty
        for (const [key, tiles] of newCache) {
            this.tileCache.set(key, tiles);
            const chunk = this.chunks.get(key);
            if (chunk) {
                chunk.dirty = true;
            }
        }

        // Force rebuild of all loaded chunks
        this.lastCameraCx = -999;
        this.lastCameraCz = -999;
    }

    /**
     * Handle partial tile updates
     */
    public updateTiles(updates: GridTile[]): void {
        const affected = new Set<string>();

        for (const tile of updates) {
            const { x: cx, z: cz } = getChunkId(tile.id);
            const key = getChunkKey(cx, cz);

            let chunkTiles = this.tileCache.get(key);
            if (!chunkTiles) {
                chunkTiles = [];
                this.tileCache.set(key, chunkTiles);
            }

            const existingIdx = chunkTiles.findIndex(t => t.id === tile.id);
            if (existingIdx !== -1) {
                chunkTiles[existingIdx] = tile;
            } else {
                chunkTiles.push(tile);
            }

            affected.add(key);
        }

        // Mark affected chunks as dirty
        for (const key of affected) {
            const chunk = this.chunks.get(key);
            if (chunk) {
                chunk.dirty = true;
            }
        }
    }

    private requestChunkBuild(cx: number, cz: number, lod: number = 1): void {
        const key = getChunkKey(cx, cz);
        const tiles = this.tileCache.get(key) || [];

        const job: MeshChunkJob = {
            id: `mesh_${key}_${Date.now()}`,
            kind: 'MESH_CHUNK',
            priority: 10,
            queuedAt: Date.now(),
            payload: {
                chunkId: key,
                cx,
                cz,
                tiles,
                gridSize: this.gridSize,
                lod
            }
        };

        this.jobSystem.enqueue(job);

        const chunk = this.chunks.get(key);
        if (chunk) {
            chunk.loading = true;
            chunk.dirty = false;
        }
    }

    private applyChunkUpdate(res: MeshChunkResult): void {
        const chunk = this.chunks.get(res.chunkId);
        if (!chunk) return; // Chunk was unloaded while building

        chunk.loading = false;

        // Dispose old meshes
        if (chunk.mesh) {
            this.scene.remove(chunk.mesh);
            chunk.mesh.geometry.dispose();
        }
        if (chunk.waterMesh) {
            this.scene.remove(chunk.waterMesh);
            chunk.waterMesh.geometry.dispose();
        }

        // Calculate world position for chunk
        const offset = (this.gridSize - 1) / 2;
        const xPos = (res.cx * CHUNK_SIZE) - offset;
        const zPos = (res.cz * CHUNK_SIZE) - offset;

        // Helper to create mesh from buffer data
        const createMesh = (data: any, mat: THREE.Material, castShadow: boolean): THREE.Mesh | null => {
            if (!data || !data.p || data.p.length === 0) return null;

            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(data.p, 3));
            geo.setAttribute('normal', new THREE.BufferAttribute(data.n, 3));
            geo.setAttribute('color', new THREE.BufferAttribute(data.c, 3));
            geo.setAttribute('uv', new THREE.BufferAttribute(data.u, 2));
            geo.computeBoundingSphere();
            geo.computeBoundingBox();

            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(xPos, 0, zPos);
            mesh.castShadow = castShadow;
            mesh.receiveShadow = true;
            mesh.frustumCulled = true;
            return mesh;
        };

        chunk.mesh = createMesh(res.solid, matMaster, true);
        if (chunk.mesh) {
            this.scene.add(chunk.mesh);
        }

        chunk.waterMesh = createMesh(res.water, mats.reservoirWater, false);
        if (chunk.waterMesh) {
            chunk.waterMesh.receiveShadow = false;
            this.scene.add(chunk.waterMesh);
        }

        // Foliage callback
        if (this.onFoliageUpdate && res.foliage) {
            this.onFoliageUpdate(res.chunkId, res.foliage);
        }
    }

    private disposeChunk(key: string, chunk: ChunkRenderData): void {
        if (chunk.mesh) {
            this.scene.remove(chunk.mesh);
            chunk.mesh.geometry.dispose();
        }
        if (chunk.waterMesh) {
            this.scene.remove(chunk.waterMesh);
            chunk.waterMesh.geometry.dispose();
        }
        if (this.onChunkDispose) {
            this.onChunkDispose(key);
        }
    }

    public dispose(): void {
        for (const [key, chunk] of this.chunks) {
            this.disposeChunk(key, chunk);
        }
        this.chunks.clear();
        this.tileCache.clear();
    }
}
