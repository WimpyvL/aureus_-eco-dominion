/**
 * Building Render System
 * Handles rendering of buildings, construction sites, and associated animations/particles.
 * Replaces functionality of legacy WorldManager (building component).
 */

import * as THREE from 'three';
import { BuildingType, GridTile, Chunk } from '../../../types';
import { BuildingFactory } from '../../../engine/render/utils/VoxelGenerators';
import { BUILDINGS, COLORS } from '../../../engine/data/VoxelConstants';
import { sharedBoxGeo } from '../../../engine/render/utils/VoxelBuilder';
import { mats } from '../../../engine/render/materials/VoxelMaterials';
import { ChunkStore } from '../../../engine/space/ChunkStore';

interface AnimationDef {
    mesh: THREE.Object3D;
    type: 'ROTOR' | 'SOLAR' | 'SMOKE_EMITTER' | 'NUGGET_POP';
    lastEmit?: number;
    baseRotX?: number;
    velocity?: number;
    groundY?: number;
}

interface Particle {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
    decay: number;
}

export class BuildingRenderSystem {
    private scene: THREE.Scene;

    // State
    private buildingMeshes: Map<number, THREE.Object3D> = new Map();
    private animatedElements: Map<number, AnimationDef[]> = new Map();
    private particles: Particle[] = [];

    // Cursors (Moved from WorldManager)
    private selectionCursor: THREE.Mesh;
    private ghostBuilding: THREE.Group | null = null;
    private ghostType: BuildingType | null = null;
    private pinnedGhostPos: { x: number, z: number } | null = null;
    private currentViewMode: 'SURFACE' | 'FIRST_PERSON' = 'SURFACE';

