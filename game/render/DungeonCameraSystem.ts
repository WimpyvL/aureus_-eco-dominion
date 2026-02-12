
import * as THREE from 'three';
import { ThreeRenderAdapter } from '../../engine/render/ThreeRenderAdapter';

export class DungeonCameraSystem {
    private camera: THREE.PerspectiveCamera;
    private domElement: HTMLElement;
    private adapter: ThreeRenderAdapter;
    public enabled = false;

    // Camera State
    public focus = new THREE.Vector3(16, 0, 16); // Center of grid roughly
    public zoom = 20;
    public pitch = Math.PI / 3; // 60 degrees
    public yaw = Math.PI / 4;   // 45 degrees

    // Input State
    private isDragging = false;
    private lastMouseX = 0;
    private lastMouseY = 0;

    constructor(adapter: ThreeRenderAdapter) {
        this.adapter = adapter;
        this.domElement = adapter.getCanvas();

        // Initialize Perspective Camera
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.camera.layers.enable(1); // See Dungeon Layer
        this.camera.layers.enable(0); // See Global Layer (lights)
        this.updateCameraTransform();

        // Bind handlers
        this.boundPointerDown = this.onPointerDown.bind(this);
        this.boundPointerMove = this.onPointerMove.bind(this);
        this.boundPointerUp = this.onPointerUp.bind(this);
        this.boundWheel = this.onWheel.bind(this);
        this.boundContextMenu = (e: Event) => e.preventDefault();

        // Listen for resize to update aspect ratio
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        });
    }

    /* Handler bindings */
    private boundPointerDown: (e: PointerEvent) => void;
    private boundPointerMove: (e: PointerEvent) => void;
    private boundPointerUp: (e: PointerEvent) => void;
    private boundWheel: (e: WheelEvent) => void;
    private boundContextMenu: (e: Event) => void;

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (enabled) {
            this.adapter.setCamera(this.camera);
            this.bindEvents();
        } else {
            this.unbindEvents();
        }
    }

    private bindEvents(): void {
        this.unbindEvents();
        this.domElement.style.touchAction = 'none';

        this.domElement.addEventListener('pointerdown', this.boundPointerDown);
        window.addEventListener('pointermove', this.boundPointerMove);
        window.addEventListener('pointerup', this.boundPointerUp);
        this.domElement.addEventListener('wheel', this.boundWheel, { passive: false });
        this.domElement.addEventListener('contextmenu', this.boundContextMenu);
    }

    private unbindEvents(): void {
        this.domElement.removeEventListener('pointerdown', this.boundPointerDown);
        window.removeEventListener('pointermove', this.boundPointerMove);
        window.removeEventListener('pointerup', this.boundPointerUp);
        this.domElement.removeEventListener('wheel', this.boundWheel);
        this.domElement.removeEventListener('contextmenu', this.boundContextMenu);
    }

    private updateCameraTransform() {
        // Calculate offset based on yaw/pitch/zoom
        const yOffset = Math.sin(this.pitch) * this.zoom;
        const hDist = Math.cos(this.pitch) * this.zoom;
        const xOffset = Math.sin(this.yaw) * hDist;
        const zOffset = Math.cos(this.yaw) * hDist;

        this.camera.position.set(
            this.focus.x + xOffset,
            this.focus.y + yOffset,
            this.focus.z + zOffset
        );
        this.camera.lookAt(this.focus);
    }

    public jumpTo(x: number, z: number) {
        this.focus.x = x;
        this.focus.z = z;
        this.updateCameraTransform();
    }

    // --- Input Handlers ---

    private onPointerDown(e: PointerEvent) {
        if (!this.enabled) return;
        if (e.button === 2 || (e.button === 0 && e.shiftKey)) { // Right click or shift+click to drag
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.domElement.setPointerCapture(e.pointerId);
        }
    }

    private onPointerMove(e: PointerEvent) {
        if (!this.enabled || !this.isDragging) return;

        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        // Pan logic (move focus opposite to drag)
        // We need to move relative to camera yaw
        const panSpeed = 0.05 * (this.zoom / 20); // Scale with zoom

        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

        // Dragging DOWN (dy > 0) should move camera UP (focus Z-)
        // Actually typically dragging move terrain. 
        // If I drag mouse down, I want to see usage above? No, drag map down = camera up.
        // Let's implement standard Pan.

        // Rotate logic if ctrl held?
        if (e.ctrlKey) {
            this.yaw -= dx * 0.01;
            this.pitch = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.pitch + dy * 0.01));
        } else {
            // Pan
            const moveX = -(right.x * dx + forward.x * -dy) * panSpeed;
            const moveZ = -(right.z * dx + forward.z * -dy) * panSpeed;

            this.focus.x += moveX;
            this.focus.z += moveZ;
        }

        this.updateCameraTransform();
    }

    private onPointerUp(e: PointerEvent) {
        if (this.isDragging) {
            this.isDragging = false;
            this.domElement.releasePointerCapture(e.pointerId);
        }
    }

    private onWheel(e: WheelEvent) {
        if (!this.enabled) return;
        e.preventDefault();

        const zoomSpeed = 0.1;
        this.zoom = Math.max(5, Math.min(50, this.zoom + (e.deltaY * 0.01 * zoomSpeed)));
        this.updateCameraTransform();
    }
}
