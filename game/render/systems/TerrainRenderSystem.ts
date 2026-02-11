/**
 * Terrain Render System
 * Manages terrain chunk lifecycle, meshing, and rendering.
 * Uses a simple 2D chunk grid matching the game's heightmap-based terrain.
 */

import * as THREE from 'three';
import { JobSystem, MeshChunkResult, MeshChunkJob, ENGINE_SCHEMA_VERSION, createJob } from '../../../engine/jobs';
import { GridTile } from '../../../types';
import { matMaster, mats } from '../../../engine/render/materials/VoxelMaterials';
import { CHUNK_SIZE, worldToChunk, toChunkKey } from '../../../engine/utils/coords';

interface ChunkRenderData {
    mesh: THREE.Mesh | null;
    waterMesh: THREE.Mesh | null;
    ghostMesh: THREE.Mesh | null;
    dirty: boolean;
    loading: boolean;
}

export class TerrainRenderSystem {
    private scene: THREE.Scene;
    private jobSystem: JobSystem;

    private chunks: Map<string, ChunkRenderData & { lod: number }> = new Map();
    private tileCache: Map<string, GridTile[]> = new Map();
    private viewMode: 'SURFACE' | 'FIRST_PERSON' = 'SURFACE';

    // View radius in chunks (Reduced for optimization)
    private viewRadius = 5;

    // Track last camera chunk to avoid redundant updates
    private lastCameraCx = -999;
    private lastCameraCz = -999;
    private lastFrustumCheck = 0;

    // Callbacks for foliage system
    public onFoliageUpdate?: (key: string, items: any[]) => void;
    public onChunkDispose?: (key: string) => void;

    constructor(scene: THREE.Scene, jobSystem: JobSystem) {
        this.scene = scene;
        this.jobSystem = jobSystem;
    }

    public setViewMode(mode: 'SURFACE' | 'FIRST_PERSON'): void {
        if (this.viewMode === mode) return;
        this.viewMode = mode;
        // Invalidate all chunks to force rebuild with new view mode
        for (const chunk of this.chunks.values()) {
            chunk.dirty = true;
        }
    }

    /**
     * Forces a complete reload of all chunks
     */
    public forceReload(): void {
        this.dispose();
        this.lastCameraCx = -999;
        this.lastCameraCz = -999;
    }

