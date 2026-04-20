/**
 * Isometric Camera System
 * Handles orthographic camera control for the isometric RTS view.
 * Adapted from the proven legacy SceneManager camera logic.
 * 
 * Mobile Controls: Pinch zoom, two-finger rotate, pan gestures
 * (|/) Klaasvaakie
 */

import * as THREE from 'three';
import { ThreeRenderAdapter } from '../../engine/render/ThreeRenderAdapter';
import { computeTwoFingerGesture, type GestureSnapshot } from './mobileGestureMath';

export class IsoCameraSystem {
    private camera: THREE.OrthographicCamera;
    private domElement: HTMLElement;
    private enabled = true;

    // Camera State - Public for read access
    public cameraZoom: number;
    public zoomLevel = 7; // Max zoom out (7 steps)
    public cameraFocus = new THREE.Vector3(0, 0, 0);
    public cameraAngle = Math.PI / 4;  // 45 degrees - isometric view
    public cameraElevation = Math.PI / 3.5;  // ~51 degrees

    // Input State
    private isDragging = false;
    private isRotating = false;
    private lastMouseX = 0;
    private lastMouseY = 0;
    private dragStartX = 0;
    private dragStartY = 0;

    // Mobile Touch State
    private activeTouchPointers = new Map<number, { x: number; y: number; lastX: number; lastY: number }>();
    private lastGestureSnapshot: GestureSnapshot | null = null;

    // Bound handlers for cleanup
    private boundPointerDown: (e: PointerEvent) => void;
    private boundPointerMove: (e: PointerEvent) => void;
    private boundPointerUp: (e: PointerEvent) => void;
    private boundWheel: (e: WheelEvent) => void;
    private boundContextMenu: (e: Event) => void;

    constructor(adapter: ThreeRenderAdapter) {
        this.camera = adapter.getCamera() as THREE.OrthographicCamera;
        this.cameraZoom = 15 + (this.zoomLevel * 10);
        this.domElement = adapter.getCanvas();

        // Bind handlers
        this.boundPointerDown = this.onPointerDown.bind(this);
        this.boundPointerMove = this.onPointerMove.bind(this);
        this.boundPointerUp = this.onPointerUp.bind(this);
        this.boundWheel = this.onWheel.bind(this);
        this.boundContextMenu = (e: Event) => e.preventDefault();
        this.bindEvents();
        this.updateCameraTransform();
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (enabled) {
            this.bindEvents();
        } else {
            this.unbindEvents();
        }
    }

    private bindEvents(): void {
        this.unbindEvents(); // Prevent duplicates

        this.domElement.style.touchAction = 'none';
        this.domElement.style.pointerEvents = 'auto';

        this.domElement.addEventListener('pointerdown', this.boundPointerDown);
        window.addEventListener('pointermove', this.boundPointerMove);
        window.addEventListener('pointerup', this.boundPointerUp);
        window.addEventListener('pointercancel', this.boundPointerUp);
        this.domElement.addEventListener('wheel', this.boundWheel, { passive: false });
        this.domElement.addEventListener('contextmenu', this.boundContextMenu);
    }

    private unbindEvents(): void {
        this.domElement.removeEventListener('pointerdown', this.boundPointerDown);
        window.removeEventListener('pointermove', this.boundPointerMove);
        window.removeEventListener('pointerup', this.boundPointerUp);
        window.removeEventListener('pointercancel', this.boundPointerUp);
        this.domElement.removeEventListener('wheel', this.boundWheel);
        this.domElement.removeEventListener('contextmenu', this.boundContextMenu);
    }

    public dispose(): void {
        this.unbindEvents();
    }

    // --- Event Handlers ---

    private onPointerDown(e: PointerEvent): void {
        if (!this.enabled) return;

        if (e.pointerType === 'touch') {
            this.activeTouchPointers.set(e.pointerId, {
                x: e.clientX,
                y: e.clientY,
                lastX: e.clientX,
                lastY: e.clientY,
            });

            if (this.activeTouchPointers.size >= 2) {
                this.lastGestureSnapshot = this.createGestureSnapshot();
            } else {
                this.lastGestureSnapshot = null;
            }
            return;
        }

        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;

        // Right click (button 2) = rotate, Left click (button 0) = pan
        if (e.button === 2) {
            this.isRotating = true;
            this.isDragging = false;
        } else if (e.button === 0) {
            this.isDragging = false; // Will become true on move
        }
    }

    private onPointerMove(e: PointerEvent): void {
        if (!this.enabled) return;

        if (e.pointerType === 'touch' && this.activeTouchPointers.has(e.pointerId)) {
            this.handleTouchPointerMove(e);
            return;
        }

        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;

        // Check if we've moved enough to start dragging
        if (!this.isDragging && !this.isRotating) {
            const distFromStart = Math.sqrt(
                Math.pow(e.clientX - this.dragStartX, 2) +
                Math.pow(e.clientY - this.dragStartY, 2)
            );
            if (distFromStart > 3 && e.buttons === 1) {
                this.isDragging = true;
            }
        }

        if (this.isRotating) {
            this.rotate(dx);
        } else if (this.isDragging) {
            this.pan(dx, dy);
        }

        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }

    private onPointerUp(e: PointerEvent): void {
        if (e.pointerType === 'touch') {
            this.activeTouchPointers.delete(e.pointerId);
            this.lastGestureSnapshot = this.activeTouchPointers.size >= 2 ? this.createGestureSnapshot() : null;
            return;
        }

        this.isDragging = false;
        this.isRotating = false;
    }

