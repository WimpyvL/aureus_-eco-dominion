import * as THREE from 'three';
import { StateManager } from '../../engine/state/StateManager';
import { DungeonEngine } from '../../engine/dungeon/DungeonEngine';

export type DungeonInteractionMode = 'mine' | 'build_support' | 'build_recharger';

export class DungeonInputHandler {
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    private stateManager: StateManager;
    private dungeonEngine: DungeonEngine | null = null;
    private selectionMesh: THREE.Mesh;
    private mode: DungeonInteractionMode = 'mine';
    private camera: THREE.Camera | null = null;
    private meshGroup: THREE.Group | null = null;

    // Energy threshold for assigning miners
    private ENERGY_LOW_THRESHOLD = 20;

    constructor(stateManager: StateManager, scene: THREE.Scene) {
        this.stateManager = stateManager;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Create selection highlight mesh
        const selectionGeometry = new THREE.BoxGeometry(1.02, 1.02, 1.02);
        const selectionMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        this.selectionMesh = new THREE.Mesh(selectionGeometry, selectionMaterial);
        this.selectionMesh.visible = false;
        scene.add(this.selectionMesh);
    }

    /**
     * Set the dungeon engine instance (called when dungeon is initialized)
     */
    public setDungeonEngine(engine: DungeonEngine): void {
        this.dungeonEngine = engine;
    }

    /**
     * Set the mesh group to raycast against
     */
    public setMeshGroup(group: THREE.Group): void {
        this.meshGroup = group;
    }

    /**
     * Set the active camera for raycasting
     */
    public setCamera(camera: THREE.Camera): void {
        this.camera = camera;
    }

    /**
     * Set the interaction mode
     */
    public setMode(mode: DungeonInteractionMode): void {
        this.mode = mode;
        this.selectionMesh.visible = false;
    }

    /**
     * Get current mode
     */
    public getMode(): DungeonInteractionMode {
        return this.mode;
    }

    /**
     * Handle click interaction
     */
    public handleClick(clientX: number, clientY: number): void {
        if (!this.camera || !this.dungeonEngine || !this.meshGroup) return;

        // Convert mouse position to normalized device coordinates
        this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;

        // Raycast
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.meshGroup.children, true);

        if (intersects.length === 0) {
            this.selectionMesh.visible = false;
            return;
        }

        const intersect = intersects[0];

        // Calculate block position
        // Offset by face normal to get the clicked block (not the adjacent one)
        const point = intersect.point.clone().add(
            intersect.face!.normal.clone().multiplyScalar(-0.5)
        );

        const tx = Math.floor(point.x);
        const ty = Math.floor(point.y);
        const tz = Math.floor(point.z);

        const blockId = this.dungeonEngine.getBlockId(tx, ty, tz);

        if (this.mode === 'mine') {
            this.handleMineMode(tx, ty, tz, blockId);
        } else {
            this.handleBuildMode(tx, ty, tz, blockId);
        }
    }

    /**
     * Handle mining interaction
     */
    private handleMineMode(x: number, y: number, z: number, blockId: number): void {
        const state = this.stateManager.getState();

        // Can't mine air or heart, and must be above ground level
        if (blockId === DungeonEngine.BLOCK.AIR ||
            blockId === DungeonEngine.BLOCK.HEART ||
            y <= 0) {
            this.selectionMesh.visible = false;
            return;
        }

        // Show selection
        this.selectionMesh.position.set(x + 0.5, y + 0.5, z + 0.5);
        this.selectionMesh.visible = true;

        // Find an idle miner with enough energy
        const eligibleMiner = state.dungeon.miners.find(
            m => m.state === 'idle' && m.energy > this.ENERGY_LOW_THRESHOLD
        );

        if (!eligibleMiner) {
            // No available miners
            state.dungeon.logs.push('No available miners. Hire more or wait for recharge.');
            return;
        }

        // Assign miner to target block
        eligibleMiner.state = 'walking';
        eligibleMiner.targetBlock = { x, y, z };
    }

    /**
     * Handle building placement
     */
    private handleBuildMode(x: number, y: number, z: number, blockId: number): void {
        const state = this.stateManager.getState();

        // Can only build in air blocks at ground level (y=1)
        if (blockId !== DungeonEngine.BLOCK.AIR || y !== 1) {
            this.selectionMesh.visible = false;
            return;
        }

        if (this.mode === 'build_support') {
            // Support pillar costs stone
            if (state.resources.stone < 50) {
                state.dungeon.logs.push('Not enough stone to build support pillar.');
                return;
            }

            // Deduct cost
            state.resources.stone -= 50;

            // Place support pillar (3 blocks tall)
            this.dungeonEngine!.setBlockId(x, 1, z, DungeonEngine.BLOCK.SUPPORT);
            this.dungeonEngine!.setBlockId(x, 2, z, DungeonEngine.BLOCK.SUPPORT);
            this.dungeonEngine!.setBlockId(x, 3, z, DungeonEngine.BLOCK.SUPPORT);

            // Add to buildings list
            state.dungeon.buildings.push({
                id: `support_${Date.now()}`,
                type: 'support',
                position: { x, y: 1, z }
            });

            state.dungeon.logs.push('Support pillar placed.');

        } else if (this.mode === 'build_recharger') {
            // Recharger costs AGT and gems
            if (state.resources.agt < 100 || state.resources.gems < 50) {
                state.dungeon.logs.push('Not enough resources for recharger (100 AGT, 50 gems).');
                return;
            }

            // Deduct cost
            state.resources.agt -= 100;
            state.resources.gems -= 50;

            // Place recharger
            this.dungeonEngine!.setBlockId(x, 1, z, DungeonEngine.BLOCK.RECHARGER);

            // Add to buildings list
            state.dungeon.buildings.push({
                id: `recharger_${Date.now()}`,
                type: 'recharger',
                position: { x, y: 1, z }
            });

            state.dungeon.logs.push('Recharger placed.');
        }
    }

    /**
     * Handle hover (for preview/feedback)
     */
    public handleHover(clientX: number, clientY: number): void {
        if (!this.camera || !this.meshGroup) return;

        this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.meshGroup.children, true);

        if (intersects.length > 0 && this.mode !== 'mine') {
            const intersect = intersects[0];
            const point = intersect.point.clone().add(
                intersect.face!.normal.clone().multiplyScalar(0.5)
            );

            const tx = Math.floor(point.x);
            const ty = Math.floor(point.y);
            const tz = Math.floor(point.z);

            // Show preview for build mode
            this.selectionMesh.position.set(tx + 0.5, ty + 0.5, tz + 0.5);
            this.selectionMesh.visible = true;
        } else {
            // Hide selection when not hovering in build mode
            if (this.mode !== 'mine') {
                this.selectionMesh.visible = false;
            }
        }
    }

    /**
     * Cleanup
     */
    public dispose(): void {
        this.selectionMesh.geometry.dispose();
        (this.selectionMesh.material as THREE.Material).dispose();
        this.selectionMesh.parent?.remove(this.selectionMesh);
    }
}
