import * as THREE from 'three';
import { ThreeRenderAdapter } from '../../engine/render/ThreeRenderAdapter';
import { Agent } from '../../types';

export class FPSCameraSystem {
    private camera: THREE.PerspectiveCamera;
    private domElement: HTMLElement;
    private adapter: ThreeRenderAdapter;
    public enabled = false;
    private onExit?: () => void;

    // Smoothing
    private currentHeight = 0;
    private initialized = false;

    // Movement state
    private moveForward = false;
    private moveBackward = false;
    private moveLeft = false;
    private moveRight = false;
    private moveSprint = false;
    private moveJump = false;

    // Look state
    private pitch = 0;
    private yaw = 0;
    private lookSpeed = 0.002;

    // Attachment
    private targetAgentId: string | null = null;
    private headOffset = new THREE.Vector3(0, 0.6, 0);

    // Bound handlers
    private boundKeyDown: (e: KeyboardEvent) => void;
    private boundKeyUp: (e: KeyboardEvent) => void;
    private boundMouseMove: (e: MouseEvent) => void;
    private boundPointerLockChange: () => void;

    constructor(adapter: ThreeRenderAdapter) {
        this.adapter = adapter;
        this.camera = adapter.getPerspectiveCamera();
        this.domElement = adapter.getCanvas();

        this.boundKeyDown = this.onKeyDown.bind(this);
        this.boundKeyUp = this.onKeyUp.bind(this);
        this.boundMouseMove = this.onMouseMove.bind(this);
        this.boundPointerLockChange = this.onPointerLockChange.bind(this);
        this.boundMouseDown = this.onMouseDown.bind(this);
    }

    private boundMouseDown: (e: MouseEvent) => void;
    public onLeftClick?: () => void;
    public onRightClick?: () => void;

    public setEnabled(enabled: boolean): void {
        if (this.enabled === enabled) return;
        this.enabled = enabled;

        if (enabled) {
            this.adapter.setCamera(this.camera);
            this.bindEvents();
            // Request pointer lock for FPS controls
            this.domElement.requestPointerLock?.();
        } else {
            this.unbindEvents();
            if (document.pointerLockElement === this.domElement) {
                document.exitPointerLock();
            }
        }
    }

    public setOnExit(callback: () => void): void {
        this.onExit = callback;
    }

    public attachTo(agentId: string | null): void {
        this.targetAgentId = agentId;
        if (agentId) {
            this.setEnabled(true);
        } else {
            this.setEnabled(false);
        }
    }

    private bindEvents(): void {
        window.addEventListener('keydown', this.boundKeyDown);
        window.addEventListener('keyup', this.boundKeyUp);
        window.addEventListener('mousemove', this.boundMouseMove);
        window.addEventListener('mousedown', this.boundMouseDown);
        document.addEventListener('pointerlockchange', this.boundPointerLockChange);
    }

    private unbindEvents(): void {
        window.removeEventListener('keydown', this.boundKeyDown);
        window.removeEventListener('keyup', this.boundKeyUp);
        window.removeEventListener('mousemove', this.boundMouseMove);
        window.removeEventListener('mousedown', this.boundMouseDown);
        document.removeEventListener('pointerlockchange', this.boundPointerLockChange);
    }

    private onMouseDown(e: MouseEvent): void {
        if (!this.enabled || document.pointerLockElement !== this.domElement) return;

        if (e.button === 0) {
            this.onLeftClick?.();
        } else if (e.button === 2) {
            this.onRightClick?.();
        }
    }

    private onKeyDown(e: KeyboardEvent): void {
        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW': this.moveForward = true; break;
            case 'ArrowLeft':
            case 'KeyA': this.moveLeft = true; break;
            case 'ArrowDown':
            case 'KeyS': this.moveBackward = true; break;
            case 'ArrowRight':
            case 'KeyD': this.moveRight = true; break;
            case 'ShiftLeft':
            case 'ShiftRight': this.moveSprint = true; break;
            case 'Space': this.moveJump = true; break;
            case 'Escape':
                this.setEnabled(false);
                this.onExit?.();
                break;
        }
    }

    private onKeyUp(e: KeyboardEvent): void {
        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW': this.moveForward = false; break;
            case 'ArrowLeft':
            case 'KeyA': this.moveLeft = false; break;
            case 'ArrowDown':
            case 'KeyS': this.moveBackward = false; break;
            case 'ArrowRight':
            case 'KeyD': this.moveRight = false; break;
            case 'ShiftLeft':
            case 'ShiftRight': this.moveSprint = false; break;
            case 'Space': this.moveJump = false; break;
        }
    }

    private onMouseMove(e: MouseEvent): void {
        if (!this.enabled || document.pointerLockElement !== this.domElement) return;

        this.yaw -= e.movementX * this.lookSpeed;
        this.pitch -= e.movementY * this.lookSpeed;

        // Clamp pitch to avoid flipping
        this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
    }

    private onPointerLockChange(): void {
        if (document.pointerLockElement !== this.domElement && this.enabled) {
            // User exited pointer lock (usually via Escape, which the browser swallows so keydown doesn't fire)
            this.setEnabled(false);
            this.onExit?.();
        }
    }

    public update(dt: number, agents: Agent[], getHeightAt?: (x: number, z: number) => number): void {
        if (!this.enabled) return;

        const agent = agents.find(a => a.id === this.targetAgentId);
        if (!agent) {
            // Agent disappeared or was never there
            return;
        }

        // 1. Sync camera position to agent head
        const worldX = agent.visualX ?? agent.x;
        const worldZ = agent.visualZ ?? agent.z;

        let terrainHeight = 0;
        if (getHeightAt) {
            terrainHeight = getHeightAt(worldX, worldZ);
        }

        const targetHeight = terrainHeight + 0.8;
        if (!this.initialized) {
            this.currentHeight = targetHeight;
            this.initialized = true;
        } else {
            this.currentHeight = THREE.MathUtils.lerp(this.currentHeight, targetHeight, 0.15);
        }

        this.camera.position.set(worldX, this.currentHeight, worldZ); // Height is terrain + head offset

        // 2. Apply look rotation
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.set(this.pitch, this.yaw, 0);

        // Optional: If we want to ALLOW movement, we'd need to send commands back to the engine.
        // For a simple FPV "viewer", we just follow the agent.
    }

    public getMovement(): THREE.Vector3 {
        const move = new THREE.Vector3();
        if (!this.enabled) return move;

        if (this.moveForward) move.z -= 1;
        if (this.moveBackward) move.z += 1;
        if (this.moveLeft) move.x -= 1;
        if (this.moveRight) move.x += 1;

        move.normalize();
        if (this.moveSprint) move.multiplyScalar(2.0); // 2x speed for sprint

        move.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        return move;
    }

    public isJumping(): boolean {
        const jumping = this.moveJump;
        // Optional: consume jump or handle cooldown if needed
        return jumping;
    }

    public getYaw(): number {
        return this.yaw;
    }
}
