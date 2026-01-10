
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { mats } from '../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../render/utils/VoxelBuilder';
import { BuildingType } from '../../../types';

export const BuildingsFactory = {
    [BuildingType.EMPTY]: () => new THREE.Group(),

    // WASH PLANT - Large industrial ore processing facility
    [BuildingType.WASH_PLANT]: () => {
        const g = new THREE.Group();
        // Large concrete foundation
        g.add(voxel(2.0, 0.3, 2.0, mats.concrete, 0, 0, 0));

        // Main processing building
        g.add(voxel(1.2, 2.5, 1.2, mats.metal, -0.3, 0.3, -0.3));
        g.add(voxel(1.25, 0.15, 1.25, mats.darkPipe, -0.3, 1.0, -0.3));
        g.add(voxel(1.25, 0.15, 1.25, mats.darkPipe, -0.3, 1.8, -0.3));
        g.add(voxel(1.3, 0.2, 1.3, mats.hazard, -0.3, 2.6, -0.3));

        // Ore hoppers
        g.add(voxel(0.6, 1.0, 0.6, mats.blueMetal, 0.5, 0.3, 0.5));
        g.add(voxel(0.65, 0.1, 0.65, mats.metal, 0.5, 1.2, 0.5));

        // Secondary processing unit
        g.add(voxel(0.8, 1.5, 0.8, mats.blueMetal, 0.5, 0.3, -0.5));
        g.add(voxel(0.3, 0.15, 0.05, mats.emissiveCyan, 0.5, 0.8, -0.09));
        g.add(voxel(0.3, 0.15, 0.05, mats.emissiveCyan, 0.5, 1.2, -0.09));

        // Conveyor belt system
        const conveyor = voxel(0.5, 0.15, 2.2, mats.darkPipe, 0.5, 1.3, 0);
        conveyor.rotation.x = 0.25;
        g.add(conveyor);

        // Conveyor rollers
        for (let z = -0.8; z <= 0.8; z += 0.4) {
            g.add(voxel(0.55, 0.08, 0.12, mats.metal, 0.5, 1.3 + (z * 0.12), z));
        }

        // Smokestack
        g.add(voxel(0.25, 3.5, 0.25, mats.metal, -0.7, 0.3, 0.7));
        g.add(voxel(0.3, 0.3, 0.3, mats.concrete, -0.7, 0, 0.7));
        g.add(voxel(0.2, 0.2, 0.2, mats.emissiveRed, -0.7, 3.8, 0.7));

        // Pipes and details
        g.add(voxel(0.1, 0.6, 0.1, mats.darkPipe, 0.1, 0.3, 0.9));
        g.add(voxel(0.8, 0.1, 0.1, mats.darkPipe, 0.1, 0.6, 0.9));

        // Control panel
        g.add(voxel(0.3, 0.5, 0.15, mats.metal, -0.8, 0.3, 0));
        g.add(voxel(0.2, 0.3, 0.05, mats.emissiveGreen, -0.8, 0.5, 0.08));

        return g;
    },

    // RECYCLING PLANT - Clean tech processing facility
    [BuildingType.RECYCLING_PLANT]: () => {
        const g = new THREE.Group();
        // Foundation
        g.add(voxel(2.0, 0.35, 2.0, mats.concrete, 0, 0, 0));

        // Main clean building
        g.add(voxel(1.4, 1.8, 1.4, mats.white, -0.2, 0.35, -0.2));
        g.add(voxel(1.2, 0.6, 1.2, mats.glass, -0.2, 1.8, -0.2));

        // Green tech core
        g.add(voxel(0.5, 0.5, 0.5, mats.emissiveCyan, -0.2, 1.5, -0.2));

        // Processing cylinders
        g.add(voxel(0.7, 2.2, 0.7, mats.greenMetal, 0.55, 0.35, 0.55));
        g.add(voxel(0.75, 0.1, 0.75, mats.metal, 0.55, 1.2, 0.55));
        g.add(voxel(0.75, 0.1, 0.75, mats.metal, 0.55, 1.8, 0.55));
        g.add(voxel(0.25, 0.25, 0.08, mats.emissiveGreen, 0.55, 1.5, 0.92));

        // Secondary cylinder
        g.add(voxel(0.6, 1.6, 0.6, mats.greenMetal, 0.55, 0.35, -0.55));
        g.add(voxel(0.2, 0.2, 0.05, mats.emissiveCyan, 0.55, 1.0, -0.24));

        // Exhaust tower (clean steam)
        g.add(voxel(0.35, 3.5, 0.35, mats.white, -0.75, 0.35, 0.75));
        g.add(voxel(0.45, 0.08, 0.45, mats.metal, -0.75, 2.2, 0.75));
        g.add(voxel(0.45, 0.08, 0.45, mats.metal, -0.75, 2.8, 0.75));
        g.add(voxel(0.5, 0.15, 0.5, mats.glass, -0.75, 3.5, 0.75));

        // Solar panels on roof
        g.add(voxel(0.6, 0.08, 0.4, mats.solar, -0.2, 2.45, -0.2));

        return g;
    },

    // STAFF QUARTERS - Multi-story residential building
    [BuildingType.STAFF_QUARTERS]: () => {
        const g = new THREE.Group();
        // Foundation
        g.add(voxel(2.0, 0.25, 2.0, mats.concrete, 0, 0, 0));

        // Main building - 3 floors
        g.add(voxel(1.6, 2.4, 1.6, mats.brick, 0, 0.25, 0));

        // Floor separators
        for (let y = 0.8; y <= 2.0; y += 0.6) {
            g.add(voxel(1.7, 0.1, 1.7, mats.concrete, 0, y, 0));
        }

        // Windows on each floor
        for (let y = 0.5; y <= 2.0; y += 0.6) {
            // Front windows
            g.add(voxel(0.25, 0.3, 0.08, mats.glass, -0.5, y, 0.81));
            g.add(voxel(0.25, 0.3, 0.08, mats.glass, 0.0, y, 0.81));
            g.add(voxel(0.25, 0.3, 0.08, mats.glass, 0.5, y, 0.81));
            // Side windows
            g.add(voxel(0.08, 0.3, 0.25, mats.glass, 0.81, y, 0));
        }

        // Entrance
        g.add(voxel(0.5, 0.7, 0.08, mats.wood, 0, 0.25, 0.81));
        g.add(voxel(0.6, 0.15, 0.3, mats.concrete, 0, 0.25, 0.95));

        // Roof details
        g.add(voxel(1.4, 0.3, 1.4, mats.metal, 0, 2.65, 0));
        g.add(voxel(0.3, 0.5, 0.3, mats.concrete, 0.5, 2.65, 0.5));
        g.add(voxel(0.15, 0.15, 0.15, mats.emissiveCyan, 0.5, 3.15, 0.5));

        // AC units
        g.add(voxel(0.4, 0.3, 0.4, mats.metal, -0.5, 2.65, -0.5));

        return g;
    },

    // CANTEEN - Hydroponic farm and dining hall
    [BuildingType.CANTEEN]: () => {
        const g = new THREE.Group();
        // Foundation
        g.add(voxel(2.0, 0.25, 2.0, mats.concrete, 0, 0, 0));

        // Support pillars
        g.add(voxel(0.15, 2.2, 0.15, mats.metal, -0.85, 0.25, -0.85));
        g.add(voxel(0.15, 2.2, 0.15, mats.metal, 0.85, 0.25, -0.85));
        g.add(voxel(0.15, 2.2, 0.15, mats.metal, -0.85, 0.25, 0.85));
        g.add(voxel(0.15, 2.2, 0.15, mats.metal, 0.85, 0.25, 0.85));

        // Glass roof (greenhouse)
        g.add(voxel(2.1, 0.12, 2.1, mats.glass, 0, 2.45, 0));
        g.add(voxel(2.0, 0.08, 0.08, mats.metal, 0, 2.5, -0.5));
        g.add(voxel(2.0, 0.08, 0.08, mats.metal, 0, 2.5, 0.5));
        g.add(voxel(0.08, 0.08, 2.0, mats.metal, -0.5, 2.5, 0));
        g.add(voxel(0.08, 0.08, 2.0, mats.metal, 0.5, 2.5, 0));

        // Central kitchen/bar
        g.add(voxel(1.4, 1.8, 0.4, mats.wood, 0, 0.25, -0.7));
        g.add(voxel(1.5, 0.1, 0.5, mats.metal, 0, 1.8, -0.7));

        // Hydroponic beds
        g.add(voxel(0.5, 0.5, 0.5, mats.leaf, -0.5, 0.25, 0.5));
        g.add(voxel(0.5, 0.6, 0.5, mats.progressGreen, 0.5, 0.25, 0.5));
        g.add(voxel(0.4, 0.4, 0.4, mats.leaf, 0, 0.25, 0.5));

        // Grow lights
        g.add(voxel(0.08, 0.08, 0.08, mats.emissiveGreen, -0.5, 1.5, 0.5));
        g.add(voxel(0.08, 0.08, 0.08, mats.emissiveGreen, 0.5, 1.5, 0.5));

        // Tables
        g.add(voxel(0.6, 0.5, 0.4, mats.wood, -0.5, 0.25, -0.2));
        g.add(voxel(0.6, 0.5, 0.4, mats.wood, 0.5, 0.25, -0.2));

        return g;
    },

    // SOCIAL HUB - Large geodesic dome recreation center
    [BuildingType.SOCIAL_HUB]: () => {
        const g = new THREE.Group();
        // Foundation
        g.add(voxel(2.0, 0.25, 2.0, mats.concrete, 0, 0, 0));

        // Main dome (larger)
        const dome = new THREE.Mesh(
            new THREE.SphereGeometry(1.1, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
            mats.glass
        );
        dome.position.y = 0.25;
        g.add(dome);

        // Dome frame rings
        for (let r = 0.3; r <= 1.0; r += 0.35) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(r, 0.03, 8, 24),
                mats.metal
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 0.25 + Math.sqrt(1.1 * 1.1 - r * r) * 0.5;
            g.add(ring);
        }

        // Central pillar with beacon
        g.add(voxel(0.4, 1.6, 0.4, mats.metal, 0, 0.25, 0));
        g.add(voxel(0.2, 0.2, 0.2, mats.emissiveCyan, 0, 1.85, 0));

        // Seating areas around dome
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * 0.7;
            const z = Math.sin(angle) * 0.7;
            g.add(voxel(0.25, 0.15, 0.25, mats.wood, x, 0.25, z));
        }

        // Entrance arch
        g.add(voxel(0.5, 0.8, 0.15, mats.metal, 0, 0.25, 1.0));

        // Decorative lights
        g.add(voxel(0.1, 0.1, 0.1, mats.emissiveGreen, 0.8, 0.5, 0));
        g.add(voxel(0.1, 0.1, 0.1, mats.emissiveCyan, -0.8, 0.5, 0));

        return g;
    },

    // SOLAR ARRAY - Large tilted solar panel installation
    [BuildingType.SOLAR_ARRAY]: () => {
        const g = new THREE.Group();
        // Foundation rails
        g.add(voxel(1.9, 0.15, 0.15, mats.metal, 0, 0, -0.3));
        g.add(voxel(1.9, 0.15, 0.15, mats.metal, 0, 0, 0.3));

        // Support structure
        g.add(voxel(0.1, 0.8, 0.1, mats.metal, -0.7, 0.15, 0));
        g.add(voxel(0.1, 0.8, 0.1, mats.metal, 0, 0.15, 0));
        g.add(voxel(0.1, 0.8, 0.1, mats.metal, 0.7, 0.15, 0));

        // Panel bed
        const bed = new THREE.Group();
        bed.position.y = 0.95;
        bed.rotation.x = Math.PI / 5;

        // Panel frame
        bed.add(voxel(2.0, 0.12, 1.4, mats.metal, 0, 0, 0));

        // Solar cells (detailed grid)
        for (let x = -0.75; x <= 0.75; x += 0.5) {
            for (let z = -0.5; z <= 0.5; z += 0.5) {
                bed.add(voxel(0.45, 0.06, 0.45, mats.solar, x, 0.08, z));
            }
        }

        bed.userData = { isSolarPanel: true };
        g.add(bed);

        // Inverter box
        g.add(voxel(0.3, 0.4, 0.2, mats.metal, 0.8, 0.15, 0));
        g.add(voxel(0.1, 0.1, 0.05, mats.emissiveGreen, 0.8, 0.4, 0.11));

        return g;
    },

    // COMMUNITY GARDEN - Larger organic farm with paths
    [BuildingType.COMMUNITY_GARDEN]: () => {
        const g = new THREE.Group();
        // Dirt base
        g.add(voxel(2.0, 0.15, 2.0, mats.dirt, 0, 0, 0));

        // Walking paths (cross pattern)
        g.add(voxel(0.3, 0.08, 2.0, mats.concrete, 0, 0.15, 0));
        g.add(voxel(2.0, 0.08, 0.3, mats.concrete, 0, 0.15, 0));

        // Planter beds in corners
        const planter = (x: number, z: number, plantColor: THREE.Material, height: number) => {
            g.add(voxel(0.75, 0.35, 0.75, mats.wood, x, 0.15, z));
            g.add(voxel(0.65, height, 0.65, plantColor, x, 0.35, z));
        };

        planter(-0.55, -0.55, mats.leaf, 0.5);
        planter(0.55, -0.55, mats.progressGreen, 0.6);
        planter(-0.55, 0.55, mats.progressGreen, 0.4);
        planter(0.55, 0.55, mats.leaf, 0.55);

        // Small trees/tall plants
        g.add(voxel(0.15, 0.8, 0.15, mats.wood, -0.55, 0.5, -0.55));
        g.add(voxel(0.4, 0.4, 0.4, mats.leaf, -0.55, 1.0, -0.55));

        // Water barrel
        g.add(voxel(0.25, 0.5, 0.25, mats.blueMetal, 0.85, 0.15, 0));

        // Decorative fence posts
        g.add(voxel(0.1, 0.6, 0.1, mats.wood, -0.95, 0.15, -0.95));
        g.add(voxel(0.1, 0.6, 0.1, mats.wood, 0.95, 0.15, -0.95));
        g.add(voxel(0.1, 0.6, 0.1, mats.wood, -0.95, 0.15, 0.95));
        g.add(voxel(0.1, 0.6, 0.1, mats.wood, 0.95, 0.15, 0.95));

        return g;
    },

    // WIND TURBINE - Tall modern turbine
    [BuildingType.WIND_TURBINE]: () => {
        const g = new THREE.Group();
        // Concrete base
        g.add(voxel(1.0, 0.3, 1.0, mats.concrete, 0, 0, 0));

        // Tapered tower
        g.add(voxel(0.5, 1.5, 0.5, mats.white, 0, 0.3, 0));
        g.add(voxel(0.45, 1.5, 0.45, mats.white, 0, 1.8, 0));
        g.add(voxel(0.4, 1.5, 0.4, mats.white, 0, 3.3, 0));
        g.add(voxel(0.35, 1.5, 0.35, mats.white, 0, 4.8, 0));

        // Nacelle (generator housing)
        g.add(voxel(0.8, 0.5, 0.4, mats.white, 0, 6.3, 0.3));

        // Rotor hub
        const rotor = new THREE.Group();
        rotor.position.set(0, 6.5, 0.9);
        rotor.userData = { isRotor: true };

        // Hub
        rotor.add(voxel(0.25, 0.25, 0.3, mats.metal, 0, 0, 0));

        // Three blades
        for (let i = 0; i < 3; i++) {
            const blade = new THREE.Group();
            blade.rotation.z = i * (Math.PI * 2 / 3);

            // Blade with taper
            blade.add(voxel(0.25, 1.5, 0.06, mats.white, 0, 0.9, 0));
            blade.add(voxel(0.2, 1.5, 0.05, mats.white, 0, 2.4, 0));
            blade.add(voxel(0.15, 1.0, 0.04, mats.white, 0, 3.6, 0));

            rotor.add(blade);
        }
        g.add(rotor);

        // Warning light
        g.add(voxel(0.15, 0.15, 0.15, mats.emissiveRed, 0, 6.85, 0));

        return g;
    },

    // SECURITY POST - Guard tower with search light
    [BuildingType.SECURITY_POST]: () => {
        const g = new THREE.Group();
        // Foundation
        g.add(voxel(1.0, 0.4, 1.0, mats.concrete, 0, 0, 0));

        // Base building
        g.add(voxel(0.8, 1.2, 0.8, mats.metal, 0, 0.4, 0));
        g.add(voxel(0.3, 0.5, 0.05, mats.glass, 0, 0.9, 0.41));

        // Tower shaft
        g.add(voxel(0.35, 4.0, 0.35, mats.metal, 0, 1.6, 0));

        // Observation deck
        g.add(voxel(1.2, 0.15, 1.2, mats.concrete, 0, 5.0, 0));

        // Guard booth
        g.add(voxel(1.0, 1.0, 1.0, mats.glass, 0, 5.15, 0));
        g.add(voxel(1.05, 0.1, 1.05, mats.metal, 0, 6.15, 0));

        // Railings
        g.add(voxel(1.3, 0.6, 0.08, mats.metal, 0, 5.15, 0.6));
        g.add(voxel(1.3, 0.6, 0.08, mats.metal, 0, 5.15, -0.6));
        g.add(voxel(0.08, 0.6, 1.2, mats.metal, 0.6, 5.15, 0));
        g.add(voxel(0.08, 0.6, 1.2, mats.metal, -0.6, 5.15, 0));

        // Search light
        g.add(voxel(0.2, 0.3, 0.2, mats.metal, 0.4, 6.25, 0.4));
        g.add(voxel(0.15, 0.15, 0.15, mats.emissiveCyan, 0.4, 6.55, 0.4));

        // Warning light
        g.add(voxel(0.12, 0.12, 0.12, mats.emissiveRed, 0, 6.3, 0));

        return g;
    },
    // LOCAL SCHOOL - Massive 3x3 educational campus
    [BuildingType.LOCAL_SCHOOL]: () => {
        const g = new THREE.Group();

        // Large foundation/courtyard
        g.add(voxel(3.0, 0.2, 3.0, mats.concrete, 0, 0, 0));

        // MAIN BUILDING - L-shaped structure
        // Main hall (back)
        g.add(voxel(2.6, 2.8, 0.8, mats.brick, 0, 0.2, -1.0));
        // Wing (side)
        g.add(voxel(0.8, 2.8, 1.6, mats.brick, -1.0, 0.2, 0.2));

        // Windows - Main building front
        for (let y = 0.6; y <= 2.2; y += 0.8) {
            for (let x = -1.0; x <= 1.0; x += 0.5) {
                g.add(voxel(0.35, 0.5, 0.1, mats.glass, x, y, -0.55));
            }
        }

        // Windows - Wing side
        for (let y = 0.6; y <= 2.2; y += 0.8) {
            for (let z = -0.4; z <= 0.8; z += 0.6) {
                g.add(voxel(0.1, 0.5, 0.4, mats.glass, -0.55, y, z));
            }
        }

        // Main entrance with canopy
        g.add(voxel(0.8, 1.2, 0.15, mats.wood, 0, 0.2, -0.55));
        g.add(voxel(1.2, 0.1, 0.6, mats.metal, 0, 1.6, -0.35));
        g.add(voxel(0.1, 0.8, 0.1, mats.metal, -0.5, 0.8, -0.1));
        g.add(voxel(0.1, 0.8, 0.1, mats.metal, 0.5, 0.8, -0.1));

        // Roofs
        g.add(voxel(2.8, 0.25, 1.0, mats.metal, 0, 3.0, -1.0));
        g.add(voxel(1.0, 0.25, 1.8, mats.metal, -1.0, 3.0, 0.2));

        // BELL TOWER
        g.add(voxel(0.5, 4.0, 0.5, mats.brick, 1.1, 0.2, -1.1));
        g.add(voxel(0.6, 0.15, 0.6, mats.concrete, 1.1, 4.2, -1.1));
        g.add(voxel(0.3, 0.4, 0.3, mats.gold, 1.1, 4.35, -1.1));
        g.add(voxel(0.15, 0.15, 0.15, mats.emissiveGreen, 1.1, 4.75, -1.1));

        // FLAG POLE
        g.add(voxel(0.08, 3.0, 0.08, mats.metal, 1.2, 0.2, 1.2));
        g.add(voxel(0.4, 0.25, 0.05, mats.hazard, 1.2, 3.0, 1.2));

        // PLAYGROUND AREA (front right)
        g.add(voxel(1.2, 0.08, 1.2, mats.asphalt, 0.8, 0.2, 0.8));

        // Swing set
        g.add(voxel(0.1, 1.2, 0.1, mats.metal, 0.5, 0.28, 0.5));
        g.add(voxel(0.1, 1.2, 0.1, mats.metal, 1.1, 0.28, 0.5));
        g.add(voxel(0.7, 0.08, 0.08, mats.metal, 0.8, 1.48, 0.5));
        g.add(voxel(0.05, 0.5, 0.05, mats.metal, 0.65, 1.0, 0.5));
        g.add(voxel(0.15, 0.08, 0.1, mats.wood, 0.65, 0.5, 0.5));
        g.add(voxel(0.05, 0.5, 0.05, mats.metal, 0.95, 1.0, 0.5));
        g.add(voxel(0.15, 0.08, 0.1, mats.wood, 0.95, 0.5, 0.5));

        // Slide
        g.add(voxel(0.15, 1.0, 0.15, mats.metal, 1.0, 0.28, 1.0));
        g.add(voxel(0.4, 0.08, 0.4, mats.metal, 1.0, 1.28, 1.0));
        const slide = voxel(0.25, 0.06, 0.8, mats.blueMetal, 1.0, 0.8, 0.55);
        slide.rotation.x = 0.5;
        g.add(slide);

        // BENCHES around courtyard
        g.add(voxel(0.6, 0.3, 0.2, mats.wood, -0.3, 0.2, 0.5));
        g.add(voxel(0.6, 0.3, 0.2, mats.wood, 0.4, 0.2, 1.2));

        // TREES/PLANTERS
        g.add(voxel(0.4, 0.3, 0.4, mats.concrete, -1.2, 0.2, 1.0));
        g.add(voxel(0.2, 0.8, 0.2, mats.wood, -1.2, 0.5, 1.0));
        g.add(voxel(0.5, 0.5, 0.5, mats.leaf, -1.2, 1.1, 1.0));

        // Bicycle rack
        g.add(voxel(0.6, 0.4, 0.15, mats.metal, 0.3, 0.2, -0.15));

        // School sign
        g.add(voxel(0.8, 0.5, 0.1, mats.white, 0, 2.5, -0.5));
        g.add(voxel(0.6, 0.3, 0.05, mats.emissiveCyan, 0, 2.55, -0.44));

        return g;
    },

    // SAFARI LODGE - Massive 3x3 eco-lodge resort with wooden cabins and lush gardens
    [BuildingType.SAFARI_LODGE]: () => {
        const g = new THREE.Group();

        // LUSH GRASS BASE with garden paths
        g.add(voxel(3.0, 0.15, 3.0, mats.progressGreen, 0, 0, 0));

        // Stone pathways
        g.add(voxel(0.4, 0.08, 2.8, mats.concrete, 0, 0.15, 0));
        g.add(voxel(2.0, 0.08, 0.4, mats.concrete, 0, 0.15, 0.5));
        g.add(voxel(1.0, 0.08, 0.4, mats.concrete, -0.8, 0.15, -0.8));

        // MAIN LODGE BUILDING (center-back) - Wooden cabin style
        g.add(voxel(1.8, 0.15, 1.2, mats.wood, 0, 0.15, -0.8)); // Foundation
        g.add(voxel(1.6, 1.6, 1.0, mats.wood, 0, 0.3, -0.8)); // Main cabin
        g.add(voxel(1.7, 0.1, 1.1, mats.wood, 0, 1.9, -0.8)); // Roof trim
        // Pitched roof
        g.add(voxel(1.8, 0.4, 0.6, mats.wood, 0, 2.0, -0.8));
        g.add(voxel(1.4, 0.3, 0.4, mats.wood, 0, 2.4, -0.8));
        g.add(voxel(0.8, 0.2, 0.3, mats.wood, 0, 2.7, -0.8));

        // Lodge windows
        g.add(voxel(0.4, 0.5, 0.1, mats.glass, -0.4, 0.8, -0.24));
        g.add(voxel(0.4, 0.5, 0.1, mats.glass, 0.4, 0.8, -0.24));
        g.add(voxel(0.5, 0.6, 0.1, mats.glass, 0, 1.2, -0.24));

        // Lodge entrance porch
        g.add(voxel(1.0, 0.1, 0.5, mats.wood, 0, 0.15, -0.1));
        g.add(voxel(0.5, 1.0, 0.1, mats.wood, 0, 0.25, -0.2)); // Door
        g.add(voxel(0.1, 1.2, 0.1, mats.wood, -0.4, 0.25, 0.05)); // Porch post
        g.add(voxel(0.1, 1.2, 0.1, mats.wood, 0.4, 0.25, 0.05)); // Porch post
        g.add(voxel(1.0, 0.1, 0.6, mats.wood, 0, 1.45, -0.05)); // Porch roof

        // GUEST CABIN 1 (left) - Smaller wooden cabin
        g.add(voxel(0.9, 0.1, 0.9, mats.wood, -1.0, 0.15, 0.9)); // Foundation
        g.add(voxel(0.8, 1.2, 0.8, mats.wood, -1.0, 0.25, 0.9)); // Cabin
        g.add(voxel(0.9, 0.3, 0.5, mats.wood, -1.0, 1.45, 0.9)); // Roof
        g.add(voxel(0.6, 0.2, 0.3, mats.wood, -1.0, 1.75, 0.9)); // Roof peak
        g.add(voxel(0.3, 0.4, 0.1, mats.glass, -1.0, 0.7, 0.49)); // Window

        // GUEST CABIN 2 (right) - Smaller wooden cabin
        g.add(voxel(0.9, 0.1, 0.9, mats.wood, 1.0, 0.15, 0.9)); // Foundation
        g.add(voxel(0.8, 1.2, 0.8, mats.wood, 1.0, 0.25, 0.9)); // Cabin
        g.add(voxel(0.9, 0.3, 0.5, mats.wood, 1.0, 1.45, 0.9)); // Roof
        g.add(voxel(0.6, 0.2, 0.3, mats.wood, 1.0, 1.75, 0.9)); // Roof peak
        g.add(voxel(0.3, 0.4, 0.1, mats.glass, 1.0, 0.7, 0.49)); // Window

        // SWIMMING POOL / POND (center-front)
        g.add(voxel(1.0, 0.15, 0.8, mats.concrete, 0, 0.15, 0.6)); // Pool edge
        g.add(voxel(0.9, 0.1, 0.7, mats.glass, 0, 0.12, 0.6)); // Water

        // LARGE TREES
        const addTree = (x: number, z: number, height: number) => {
            g.add(voxel(0.2, height, 0.2, mats.wood, x, 0.15, z));
            g.add(voxel(0.7, 0.6, 0.7, mats.leaf, x, height * 0.6, z));
            g.add(voxel(0.5, 0.5, 0.5, mats.leaf, x, height * 0.85, z));
            g.add(voxel(0.3, 0.4, 0.3, mats.leaf, x, height * 1.05, z));
        };
        addTree(-1.2, -1.2, 1.8);
        addTree(1.2, -1.2, 2.0);
        addTree(-1.3, 0, 1.5);
        addTree(1.3, 0, 1.6);

        // FLOWER GARDENS
        const addFlowerBed = (x: number, z: number) => {
            g.add(voxel(0.4, 0.25, 0.4, mats.leaf, x, 0.15, z));
            g.add(voxel(0.1, 0.15, 0.1, mats.emissiveRed, x - 0.1, 0.4, z - 0.1));
            g.add(voxel(0.1, 0.15, 0.1, mats.gold, x + 0.1, 0.4, z + 0.1));
            g.add(voxel(0.1, 0.12, 0.1, mats.emissiveCyan, x, 0.35, z));
        };
        addFlowerBed(-0.6, 0.3);
        addFlowerBed(0.6, 0.3);
        addFlowerBed(-0.5, -0.4);
        addFlowerBed(0.5, -0.4);

        // BUSHES/HEDGES around perimeter
        g.add(voxel(0.5, 0.4, 0.3, mats.leaf, -1.3, 0.15, -0.4));
        g.add(voxel(0.5, 0.4, 0.3, mats.leaf, 1.3, 0.15, -0.4));
        g.add(voxel(0.3, 0.35, 0.5, mats.progressGreen, -0.7, 0.15, 1.3));
        g.add(voxel(0.3, 0.35, 0.5, mats.progressGreen, 0.7, 0.15, 1.3));

        // WOODEN FENCE (partial, decorative)
        g.add(voxel(0.08, 0.6, 1.5, mats.wood, -1.45, 0.15, 0.6));
        g.add(voxel(0.08, 0.6, 1.5, mats.wood, 1.45, 0.15, 0.6));
        g.add(voxel(1.5, 0.6, 0.08, mats.wood, 0, 0.15, 1.45));

        // OUTDOOR DINING AREA
        g.add(voxel(0.5, 0.35, 0.5, mats.wood, 0.4, 0.15, -0.3)); // Table
        g.add(voxel(0.2, 0.25, 0.2, mats.wood, 0.2, 0.15, -0.3)); // Chair
        g.add(voxel(0.2, 0.25, 0.2, mats.wood, 0.6, 0.15, -0.3)); // Chair

        // LANTERNS with warm glow
        const addLantern = (x: number, z: number) => {
            g.add(voxel(0.1, 1.0, 0.1, mats.wood, x, 0.15, z));
            g.add(voxel(0.18, 0.3, 0.18, mats.gold, x, 1.15, z));
            g.add(voxel(0.12, 0.12, 0.12, mats.emissiveGreen, x, 1.4, z));
        };
        addLantern(-0.2, 0.95);
        addLantern(0.2, 0.95);
        addLantern(-0.6, -0.1);
        addLantern(0.6, -0.1);

        // POTTED PLANTS on porch
        g.add(voxel(0.15, 0.2, 0.15, mats.concrete, -0.35, 0.25, 0.1));
        g.add(voxel(0.12, 0.3, 0.12, mats.leaf, -0.35, 0.45, 0.1));
        g.add(voxel(0.15, 0.2, 0.15, mats.concrete, 0.35, 0.25, 0.1));
        g.add(voxel(0.12, 0.3, 0.12, mats.progressGreen, 0.35, 0.45, 0.1));

        // WELCOME SIGN
        g.add(voxel(0.1, 0.8, 0.1, mats.wood, 0, 0.15, 1.3));
        g.add(voxel(0.5, 0.3, 0.08, mats.wood, 0, 0.8, 1.3));

        return g;
    },

    // GREEN TECH LAB - Massive 3x3 research biosphere complex
    [BuildingType.GREEN_TECH_LAB]: () => {
        const g = new THREE.Group();

        // Large foundation
        g.add(voxel(3.0, 0.3, 3.0, mats.concrete, 0, 0, 0));

        // MAIN RESEARCH BUILDING (center)
        g.add(voxel(1.8, 2.5, 1.8, mats.white, 0, 0.3, 0));

        // Glass facade panels
        for (let y = 0.7; y <= 2.2; y += 0.5) {
            g.add(voxel(1.6, 0.2, 0.1, mats.glass, 0, y, 0.91));
            g.add(voxel(0.1, 0.2, 1.6, mats.glass, 0.91, y, 0));
            g.add(voxel(0.1, 0.2, 1.6, mats.glass, -0.91, y, 0));
        }

        // MAIN BIOSPHERE DOME (on top of main building)
        const mainDome = new THREE.Mesh(
            new THREE.SphereGeometry(1.0, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
            mats.glass
        );
        mainDome.position.set(0, 2.8, 0);
        g.add(mainDome);

        // Dome frame rings
        for (let r = 0.3; r <= 0.9; r += 0.3) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(r, 0.04, 8, 24),
                mats.greenMetal
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 2.8 + Math.sqrt(1.0 - r * r) * 0.5;
            g.add(ring);
        }

        // Plants inside main dome
        g.add(voxel(0.5, 0.7, 0.5, mats.leaf, 0, 2.8, 0));
        g.add(voxel(0.3, 0.9, 0.3, mats.progressGreen, 0.3, 2.8, 0.3));
        g.add(voxel(0.25, 0.6, 0.25, mats.leaf, -0.3, 2.8, -0.2));

        // EQUIPMENT TOWERS (corners)
        // Tower 1 - Processing
        g.add(voxel(0.6, 3.5, 0.6, mats.metal, 1.1, 0.3, 1.1));
        g.add(voxel(0.65, 0.12, 0.65, mats.greenMetal, 1.1, 1.5, 1.1));
        g.add(voxel(0.65, 0.12, 0.65, mats.greenMetal, 1.1, 2.3, 1.1));
        g.add(voxel(0.65, 0.12, 0.65, mats.greenMetal, 1.1, 3.1, 1.1));
        g.add(voxel(0.25, 0.3, 0.25, mats.emissiveGreen, 1.1, 3.8, 1.1));

        // Tower 2 - Data processing
        g.add(voxel(0.6, 3.0, 0.6, mats.metal, -1.1, 0.3, 1.1));
        g.add(voxel(0.2, 0.2, 0.1, mats.emissiveCyan, -1.1, 1.2, 1.42));
        g.add(voxel(0.2, 0.2, 0.1, mats.emissiveCyan, -1.1, 1.8, 1.42));
        g.add(voxel(0.2, 0.2, 0.1, mats.emissiveCyan, -1.1, 2.4, 1.42));
        g.add(voxel(0.7, 0.15, 0.7, mats.greenMetal, -1.1, 3.3, 1.1));

        // Tower 3 - Air processing
        g.add(voxel(0.5, 4.0, 0.5, mats.white, -1.1, 0.3, -1.1));
        g.add(voxel(0.6, 0.2, 0.6, mats.metal, -1.1, 4.3, -1.1));
        g.add(voxel(0.3, 0.3, 0.3, mats.emissiveGreen, -1.1, 4.5, -1.1));

        // SOLAR ARRAY WING (right side)
        g.add(voxel(0.8, 0.08, 0.8, mats.metal, 1.1, 0.3, -0.9));
        const solarWing = new THREE.Group();
        solarWing.position.set(1.1, 0.8, -0.9);
        solarWing.rotation.x = Math.PI / 5;
        solarWing.add(voxel(0.9, 0.08, 0.8, mats.solar, 0, 0, 0));
        g.add(solarWing);

        // GREENHOUSE ANNEX (back left)
        g.add(voxel(1.0, 1.2, 0.8, mats.glass, -0.9, 0.3, -0.9));
        g.add(voxel(1.05, 0.1, 0.85, mats.metal, -0.9, 1.5, -0.9));
        // Plants in greenhouse
        g.add(voxel(0.3, 0.5, 0.3, mats.leaf, -1.0, 0.3, -0.9));
        g.add(voxel(0.25, 0.6, 0.25, mats.progressGreen, -0.75, 0.3, -0.8));
        g.add(voxel(0.25, 0.4, 0.25, mats.leaf, -0.9, 0.3, -1.1));

        // PATHWAYS
        g.add(voxel(0.5, 0.05, 2.0, mats.concrete, 0.5, 0.3, 0));
        g.add(voxel(2.0, 0.05, 0.5, mats.concrete, 0, 0.3, 0.5));

        // MAIN ENTRANCE
        g.add(voxel(0.7, 1.2, 0.15, mats.glass, 0, 0.3, 0.93));
        g.add(voxel(0.9, 0.15, 0.5, mats.metal, 0, 1.5, 1.05)); // Canopy

        // RESEARCH EQUIPMENT (scattered)
        g.add(voxel(0.3, 0.4, 0.3, mats.metal, 0.6, 0.3, -0.4));
        g.add(voxel(0.1, 0.1, 0.1, mats.emissiveCyan, 0.6, 0.7, -0.4));

        // WATER FEATURE (eco pond)
        g.add(voxel(0.6, 0.1, 0.6, mats.glass, 0.9, 0.3, 0.4));
        g.add(voxel(0.15, 0.3, 0.15, mats.leaf, 1.0, 0.4, 0.5));

        // HELIPAD marking (for research deliveries)
        g.add(voxel(0.8, 0.02, 0.8, mats.concrete, -0.5, 0.32, 0.9));
        g.add(voxel(0.1, 0.03, 0.5, mats.hazard, -0.5, 0.34, 0.9));
        g.add(voxel(0.5, 0.03, 0.1, mats.hazard, -0.5, 0.34, 0.9));

        return g;
    },

    // MINING HEADFRAME - Massive industrial A-frame derrick (4x4)
    [BuildingType.MINING_HEADFRAME]: () => {
        const g = new THREE.Group();
        // Reinforced concrete foundation with inner shaft opening
        g.add(voxel(3.8, 0.4, 3.8, mats.concrete, 0, 0, 0));
        g.add(voxel(1.2, 0.1, 1.2, mats.metal, 0, 0.2, 0)); // Shaft cap

        // Main A-Frame Derrick (Inner core)
        g.add(voxel(0.4, 7.5, 0.4, mats.metal, -1.2, 3.75, -1.2));
        g.add(voxel(0.4, 7.5, 0.4, mats.metal, 1.2, 3.75, -1.2));
        g.add(voxel(0.4, 7.5, 0.4, mats.metal, -1.2, 3.75, 1.2));
        g.add(voxel(0.4, 7.5, 0.4, mats.metal, 1.2, 3.75, 1.2));

        // Structural Bracing (Complex cross pattern)
        for (let y = 1.5; y < 7.0; y += 2.0) {
            g.add(voxel(2.4, 0.15, 0.15, mats.metalLight, 0, y, -1.2));
            g.add(voxel(2.4, 0.15, 0.15, mats.metalLight, 0, y, 1.2));
            g.add(voxel(0.15, 0.15, 2.4, mats.metalLight, -1.2, y, 0));
            g.add(voxel(0.15, 0.15, 2.4, mats.metalLight, 1.2, y, 0));
        }

        // Top Sheave Deck (Dual Pulley Wheels)
        g.add(voxel(3.0, 0.2, 3.0, mats.metal, 0, 7.5, 0));
        // Pulley 1
        g.add(voxel(1.8, 1.8, 0.2, mats.hazard, 0.4, 8.5, 0)); // Outer ring
        g.add(voxel(0.1, 0.1, 0.1, mats.metalLight, 0.4, 8.5, 0)); // Axle
        // Pulley 2
        g.add(voxel(1.8, 1.8, 0.2, mats.hazard, -0.4, 8.5, 0));

        // Hoist Cables
        g.add(voxel(0.06, 8.0, 0.06, mats.metalLight, 0.4, 4.0, 0));
        g.add(voxel(0.06, 8.0, 0.06, mats.metalLight, -0.4, 4.0, 0));

        // Side Control Shack (Floating)
        g.add(voxel(1.2, 1.2, 1.2, mats.metalLight, -1.8, 4.5, 1.2));
        g.add(voxel(0.8, 0.6, 0.1, mats.glass, -1.8, 4.8, 1.8)); // Observation window

        // Ore Loading Chute & Conveyor
        g.add(voxel(1.0, 3.0, 1.0, mats.metal, 1.5, 1.5, 1.5)); // Drop tower
        g.add(voxel(2.5, 0.3, 0.8, mats.hazard, 2.5, 2.5, 1.5)); // Conveyor bridge
        g.add(voxel(1.2, 1.2, 1.2, mats.concrete, 3.5, 0.6, 1.5)); // Receiving station

        // Safety details
        g.add(voxel(0.2, 0.2, 0.2, mats.hazard, -1.4, 7.5, -1.4)); // Warning light top
        g.add(voxel(0.2, 0.1, 0.6, mats.hazard, 0, 0.25, 1.8)); // Safety tape stripes

        return g;
    },

    // ORE FOUNDRY - Industrial smelting complex (3x3)
    [BuildingType.ORE_FOUNDRY]: () => {
        const g = new THREE.Group();
        // Heavy Industrial Deck
        g.add(voxel(2.8, 0.4, 2.8, mats.concrete, 0, 0, 0));

        // Main Smelting Kiln (Horizontal Processing Tube)
        g.add(voxel(2.4, 1.2, 1.2, mats.metal, 0, 1.0, 0));
        g.add(voxel(1.0, 1.0, 1.0, mats.metalLight, -1.2, 1.0, 0)); // Feed head
        g.add(voxel(1.0, 1.0, 1.0, mats.metalLight, 1.2, 1.0, 0)); // Output head

        // High-Temp Furnace Core
        g.add(voxel(1.5, 2.0, 1.5, mats.concrete, 0, 1.2, -0.8));
        g.add(voxel(0.6, 0.6, 0.1, mats.hazard, 0, 1.2, -0.1)); // Glowing slag view-port

        // Molten Slag Vats
        g.add(voxel(0.8, 0.4, 0.8, mats.metal, -0.8, 0.4, 0.8));
        g.add(voxel(0.6, 0.1, 0.6, mats.hazard, -0.8, 0.61, 0.8)); // Liquid orange slag
        g.add(voxel(0.8, 0.4, 0.8, mats.metal, 0.8, 0.4, 0.8));
        g.add(voxel(0.6, 0.1, 0.6, mats.hazard, 0.8, 0.61, 0.8));

        // Triple Smokestacks (Heat Dissipation)
        g.add(voxel(0.4, 4.0, 0.4, mats.concrete, -0.8, 2.0, -0.8));
        g.add(voxel(0.4, 3.5, 0.4, mats.concrete, 0.8, 1.8, -0.8));
        g.add(voxel(0.3, 4.2, 0.3, mats.metal, 0, 2.1, 0.8));

        // Complex Pipe Network
        g.add(voxel(0.15, 0.15, 1.5, mats.metalLight, -0.6, 1.8, 0));
        g.add(voxel(1.5, 0.15, 0.15, mats.metalLight, 0, 2.5, -0.8));
        g.add(voxel(0.15, 1.2, 0.15, mats.metalLight, 0.5, 0.8, 0.5)); // Vertical riser

        // Emergency Steam Vents
        g.add(voxel(0.3, 0.6, 0.3, mats.hazard, 1.2, 1.6, 0.4));
        g.add(voxel(0.3, 0.6, 0.3, mats.hazard, -1.2, 1.6, 0.4));

        return g;
    },

    // WORKSHOP - Construction speed boost facility (2x2)
    [BuildingType.WORKSHOP]: () => {
        const g = new THREE.Group();
        // Foundation
        g.add(voxel(2.0, 0.25, 2.0, mats.concrete, 0, 0, 0));

        // Main building with corrugated metal walls
        g.add(voxel(1.6, 1.8, 1.6, mats.metal, 0, 0.25, 0));

        // Roof (slanted shed style)
        g.add(voxel(1.8, 0.15, 1.8, mats.metalLight, 0, 2.05, 0));
        g.add(voxel(1.6, 0.1, 1.6, mats.metalLight, 0, 2.2, -0.1));

        // Large garage door (front)
        g.add(voxel(1.0, 1.4, 0.1, mats.metalLight, 0, 0.25, 0.81));
        g.add(voxel(0.9, 1.3, 0.05, mats.darkPipe, 0, 0.3, 0.83));

        // Windows (sides)
        g.add(voxel(0.08, 0.5, 0.6, mats.glass, 0.81, 1.0, 0));
        g.add(voxel(0.08, 0.5, 0.6, mats.glass, -0.81, 1.0, 0));

        // Workbenches inside
        g.add(voxel(0.6, 0.5, 0.3, mats.wood, -0.5, 0.25, -0.5));
        g.add(voxel(0.6, 0.5, 0.3, mats.wood, 0.5, 0.25, -0.5));

        // Tool racks
        g.add(voxel(0.08, 1.0, 0.4, mats.metal, -0.75, 0.8, -0.7));
        g.add(voxel(0.08, 1.0, 0.4, mats.metal, 0.75, 0.8, -0.7));

        // Hanging tools (colored accents)
        g.add(voxel(0.05, 0.15, 0.05, mats.hazard, -0.75, 1.3, -0.6));
        g.add(voxel(0.05, 0.2, 0.05, mats.blueMetal, -0.75, 1.3, -0.75));
        g.add(voxel(0.05, 0.15, 0.05, mats.hazard, 0.75, 1.3, -0.6));

        // Floor markings
        g.add(voxel(1.4, 0.02, 0.15, mats.hazard, 0, 0.26, 0.3));

        // Exterior details - AC unit
        g.add(voxel(0.4, 0.3, 0.3, mats.metal, 0.7, 1.6, -0.85));

        // Light fixture
        g.add(voxel(0.3, 0.1, 0.3, mats.metal, 0, 1.95, 0));
        g.add(voxel(0.15, 0.08, 0.15, mats.emissiveGreen, 0, 1.87, 0));

        // Signage
        g.add(voxel(0.5, 0.3, 0.08, mats.blueMetal, 0, 1.7, 0.85));

        return g;
    },

    // STORAGE_DEPOT - Expanded mineral storage (2x2)
    [BuildingType.STORAGE_DEPOT]: () => {
        const g = new THREE.Group();
        // Foundation
        g.add(voxel(2.0, 0.2, 2.0, mats.concrete, 0, 0, 0));

        // Main warehouse structure
        g.add(voxel(1.8, 2.0, 1.8, mats.metalLight, 0, 0.2, 0));

        // Corrugated roof
        g.add(voxel(2.0, 0.15, 2.0, mats.metal, 0, 2.2, 0));

        // Loading dock (front)
        g.add(voxel(1.5, 0.3, 0.4, mats.concrete, 0, 0.2, 1.1));

        // Large cargo doors
        g.add(voxel(0.6, 1.5, 0.1, mats.hazard, -0.45, 0.2, 0.91));
        g.add(voxel(0.6, 1.5, 0.1, mats.hazard, 0.45, 0.2, 0.91));

        // Crates and containers inside (visible)
        g.add(voxel(0.5, 0.5, 0.5, mats.wood, -0.5, 0.2, -0.4));
        g.add(voxel(0.5, 0.5, 0.5, mats.blueMetal, 0.5, 0.2, -0.4));
        g.add(voxel(0.4, 0.4, 0.4, mats.wood, -0.5, 0.7, -0.4));
        g.add(voxel(0.6, 0.6, 0.6, mats.metal, 0, 0.2, -0.5));

        // Forklift
        g.add(voxel(0.3, 0.2, 0.5, mats.hazard, -0.2, 0.2, 0.5));
        g.add(voxel(0.08, 0.5, 0.08, mats.metal, -0.3, 0.4, 0.3));
        g.add(voxel(0.25, 0.08, 0.4, mats.metal, -0.2, 0.4, 0.7));

        // Exterior shelving
        g.add(voxel(0.08, 1.5, 0.5, mats.metal, -0.9, 0.8, 0));

        // Inventory sign
        g.add(voxel(0.6, 0.4, 0.08, mats.white, 0, 1.8, 0.92));
        g.add(voxel(0.4, 0.25, 0.05, mats.emissiveCyan, 0, 1.85, 0.95));

        // Ventilation
        g.add(voxel(0.3, 0.3, 0.3, mats.metal, 0.7, 2.2, 0));

        return g;
    },

    // GENERATOR - Fuel power generator
    [BuildingType.GENERATOR]: () => {
        const g = new THREE.Group();
        // Foundation
        g.add(voxel(1.0, 0.2, 1.0, mats.concrete, 0, 0, 0));

        // Main generator housing
        g.add(voxel(0.9, 1.0, 0.9, mats.metal, 0, 0.2, 0));

        // Ventilation grilles (sides)
        g.add(voxel(0.05, 0.6, 0.6, mats.darkPipe, 0.46, 0.5, 0));
        g.add(voxel(0.05, 0.6, 0.6, mats.darkPipe, -0.46, 0.5, 0));

        // Exhaust pipe
        g.add(voxel(0.2, 1.5, 0.2, mats.metal, 0.3, 1.0, 0.3));
        g.add(voxel(0.25, 0.1, 0.25, mats.darkPipe, 0.3, 2.5, 0.3));

        // Control panel
        g.add(voxel(0.3, 0.4, 0.1, mats.metal, 0, 0.8, 0.46));
        g.add(voxel(0.1, 0.1, 0.05, mats.emissiveGreen, -0.08, 0.95, 0.48));
        g.add(voxel(0.1, 0.1, 0.05, mats.emissiveRed, 0.08, 0.95, 0.48));

        // Fuel tank
        g.add(voxel(0.3, 0.5, 0.3, mats.hazard, -0.3, 0.2, -0.3));

        // Power cables
        g.add(voxel(0.6, 0.08, 0.08, mats.darkPipe, 0, 0.2, 0.55));

        // Top housing
        g.add(voxel(0.95, 0.15, 0.95, mats.metalLight, 0, 1.2, 0));

        // Warning stripes
        g.add(voxel(0.9, 0.08, 0.05, mats.hazard, 0, 0.3, 0.46));

        return g;
    },

    // RESERVOIR - Large industrial water storage (3x3)
    [BuildingType.RESERVOIR]: () => {
        const g = new THREE.Group();

        // Large concrete foundation
        g.add(voxel(3.0, 0.3, 3.0, mats.concrete, 0, 0, 0));

        // Concrete walls (rectangular basin)
        g.add(voxel(3.0, 1.0, 0.2, mats.concrete, 0, 0.3, -1.4)); // Back wall
        g.add(voxel(3.0, 1.0, 0.2, mats.concrete, 0, 0.3, 1.4));  // Front wall
        g.add(voxel(0.2, 1.0, 2.8, mats.concrete, -1.4, 0.3, 0)); // Left wall
        g.add(voxel(0.2, 1.0, 2.8, mats.concrete, 1.4, 0.3, 0));  // Right wall

        // Water surface
        g.add(voxel(2.6, 0.15, 2.6, mats.reservoirWater, 0, 0.9, 0));

        // Metal gantry walkway across top
        g.add(voxel(3.0, 0.1, 0.4, mats.metal, 0, 1.35, 0));
        // Gantry supports
        g.add(voxel(0.1, 0.8, 0.1, mats.metal, -1.3, 0.9, 0));
        g.add(voxel(0.1, 0.8, 0.1, mats.metal, 1.3, 0.9, 0));

        // Railings
        g.add(voxel(3.0, 0.4, 0.05, mats.metalLight, 0, 1.55, 0.18));
        g.add(voxel(3.0, 0.4, 0.05, mats.metalLight, 0, 1.55, -0.18));

        // Pump station (corner)
        g.add(voxel(0.8, 1.5, 0.8, mats.metal, -1.0, 0.3, -1.0));
        g.add(voxel(0.85, 0.1, 0.85, mats.metalLight, -1.0, 1.8, -1.0));

        // Pump pipes connecting to basin
        g.add(voxel(0.15, 0.15, 0.6, mats.blueMetal, -1.0, 0.6, -0.4));
        g.add(voxel(0.15, 0.6, 0.15, mats.blueMetal, -0.7, 0.4, -1.0));

        // Control panel on pump station
        g.add(voxel(0.3, 0.4, 0.1, mats.metal, -0.7, 1.0, -0.55));
        g.add(voxel(0.15, 0.2, 0.05, mats.emissiveGreen, -0.7, 1.15, -0.5));

        // Outlet pipes (side)
        g.add(voxel(0.2, 0.2, 0.8, mats.blueMetal, 1.3, 0.5, 0.8));
        g.add(voxel(0.3, 0.3, 0.5, mats.metal, 1.5, 0.4, 1.2));

        // Water level gauge
        g.add(voxel(0.08, 0.8, 0.08, mats.glass, 1.35, 0.7, -0.8));
        g.add(voxel(0.1, 0.3, 0.1, mats.emissiveCyan, 1.35, 1.1, -0.8));

        // Warning signage
        g.add(voxel(0.4, 0.3, 0.05, mats.hazard, 0, 1.0, 1.43));

        // Ladder access
        g.add(voxel(0.08, 1.2, 0.15, mats.metal, 0.8, 0.6, 1.35));

        // Overflow drain grate
        g.add(voxel(0.4, 0.05, 0.4, mats.metalLight, 1.1, 0.35, 1.1));

        return g;
    },

    // ═══════════════════════════════════════════════════════════════
    // ERA 2: GROWTH - New Buildings
    // ═══════════════════════════════════════════════════════════════

    // MEDICAL_BAY - Field hospital (2x2)
    [BuildingType.MEDICAL_BAY]: () => {
        const g = new THREE.Group();
        // Base platform
        g.add(voxel(2.0, 0.15, 2.0, mats.concrete, 0, 0, 0));
        // Main building
        g.add(voxel(1.8, 1.2, 1.8, mats.white, 0, 0.15, 0));
        // Red cross on roof
        g.add(voxel(0.6, 0.1, 0.15, mats.emissiveRed, 0, 1.4, 0));
        g.add(voxel(0.15, 0.1, 0.6, mats.emissiveRed, 0, 1.4, 0));
        // Windows
        g.add(voxel(0.5, 0.4, 0.05, mats.glass, -0.5, 0.8, 0.91));
        g.add(voxel(0.5, 0.4, 0.05, mats.glass, 0.5, 0.8, 0.91));
        // Door
        g.add(voxel(0.4, 0.8, 0.05, mats.metal, 0, 0.4, 0.91));
        // Ambulance bay awning
        g.add(voxel(0.8, 0.05, 0.4, mats.metalLight, -0.6, 1.0, 1.1));
        // Medical equipment on side
        g.add(voxel(0.3, 0.6, 0.3, mats.metal, 0.75, 0.3, 0.75));
        g.add(voxel(0.1, 0.3, 0.1, mats.emissiveGreen, 0.75, 0.9, 0.75));
        return g;
    },

    // TRAINING_CENTER - Skill academy (2x2)
    [BuildingType.TRAINING_CENTER]: () => {
        const g = new THREE.Group();
        // Foundation
        g.add(voxel(2.0, 0.2, 2.0, mats.concrete, 0, 0, 0));
        // Main building
        g.add(voxel(1.8, 1.5, 1.6, mats.metal, 0, 0.2, 0.1));
        // Classroom windows
        for (let i = -0.5; i <= 0.5; i += 0.5) {
            g.add(voxel(0.35, 0.5, 0.05, mats.glass, i, 1.0, 0.81));
        }
        // Training yard
        g.add(voxel(1.6, 0.05, 0.5, mats.asphalt, 0, 0.2, -0.7));
        // Obstacle course elements
        g.add(voxel(0.15, 0.4, 0.15, mats.wood, -0.5, 0.25, -0.7));
        g.add(voxel(0.15, 0.4, 0.15, mats.wood, 0, 0.25, -0.7));
        g.add(voxel(0.15, 0.4, 0.15, mats.wood, 0.5, 0.25, -0.7));
        // Flag pole
        g.add(voxel(0.06, 1.5, 0.06, mats.metal, -0.85, 0.2, -0.85));
        g.add(voxel(0.3, 0.2, 0.05, mats.emissiveGreen, -0.7, 1.5, -0.85));
        // Roof
        g.add(voxel(1.9, 0.1, 1.7, mats.metalLight, 0, 1.7, 0.1));
        return g;
    },

    // ═══════════════════════════════════════════════════════════════
    // ERA 3: INDUSTRY - New Buildings
    // ═══════════════════════════════════════════════════════════════

    // GEM_REFINERY - Precision gem extraction (2x2)
    [BuildingType.GEM_REFINERY]: () => {
        const g = new THREE.Group();
        // Foundation
        g.add(voxel(2.0, 0.25, 2.0, mats.concrete, 0, 0, 0));
        // Main structure
        g.add(voxel(1.6, 1.4, 1.6, mats.metal, 0, 0.25, 0));
        // Glass dome top (sorting room)
        g.add(voxel(1.0, 0.6, 1.0, mats.glass, 0, 1.65, 0));
        // Gem sorting conveyor
        g.add(voxel(1.8, 0.1, 0.3, mats.metalLight, 0, 0.5, 0));
        // Laser cutters (glowing)
        g.add(voxel(0.1, 0.3, 0.1, mats.emissiveCyan, -0.4, 1.0, 0));
        g.add(voxel(0.1, 0.3, 0.1, mats.emissiveCyan, 0.4, 1.0, 0));
        // Output bins
        g.add(voxel(0.3, 0.3, 0.3, mats.metal, -0.6, 0.25, 0.6));
        g.add(voxel(0.3, 0.3, 0.3, mats.metal, 0.6, 0.25, 0.6));
        // Pipes
        g.add(voxel(0.15, 0.8, 0.15, mats.darkPipe, 0.8, 0.25, -0.8));
        return g;
    },

    // RAIL_LINE - Industrial transport track (1x1)
    [BuildingType.RAIL_LINE]: () => {
        const g = new THREE.Group();
        // Rail bed (gravel)
        g.add(voxel(1.0, 0.08, 0.6, mats.concrete, 0, 0, 0));
        // Rails
        g.add(voxel(0.9, 0.06, 0.06, mats.metal, 0, 0.08, -0.15));
        g.add(voxel(0.9, 0.06, 0.06, mats.metal, 0, 0.08, 0.15));
        // Sleepers (ties)
        for (let x = -0.35; x <= 0.35; x += 0.35) {
            g.add(voxel(0.1, 0.04, 0.5, mats.wood, x, 0.05, 0));
        }
        return g;
    },

    // DISTRIBUTION_HUB - Logistics center (2x2)
    [BuildingType.DISTRIBUTION_HUB]: () => {
        const g = new THREE.Group();
        // Platform
        g.add(voxel(2.0, 0.2, 2.0, mats.concrete, 0, 0, 0));
        // Warehouse
        g.add(voxel(1.8, 1.0, 1.4, mats.metal, 0, 0.2, -0.2));
        // Loading dock
        g.add(voxel(1.6, 0.1, 0.5, mats.asphalt, 0, 0.2, 0.7));
        // Conveyor belts
        g.add(voxel(0.3, 0.08, 1.5, mats.metalLight, -0.5, 0.5, 0));
        g.add(voxel(0.3, 0.08, 1.5, mats.metalLight, 0.5, 0.5, 0));
        // Crates
        g.add(voxel(0.3, 0.3, 0.3, mats.wood, -0.6, 0.2, 0.6));
        g.add(voxel(0.3, 0.3, 0.3, mats.wood, 0.0, 0.2, 0.6));
        g.add(voxel(0.3, 0.3, 0.3, mats.wood, 0.6, 0.2, 0.6));
        // Forklift
        g.add(voxel(0.4, 0.4, 0.25, mats.hazard, 0.6, 0.2, 0));
        // Office section
        g.add(voxel(0.5, 0.6, 0.5, mats.white, -0.65, 1.2, -0.65));
        return g;
    },

    // ═══════════════════════════════════════════════════════════════
    // ERA 4: SUSTAINABILITY - New Buildings
    // ═══════════════════════════════════════════════════════════════

    // WASTE_TREATMENT - Pollution reducer (2x2)
    [BuildingType.WASTE_TREATMENT]: () => {
        const g = new THREE.Group();
        // Base
        g.add(voxel(2.0, 0.2, 2.0, mats.concrete, 0, 0, 0));
        // Treatment tanks (circular-ish)
        g.add(voxel(0.8, 0.8, 0.8, mats.blueMetal, -0.5, 0.2, -0.5));
        g.add(voxel(0.8, 0.8, 0.8, mats.blueMetal, 0.5, 0.2, -0.5));
        g.add(voxel(0.8, 0.8, 0.8, mats.blueMetal, 0, 0.2, 0.5));
        // Tank tops (green = clean)
        g.add(voxel(0.7, 0.1, 0.7, mats.emissiveGreen, -0.5, 1.0, -0.5));
        g.add(voxel(0.7, 0.1, 0.7, mats.emissiveGreen, 0.5, 1.0, -0.5));
        g.add(voxel(0.7, 0.1, 0.7, mats.emissiveGreen, 0, 1.0, 0.5));
        // Connecting pipes
        g.add(voxel(0.15, 0.15, 0.8, mats.darkPipe, 0, 0.6, 0));
        g.add(voxel(0.8, 0.15, 0.15, mats.darkPipe, 0, 0.6, 0));
        // Control booth
        g.add(voxel(0.5, 0.8, 0.5, mats.metal, 0.7, 0.2, 0.7));
        return g;
    },

    // NATURE_RESERVE - Wildlife sanctuary (4x4)
    [BuildingType.NATURE_RESERVE]: () => {
        const g = new THREE.Group();
        // Natural ground
        g.add(voxel(4.0, 0.1, 4.0, mats.dirt, 0, 0, 0));
        // Grass patches
        g.add(voxel(1.5, 0.15, 1.5, mats.grass, -1.0, 0.1, -1.0));
        g.add(voxel(1.5, 0.15, 1.5, mats.grass, 1.0, 0.1, 1.0));
        // Trees
        g.add(voxel(0.2, 1.5, 0.2, mats.wood, -1.2, 0.1, -1.2));
        g.add(voxel(0.8, 0.8, 0.8, mats.leaf, -1.2, 1.4, -1.2));
        g.add(voxel(0.2, 1.2, 0.2, mats.wood, 1.0, 0.1, -0.8));
        g.add(voxel(0.6, 0.6, 0.6, mats.leaf, 1.0, 1.1, -0.8));
        g.add(voxel(0.2, 1.8, 0.2, mats.wood, -0.5, 0.1, 1.2));
        g.add(voxel(1.0, 1.0, 1.0, mats.leaf, -0.5, 1.6, 1.2));
        // Small pond
        g.add(voxel(1.2, 0.1, 0.8, mats.reservoirWater, 0.8, 0.1, 0.8));
        // Wooden fence perimeter
        g.add(voxel(4.0, 0.4, 0.08, mats.wood, 0, 0.2, -1.96));
        g.add(voxel(4.0, 0.4, 0.08, mats.wood, 0, 0.2, 1.96));
        // Ranger station
        g.add(voxel(0.6, 0.6, 0.6, mats.wood, 1.5, 0.1, -1.5));
        g.add(voxel(0.7, 0.1, 0.7, mats.metalLight, 1.5, 0.7, -1.5));
        return g;
    },

    // HYDROPONICS - Vertical farm (2x2)
    [BuildingType.HYDROPONICS]: () => {
        const g = new THREE.Group();
        // Base
        g.add(voxel(2.0, 0.15, 2.0, mats.concrete, 0, 0, 0));
        // Glass greenhouse structure
        g.add(voxel(1.8, 1.8, 1.8, mats.glass, 0, 0.15, 0));
        // Frame
        g.add(voxel(0.1, 1.8, 0.1, mats.metalLight, -0.9, 0.15, -0.9));
        g.add(voxel(0.1, 1.8, 0.1, mats.metalLight, 0.9, 0.15, -0.9));
        g.add(voxel(0.1, 1.8, 0.1, mats.metalLight, -0.9, 0.15, 0.9));
        g.add(voxel(0.1, 1.8, 0.1, mats.metalLight, 0.9, 0.15, 0.9));
        // Grow beds (stacked)
        for (let y = 0.4; y <= 1.4; y += 0.5) {
            g.add(voxel(1.4, 0.1, 0.4, mats.leaf, 0, y, -0.4));
            g.add(voxel(1.4, 0.1, 0.4, mats.leaf, 0, y, 0.4));
        }
        // Grow lights
        g.add(voxel(1.5, 0.05, 0.1, mats.emissiveCyan, 0, 1.8, 0));
        // Water pipes
        g.add(voxel(0.08, 1.6, 0.08, mats.blueMetal, -0.7, 0.3, 0));
        g.add(voxel(0.08, 1.6, 0.08, mats.blueMetal, 0.7, 0.3, 0));
        return g;
    },

    // GEOTHERMAL_PLANT - Deep earth power (2x2)
    [BuildingType.GEOTHERMAL_PLANT]: () => {
        const g = new THREE.Group();
        // Base platform
        g.add(voxel(2.0, 0.25, 2.0, mats.concrete, 0, 0, 0));
        // Main turbine building
        g.add(voxel(1.4, 1.2, 1.4, mats.metal, 0, 0.25, 0));
        // Steam vents
        g.add(voxel(0.3, 0.8, 0.3, mats.darkPipe, -0.65, 1.45, -0.65));
        g.add(voxel(0.3, 0.8, 0.3, mats.darkPipe, 0.65, 1.45, 0.65));
        // Steam caps (glowing hot)
        g.add(voxel(0.35, 0.1, 0.35, mats.emissiveRed, -0.65, 2.25, -0.65));
        g.add(voxel(0.35, 0.1, 0.35, mats.emissiveRed, 0.65, 2.25, 0.65));
        // Cooling towers
        g.add(voxel(0.5, 0.6, 0.5, mats.concrete, -0.7, 0.25, 0.7));
        g.add(voxel(0.5, 0.6, 0.5, mats.concrete, 0.7, 0.25, -0.7));
        // Pipes going into ground
        g.add(voxel(0.2, 0.25, 0.2, mats.darkPipe, 0, 0, 0));
        // Control panel
        g.add(voxel(0.4, 0.6, 0.15, mats.metal, 0, 0.6, 0.73));
        g.add(voxel(0.2, 0.3, 0.05, mats.emissiveGreen, 0, 0.8, 0.78));
        // Power cables out
        g.add(voxel(0.8, 0.1, 0.1, mats.darkPipe, 0.6, 0.8, 0));
        return g;
    },

    // ═══════════════════════════════════════════════════════════════
    // ERA 5: PROSPERITY - New Buildings
    // ═══════════════════════════════════════════════════════════════

    // MONUMENT - Victory celebration (2x2)
    [BuildingType.MONUMENT]: () => {
        const g = new THREE.Group();
        // Grand base
        g.add(voxel(2.0, 0.4, 2.0, mats.concrete, 0, 0, 0));
        g.add(voxel(1.6, 0.3, 1.6, mats.concrete, 0, 0.4, 0));
        g.add(voxel(1.2, 0.2, 1.2, mats.concrete, 0, 0.7, 0));
        // Central pillar
        g.add(voxel(0.5, 2.5, 0.5, mats.metalLight, 0, 0.9, 0));
        // Top orb (golden/glowing)
        g.add(voxel(0.6, 0.6, 0.6, mats.emissiveGreen, 0, 3.4, 0));
        // Decorative wings
        g.add(voxel(0.8, 0.1, 0.15, mats.metal, 0, 2.5, 0));
        g.add(voxel(0.15, 0.1, 0.8, mats.metal, 0, 2.5, 0));
        // Corner accents
        g.add(voxel(0.2, 0.8, 0.2, mats.metalLight, -0.7, 0.4, -0.7));
        g.add(voxel(0.2, 0.8, 0.2, mats.metalLight, 0.7, 0.4, -0.7));
        g.add(voxel(0.2, 0.8, 0.2, mats.metalLight, -0.7, 0.4, 0.7));
        g.add(voxel(0.2, 0.8, 0.2, mats.metalLight, 0.7, 0.4, 0.7));
        // Plaque
        g.add(voxel(0.6, 0.3, 0.05, mats.metal, 0, 0.5, 0.81));
        return g;
    },

    // SPACEPORT - Orbital launch facility (5x5)
    [BuildingType.SPACEPORT]: () => {
        const g = new THREE.Group();
        // Large launch pad
        g.add(voxel(5.0, 0.3, 5.0, mats.concrete, 0, 0, 0));
        // Launch flame trench
        g.add(voxel(1.0, 0.2, 3.0, mats.asphalt, 0, 0.05, 0));
        // Rocket/shuttle placeholder
        g.add(voxel(0.8, 3.0, 0.8, mats.white, 0, 0.3, 0));
        g.add(voxel(0.6, 0.8, 0.6, mats.metal, 0, 3.3, 0));
        // Nose cone
        g.add(voxel(0.4, 0.5, 0.4, mats.metalLight, 0, 4.1, 0));
        // Launch tower
        g.add(voxel(0.3, 4.0, 0.3, mats.metal, -1.2, 0.3, 0));
        g.add(voxel(0.8, 0.15, 0.3, mats.metal, -0.8, 2.0, 0));
        g.add(voxel(0.8, 0.15, 0.3, mats.metal, -0.8, 3.0, 0));
        // Control building
        g.add(voxel(1.5, 1.0, 1.2, mats.metal, -1.5, 0.3, -1.8));
        g.add(voxel(1.0, 0.5, 0.8, mats.glass, -1.5, 1.3, -1.8));
        // Fuel tanks
        g.add(voxel(0.6, 1.2, 0.6, mats.white, 1.8, 0.3, -1.5));
        g.add(voxel(0.6, 1.2, 0.6, mats.hazard, 1.8, 0.3, -0.5));
        // Landing lights
        g.add(voxel(0.2, 0.2, 0.2, mats.emissiveRed, -2.2, 0.35, -2.2));
        g.add(voxel(0.2, 0.2, 0.2, mats.emissiveRed, 2.2, 0.35, -2.2));
        g.add(voxel(0.2, 0.2, 0.2, mats.emissiveRed, -2.2, 0.35, 2.2));
        g.add(voxel(0.2, 0.2, 0.2, mats.emissiveRed, 2.2, 0.35, 2.2));
        // Service road
        g.add(voxel(2.0, 0.05, 0.6, mats.asphalt, -1.5, 0.3, 1.5));
        return g;
    }
}
