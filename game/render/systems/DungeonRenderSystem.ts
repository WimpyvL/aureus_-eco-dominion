
import * as THREE from 'three';
import { DungeonState } from '../../../engine/dungeon/DungeonTypes';
import { DungeonEngine } from '../../../engine/dungeon/DungeonEngine';
import { createDungeonHeart } from '../models/DungeonModels';
import { createAgentByRole } from '../../../engine/data/voxels/Agent';

export class DungeonRenderSystem {
    private scene: THREE.Scene;
    private root: THREE.Group;
    private meshes: Map<number, THREE.InstancedMesh> = new Map();
    private minerGroup: THREE.Group;
    private minerMeshes: Map<string, { group: THREE.Group, bar: THREE.Mesh, parts: any }> = new Map();
    private heartMesh: THREE.Group | null = null;

    // Geometry and Materials
    private boxGeometry: THREE.BoxGeometry;
    private materials: Map<number, THREE.Material>;
    private dungeonTexture: THREE.CanvasTexture | null = null;
    private wallNormalMap: THREE.CanvasTexture | null = null;

    // State tracking
    private lastVoxelDataVersion: number = -1;
    private engine: DungeonEngine | null = null;

    // Miner config
    private MINER_CONFIGS = {
        driller: { speed: 0.15, miningSpeed: 0.1, color: 0xffaa00, scale: 0.3 },
        excavator: { speed: 0.1, miningSpeed: 0.2, color: 0xcc4400, scale: 0.4 },
        foreman: { speed: 0.2, miningSpeed: 0.05, color: 0x00ccff, scale: 0.35 }
    };

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.root = new THREE.Group();
        this.root.name = 'dungeon-root';
        this.root.visible = false; // Hidden by default, toggled by World
        this.scene.add(this.root);

        this.minerGroup = new THREE.Group();
        this.root.add(this.minerGroup);

        this.boxGeometry = new THREE.BoxGeometry(1, 1, 1);

        // Generate textures for the dungeon
        this.generateDungeonTextures();

        // Add lights to the dungeon root
        const ambient = new THREE.AmbientLight(0xffffff, 0.8);
        ambient.layers.enable(1); // Light up layer 1
        this.root.add(ambient);

        const directional = new THREE.DirectionalLight(0xffffff, 1.0);
        directional.position.set(10, 50, 10);
        directional.layers.enable(1); // Light up layer 1
        this.root.add(directional);

