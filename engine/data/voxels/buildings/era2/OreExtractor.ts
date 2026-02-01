
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Ore Extractor Factory - Multi-level deep mining
 * Level 1: Simple jackhammer station (primitive)
 * Level 2: Industrial cylinder extractor (Original)
 * Level 3: Dual-bore extraction rig
 * Level 4: Plasma-bore extractor complex
 */
export const OreExtractorFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

// Level 1: Simple jackhammer station
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.4, 0.2, 1.4, mats.concrete, 0, 0, 0));

    // Wooden scaffold
    g.add(voxel(0.1, 1.8, 0.1, mats.wood, -0.4, 0.2, -0.4));
    g.add(voxel(0.1, 1.8, 0.1, mats.wood, 0.4, 0.2, -0.4));
    g.add(voxel(0.8, 0.1, 0.1, mats.wood, 0, 1.8, -0.4));

    // Makeshift jackhammer
    g.add(voxel(0.15, 1.5, 0.15, mats.metal, 0, 0.4, -0.4));
    g.add(voxel(0.25, 0.25, 0.25, mats.darkPipe, 0, 1.9, -0.4));

    // Ore piles
    g.add(voxel(0.4, 0.3, 0.4, mats.concrete, 0.4, 0.2, 0.4));
    g.add(voxel(0.35, 0.25, 0.35, mats.concrete, -0.4, 0.2, 0.5));

    return g;
}

// Level 2: Industrial cylinder extractor (Original)
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.6, 0.5, 1.6, mats.concrete, 0, 0, 0));
    g.add(voxel(1.2, 1.8, 1.2, mats.metal, 0, 0.5, 0));
    g.add(voxel(0.2, 2.0, 0.2, mats.metalLight, -0.7, 0, -0.7));
    g.add(voxel(0.2, 2.0, 0.2, mats.metalLight, 0.7, 0, -0.7));
    g.add(voxel(0.2, 2.0, 0.2, mats.metalLight, -0.7, 0, 0.7));
    g.add(voxel(0.2, 2.0, 0.2, mats.metalLight, 0.7, 0, 0.7));
    g.add(voxel(0.8, 0.2, 0.8, mats.emissiveCyan, 0, 2.3, 0));
    return g;
}

// Level 3: Dual-bore extraction rig
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.8, 0.6, 1.8, mats.concrete, 0, 0, 0));

    // Two boring cylinders
    const addBore = (x: number, z: number) => {
        g.add(voxel(0.6, 2.2, 0.6, mats.metalLight, x, 0.6, z));
        g.add(voxel(0.7, 0.2, 0.7, mats.hazard, x, 0.6, z));
        g.add(voxel(0.4, 0.2, 0.4, mats.emissiveCyan, x, 2.8, z));
    };
    addBore(-0.4, 0);
    addBore(0.4, 0);

    // Heavy support frame
    g.add(voxel(1.6, 0.2, 0.2, mats.metal, 0, 1.5, 0));
    g.add(voxel(1.6, 0.2, 0.2, mats.metal, 0, 2.5, 0));

    return g;
}

// Level 4: Plasma-bore extractor
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(2.0, 0.8, 2.0, mats.concrete, 0, 0, 0));

    // High-tech core tower
    g.add(voxel(1.0, 3.0, 1.0, mats.concreteLight, 0, 0.8, 0));
    g.add(voxel(1.1, 0.15, 1.1, mats.blueMetal, 0, 1.5, 0));
    g.add(voxel(1.1, 0.15, 1.1, mats.blueMetal, 0, 3.0, 0));

    // Plasma boring beam (underneath-ish/core)
    const beam = voxel(0.4, 1.0, 0.4, mats.emissiveCyan, 0, 3.8, 0);
    g.add(beam);

    // Cooling radiators
    for (let i = 0; i < 4; i++) {
        const offset = 0.6;
        const x = (i % 2 === 0) ? (i === 0 ? offset : -offset) : 0;
        const z = (i % 2 !== 0) ? (i === 1 ? offset : -offset) : 0;
        g.add(voxel(0.3, 2.0, 0.3, mats.metalLight, x, 0.8, z));
    }

    return g;
}