    /**
     * Called every visual frame with the camera focus position (world coords)
     */
    update(cameraFocus: THREE.Vector3, camera?: THREE.Camera): void {
        // Convert world position to grid position, then to chunk coordinates
        // World (0,0) = center of grid. Grid tile (64,64) for 128x128.
        const cameraCx = Math.floor(cameraFocus.x / CHUNK_SIZE);
        const cameraCz = Math.floor(cameraFocus.z / CHUNK_SIZE);


        const now = Date.now();
        // Only recalculate if camera moved or periodically (every 200ms) for frustum updates
        if (cameraCx === this.lastCameraCx && cameraCz === this.lastCameraCz && (now - this.lastFrustumCheck < 200)) {
            // return; // Skip for now, need strict updates
        }

        this.lastCameraCx = cameraCx;
        this.lastCameraCz = cameraCz;
        this.lastFrustumCheck = now;

        // Calculate which chunks should be visible (infinite world - no bounds limit)
        const visibleChunks = new Set<string>();

        // Setup Frustum
        const frustum = new THREE.Frustum();
        if (camera) {
            const matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
            frustum.setFromProjectionMatrix(matrix);
        }

        // Reuse box for checks
        const box = new THREE.Box3();

        for (let dx = -this.viewRadius; dx <= this.viewRadius; dx++) {
            for (let dz = -this.viewRadius; dz <= this.viewRadius; dz++) {
                const cx = cameraCx + dx;
                const cz = cameraCz + dz;

                // Frustum Check
                if (camera) {
                    const xPos = cx * CHUNK_SIZE;
                    const zPos = cz * CHUNK_SIZE;

                    // Define chunk bounds
                    box.min.set(xPos, -10, zPos);
                    box.max.set(xPos + CHUNK_SIZE, 80, zPos + CHUNK_SIZE);

                    if (!frustum.intersectsBox(box)) {
                        continue; // Skip off-screen chunks
                    }
                }

                const key = toChunkKey(cx, cz);
                visibleChunks.add(key);

                const dist = Math.max(Math.abs(dx), Math.abs(dz));
                // Simplified LOD: only LOD 1 for now to prevent thrashing
                // Future: add proper LOD hysteresis
                const lod = 1;

                // Load chunk if not already present
                if (!this.chunks.has(key)) {
                    this.chunks.set(key, { mesh: null, waterMesh: null, ghostMesh: null, dirty: true, loading: false, lod });
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
            } else {
                console.error(`[TerrainRenderSystem] Chunk build failed for ${res.chunkId}:`, res.error);
                const chunk = this.chunks.get(res.chunkId);
                if (chunk) {
                    chunk.loading = false;
                    // chunk.dirty = true; // Retry? Or leave broken?
                }
            }
        }
    }

    /**
     * Sync grid state from game state (now accepts all tiles or chunks)
     */
    public syncGrid(tiles: GridTile[]): void {
        this.tileCache.clear();
        const affected = new Set<string>();

        for (const tile of tiles) {
            const { cx, cz } = worldToChunk(tile.x, tile.z, CHUNK_SIZE);
            const key = toChunkKey(cx, cz);

            if (!this.tileCache.has(key)) {
                this.tileCache.set(key, []);
            }
            this.tileCache.get(key)!.push(tile);
            affected.add(key);
        }

        // Mark affected chunks dirty
        for (const key of affected) {
            const chunk = this.chunks.get(key);
            if (chunk) {
                chunk.dirty = true;
            }
        }

        this.lastCameraCx = -999;
        this.lastCameraCz = -999;
    }

    /**
     * Handle partial tile updates
     */
    public updateTiles(updates: GridTile[]): void {
        const affected = new Set<string>();

        for (const tile of updates) {
            const { cx, cz } = worldToChunk(tile.x, tile.z, CHUNK_SIZE);
            const key = toChunkKey(cx, cz);

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

    /**
     * Implements targeted chunk update from Effect
     */
    public updateChunk(cx: number, cz: number, updates: GridTile[]): void {
        const key = toChunkKey(cx, cz);
        this.tileCache.set(key, updates);

        const chunk = this.chunks.get(key);
        if (chunk) {
            chunk.dirty = true;
        }
    }

    private requestChunkBuild(cx: number, cz: number, lod: number = 1): void {
        const key = toChunkKey(cx, cz);
        const tiles = this.tileCache.get(key) || [];

        const job = createJob<MeshChunkJob>('MESH_CHUNK', {
            priority: 10,
            payload: {
                chunkId: key,
                cx,
                cz,
                tiles,
                viewMode: 'SURFACE',
                lod
            }
        });

        console.log(`[TerrainRenderSystem] Requesting build for ${key} (View: ${this.viewMode})`);

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
        if (chunk.ghostMesh) {
            this.scene.remove(chunk.ghostMesh);
            chunk.ghostMesh.geometry.dispose();
        }

        // Calculate world position for chunk
        const xPos = res.cx * CHUNK_SIZE;
        const zPos = res.cz * CHUNK_SIZE;

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
        } else {
            console.warn(`[TerrainRenderSystem] Mesh IS NULL for ${res.chunkId}`);
        }

        chunk.waterMesh = createMesh(res.water, mats.reservoirWater, false);
        if (chunk.waterMesh) {
            chunk.waterMesh.receiveShadow = false;
            this.scene.add(chunk.waterMesh);
        }

        chunk.ghostMesh = createMesh(res.ghost, mats.ghost, false);
        if (chunk.ghostMesh) {
            chunk.ghostMesh.receiveShadow = false;
            this.scene.add(chunk.ghostMesh);
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
        if (chunk.ghostMesh) {
            this.scene.remove(chunk.ghostMesh);
            chunk.ghostMesh.geometry.dispose();
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
