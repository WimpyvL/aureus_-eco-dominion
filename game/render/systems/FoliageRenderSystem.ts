/**
 * Foliage Render System
 * Renders trees, rocks, and resources using InstancedMesh.
 * Receives data from TerrainRenderSystem.
 */

import * as THREE from 'three';
import { BuildingFactory } from '../../../engine/render/utils/VoxelGenerators';
import { matMaster } from '../../../engine/render/materials/VoxelMaterials';
import { mergeGroupGeometry } from '../../../engine/render/utils/VoxelUtils';

export interface FoliageItem {
    x: number;
    y: number;
    z: number;
    type: string;
    marked?: boolean;
}

export class FoliageRenderSystem {
    private scene: THREE.Scene;
    private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map();

    // Data Source: Chunk ID -> List of Items
    private chunkFoliage: Map<string, FoliageItem[]> = new Map();

    private isDirty = false;
    private rafId = 0;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    /**
     * Update foliage for a specific chunk
     */
    public updateChunk(key: string, items: FoliageItem[]) {
        this.chunkFoliage.set(key, items);
        this.requestRebuild();
    }

    /**
     * Remove foliage for a chunk (unloaded)
     */
    public removeChunk(key: string) {
        if (this.chunkFoliage.delete(key)) {
            this.requestRebuild();
        }
    }

    public dispose() {
        cancelAnimationFrame(this.rafId);
        this.instancedMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.dispose();
        });
        this.instancedMeshes.clear();
        this.chunkFoliage.clear();
    }

    private requestRebuild() {
        if (!this.isDirty) {
            this.isDirty = true;
            // Debounce to avoid rebuilding multiple times per frame if multiple chunks load
            this.rafId = requestAnimationFrame(this.rebuild.bind(this));
        }
    }

    private rebuild() {
        this.isDirty = false;

        // 1. Bucket by Type
        const buckets: Record<string, FoliageItem[]> = {};
        let totalItems = 0;

        for (const items of this.chunkFoliage.values()) {
            for (const item of items) {
                if (!buckets[item.type]) buckets[item.type] = [];
                buckets[item.type].push(item);
                totalItems++;
            }
        }

        // 2. Sync Meshes
        const activeKeys = new Set<string>();
        const dummy = new THREE.Object3D();

        Object.entries(buckets).forEach(([type, items]) => {
            activeKeys.add(type);

            let mesh = this.instancedMeshes.get(type);
            const count = items.length;

            // Create or Resize Mesh
            if (!mesh || mesh.count < count) {
                if (mesh) {
                    this.scene.remove(mesh);
                    mesh.dispose();
                }

                if (!BuildingFactory[type]) {
                    console.warn(`[FoliageSystem] Unknown foliage type: ${type}`);
                    return;
                }

                const group = BuildingFactory[type]();
                const geometry = mergeGroupGeometry(group);

                // Allocate with some buffer to avoid frequent re-alloc
                const capacity = Math.ceil(count * 1.5);
                mesh = new THREE.InstancedMesh(geometry, matMaster, capacity);

                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.frustumCulled = false; // CRITICAL: This is a global pool across all chunks
                // Allow updates
                mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

                this.scene.add(mesh);
                this.instancedMeshes.set(type, mesh);
            }

            // Update Instances
            let idx = 0;
            items.forEach((item) => {
                // Deterministic rotation based on position
                const seed = Math.abs(item.x * 31 + item.z * 17);
                const rotY = (seed % 4) * (Math.PI / 2);

                // Position is absolute world coordinate from worker
                dummy.position.set(item.x, item.y, item.z);
                dummy.rotation.set(0, rotY, 0);
                dummy.scale.setScalar(1.0);
                dummy.updateMatrix();

                mesh!.setMatrixAt(idx, dummy.matrix);

                // Tint if marked for harvest
                if (item.marked) {
                    mesh!.setColorAt(idx, new THREE.Color(1, 0.3, 0.3)); // Red tint
                } else {
                    mesh!.setColorAt(idx, new THREE.Color(1, 1, 1)); // White (Normal)
                }

                idx++;
            });

            mesh.count = count;
            mesh.instanceMatrix.needsUpdate = true;
            if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        });

        // 3. Cleanup Unused
        for (const [type, mesh] of this.instancedMeshes) {
            if (!activeKeys.has(type)) {
                this.scene.remove(mesh);
                mesh.dispose();
                this.instancedMeshes.delete(type);
            }
        }
    }

    /**
     * Get meshes for raycasting/interaction
     */
    public getInteractables(): THREE.Object3D[] {
        return Array.from(this.instancedMeshes.values());
    }
}