    // Materials / Geometry Reuse
    private particleGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    private particleMats: Record<string, THREE.Material> = {
        MINERAL: new THREE.MeshBasicMaterial({ color: 0xcbd5e1 }),
        ECO: new THREE.MeshBasicMaterial({ color: 0x10b981 }),
        TRUST: new THREE.MeshBasicMaterial({ color: 0xf43f5e }),
        CASH: new THREE.MeshBasicMaterial({ color: 0xf59e0b }),
        SMOKE: new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.5 }),
        DIRT: new THREE.MeshBasicMaterial({ color: 0x78350f }),
        ROCK: new THREE.MeshBasicMaterial({ color: 0x475569 }),
    };

    // Cache to detect changes
    private tileCache: Map<number, { type: string; progress: number; state: string }> = new Map();

    constructor(scene: THREE.Scene) {
        this.scene = scene;

        // Init Cursor
        this.selectionCursor = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, 0.05, 1.0),
            new THREE.MeshBasicMaterial({ color: 0x22c55e, opacity: 0.5, transparent: true, depthWrite: false })
        );
        this.selectionCursor.visible = false;
        this.scene.add(this.selectionCursor);
    }

    public update(dt: number, time: number, chunks: Record<string, Chunk>, dirtyKeys?: Set<string>, viewMode: 'SURFACE' | 'FIRST_PERSON' = 'SURFACE') {
        this.currentViewMode = viewMode;

        // 1. Sync Grid Changes
        if (dirtyKeys && dirtyKeys.has('chunks')) {
            Object.values(chunks).forEach(chunk => {
                if (!chunk.meshDirty && !chunk.simDirty) return; // Optimization

                chunk.tiles.forEach(tile => {
                    // Quick skip for most tiles
                    if (!tile.buildingType || tile.buildingType === BuildingType.EMPTY) {
                        if (tile.foliage !== 'ILLEGAL_CAMP') {
                            if (this.buildingMeshes.has(tile.id)) {
                                this.removeTile(tile.id);
                            }
                            return;
                        }
                    }

                    const cached = this.tileCache.get(tile.id);
                    const currentProgress = 1 - ((tile.constructionTimeLeft || 0) / (BUILDINGS[tile.buildingType]?.buildTime || 1));

                    // For infrastructure tiles, include connection state in the hash so neighbors trigger updates
                    let connectionHash = '';
                    if (tile.buildingType === BuildingType.ROAD || tile.buildingType === BuildingType.PIPE || tile.buildingType === BuildingType.FENCE || tile.buildingType === BuildingType.POWER_LINE) {
                        const conn = this.getInfrastructureConnections(tile, chunks);
                        connectionHash = `_${conn.north}_${conn.south}_${conn.east}_${conn.west}`;
                    }
                    const stateHash = `${tile.buildingType}_${tile.isUnderConstruction}_${tile.integrity}_${tile.waterStatus}_${tile.powerStatus}_VM:${viewMode}`;

                    // Detect Changes
                    if (!cached || cached.type !== tile.buildingType || Math.abs(cached.progress - currentProgress) > 0.05 || cached.state !== stateHash) {
                        this.updateTile(tile, currentProgress, chunks);
                        this.tileCache.set(tile.id, {
                            type: tile.buildingType,
                            progress: currentProgress,
                            state: stateHash
                        });
                    }
                });

                // Reset flags after processing? (Or let engine handle it)
            });
        }

        // 2. Animate
        this.animate(dt, time);
    }

    private removeTile(tileId: number) {
        if (this.buildingMeshes.has(tileId)) {
            const mesh = this.buildingMeshes.get(tileId)!;
            this.scene.remove(mesh);
            this.buildingMeshes.delete(tileId);
            this.animatedElements.delete(tileId);
            this.tileCache.delete(tileId);
        }
    }

    /**
     * Calculate infrastructure connections by checking neighboring tiles
     */
    private getInfrastructureConnections(tile: GridTile, chunks: Record<string, Chunk>): { north: boolean; south: boolean; east: boolean; west: boolean } {
        const targetType = tile.buildingType;

        // Find neighbors via ChunkStore
        const north = ChunkStore.getTile(chunks, tile.x, tile.z - 1);
        const south = ChunkStore.getTile(chunks, tile.x, tile.z + 1);
        const east = ChunkStore.getTile(chunks, tile.x + 1, tile.z);
        const west = ChunkStore.getTile(chunks, tile.x - 1, tile.z);

        return {
            north: north?.buildingType === targetType,
            south: south?.buildingType === targetType,
            east: east?.buildingType === targetType,
            west: west?.buildingType === targetType
        };
    }

    private updateTile(tile: GridTile, progress: number, chunks: Record<string, Chunk>) {
        // Remove existing
        if (this.buildingMeshes.has(tile.id)) {
            const mesh = this.buildingMeshes.get(tile.id)!;
            this.scene.remove(mesh);
            this.buildingMeshes.delete(tile.id);
            this.animatedElements.delete(tile.id);
        }

        if (tile.buildingType === BuildingType.EMPTY && tile.foliage !== 'ILLEGAL_CAMP') return;

        // Water is handled by TerrainRenderSystem now
        if (tile.buildingType === BuildingType.POND) return;

        // Skip multi-tile tails (infrastructure excluded)
        if (tile.structureHeadX !== undefined && (tile.x !== tile.structureHeadX || tile.z !== tile.structureHeadZ) &&
            !(tile.buildingType === BuildingType.ROAD || tile.buildingType === BuildingType.PIPE || tile.buildingType === BuildingType.FENCE || tile.buildingType === BuildingType.POWER_LINE)) {
            return;
        }

        let type: BuildingType | 'ILLEGAL_CAMP' = tile.buildingType;
        if (type === BuildingType.EMPTY && tile.foliage === 'ILLEGAL_CAMP') type = 'ILLEGAL_CAMP';

        if (!(type in BuildingFactory)) return;

        const root = new THREE.Group();
        const def = BUILDINGS[tile.buildingType];
        const w = def?.width || 1;
        const d = def?.depth || 1;
        const dx = (w - 1) / 2;
        const dz = (d - 1) / 2;

        // Position (Raw world coordinates)
        root.position.set(tile.x + dx, tile.terrainHeight * 0.5, tile.z + dz);

        // Render Main Building
        if (tile.buildingType !== BuildingType.EMPTY) {
            const seed = Math.abs(tile.x * 11 + tile.z * 17 + tile.id * 31);
            const config: any = {
                isUnderConstruction: tile.isUnderConstruction,
                progress: progress,
                integrity: tile.integrity,
                waterStatus: tile.waterStatus,
                powerStatus: tile.powerStatus,
                level: tile.level || 1,
                seed
            };

            let connections = undefined;
            if (tile.buildingType === BuildingType.ROAD || tile.buildingType === BuildingType.PIPE || tile.buildingType === BuildingType.FENCE || tile.buildingType === BuildingType.POWER_LINE) {
                connections = this.getInfrastructureConnections(tile, chunks);
            }

            const buildingGroup = BuildingFactory[type]({ ...config, connections });



            if (tile.isUnderConstruction) {
                const scale = 0.4 + (progress * 0.6);
                buildingGroup.scale.set(scale, scale, scale);
                buildingGroup.position.y -= (1 - progress) * 0.5;

                buildingGroup.traverse((c: any) => {
                    if (c.isMesh) {
                        c.material = new THREE.MeshStandardMaterial({
                            color: 0x00ffff, transparent: true, opacity: 0.6,
                            roughness: 0.2, metalness: 0.8, emissive: 0x00ffff, emissiveIntensity: 0.4
                        });
                    }
                });

                if (BuildingFactory['CONSTRUCTION']) {
                    const scaffold = BuildingFactory['CONSTRUCTION']({ width: w, depth: d });
                    root.add(scaffold);
                }
            }

            // --- Underground Connector Removed ---

            root.add(buildingGroup);
        }



        // Collect Animations
        const anims: AnimationDef[] = [];
        root.traverse((c: any) => {
            if (c.userData.isRotor) anims.push({ mesh: c, type: 'ROTOR' });
            if (c.userData.isSolarPanel) anims.push({ mesh: c, type: 'SOLAR', baseRotX: c.rotation.x });
            if (c.userData.isNugget) anims.push({ mesh: c, type: 'NUGGET_POP', velocity: c.userData.velocity, groundY: c.userData.groundY });
        });

        if (['WASH_PLANT', 'RECYCLING_PLANT', 'ILLEGAL_CAMP'].includes(type)) {
            anims.push({ mesh: root, type: 'SMOKE_EMITTER', lastEmit: Math.random() });
        }

        if (anims.length > 0) this.animatedElements.set(tile.id, anims);

        this.scene.add(root);
        this.buildingMeshes.set(tile.id, root);
    }

    // ... Animation Loop ...
    private animate(dt: number, time: number) {
        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.mesh.position.add(p.velocity);
            p.life -= p.decay;
            (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, p.life);
            p.mesh.scale.multiplyScalar(0.95);
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            }
        }

        // Buildings
        this.animatedElements.forEach((anims, tileId) => anims.forEach(anim => {
            if (anim.type === 'ROTOR') {
                anim.mesh.rotation.z -= 0.15 * (dt * 60); // approx
                anim.mesh.updateMatrix();
            } else if (anim.type === 'SMOKE_EMITTER' && (!anim.lastEmit || time - anim.lastEmit > 0.4)) {
                if (Math.random() > 0.2) this.emitParticle(tileId, 'SMOKE');
                anim.lastEmit = time;
            }
        }));
    }

    private emitParticle(tileId: number, type: string) {
        const mesh = this.buildingMeshes.get(tileId);

        const mat = this.particleMats[type];
        const p = new THREE.Mesh(this.particleGeo, mat);

        if (mesh) {
            p.position.copy(mesh.position);
        } else {
            p.position.set(0, 0, 0); // Temporary fallback, ideally use worldX/Z
        }

        p.position.y += 0.5 + Math.random() * 0.5;
        p.position.x += (Math.random() - 0.5) * 0.5;
        p.position.z += (Math.random() - 0.5) * 0.5;

        this.scene.add(p);
        this.particles.push({
            mesh: p,
            velocity: new THREE.Vector3((Math.random() - 0.5) * 0.08, 0.05 + Math.random() * 0.08, (Math.random() - 0.5) * 0.1),
            life: 1.0,
            decay: 0.03
        });
    }

    public triggerEffect(worldX: number, worldZ: number, type: string, offset: number) {
        // Find or create a temporary tile object or just use coordinates
        // For simplicity, we'll use buildingMeshes lookup if tileId was worldX*1M + worldZ
        const tileId = Math.round(worldX) * 1000000 + Math.round(worldZ);
        if (type === 'DUST') {
            for (let i = 0; i < 5; i++) this.emitParticle(tileId, 'DIRT');
        } else if (type === 'MINING') {
            for (let i = 0; i < 8; i++) this.emitParticle(tileId, Math.random() > 0.5 ? 'ROCK' : 'DIRT');
        } else if (type === 'SMOKE') {
            for (let i = 0; i < 3; i++) this.emitParticle(tileId, 'SMOKE');
        } else if (type === 'ECO_REHAB') {
            for (let i = 0; i < 10; i++) this.emitParticle(tileId, 'GRASS');
        }
    }

    public setPinnedGhost(pos: { x: number, z: number } | null, y: number = 0) {
        this.pinnedGhostPos = pos;
        // If we have a pinned position, position the ghost there
        if (pos !== null && this.ghostBuilding) {
            const def = BUILDINGS[this.ghostType!];
            const w = def?.width || 1;
            const d = def?.depth || 1;
            const dx = (w - 1) / 2;
            const dz = (d - 1) / 2;
            this.ghostBuilding.position.set(pos.x + dx, y, pos.z + dz);
            this.ghostBuilding.visible = true;
        }
    }

    public setGhostBuilding(type: BuildingType | null) {
        if (this.ghostType === type) return;

        // Remove old
        if (this.ghostBuilding) {
            this.scene.remove(this.ghostBuilding);
            this.ghostBuilding = null;
        }

        this.ghostType = type;

        if (type && BuildingFactory[type]) {
            const group = BuildingFactory[type]();
            this.ghostBuilding = new THREE.Group();
            this.ghostBuilding.add(group);

            // Ghost Material
            this.ghostBuilding.traverse((c: any) => {
                if (c.isMesh) {
                    c.material = new THREE.MeshStandardMaterial({
                        color: 0xffffff, transparent: true, opacity: 0.5,
                        emissive: 0x444444
                    });
                    c.castShadow = false;
                    c.receiveShadow = false;
                }
            });

            this.scene.add(this.ghostBuilding);
        }
    }

    public setCursorMode(mode: 'BUILD' | 'BULLDOZE' | 'INSPECT') {
        const mat = this.selectionCursor.material as THREE.MeshBasicMaterial;
        if (mode === 'BULLDOZE') {
            mat.color.setHex(0xf43f5e); // Red
        } else if (mode === 'INSPECT') {
            mat.color.setHex(0x3b82f6); // Blue
        } else {
            mat.color.setHex(0x22c55e); // Green
        }
    }

    public updateCursor(pos: THREE.Vector3 | null, fallbackCenter: THREE.Vector3 | null = null) {
        // 1. Determine effective position for the Ghost Building
        // Priority: Pinned > Cursor > Fallback (Screen Center)
        let ghostPos = null;

        if (this.pinnedGhostPos !== null) {
            if (this.ghostBuilding) this.ghostBuilding.visible = true;
        } else if (pos) {
            ghostPos = pos;
        } else if (fallbackCenter) {
            ghostPos = fallbackCenter;
        }

        // 2. Update Selection Cursor (Only follows actual mouse/touch)
        if (pos) {
            // Snap to grid center
            const cx = Math.floor(pos.x + 0.5);
            const cz = Math.floor(pos.z + 0.5);

            this.selectionCursor.visible = true;
            this.selectionCursor.position.set(cx, pos.y + 0.1, cz);
        } else {
            this.selectionCursor.visible = false;
        }

        // 3. Update Ghost Building Position
        if (this.ghostBuilding && this.pinnedGhostPos === null) {
            if (ghostPos) {
                this.ghostBuilding.visible = true;

                // Snap to grid
                const cx = Math.floor(ghostPos.x + 0.5);
                const cz = Math.floor(ghostPos.z + 0.5);

                // Adjust for size
                const def = BUILDINGS[this.ghostType!];
                const w = def?.width || 1;
                const d = def?.depth || 1;
                const dx = (w - 1) / 2;
                const dz = (d - 1) / 2;

                this.ghostBuilding.position.set(cx + dx, ghostPos.y, cz + dz);
            } else {
                this.ghostBuilding.visible = false;
            }
        }
    }
}
