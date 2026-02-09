/**
 * Engine Input System
 * Handles native DOM events and maps them to Engine commands or callbacks.
 * Reduces latency by bypassing React state updates for interaction raycasting.
 */

import * as THREE from 'three';
import { ThreeRenderAdapter } from '../render/ThreeRenderAdapter';

export class InputSystem {
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    private interactionPlane: THREE.Mesh;
    private rayPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    private dragStartPoint = new THREE.Vector3();
    private dragStartScreen = new THREE.Vector2();
    private isDragging = false;
    private isRightClick = false;
    private activePointers: Map<number, PointerEvent> = new Map();
    private lastHoverCheckTime = 0;

    // Dependencies
    private renderAdapter: ThreeRenderAdapter;
    private domElement: HTMLElement;
    private getTerrainHeight: (worldX: number, worldZ: number) => number;

    // Callbacks provided by AureusWorld to dispatch to Redux/Engine
    // In a pure engine, we would dispatch actions directly, but we are bridging.
    public onTileClick?: (x: number, z: number, isTouch: boolean) => void;
    public onTileRightClick?: (x: number, z: number, isTouch: boolean) => void;
    public onTileHover?: (x: number | null, z: number | null) => void;

    constructor(renderAdapter: ThreeRenderAdapter, getTerrainHeight: (worldX: number, worldZ: number) => number) {
        this.renderAdapter = renderAdapter;
        this.domElement = renderAdapter.getCanvas();
        this.getTerrainHeight = getTerrainHeight;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Invisible plane for raycasting against "ground"
        const planeGeo = new THREE.PlaneGeometry(10000, 10000); // Large enough for most views
        const planeMat = new THREE.MeshBasicMaterial({ visible: false });
        this.interactionPlane = new THREE.Mesh(planeGeo, planeMat);
        this.interactionPlane.rotation.x = -Math.PI / 2;
        this.interactionPlane.position.y = -0.5; // Slightly below 0

        // Add to scene so we can raycast against it easily without iterating full world
        // Or we can just keep it for math.
        // renderAdapter.getScene().add(this.interactionPlane); 
        // Actually, for raycasting against a mathematical plane we don't need a mesh,
        // but for `intersectObject` we do.
        // Let's rely on math plane for performance.
    }

    init() {
        this.bindEvents();
    }

    dispose() {
        this.unbindEvents();
    }

    private bindEvents() {
        // We attach to the renderer canvas which captures pointer events
        // Note: CSS pointer-events allowed on canvas
        this.domElement.style.pointerEvents = 'auto';

        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);

        this.domElement.addEventListener('pointerdown', this.handlePointerDown);
        window.addEventListener('pointermove', this.handlePointerMove);
        window.addEventListener('pointerup', this.handlePointerUp);
        window.addEventListener('pointercancel', this.handlePointerUp);
        this.domElement.addEventListener('contextmenu', this.handleContextMenu);
    }

    private unbindEvents() {
        this.domElement.style.pointerEvents = 'none';

        this.domElement.removeEventListener('pointerdown', this.handlePointerDown);
        window.removeEventListener('pointermove', this.handlePointerMove);
        window.removeEventListener('pointerup', this.handlePointerUp);
        window.removeEventListener('pointercancel', this.handlePointerUp);
        this.domElement.removeEventListener('contextmenu', this.handleContextMenu);
    }

    private handlePointerDown(e: PointerEvent) {
        this.activePointers.set(e.pointerId, e);
        if (this.activePointers.size === 1) {
            this.isDragging = false; // Assume click until moved
            this.dragStartScreen.set(e.clientX, e.clientY);
            this.isRightClick = (e.button === 2 || e.pointerType === 'touch' && e.isPrimary === false);
        }
    }

    private lastClientX = 0;
    private lastClientY = 0;

    private handlePointerMove(e: PointerEvent) {
        this.activePointers.set(e.pointerId, e);
        this.lastClientX = e.clientX;
        this.lastClientY = e.clientY;

        // Threshold check for dragging
        if (!this.isDragging && this.activePointers.size === 1) {
            const dist = this.dragStartScreen.distanceTo(new THREE.Vector2(e.clientX, e.clientY));
            if (dist > 5) {
                this.isDragging = true;
            }
        }

        // Hover Logic
        if (!this.isDragging && !this.isRightClick) {
            const now = Date.now();
            if (now - this.lastHoverCheckTime > 32) { // 30Hz throttle
                this.checkHover(e.clientX, e.clientY);
                this.lastHoverCheckTime = now;
            }
        }
    }

    /**
     * Get the current world position of the cursor (on the logical ground plane)
     */
    public getCurrentCursor(): THREE.Vector3 | null {
        // If mouse hasn't moved yet, return null
        if (this.lastClientX === 0 && this.lastClientY === 0) return null;

        const hit = this.getIntersection(this.lastClientX, this.lastClientY);
        return hit ? hit.point : null;
    }

    private handlePointerUp(e: PointerEvent) {
        this.activePointers.delete(e.pointerId);

        if (!this.isDragging) {
            // Click confirmed
            const isTouch = e.pointerType === 'touch';
            if (this.isRightClick) {
                this.handleClick(e.clientX, e.clientY, true, isTouch);
            } else {
                this.handleClick(e.clientX, e.clientY, false, isTouch);
            }
        }

        this.isDragging = false;
    }

    private handleContextMenu(e: MouseEvent) {
        e.preventDefault();
    }

    public setRayPlaneHeight(height: number) {
        this.rayPlane.constant = -height;
    }

    private getIntersection(clientX: number, clientY: number): { x: number, z: number, point: THREE.Vector3 } | null {
        // Normalized Device Coordinates
        const rect = this.domElement.getBoundingClientRect();
        this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.renderAdapter.getCamera());

        const target = new THREE.Vector3();
        let currentPlaneHeight = -this.rayPlane.constant;

        for (let iter = 0; iter < 3; iter++) {
            const iterPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -currentPlaneHeight);
            const hit = this.raycaster.ray.intersectPlane(iterPlane, target);

            if (!hit) return null;

            const tileX = Math.round(hit.x);
            const tileZ = Math.round(hit.z);

            // Query actual terrain height at this XZ
            const terrainHeight = this.getTerrainHeight(hit.x, hit.z);

            // If we're close enough (within 0.1 units), accept this result
            if (Math.abs(terrainHeight - currentPlaneHeight) < 0.1) {
                hit.y = terrainHeight;
                return { x: tileX, z: tileZ, point: hit };
            }

            // Refine: use terrain height for next iteration
            currentPlaneHeight = terrainHeight;
        }

        // After max iterations, use last result
        const tileX = Math.round(target.x);
        const tileZ = Math.round(target.z);
        target.y = this.getTerrainHeight(target.x, target.z);
        return { x: tileX, z: tileZ, point: target };
    }

    private handleClick(x: number, y: number, isRight: boolean, isTouch: boolean) {
        const hit = this.getIntersection(x, y);
        if (hit) {
            if (isRight) {
                this.onTileRightClick?.(hit.x, hit.z, isTouch);
            } else {
                this.onTileClick?.(hit.x, hit.z, isTouch);
            }
        }
    }

    private checkHover(x: number, y: number) {
        const hit = this.getIntersection(x, y);
        if (hit) {
            this.onTileHover?.(hit.x, hit.z);
        } else {
            this.onTileHover?.(null, null);
        }
    }
}
