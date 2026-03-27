/**
 * Engine Render - Three.js Render Adapter
 * Concrete implementation of RenderAdapter for Three.js
 */

import * as THREE from 'three';
import { FrameContext } from '../kernel/Types';
import { RenderAdapter, RenderStats } from './RenderAdapter';

/** Three.js adapter configuration */
export interface ThreeRenderConfig {
    antialias: boolean;
    shadowMap: boolean;
    pixelRatio: number;
    clearColor: number;
    fogEnabled: boolean;
    fogColor: number;
    fogNear: number;
    fogFar: number;
}

const DEFAULT_CONFIG: ThreeRenderConfig = {
    antialias: false,
    shadowMap: false,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 1.25),
    clearColor: 0x0f172a,
    fogEnabled: false,
    fogColor: 0x1a1a2e,
    fogNear: 40,
    fogFar: 120,
};

export class ThreeRenderAdapter implements RenderAdapter {
    private renderer!: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private orthoCamera: THREE.OrthographicCamera;
    private perspectiveCamera: THREE.PerspectiveCamera;
    private activeCamera: THREE.Camera;
    private container: HTMLElement | null = null;
    private resizeObserver: ResizeObserver | null = null;
    private config: ThreeRenderConfig;

    constructor(config: Partial<ThreeRenderConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config, fogEnabled: false };
        this.scene = new THREE.Scene();

        // Orthographic to match legacy engine
        this.orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2000);
        this.orthoCamera.position.set(0, 40, 50);
        this.orthoCamera.lookAt(0, 0, 0);

        // Perspective for FPV
        this.perspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.perspectiveCamera.position.set(0, 5, 10);

        this.activeCamera = this.orthoCamera;
    }

    /**
     * Initialize the Three.js renderer
     */
    init(container: HTMLElement): void {
        this.container = container;

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: this.config.antialias,
            powerPreference: 'high-performance',
            alpha: true, // Enable transparency
        });

        this.renderer.setPixelRatio(this.config.pixelRatio);
        this.renderer.setClearColor(this.config.clearColor, 0); // Transparent clear
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.localClippingEnabled = true; // Required for material clippingPlanes

        if (this.config.shadowMap) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }

        // Style for overlay
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.pointerEvents = 'none'; // Let clicks pass through for now
        this.renderer.domElement.style.zIndex = '50'; // Higher z-index to ensure it is on top

        container.appendChild(this.renderer.domElement);

        // Setup fog
        if (this.config.fogEnabled) {
            this.scene.fog = new THREE.Fog(
                this.config.fogColor,
                this.config.fogNear,
                this.config.fogFar
            );
        }

        // Handle resize
        this.resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                const { width, height } = entry.contentRect;
                this.resize(width, height);
            }
        });
        this.resizeObserver.observe(container);

        // Initial size
        this.resize(window.innerWidth, window.innerHeight);

        // Add default lighting
        this.setupDefaultLighting();
    }

    public directionalLight: THREE.DirectionalLight | null = null;
    public ambientLight: THREE.AmbientLight | null = null;

    /**
     * Setup default scene lighting
     */
    private setupDefaultLighting(): void {
        // Boosted ambient light for visibility
        this.ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        this.scene.add(this.ambientLight);

        // Main directional light (sun)
        this.directionalLight = new THREE.DirectionalLight(0xfff5e0, 1.0);
        this.directionalLight.position.set(50, 80, 30);
        this.scene.add(this.directionalLight);

        // Hemisphere light for ambient variation
        const hemi = new THREE.HemisphereLight(0x87CEEB, 0x3d2817, 0.4);
        this.scene.add(hemi);
    }

    /**
     * Sync phase - update renderable state
     */
    sync(_ctx: FrameContext): void {
        // Override in game-specific adapter or use scene hooks
        // This is where instances/meshes would be updated
    }

    /**
     * Draw phase - render the scene
     */
    draw(_ctx: FrameContext): void {
        this.renderer.render(this.scene, this.activeCamera);
    }

    /**
     * Handle container resize
     */
    resize(width: number, height: number): void {
        if (width <= 0 || height <= 0) return;

        this.renderer.setSize(width, height, false);

        // Update perspective camera aspect ratio
        this.perspectiveCamera.aspect = width / height;
        this.perspectiveCamera.updateProjectionMatrix();

        // Update active camera if needed (ortho handling is in draw/camera systems)
    }

    /**
     * Dispose all resources
     */
    dispose(): void {
        this.resizeObserver?.disconnect();
        this.renderer?.dispose();

        // Dispose scene objects
        this.scene.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
                obj.geometry?.dispose();
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material?.dispose();
                }
            }
        });

        this.scene.clear();
    }

    /**
     * Get renderer statistics
     */
    getStats(): RenderStats {
        const info = this.renderer.info;
        return {
            drawCalls: info.render.calls,
            triangles: info.render.triangles,
            points: info.render.points,
            lines: info.render.lines,
            geometries: info.memory.geometries,
            textures: info.memory.textures,
            programs: info.programs?.length ?? 0,
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // PUBLIC ACCESSORS
    // ═══════════════════════════════════════════════════════════════

    /** Get the Three.js scene */
    getScene(): THREE.Scene {
        return this.scene;
    }

    // ...

    /** Get the camera */
    getCamera(): THREE.Camera {
        return this.activeCamera;
    }

    setCamera(camera: THREE.Camera): void {
        this.activeCamera = camera;
    }

    getOrthoCamera(): THREE.OrthographicCamera {
        return this.orthoCamera;
    }

    getPerspectiveCamera(): THREE.PerspectiveCamera {
        return this.perspectiveCamera;
    }

    /** Get the renderer */
    getRenderer(): THREE.WebGLRenderer {
        return this.renderer;
    }

    /** Get the DOM canvas element */
    getCanvas(): HTMLCanvasElement {
        return this.renderer.domElement;
    }
}
