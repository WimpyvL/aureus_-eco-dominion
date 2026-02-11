/**
 * Environment Render System
 * Handles day/night cycle, weather effects (rain, fog), and atmospheric lighting.
 * Replaces the environment logic from legacy SceneManager.
 */

import * as THREE from 'three';
import { COLORS } from '../../../engine/data/VoxelConstants';
import { ThreeRenderAdapter } from '../../../engine/render/ThreeRenderAdapter';

export class EnvironmentRenderSystem {
    private scene: THREE.Scene;
    private adapter: ThreeRenderAdapter;

    // State
    private timeOfDay = 12000;
    private weather: 'CLEAR' | 'RAINY' | 'STORM' | 'TOXIC' | 'HEAT' = 'CLEAR';
    private viewMode: 'SURFACE' | 'FIRST_PERSON' = 'SURFACE';

    // Target Values for Interpolation
    private targetBgColor = new THREE.Color(COLORS.BG);
    private currentBgColor = new THREE.Color(COLORS.BG);

    private targetFogColor = new THREE.Color(COLORS.BG);
    private currentFogColor = new THREE.Color(COLORS.BG);

    // Linear Fog Params
    private targetFogNear = 40;
    private currentFogNear = 40;
    private targetFogFar = 120;
    private currentFogFar = 120;

    private targetLightColor = new THREE.Color(0xffcd75);
    private currentLightColor = new THREE.Color(0xffcd75);
    private targetLightIntensity = 1.2;
    private currentLightIntensity = 1.2;

    // Rain System
    private rainSystem: THREE.InstancedMesh;
    private isRaining = false;
    private cameraFocus = new THREE.Vector3(0, 0, 0);

    // Sun/Moon Visual
    private sunMesh: THREE.Mesh;
    private sunDistance = 150; // Distance from camera focus

    constructor(adapter: ThreeRenderAdapter) {
        this.adapter = adapter;
        this.scene = adapter.getScene();

        // Initialize Fog (Linear)
        this.scene.fog = new THREE.Fog(this.currentFogColor, this.currentFogNear, this.currentFogFar);
        this.scene.background = this.currentBgColor;

        // Initialize Rain
        this.rainSystem = this.createRainSystem();
        this.scene.add(this.rainSystem);

        // Initialize Sun Sphere
        this.sunMesh = this.createSunSphere();
        this.scene.add(this.sunMesh);
    }

