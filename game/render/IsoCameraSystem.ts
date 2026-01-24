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

export class IsoCameraSystem {
    private camera: THREE.OrthographicCamera;
    private domElement: HTMLElement;
    private enabled = true;

    // Camera State - Public for read access
    public cameraZoom: number;
    public zoomLevel = 5; // Max zoom out (5 steps) - reduced from 7 for better gameplay
    public cameraFocus = new THREE.Vector3(0, 0, 0);
    public cameraAngle = Math.PI / 4;  // 45 degrees - isometric view
    public cameraElevation = Math.PI / 3.5;  // ~51 degrees
    public targetFocusY = 0;
    public currentFocusY = 0;
    public undergroundMode = false;

    // Input State
    private isDragging = false;
    private isRotating = false;
    private lastMouseX = 0;
    private lastMouseY = 0;
    private dragStartX = 0;
    private dragStartY = 0;

    // Mobile Touch State
    private activeTouches = new Map<number, { x: number; y: number; startX: number; startY: number }>();
    private lastTouchDistance = 0;
    private lastTouchAngle = 0;
    private lastTouchMidpoint = { x: 0, y: 0 };
    private gestureStartZoom = 0;
    private gestureStartAngle = 0;
    private isMobileGesture = false;
    private touchStartTime = 0;

    // Bound handlers for cleanup
    private boundPointerDown: (e: PointerEvent) => void;
    private boundPointerMove: (e: PointerEvent) => void;
    private boundPointerUp: (e: PointerEvent) => void;
    private boundWheel: (e: WheelEvent) => void;
    private boundContextMenu: (e: Event) => void;
    private boundTouchStart: (e: TouchEvent) => void;
    private boundTouchMove: (e: TouchEvent) => void;
    private boundTouchEnd: (e: TouchEvent) => void;

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
        this.boundTouchStart = this.onTouchStart.bind(this);
        this.boundTouchMove = this.onTouchMove.bind(this);
        this.boundTouchEnd = this.onTouchEnd.bind(this);

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
        this.domElement.addEventListener('wheel', this.boundWheel, { passive: false });
        this.domElement.addEventListener('contextmenu', this.boundContextMenu);

