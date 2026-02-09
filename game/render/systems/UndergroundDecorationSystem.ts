import * as THREE from 'three';
import { bioLumeMaterial } from '../../../engine/render/materials/VoxelMaterials';
import { CHUNK_SIZE } from '../../../engine/space/ChunkStore';


export class UndergroundDecorationSystem {
    private scene: THREE.Scene;
    private crystals: THREE.InstancedMesh;
    private maxCrystals = 1000;
    private visible = false;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.crystals = this.createCrystalMesh();
        this.scene.add(this.crystals);
    }

    private createCrystalMesh(): THREE.InstancedMesh {
        // --- Crystals Removed (User requested removal of blue cones) ---
        const geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const mesh = new THREE.InstancedMesh(geo, bioLumeMaterial, 1);
        mesh.visible = false;
        return mesh;
    }

    public update(dt: number, time: number, viewMode: string, cameraFocus: THREE.Vector3): void {
        const isUnderground = viewMode === 'UNDERGROUND';

        if (this.visible !== isUnderground) {
            this.visible = isUnderground;
            this.crystals.visible = false; // Always hidden
            if (isUnderground) this.rebuild(cameraFocus);
        }

        if (this.visible) {
            // Update shader time
            (this.crystals.material as THREE.ShaderMaterial).uniforms.time.value = time * 0.001;

            // Periodically rebuild as camera moves significantly
            if (Math.abs(this.crystals.position.x - cameraFocus.x) > 20 ||
                Math.abs(this.crystals.position.z - cameraFocus.z) > 20) {
                this.rebuild(cameraFocus);
            }
        }
    }

    private rebuild(focus: THREE.Vector3): void {
        this.crystals.position.set(focus.x, 0, focus.z);

        const dummy = new THREE.Object3D();
        const radius = 60;
        let count = 0;

        // Seeded random for determinism
        const seed = Math.floor(focus.x / 10) + Math.floor(focus.z / 10);
        let rng = this.seedRandom(seed);

        for (let i = 0; i < this.maxCrystals; i++) {
            const rx = (rng() - 0.5) * radius * 2;
            const rz = (rng() - 0.5) * radius * 2;

            // Randomly floor or ceiling
            // Standardized: Floor at -30, Ceiling at -10
            const onCeiling = rng() > 0.5;
            const ry = onCeiling ? -10.2 : -29.8;

            dummy.position.set(rx, ry, rz);
            dummy.rotation.set(
                onCeiling ? Math.PI : 0,
                rng() * Math.PI * 2,
                (rng() - 0.5) * 0.5
            );
            dummy.scale.setScalar(0.5 + rng() * 1.5);
            dummy.updateMatrix();

            this.crystals.setMatrixAt(count++, dummy.matrix);
        }

        this.crystals.count = count;
        this.crystals.instanceMatrix.needsUpdate = true;
    }

    private seedRandom(s: number) {
        return function () {
            s = Math.sin(s) * 10000;
            return s - Math.floor(s);
        };
    }

    public dispose(): void {
        this.scene.remove(this.crystals);
        this.crystals.geometry.dispose();
    }
}