    private onWheel(e: WheelEvent): void {
        if (!this.enabled) return;
        e.preventDefault();

        // Scroll up (negative deltaY) = zoom in (smaller frustum)
        // Scroll down (positive deltaY) = zoom out (larger frustum)
        const delta = e.deltaY * 0.1;
        this.zoom(delta);
    }

    private handleTouchPointerMove(e: PointerEvent): void {
        const touch = this.activeTouchPointers.get(e.pointerId);
        if (!touch) return;

        const nextTouch = {
            x: e.clientX,
            y: e.clientY,
            lastX: touch.x,
            lastY: touch.y,
        };
        this.activeTouchPointers.set(e.pointerId, nextTouch);

        if (this.activeTouchPointers.size >= 2) {
            const previous = this.lastGestureSnapshot;
            const current = this.createGestureSnapshot();

            if (previous && current) {
                const gesture = computeTwoFingerGesture(previous, current, {
                    zoomFactor: 0.02,
                    rotationFactor: 0.7,
                    midpointPanThreshold: 6,
                });

                this.zoom(gesture.zoomDelta, true);
                if (gesture.rotationDelta !== 0) {
                    this.cameraAngle -= gesture.rotationDelta;
                    this.updateCameraTransform();
                }

                if (gesture.midpointPan.x !== 0 || gesture.midpointPan.y !== 0) {
                    this.pan(gesture.midpointPan.x, gesture.midpointPan.y);
                }
            }

            this.lastGestureSnapshot = current;
            return;
        }

        this.lastGestureSnapshot = null;

        const dx = nextTouch.x - nextTouch.lastX;
        const dy = nextTouch.y - nextTouch.lastY;
        if (Math.hypot(dx, dy) > 3) {
            this.pan(dx, dy);
        }
    }

    private createGestureSnapshot(): GestureSnapshot | null {
        if (this.activeTouchPointers.size < 2) return null;

        const [first, second] = Array.from(this.activeTouchPointers.values());
        const dx = second.x - first.x;
        const dy = second.y - first.y;

        return {
            distance: Math.hypot(dx, dy),
            angle: Math.atan2(dy, dx),
            midpoint: {
                x: (first.x + second.x) / 2,
                y: (first.y + second.y) / 2,
            },
        };
    }

    // --- Camera Actions (Based on legacy SceneManager) ---

    public pan(screenDx: number, screenDy: number): void {
        // Convert screen movement to world movement
        // The pan speed should be proportional to zoom level
        const panSpeed = this.cameraZoom / window.innerHeight;

        // Rotate the pan direction by camera angle to match the view orientation
        const cosA = Math.cos(this.cameraAngle);
        const sinA = Math.sin(this.cameraAngle);

        // Screen right (+X screen) maps to world direction based on camera angle
        // Screen up (-Y screen) maps to forward in world
        const worldDx = (screenDx * cosA + screenDy * sinA) * panSpeed;
        const worldDz = (-screenDx * sinA + screenDy * cosA) * panSpeed;

        this.cameraFocus.x -= worldDx;
        this.cameraFocus.z -= worldDz;

        this.updateCameraTransform();
    }

    public rotate(screenDx: number): void {
        this.cameraAngle -= screenDx * 0.005;
        this.updateCameraTransform();
    }

    public zoom(delta: number, smooth: boolean = false): void {
        if (smooth) {
            this.cameraZoom = Math.max(15, Math.min(85, this.cameraZoom + delta));
            this.zoomLevel = Math.round((this.cameraZoom - 15) / 10);
        } else {
            const direction = delta > 0 ? 1 : -1;
            this.zoomLevel = Math.max(0, Math.min(7, this.zoomLevel + direction));
            this.cameraZoom = 15 + (this.zoomLevel * 10);
        }
        this.updateCameraTransform();
    }

    public updateCameraTransform(): void {
        const aspect = window.innerWidth / window.innerHeight;
        const frustumSize = this.cameraZoom;

        // Update orthographic frustum
        this.camera.left = -frustumSize * aspect / 2;
        this.camera.right = frustumSize * aspect / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = -frustumSize / 2;
        this.camera.updateProjectionMatrix();

        // Position camera at an offset from focus point
        const dist = 100;
        const y = dist * Math.sin(this.cameraElevation);
        const h = dist * Math.cos(this.cameraElevation);
        const x = h * Math.sin(this.cameraAngle);
        const z = h * Math.cos(this.cameraAngle);

        this.camera.position.set(
            this.cameraFocus.x + x,
            this.cameraFocus.y + y,
            this.cameraFocus.z + z
        );
        this.camera.lookAt(this.cameraFocus);
    }

    // --- Intro Animation ---

    public playIntroAnimation(onComplete: () => void): void {
        let progress = 0;
        const startZoom = 250;
        const targetZoom = this.cameraZoom;

        const animate = () => {
            progress += 0.015;
            if (progress >= 1) {
                this.cameraZoom = targetZoom;
                this.updateCameraTransform();
                onComplete();
                return;
            }
            // Ease out cubic
            this.cameraZoom = startZoom + (targetZoom - startZoom) * (1 - Math.pow(1 - progress, 3));
            this.updateCameraTransform();
            requestAnimationFrame(animate);
        };
        animate();
    }

    // --- Getters for external use ---

    public getFocus(): THREE.Vector3 {
        return this.cameraFocus.clone();
    }

    public getZoom(): number {
        return this.cameraZoom;
    }
}