        // Touch events for mobile gestures
        this.domElement.addEventListener('touchstart', this.boundTouchStart, { passive: false });
        this.domElement.addEventListener('touchmove', this.boundTouchMove, { passive: false });
        this.domElement.addEventListener('touchend', this.boundTouchEnd, { passive: false });
    }

    private unbindEvents(): void {
        this.domElement.removeEventListener('pointerdown', this.boundPointerDown);
        window.removeEventListener('pointermove', this.boundPointerMove);
        window.removeEventListener('pointerup', this.boundPointerUp);
        this.domElement.removeEventListener('wheel', this.boundWheel);
        this.domElement.removeEventListener('contextmenu', this.boundContextMenu);

        // Remove touch events
        this.domElement.removeEventListener('touchstart', this.boundTouchStart);
        this.domElement.removeEventListener('touchmove', this.boundTouchMove);
        this.domElement.removeEventListener('touchend', this.boundTouchEnd);
    }

    public dispose(): void {
        this.unbindEvents();
    }

    // --- Event Handlers ---

    private onPointerDown(e: PointerEvent): void {
        if (!this.enabled) return;

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

    private onPointerUp(_e: PointerEvent): void {
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

    // --- Mobile Touch Handlers ---

    private onTouchStart(e: TouchEvent): void {
        if (!this.enabled) return;
        e.preventDefault();

        this.touchStartTime = Date.now();

        // Update active touches
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            this.activeTouches.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY,
                startX: touch.clientX,
                startY: touch.clientY,
            });
        }

        // Multi-touch gesture detection
        if (this.activeTouches.size >= 2) {
            this.isMobileGesture = true;
            const touches = Array.from(this.activeTouches.values());

            // Calculate initial distance and angle for pinch/rotate
            const dx = touches[1].x - touches[0].x;
            const dy = touches[1].y - touches[0].y;
            this.lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
            this.lastTouchAngle = Math.atan2(dy, dx);

            // Calculate midpoint for pan
            this.lastTouchMidpoint = {
                x: (touches[0].x + touches[1].x) / 2,
                y: (touches[0].y + touches[1].y) / 2,
            };

            // Store starting values for gestures
            this.gestureStartZoom = this.cameraZoom;
            this.gestureStartAngle = this.cameraAngle;
        }
    }

    private onTouchMove(e: TouchEvent): void {
        if (!this.enabled) return;
        e.preventDefault();

        // Update active touches
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            const existing = this.activeTouches.get(touch.identifier);
            if (existing) {
                this.activeTouches.set(touch.identifier, {
                    ...existing,
                    x: touch.clientX,
                    y: touch.clientY,
                });
            }
        }

        const touches = Array.from(this.activeTouches.values());

        if (touches.length >= 2) {
            // Two-finger gestures: pinch zoom, rotate, and pan
            this.handleTwoFingerGesture(touches);
        } else if (touches.length === 1) {
            // Single-finger pan (only if not part of a multi-touch gesture)
            if (!this.isMobileGesture) {
                this.handleSingleFingerPan(touches[0]);
            }
        }
    }

    private onTouchEnd(e: TouchEvent): void {
        if (!this.enabled) return;
        e.preventDefault();

        // Remove ended touches
        const remainingIds = new Set<number>();
        for (let i = 0; i < e.touches.length; i++) {
            remainingIds.add(e.touches[i].identifier);
        }

        // Remove touches that are no longer active
        for (const id of this.activeTouches.keys()) {
            if (!remainingIds.has(id)) {
                this.activeTouches.delete(id);
            }
        }

        // Reset gesture state when all touches are released
        if (this.activeTouches.size === 0) {
            this.isMobileGesture = false;
            this.lastTouchDistance = 0;
            this.lastTouchAngle = 0;
        } else if (this.activeTouches.size === 1) {
            // Transitioned from multi-touch to single touch
            // Reset single-touch tracking
            const touch = Array.from(this.activeTouches.values())[0];
            this.activeTouches.set(
                Array.from(this.activeTouches.keys())[0],
                {
                    ...touch,
                    startX: touch.x,
                    startY: touch.y,
                }
            );
            this.isMobileGesture = false;
        }
    }

    private handleSingleFingerPan(touch: { x: number; y: number; startX: number; startY: number }): void {
        // Calculate movement since last frame
        const dx = touch.x - touch.startX;
        const dy = touch.y - touch.startY;

        // Only pan if moved enough (prevents accidental pans during taps)
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 5) {
            this.pan(dx, dy);

            // Update start position for next frame
            const id = Array.from(this.activeTouches.keys())[0];
            this.activeTouches.set(id, {
                ...touch,
                startX: touch.x,
                startY: touch.y,
            });
        }
    }

    private handleTwoFingerGesture(touches: Array<{ x: number; y: number; startX: number; startY: number }>): void {
        // Calculate current distance and angle
        const dx = touches[1].x - touches[0].x;
        const dy = touches[1].y - touches[0].y;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        const currentAngle = Math.atan2(dy, dx);

        // Calculate current midpoint
        const currentMidpoint = {
            x: (touches[0].x + touches[1].x) / 2,
            y: (touches[0].y + touches[1].y) / 2,
        };

        // PINCH ZOOM
        if (this.lastTouchDistance > 0) {
            const distanceChange = currentDistance - this.lastTouchDistance;

            // Convert distance change to zoom delta
            // Negative distance change = pinch in = zoom out (increase frustum)
            // Positive distance change = pinch out = zoom in (decrease frustum)
            const zoomSensitivity = 0.5;
            const zoomDelta = -distanceChange * zoomSensitivity;

            this.zoom(zoomDelta);
        }

        // TWO-FINGER ROTATE
        if (this.lastTouchAngle !== 0) {
            let angleDelta = currentAngle - this.lastTouchAngle;

            // Normalize angle delta to [-PI, PI]
            while (angleDelta > Math.PI) angleDelta -= 2 * Math.PI;
            while (angleDelta < -Math.PI) angleDelta += 2 * Math.PI;

            // Apply rotation (invert for natural feel)
            const rotateSensitivity = 2.0;
            this.cameraAngle -= angleDelta * rotateSensitivity;
            this.updateCameraTransform();
        }

        // TWO-FINGER PAN
        const midpointDx = currentMidpoint.x - this.lastTouchMidpoint.x;
        const midpointDy = currentMidpoint.y - this.lastTouchMidpoint.y;

        if (Math.abs(midpointDx) > 1 || Math.abs(midpointDy) > 1) {
            this.pan(midpointDx, midpointDy);
        }

        // Update last values for next frame
        this.lastTouchDistance = currentDistance;
        this.lastTouchAngle = currentAngle;
        this.lastTouchMidpoint = currentMidpoint;
    }

    public setTargetHeight(y: number): void {
        this.targetFocusY = y;
    }

    public setUndergroundMode(enabled: boolean): void {
        this.undergroundMode = enabled;
        // Re-calculate zoom immediately when mode changes
        const stepSize = this.undergroundMode ? 5 : 10;
        this.cameraZoom = 15 + (this.zoomLevel * stepSize);
        this.updateCameraTransform();
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

    public zoom(delta: number): void {
        // Step-based zoom: each tick is roughly 1 step
        const direction = delta > 0 ? 1 : -1;
        this.zoomLevel = Math.max(0, Math.min(5, this.zoomLevel + direction)); // Max 5 steps

        // Calculate cameraZoom based on steps: 
        // Surface: 15 (min) to 85 (max)
        // Underground: 15 (min) to 50 (max) - much closer for DK2 feel
        const stepSize = this.undergroundMode ? 5 : 10;
        this.cameraZoom = 15 + (this.zoomLevel * stepSize);
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
     * Zoom camera to focus on a specific world position
     * Used for game start to focus on an agent
     */
    public zoomToPosition(worldX: number, worldZ: number, zoomLevel: number = 2): void {
        this.cameraFocus.set(worldX, this.cameraFocus.y, worldZ);
        this.zoomLevel = Math.max(0, Math.min(5, zoomLevel));

        // Calculate cameraZoom based on steps
        const stepSize = this.undergroundMode ? 5 : 10;
        this.cameraZoom = 15 + (this.zoomLevel * stepSize);
        this.updateCameraTransform();
    }
}