    private createRainSystem(): THREE.InstancedMesh {
        const count = 500;
        const geo = new THREE.BoxGeometry(0.05, 0.8, 0.05);
        const mat = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 });
        const mesh = new THREE.InstancedMesh(geo, mat, count);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.visible = false;

        const dummy = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            dummy.position.set(
                (Math.random() - 0.5) * 100,
                Math.random() * 60,
                (Math.random() - 0.5) * 100
            );
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }
        return mesh;
    }

    private createSunSphere(): THREE.Mesh {
        const geo = new THREE.SphereGeometry(8, 16, 16);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xffdd44,
            transparent: true,
            opacity: 0.95,
            fog: false // Sun not affected by fog
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.renderOrder = 999; // Render on top
        return mesh;
    }

    private calculateSunPosition(timeOfDay: number): THREE.Vector3 {
        // Time 0 = midnight, 6000 = sunrise, 12000 = noon, 18000 = sunset, 24000 = midnight
        // Sun arc: from East at sunrise, overhead at noon, to West at sunset

        // Normalize to 0-1 range where 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
        const normalizedTime = timeOfDay / 24000;

        // Calculate angle: 0 at sunrise (East), PI/2 at noon (overhead), PI at sunset (West)
        // Sun travels from East (positive X) to West (negative X)
        const sunAngle = (normalizedTime - 0.25) * Math.PI * 2;

        // Height follows a sine curve, peaking at noon
        const dayProgress = (normalizedTime - 0.25) * 2; // 0 at sunrise, 1 at sunset
        const height = Math.sin(Math.max(0, Math.min(1, dayProgress)) * Math.PI);

        const isNight = timeOfDay < 6000 || timeOfDay > 18000;

        if (isNight) {
            // Moon position (opposite side of sky)
            const moonAngle = sunAngle + Math.PI;
            return new THREE.Vector3(
                Math.cos(moonAngle) * this.sunDistance * 0.8,
                40 + Math.abs(Math.sin(moonAngle)) * 60,
                Math.sin(moonAngle) * this.sunDistance * 0.5
            );
        }

        return new THREE.Vector3(
            Math.cos(sunAngle) * this.sunDistance,
            30 + height * 100, // 30 at horizon, 130 at noon
            Math.sin(sunAngle) * this.sunDistance * 0.5
        );
    }

    public update(dt: number, timeOfDay: number, weather: string, cameraFocus: THREE.Vector3) {
        this.timeOfDay = timeOfDay;
        this.cameraFocus.copy(cameraFocus);

        // 1. Calculate Targets based on Simulation State
        this.calculateTargets(timeOfDay, weather);

        // 2. Interpolate visuals
        this.interpolate(dt);

        // 3. Update Particles
        this.updateRain(dt);
    }

    public setViewMode(mode: 'SURFACE' | 'FIRST_PERSON') {
        this.viewMode = mode;
    }

    private calculateTargets(timeOfDay: number, weather: string) {
        // Normalize time (0-24000)
        const isNight = timeOfDay < 6000 || timeOfDay > 18000;
        const normalizedTime = timeOfDay / 24000;

        // Base Intensity
        let intensity = 1.2;
        if (isNight) {
            intensity = 0.4; // Moonlight
        } else {
            // Day arc
            const dayFactor = Math.sin((normalizedTime - 0.25) * 2 * Math.PI);
            intensity = 0.4 + dayFactor * 1.0;
        }

        // Weather Modifiers
        this.isRaining = false;

        if (weather === 'TOXIC') {
            this.targetBgColor.setHex(0x1a2e1a);
            this.targetFogColor.setHex(0x2d4a2d);
            this.targetFogNear = 40; // Increased from 10
            this.targetFogFar = 200; // Increased from 60
            this.targetLightColor.setHex(0x88ff88);
            this.targetLightIntensity = 0.6;
            this.isRaining = true;
        } else if (weather === 'HEAT') {
            this.targetBgColor.setHex(0x552200);
            this.targetFogColor.setHex(0xffaa00);
            this.targetFogNear = 100; // Increased from 20
            this.targetFogFar = 400; // Increased from 80
            this.targetLightColor.setHex(0xffaa55);
            this.targetLightIntensity = 1.8;
        } else if (weather === 'GOLDEN') {
            this.targetBgColor.setHex(0x332200);
            this.targetFogColor.setHex(0xffd700);
            this.targetFogNear = 150; // Increased from 30
            this.targetFogFar = 500; // Increased from 100
            this.targetLightColor.setHex(0xffe066);
            this.targetLightIntensity = 1.4;
        } else if (weather === 'RAINY' || weather === 'STORM') {
            this.targetBgColor.setHex(0x222233);
            this.targetFogColor.setHex(0x222233);
            this.targetFogNear = 100; // Increased from 20
            this.targetFogFar = 300; // Increased from 70
            intensity *= 0.6;
            this.isRaining = true;
            this.targetLightColor.setHex(0xccccff);
            this.targetLightIntensity = intensity;
        } else {
            // NORMAL CLEAR
            if (isNight) {
                this.targetBgColor.setHex(0x050510);
                this.targetLightColor.setHex(0x6688ff);
                this.targetFogColor.setHex(0x050510);
                this.targetFogNear = 200; // Increased from 30
                this.targetFogFar = 600; // Increased from 100
            } else {
                this.targetBgColor.setHex(COLORS.BG);
                this.targetLightColor.setHex(0xffcd75);
                this.targetFogColor.setHex(COLORS.BG);
                this.targetFogNear = 300; // Increased from 40
                this.targetFogFar = 1000; // Increased from 120
            }
            this.targetLightIntensity = intensity;
        }


    }

    private interpolate(dt: number) {
        const lerpSpeed = dt * 1.5;
        const fogLerpSpeed = dt * 2.5; // Snapshot fog even faster

        this.currentFogColor.lerp(this.targetFogColor, fogLerpSpeed);
        this.currentLightColor.lerp(this.targetLightColor, lerpSpeed);
        this.currentBgColor.lerp(this.targetBgColor, lerpSpeed);

        this.currentFogNear = THREE.MathUtils.lerp(this.currentFogNear, this.targetFogNear, fogLerpSpeed);
        this.currentFogFar = THREE.MathUtils.lerp(this.currentFogFar, this.targetFogFar, fogLerpSpeed);
        this.currentLightIntensity = THREE.MathUtils.lerp(this.currentLightIntensity, this.targetLightIntensity, lerpSpeed);

        // Apply
        this.scene.background = this.currentBgColor;
        if (this.scene.fog instanceof THREE.Fog) {
            this.scene.fog.color = this.currentFogColor;
            this.scene.fog.near = this.currentFogNear;
            this.scene.fog.far = this.currentFogFar;
        } else {
            this.scene.fog = new THREE.Fog(this.currentFogColor, this.currentFogNear, this.currentFogFar);
        }

        if (this.adapter.directionalLight) {
            this.adapter.directionalLight.color = this.currentLightColor;
            this.adapter.directionalLight.intensity = this.currentLightIntensity;
        }

        if (this.adapter.ambientLight) {
            this.adapter.ambientLight.color = this.currentLightColor;
            // Ambient is softer
            this.adapter.ambientLight.intensity = Math.max(0.6, this.currentLightIntensity * 0.8);
        }

        // Update Sun/Moon Position
        const sunPos = this.calculateSunPosition(this.timeOfDay);
        const isNight = this.timeOfDay < 6000 || this.timeOfDay > 18000;

        // Position sun relative to camera focus
        this.sunMesh.position.set(
            this.cameraFocus.x + sunPos.x,
            sunPos.y,
            this.cameraFocus.z + sunPos.z
        );

        // Update sun appearance
        const sunMat = this.sunMesh.material as THREE.MeshBasicMaterial;
        if (isNight) {
            sunMat.color.setHex(0xccccff); // Moon: blueish white
            sunMat.opacity = 0.7;
            this.sunMesh.scale.setScalar(0.6); // Moon is smaller
        } else {
            sunMat.color.setHex(0xffdd44); // Sun: warm yellow
            sunMat.opacity = 0.95;
            this.sunMesh.scale.setScalar(1.0);
        }

        // Move directional light to match sun position, relative to focus
        if (this.adapter.directionalLight) {
            this.adapter.directionalLight.position.set(
                this.cameraFocus.x + sunPos.x,
                sunPos.y,
                this.cameraFocus.z + sunPos.z
            );
            // Bias helps prevent shadow acne on voxel surfaces
            this.adapter.directionalLight.shadow.bias = -0.0001; // Slightly reduced bias -0.0005 was too aggressive
            this.adapter.directionalLight.shadow.normalBias = 0.04; // Increased normal bias for better results on vertical faces
            // Light target follows camera
            this.adapter.directionalLight.target.position.set(
                this.cameraFocus.x,
                0,
                this.cameraFocus.z
            );
            this.adapter.directionalLight.target.updateMatrixWorld();

            // Disable shadows at night for softer moonlit look, AND at low zoom for performance
            const zoom = this.adapter.getCamera().zoom;
            const isZoomedOut = zoom < 0.6;
            this.adapter.directionalLight.castShadow = !isNight && !isZoomedOut;
        }
    }

    private updateRain(dt: number) {
        this.rainSystem.visible = this.isRaining || (this.rainSystem.visible && this.currentFogNear < 30);

        if (this.rainSystem.visible) {
            const dummy = new THREE.Object3D();
            for (let i = 0; i < this.rainSystem.count; i++) {
                this.rainSystem.getMatrixAt(i, dummy.matrix);
                dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

                dummy.position.y -= 25 * dt;

                // Respawn logic
                if (dummy.position.y < 0) {
                    dummy.position.y = 60;
                    dummy.position.x = this.cameraFocus.x + (Math.random() - 0.5) * 60;
                    dummy.position.z = this.cameraFocus.z + (Math.random() - 0.5) * 60;
                }

                dummy.updateMatrix();
                this.rainSystem.setMatrixAt(i, dummy.matrix);
            }
            this.rainSystem.instanceMatrix.needsUpdate = true;
        }
    }
}
