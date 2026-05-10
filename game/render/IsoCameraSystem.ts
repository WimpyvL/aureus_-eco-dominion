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
    public enabled = false;
    private adapter: ThreeRenderAdapter;

    // Camera State - Public for read access
    public cameraZoom: number;
    public zoomLevel = 5; // Mid-range
    public maxZoomLevel = 7; // User requested reduction
    private targetZoomLevel = 5; // Target for smooth zooming
    public cameraFocus = new THREE.Vector3(0, 0, 0);
    public cameraAngle = Math.PI / 4;  // 45 degrees - isometric view
    public cameraElevation = Math.PI / 3.5;  // ~51 degrees
    public targetFocusY = 0;
    public currentFocusY = 0;

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
        this.adapter = adapter;
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
            this.adapter.setCamera(this.camera);
            this.bindEvents();
            this.updateCameraTransform();
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
        const delta = e.deltaY * 0.005; // Reduced sensitivity
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

        const pointers = Array.from(this.activeTouchPointers.values());
        const p0 = pointers[0];
        const p1 = pointers[1];

        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;

        return {
            distance: Math.hypot(dx, dy),
            angle: Math.atan2(dy, dx),
            midpoint: {
                x: (p0.x + p1.x) / 2,
                y: (p0.y + p1.y) / 2,
            },
        };
    }

    public setTargetHeight(y: number): void {
        this.targetFocusY = y;
    }

    public update(dt: number): void {
        // Smoothly interpolate vertical focus
        const lerpSpeed = 5.0; // Adjust for transition speed
        const dy = this.targetFocusY - this.currentFocusY;

        if (Math.abs(dy) > 0.01) {
            this.currentFocusY += dy * Math.min(1, dt * lerpSpeed);
            this.cameraFocus.y = this.currentFocusY;
            this.updateCameraTransform();
        }

        // Smooth Zoom Lerp
        const zoomDiff = this.targetZoomLevel - this.zoomLevel;
        if (Math.abs(zoomDiff) > 0.001) {
            const zoomLerpSpeed = 8.0;
            this.zoomLevel += zoomDiff * Math.min(1, dt * zoomLerpSpeed);

            // COMPATIBILITY: Use centralized zoom calculation
            this.calculateAndSetZoom();
        }
    }

    /**
     * Centralized zoom calculation based on mode and current zoomLevel
     */
    private calculateAndSetZoom(): void {
        const base = 10;
        const stepSize = 8;

        this.cameraZoom = base + (this.zoomLevel * stepSize);
        this.updateCameraTransform();
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
            // Direct zoom for pinch gesture - real-time feedback
            this.cameraZoom = Math.max(15, Math.min(85, this.cameraZoom + delta));
            this.zoomLevel = Math.round((this.cameraZoom - 15) / 10);
            this.targetZoomLevel = this.zoomLevel;
            this.updateCameraTransform();
        } else {
            // Continuous target update for wheel scroll - lerped in update()
            this.targetZoomLevel = Math.max(0, Math.min(this.maxZoomLevel, this.targetZoomLevel + delta));
        }
    }

    public updateCameraTransform(): void {
        const aspect = window.innerWidth / window.innerHeight;
        const frustumSize = this.cameraZoom;
        const dist = 100;

        // Keep the depth range tight around the active play space.
        // A huge orthographic near/far span murders precision and makes coplanar surfaces shimmer.
        this.camera.near = 1;
        this.camera.far = dist + 220;

        // Update orthographic frustum
        this.camera.left = -frustumSize * aspect / 2;
        this.camera.right = frustumSize * aspect / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = -frustumSize / 2;
        this.camera.updateProjectionMatrix();

        // Position camera at an offset from focus point
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
        this.camera.updateMatrixWorld();
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

    /**
     * Instantly jumps the camera to a specific world position
     */
    public jumpTo(worldX: number, worldZ: number): void {
        this.cameraFocus.set(worldX, this.cameraFocus.y, worldZ);
        this.targetFocusY = this.cameraFocus.y;
        this.currentFocusY = this.cameraFocus.y;
        this.updateCameraTransform();
    }

    /**
     * Zoom camera to focus on a specific world position
     * Used for game start to focus on an agent
     */
    public zoomToPosition(worldX: number, worldZ: number, zoomLevel: number = 2): void {
        this.cameraFocus.set(worldX, this.cameraFocus.y, worldZ);
        this.zoomLevel = Math.max(0, Math.min(this.maxZoomLevel, zoomLevel));
        this.targetZoomLevel = this.zoomLevel;

        this.calculateAndSetZoom();
    }
}