        // Initialize materials (lazy or now)
        this.materials = new Map();
        this.initMaterials();
    }

    private generateDungeonTextures() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        // Base color / Diffuse
        ctx.fillStyle = '#666666';
        ctx.fillRect(0, 0, size, size);

        // Add noise/grit
        for (let i = 0; i < 50000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const val = Math.random() * 50;
            ctx.fillStyle = `rgba(${val},${val},${val},0.15)`;
            ctx.fillRect(x, y, 2, 2);
        }

        // Add "cracks"
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * size, Math.random() * size);
            ctx.lineTo(Math.random() * size, Math.random() * size);
            ctx.stroke();
        }

        this.dungeonTexture = new THREE.CanvasTexture(canvas);
        this.dungeonTexture.wrapS = THREE.RepeatWrapping;
        this.dungeonTexture.wrapT = THREE.RepeatWrapping;
        this.dungeonTexture.magFilter = THREE.NearestFilter;
        this.dungeonTexture.minFilter = THREE.NearestFilter;
        this.dungeonTexture.needsUpdate = true;

        // Normal Map (rough approximation)
        const nCanvas = document.createElement('canvas');
        nCanvas.width = size;
        nCanvas.height = size;
        const nCtx = nCanvas.getContext('2d')!;
        nCtx.fillStyle = '#8080ff'; // Flat normal
        nCtx.fillRect(0, 0, size, size);

        // Add some noise to normal
        for (let i = 0; i < 20000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = 127 + (Math.random() - 0.5) * 30;
            const g = 127 + (Math.random() - 0.5) * 30;
            nCtx.fillStyle = `rgb(${r},${g},255)`;
            nCtx.fillRect(x, y, 1, 1);
        }
        this.wallNormalMap = new THREE.CanvasTexture(nCanvas);
        this.wallNormalMap.magFilter = THREE.NearestFilter;
        this.wallNormalMap.minFilter = THREE.NearestFilter;
        this.wallNormalMap.needsUpdate = true;

        // Add HemisphereLight for better ambient ambiance
        const hemi = new THREE.HemisphereLight(0xaaaaaa, 0x444444, 0.6);
        hemi.layers.enable(1);
        this.root.add(hemi);
    }

    private initMaterials() {
        const createMat = (color: number, emissive?: number, useTexture = true) =>
            new THREE.MeshStandardMaterial({
                color,
                map: useTexture ? this.dungeonTexture : null,
                normalMap: useTexture ? this.wallNormalMap : null,
                emissive: emissive || 0x000000,
                emissiveIntensity: emissive ? 0.8 : 0,
                roughness: 0.9,
                metalness: 0.1
            });

        // Mapping based on VoxelEngine types (DungeonEngine.BLOCK)
        this.materials.set(DungeonEngine.BLOCK.DIRT, createMat(0x4a3728));
        this.materials.set(DungeonEngine.BLOCK.STONE, createMat(0x555555));
        this.materials.set(DungeonEngine.BLOCK.GOLD, createMat(0x665500, 0xFFD700));
        this.materials.set(DungeonEngine.BLOCK.GEMS, createMat(0x550055, 0xFF00FF));
        this.materials.set(DungeonEngine.BLOCK.MANA, createMat(0x005555, 0x00FFFF));
        this.materials.set(DungeonEngine.BLOCK.HEART, createMat(0x440000, 0xAA0000));
        this.materials.set(DungeonEngine.BLOCK.SUPPORT, createMat(0x333333, 0x000000, false));
        this.materials.set(DungeonEngine.BLOCK.RECHARGER, createMat(0x111122, 0x0055FF));
    }

    setVisible(visible: boolean) {
        this.root.visible = visible;
    }

    public getMeshGroup(): THREE.Group {
        return this.root;
    }

    update(state: DungeonState) {
        if (!this.root.visible) return; // Optimization: don't update if not visible? Or update meshes but no draw?
        // Actually, we should update if state changed, so when we toggle visibility it's ready.

        if (!state.unlocked) return;

        // 1. Sync Engine
        const needsEngineSync = !this.engine || this.engine.getState() !== state;
        if (needsEngineSync) {
            this.engine = new DungeonEngine(state);
        }

        const voxelRenderVersion = this.engine.getRenderVersion();
        if (needsEngineSync || voxelRenderVersion !== this.lastVoxelDataVersion) {
            this.rebuildMesh(state);
            this.lastVoxelDataVersion = voxelRenderVersion;
        }

        // 2. Update Miners
        this.updateMiners(state);

        // 3. Update Heart
        this.updateHeart(state);
    }

    private updateHeart(state: DungeonState) {
        if (!this.heartMesh) {
            this.heartMesh = createDungeonHeart();
            this.setLayerRecursive(this.heartMesh, 1);
            this.root.add(this.heartMesh);
        }

        const midX = Math.floor(state.gridSize.x / 2);
        const midZ = Math.floor(state.gridSize.z / 2);
        this.heartMesh.position.set(midX, 1, midZ);

        // Animation
        const core = this.heartMesh.getObjectByName('core');
        if (core) {
            core.rotation.y += 0.01;
            core.position.y = 0.5 + Math.sin(Date.now() * 0.002) * 0.1;
        }
        const r1 = this.heartMesh.getObjectByName('ring1');
        if (r1) r1.rotation.y += 0.02;
        const r2 = this.heartMesh.getObjectByName('ring2');
        if (r2) r2.rotation.x += 0.015;
    }

    private rebuildMesh(state: DungeonState) {
        if (!this.engine) return;

        // Count instances
        const counts = new Map<number, number>();
        const { x: sx, y: sy, z: sz } = state.gridSize;

        // First Pass: Count
        for (let x = 0; x < sx; x++) {
            for (let y = 0; y < sy; y++) {
                for (let z = 0; z < sz; z++) {
                    if (this.engine.shouldRender(x, y, z)) {
                        const type = this.engine.getBlockId(x, y, z);
                        if (type === DungeonEngine.BLOCK.HEART) continue; // Heart is a separate model
                        counts.set(type, (counts.get(type) || 0) + 1);
                    }
                }
            }
        }

        // Resize/Create InteancsedMeshes
        counts.forEach((count, type) => {
            let mesh = this.meshes.get(type);
            if (!this.materials.get(type)) return;

            if (!mesh || mesh.count !== count) {
                if (mesh) {
                    this.root.remove(mesh);
                    mesh.dispose();
                }
                const geometry = this.boxGeometry; // Shared geometry
                const material = this.materials.get(type)!;
                mesh = new THREE.InstancedMesh(geometry, material, count);
                mesh.layers.set(1); // Dungeon Layer
                mesh.receiveShadow = true;
                mesh.castShadow = true;
                this.meshes.set(type, mesh);
                this.root.add(mesh);
            }
            // Reset index for filling
            mesh['userData'].idx = 0;
        });

        // Remove unused meshes
        for (const [type, mesh] of this.meshes) {
            if (!counts.has(type)) {
                this.root.remove(mesh);
                mesh.dispose();
                this.meshes.delete(type);
            }
        }

        // Second Pass: Fill
        const dummy = new THREE.Object3D();
        for (let x = 0; x < sx; x++) {
            for (let y = 0; y < sy; y++) {
                for (let z = 0; z < sz; z++) {
                    if (this.engine.shouldRender(x, y, z)) {
                        const type = this.engine.getBlockId(x, y, z);
                        if (type === DungeonEngine.BLOCK.HEART) continue;
                        const mesh = this.meshes.get(type);
                        if (mesh) {
                            const idx = mesh['userData'].idx;
                            dummy.position.set(x, y, z);
                            dummy.updateMatrix();
                            mesh.setMatrixAt(idx, dummy.matrix);
                            mesh['userData'].idx++;
                        }
                    }
                }
            }
        }

        this.meshes.forEach(mesh => {
            mesh.instanceMatrix.needsUpdate = true;
        });
    }

    private updateMiners(state: DungeonState) {
        const currentIds = new Set(state.miners.map(m => m.id));

        // Remove dead miners
        for (const [id, data] of this.minerMeshes) {
            if (!currentIds.has(id)) {
                this.minerGroup.remove(data.group);
                this.minerMeshes.delete(id);
            }
        }

        // Update/Add miners
        state.miners.forEach(miner => {
            let data = this.minerMeshes.get(miner.id);
            const config = this.MINER_CONFIGS[miner.type];

            if (!data) {
                const group = new THREE.Group();

                // Use the high-res agent model
                const agentRole = miner.type === 'foreman' ? 'SECURITY' : 'MINER';
                const agentMesh = createAgentByRole(agentRole);

                // Scale it down to fit in the 1x1 voxel world better
                agentMesh.scale.setScalar(0.04); // Unified scale for the complex mesh
                group.add(agentMesh);

                // Add a specific light for each miner
                const l = new THREE.PointLight(config.color, 1.5, 5);
                l.position.y = 0.5;
                group.add(l);

                // Re-use parts for animation tracking
                const parts = agentMesh.userData.parts;

                const barBg = new THREE.Mesh(
                    new THREE.PlaneGeometry(0.6, 0.08),
                    new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide })
                );
                barBg.position.y = 0.8;

                const bar = new THREE.Mesh(
                    new THREE.PlaneGeometry(0.6, 0.08),
                    new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide })
                );
                bar.position.z = 0.01;
                barBg.add(bar);
                group.add(barBg);

                this.setLayerRecursive(group, 1);

                this.minerGroup.add(group);
                data = { group, bar, parts };
                this.minerMeshes.set(miner.id, data);
            }

            // Step interpolation could go here if we had prev pos. 
            // For now, snap to pos.
            data.group.position.set(miner.position.x, miner.position.y - 0.5, miner.position.z);

            // Health/Energy Bar
            const energyPct = miner.energy / 100;
            data.bar.scale.x = Math.max(0.01, energyPct);
            data.bar.position.x = (energyPct - 1) * 0.3;

            (data.bar.material as THREE.MeshBasicMaterial).color.setHex(
                energyPct > 0.5 ? 0x00ff00 : energyPct > 0.2 ? 0xffff00 : 0xff0000
            );

            // Simple Animation Logic
            if (miner.state === 'walking' || miner.state === 'returning_to_base') {
                const walk = Math.sin(Date.now() * 0.01);
                if (data.parts) {
                    if (data.parts.legL) data.parts.legL.rotation.x = -walk * 0.5;
                    if (data.parts.legR) data.parts.legR.rotation.x = walk * 0.5;
                    if (data.parts.armL) data.parts.armL.rotation.x = walk * 0.3;
                    if (data.parts.armR) data.parts.armR.rotation.x = -walk * 0.3;
                }
            } else if (miner.state === 'mining') {
                const work = Math.sin(Date.now() * 0.015);
                if (data.parts && data.parts.armR) {
                    data.parts.armR.rotation.x = -0.5 + work * 0.6;
                }
            } else {
                if (data.parts) {
                    if (data.parts.legL) data.parts.legL.rotation.x = 0;
                    if (data.parts.legR) data.parts.legR.rotation.x = 0;
                    if (data.parts.armL) data.parts.armL.rotation.x = 0;
                    if (data.parts.armR) data.parts.armR.rotation.x = 0;
                }
            }
        });
    }

    private setLayerRecursive(obj: THREE.Object3D, layer: number) {
        obj.layers.set(layer);
        obj.children.forEach(c => this.setLayerRecursive(c, layer));
    }

    dispose() {
        this.scene.remove(this.root);
        this.meshes.forEach(m => {
            m.geometry.dispose();
            if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
            else m.material.dispose();
        });
        // Dispose textures/materials if we owned them
    }
}
