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
    shadowMapSize: number;
    clearColor: number;
    fogEnabled: boolean;
    fogColor: number;
    fogNear: number;
    fogFar: number;
}

export interface RenderQualityProfile {
    antialias: boolean;
    shadowMap: boolean;
    pixelRatio: number;
    shadowMapSize: number;
}

export type SmoothDetailLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RuntimeRenderQualityProfile extends RenderQualityProfile {
    level: number;
    label: string;
    smoothDetail: SmoothDetailLevel;
}

export function getRecommendedRenderQuality(): RenderQualityProfile {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const cores = nav.hardwareConcurrency ?? 4;
    const memory = nav.deviceMemory ?? 4;
    const dpr = window.devicePixelRatio || 1;
    const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const touchDevice = coarsePointer || 'ontouchstart' in window;
    const constrainedDevice = touchDevice || cores <= 4 || memory <= 4;
    const veryConstrainedDevice = cores <= 2 || memory <= 2;

    return {
        antialias: !constrainedDevice,
        shadowMap: !touchDevice && !veryConstrainedDevice,
        pixelRatio: Math.min(dpr, touchDevice ? 1 : constrainedDevice ? 1.25 : 1.5),
        shadowMapSize: veryConstrainedDevice ? 512 : constrainedDevice ? 1024 : 1536,
    };
}

export function buildRuntimeRenderQualityLadder(baseQuality: RenderQualityProfile = getRecommendedRenderQuality()): RuntimeRenderQualityProfile[] {
    const basePixelRatio = THREE.MathUtils.clamp(baseQuality.pixelRatio, 0.85, 1.5);
    const baseShadowSize = Math.max(512, Math.round(baseQuality.shadowMapSize / 256) * 256);

    const ladder: RuntimeRenderQualityProfile[] = [
        {
            level: 0,
            label: 'LOW',
            antialias: baseQuality.antialias,
            shadowMap: false,
            pixelRatio: Math.max(0.8, Math.min(basePixelRatio, 0.9)),
            shadowMapSize: 512,
            smoothDetail: 'LOW',
        },
        {
            level: 1,
            label: 'MEDIUM',
            antialias: baseQuality.antialias,
            shadowMap: baseQuality.shadowMap,
            pixelRatio: Math.max(0.95, Math.min(basePixelRatio, 1.0)),
            shadowMapSize: Math.min(baseShadowSize, 1024),
            smoothDetail: 'MEDIUM',
        },
        {
            level: 2,
            label: 'HIGH',
            antialias: baseQuality.antialias,
            shadowMap: baseQuality.shadowMap,
            pixelRatio: Math.max(1.0, Math.min(basePixelRatio, 1.25)),
            shadowMapSize: Math.min(baseShadowSize, 1536),
            smoothDetail: 'HIGH',
        },
        {
            level: 3,
            label: 'ULTRA',
            antialias: baseQuality.antialias,
            shadowMap: baseQuality.shadowMap,
            pixelRatio: basePixelRatio,
            shadowMapSize: baseShadowSize,
            smoothDetail: 'HIGH',
        },
    ];

    return ladder
        .map((profile, index) => ({ ...profile, level: index }))
        .filter((profile, index, arr) => {
            const prev = arr[index - 1];
            return !prev
                || prev.pixelRatio !== profile.pixelRatio
                || prev.shadowMap !== profile.shadowMap
                || prev.shadowMapSize !== profile.shadowMapSize
                || prev.smoothDetail !== profile.smoothDetail;
        })
        .map((profile, index) => ({ ...profile, level: index }));
}

const DEFAULT_QUALITY = getRecommendedRenderQuality();

const DEFAULT_CONFIG: ThreeRenderConfig = {
    antialias: DEFAULT_QUALITY.antialias,
    shadowMap: DEFAULT_QUALITY.shadowMap,
    pixelRatio: DEFAULT_QUALITY.pixelRatio,
    shadowMapSize: DEFAULT_QUALITY.shadowMapSize,
    clearColor: 0x0f172a,
    fogEnabled: true,
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
    private runtimeQualityLadder: RuntimeRenderQualityProfile[];
    private runtimeQuality: RuntimeRenderQualityProfile;

    constructor(config: Partial<ThreeRenderConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.runtimeQualityLadder = buildRuntimeRenderQualityLadder({
            antialias: this.config.antialias,
            shadowMap: this.config.shadowMap,
            pixelRatio: this.config.pixelRatio,
            shadowMapSize: this.config.shadowMapSize,
        });
        this.runtimeQuality = this.runtimeQualityLadder[this.runtimeQualityLadder.length - 1];
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
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
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
        this.applyRuntimeQuality(this.runtimeQuality);
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
        this.directionalLight.castShadow = this.config.shadowMap;
        if (this.config.shadowMap) {
            this.directionalLight.shadow.mapSize.set(this.config.shadowMapSize, this.config.shadowMapSize);
            this.directionalLight.shadow.camera.near = 1;
            this.directionalLight.shadow.camera.far = 260;
            this.directionalLight.shadow.camera.left = -90;
            this.directionalLight.shadow.camera.right = 90;
            this.directionalLight.shadow.camera.top = 90;
            this.directionalLight.shadow.camera.bottom = -90;
        }
        this.scene.add(this.directionalLight);
        this.scene.add(this.directionalLight.target);

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

    getRuntimeQuality(): RuntimeRenderQualityProfile {
        return this.runtimeQuality;
    }

    getRuntimeQualityLadder(): RuntimeRenderQualityProfile[] {
        return this.runtimeQualityLadder;
    }

    setRuntimeQualityLevel(level: number): RuntimeRenderQualityProfile {
        const clampedLevel = THREE.MathUtils.clamp(level, 0, this.runtimeQualityLadder.length - 1);
        const nextQuality = this.runtimeQualityLadder[clampedLevel];
        this.applyRuntimeQuality(nextQuality);
        return this.runtimeQuality;
    }

    private applyRuntimeQuality(nextQuality: RuntimeRenderQualityProfile): void {
        this.runtimeQuality = nextQuality;
        this.config.shadowMap = nextQuality.shadowMap;
        this.config.pixelRatio = nextQuality.pixelRatio;
        this.config.shadowMapSize = nextQuality.shadowMapSize;

        if (!this.renderer) {
            return;
        }

        this.renderer.setPixelRatio(nextQuality.pixelRatio);
        this.renderer.shadowMap.enabled = nextQuality.shadowMap;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        if (this.container) {
            this.resize(this.container.clientWidth || window.innerWidth, this.container.clientHeight || window.innerHeight);
        }

        if (this.directionalLight) {
            this.directionalLight.castShadow = nextQuality.shadowMap;
            this.directionalLight.shadow.mapSize.set(nextQuality.shadowMapSize, nextQuality.shadowMapSize);
            this.directionalLight.shadow.needsUpdate = true;
        }
    }
}
