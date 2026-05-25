/**
 * Environment Render System
 * Handles day/night cycle, weather effects (rain, fog), and atmospheric lighting.
 * Replaces the environment logic from legacy SceneManager.
 */

import * as THREE from 'three';
import { WeatherState } from '../../../types';
import { COLORS } from '../../../engine/data/VoxelConstants';
import { ThreeRenderAdapter } from '../../../engine/render/ThreeRenderAdapter';
import { getCelestialPosition, getDaylightFactor, isDaytime } from '../../../engine/sim/dayNightCycle';
import { isRainWeather, isStormWeather, normalizeWeatherState } from '../../../engine/weather/weatherModel';

export class EnvironmentRenderSystem {
    private scene: THREE.Scene;
    private adapter: ThreeRenderAdapter;

    // State
    private timeOfDay = 12000;
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
    private stormFlash = 0;

    // Sun/Moon Visual
    private sunMesh: THREE.Mesh;
    private sunDistance = 150; // Distance from camera focus
    private appliedBgColor = new THREE.Color(COLORS.BG);
    private appliedFogColor = new THREE.Color(COLORS.BG);
    private lightningBgColor = new THREE.Color(0xf6fbff);
    private lightningFogColor = new THREE.Color(0xe4eefc);

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
        const position = getCelestialPosition(timeOfDay, this.sunDistance);
        return new THREE.Vector3(position.x, position.y, position.z);
    }

    public update(dt: number, timeOfDay: number, weather: WeatherState, cameraFocus: THREE.Vector3) {
        this.timeOfDay = timeOfDay;
        this.cameraFocus.copy(cameraFocus);
        const normalizedWeather = normalizeWeatherState(weather);

        // 1. Calculate Targets based on Simulation State
        this.calculateTargets(timeOfDay, normalizedWeather);

        // 2. Handle lightning before interpolation so flashes actually affect light.
        this.updateStormFlash(dt, normalizedWeather);

        // 3. Interpolate visuals
        this.interpolate(dt);

        // 4. Update Particles
        this.updateRain(dt, normalizedWeather);
    }

    public setViewMode(mode: 'SURFACE' | 'FIRST_PERSON') {
        this.viewMode = mode;
    }

    private calculateTargets(timeOfDay: number, weather: WeatherState) {
        // Normalize time (0-24000)
        const daylightFactor = getDaylightFactor(timeOfDay);
        const isNight = daylightFactor <= 0;
        const severity = weather.intensity;

        // Base Intensity
        let intensity = isNight ? 0.4 : 0.4 + daylightFactor * 1.0;

        // Weather Modifiers
        this.isRaining = false;

        switch (weather.current) {
            case 'OVERCAST':
                this.targetBgColor.setHex(0x6f7785);
                this.targetFogColor.setHex(0x76808f);
                this.targetFogNear = 160;
                this.targetFogFar = 480;
                this.targetLightColor.setHex(0xe4e9f2);
                this.targetLightIntensity = intensity * (0.78 - severity * 0.12);
                break;
            case 'RAIN':
                this.targetBgColor.setHex(0x4b5568);
                this.targetFogColor.setHex(0x536276);
                this.targetFogNear = 120;
                this.targetFogFar = 320;
                this.targetLightColor.setHex(0xc6d7f0);
                this.targetLightIntensity = intensity * (0.68 - severity * 0.1);
                this.isRaining = true;
                break;
            case 'STORM':
                this.targetBgColor.setHex(0x1b2431);
                this.targetFogColor.setHex(0x263241);
                this.targetFogNear = 70;
                this.targetFogFar = 180;
                this.targetLightColor.setHex(0xc7d7ff);
                this.targetLightIntensity = Math.max(0.3, intensity * (0.45 - severity * 0.08));
                this.isRaining = true;
                break;
            case 'HEATWAVE':
                this.targetBgColor.setHex(0xb06f2f);
                this.targetFogColor.setHex(0xd39a54);
                this.targetFogNear = 110;
                this.targetFogFar = 300;
                this.targetLightColor.setHex(0xffc27d);
                this.targetLightIntensity = intensity * (1.15 + severity * 0.25);
                break;
            case 'DUST_STORM':
                this.targetBgColor.setHex(0x8f6035);
                this.targetFogColor.setHex(0xb37c44);
                this.targetFogNear = 50;
                this.targetFogFar = 140;
                this.targetLightColor.setHex(0xe3b377);
                this.targetLightIntensity = Math.max(0.35, intensity * (0.56 - severity * 0.12));
                break;
            case 'CLEAR':
            default:
                if (isNight) {
                    this.targetBgColor.setHex(0x050510);
                    this.targetLightColor.setHex(0x6688ff);
                    this.targetFogColor.setHex(0x050510);
                    this.targetFogNear = 200;
                    this.targetFogFar = 600;
                } else {
                    this.targetBgColor.setHex(COLORS.BG);
                    this.targetLightColor.setHex(0xffcd75);
                    this.targetFogColor.setHex(COLORS.BG);
                    this.targetFogNear = 300;
                    this.targetFogFar = 1000;
                }
                this.targetLightIntensity = intensity;
                break;
        }
    }

    private updateStormFlash(dt: number, weather: WeatherState) {
        this.stormFlash = Math.max(0, this.stormFlash - dt * 3.2);

        if (!isStormWeather(weather.current) || weather.lightning <= 0.1) {
            return;
        }

        const strikeChance = dt * (0.2 + weather.lightning * 1.4);
        if (Math.random() < strikeChance) {
            this.stormFlash = 0.72 + Math.random() * 0.28;
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
        this.appliedBgColor.copy(this.currentBgColor).lerp(this.lightningBgColor, this.stormFlash * 0.3);
        this.appliedFogColor.copy(this.currentFogColor).lerp(this.lightningFogColor, this.stormFlash * 0.15);
        this.scene.background = this.appliedBgColor;
        if (this.scene.fog instanceof THREE.Fog) {
            this.scene.fog.color = this.appliedFogColor;
            this.scene.fog.near = this.currentFogNear;
            this.scene.fog.far = this.currentFogFar;
        } else {
            this.scene.fog = new THREE.Fog(this.appliedFogColor, this.currentFogNear, this.currentFogFar);
        }

        if (this.adapter.directionalLight) {
            this.adapter.directionalLight.color = this.currentLightColor;
            this.adapter.directionalLight.intensity = this.currentLightIntensity + this.stormFlash * 1.2;
        }

        if (this.adapter.ambientLight) {
            this.adapter.ambientLight.color = this.currentLightColor;
            // Ambient is softer
            this.adapter.ambientLight.intensity = Math.max(0.4, this.currentLightIntensity * 0.8 + this.stormFlash * 0.35);
        }

        // Update Sun/Moon Position
        const sunPos = this.calculateSunPosition(this.timeOfDay);
        const isNight = !isDaytime(this.timeOfDay);

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
            // Favor stable contact shadows without letting the terrain shadow itself
            // into large moving bands as the light/camera shifts.
            this.adapter.directionalLight.shadow.bias = -0.00002;
            this.adapter.directionalLight.shadow.normalBias = 0.018;
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
            this.adapter.directionalLight.castShadow = this.adapter.getRuntimeQuality().shadowMap && !isNight && !isZoomedOut;
        }
    }

    private updateRain(dt: number, weather: WeatherState) {
        this.rainSystem.visible = isRainWeather(weather.current) || (this.rainSystem.visible && weather.precipitation > 0.1);

        if (this.rainSystem.visible) {
            const dummy = new THREE.Object3D();
            const fallSpeed = 14 + weather.precipitation * 18;
            const lateralDrift = (weather.windStrength - 0.25) * 10;
            for (let i = 0; i < this.rainSystem.count; i++) {
                this.rainSystem.getMatrixAt(i, dummy.matrix);
                dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

                dummy.position.y -= fallSpeed * dt;
                dummy.position.x += lateralDrift * dt;

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
