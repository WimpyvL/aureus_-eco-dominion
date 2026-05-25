/**
 * Foliage Render System
 * Renders trees, rocks, and resources using InstancedMesh.
 * Receives data from TerrainRenderSystem.
 * (|/) Klaasvaakie
 */

import * as THREE from 'three';
import { BuildingFactory } from '../../../engine/render/utils/VoxelGenerators';
import { foliageInstancedMaterial } from '../../../engine/render/materials/VoxelMaterials';
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
    private chunkMeshes: Map<string, Map<string, THREE.InstancedMesh>> = new Map();
    private geometryCache: Map<string, THREE.BufferGeometry> = new Map();
    private readonly dummy = new THREE.Object3D();
    private readonly markedColor = new THREE.Color(1, 0.3, 0.3);
    private readonly defaultColor = new THREE.Color(1, 1, 1);

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    /**
     * Update foliage for a specific chunk
     */
    public updateChunk(key: string, items: FoliageItem[]) {
        this.disposeChunkMeshes(key);

        if (items.length === 0) {
            return;
        }

        const buckets = new Map<string, FoliageItem[]>();
        for (const item of items) {
            const bucket = buckets.get(item.type);
            if (bucket) {
                bucket.push(item);
            } else {
                buckets.set(item.type, [item]);
            }
        }

        const chunkTypeMeshes = new Map<string, THREE.InstancedMesh>();

        for (const [type, bucket] of buckets) {
            const geometry = this.getGeometry(type);
            if (!geometry) {
                continue;
            }

            const mesh = new THREE.InstancedMesh(geometry, foliageInstancedMaterial, bucket.length);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.frustumCulled = true;
            mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            mesh.userData.chunkKey = key;
            mesh.userData.foliageType = type;

            for (let idx = 0; idx < bucket.length; idx++) {
                const item = bucket[idx];

                // Deterministic rotation and scale based on position.
                const rotSeed = Math.abs(item.x * 31 + item.z * 17);
                const rotY = (rotSeed % 4) * (Math.PI / 2);

                const scaleSeed = Math.abs(item.x * 7.11 + item.z * 3.45);
                const scale = 0.85 + (scaleSeed % 10) * 0.03;

                this.dummy.position.set(item.x, item.y, item.z);
                this.dummy.rotation.set(0, rotY, 0);
                this.dummy.scale.setScalar(scale);
                this.dummy.updateMatrix();

                mesh.setMatrixAt(idx, this.dummy.matrix);
                mesh.setColorAt(idx, item.marked ? this.markedColor : this.defaultColor);
            }

            mesh.instanceMatrix.needsUpdate = true;
            if (mesh.instanceColor) {
                mesh.instanceColor.needsUpdate = true;
            }
            mesh.computeBoundingBox();
            mesh.computeBoundingSphere();

            this.scene.add(mesh);
            chunkTypeMeshes.set(type, mesh);
        }

        if (chunkTypeMeshes.size > 0) {
            this.chunkMeshes.set(key, chunkTypeMeshes);
        }
    }

    /**
     * Remove foliage for a chunk (unloaded)
     */
    public removeChunk(key: string) {
        this.disposeChunkMeshes(key);
    }

    public dispose() {
        for (const key of this.chunkMeshes.keys()) {
            this.disposeChunkMeshes(key);
        }
        for (const geometry of this.geometryCache.values()) {
            geometry.dispose();
        }
        this.geometryCache.clear();
    }

    private getGeometry(type: string): THREE.BufferGeometry | null {
        const cached = this.geometryCache.get(type);
        if (cached) {
            return cached;
        }

        if (!BuildingFactory[type]) {
            console.warn(`[FoliageSystem] Unknown foliage type: ${type}`);
            return null;
        }

        const group = BuildingFactory[type]({ seed: 42 });
        const geometry = mergeGroupGeometry(group);
        this.geometryCache.set(type, geometry);
        return geometry;
    }

    private disposeChunkMeshes(key: string) {
        const meshes = this.chunkMeshes.get(key);
        if (!meshes) {
            return;
        }

        for (const mesh of meshes.values()) {
            this.scene.remove(mesh);
            mesh.dispose();
        }

        this.chunkMeshes.delete(key);
    }

    /**
     * Get meshes for raycasting/interaction
     */
    public getInteractables(): THREE.Object3D[] {
        const meshes: THREE.Object3D[] = [];
        for (const chunkMeshes of this.chunkMeshes.values()) {
            meshes.push(...chunkMeshes.values());
        }
        return meshes;
    }
}
