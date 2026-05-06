
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { cylinder, dome, torusRing, voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Social Hub Factory - Multi-level community space
 * Level 1: Primitive gathering area (fire-pit and logs)
 * Level 2: Solaris Social Hub dome (Original)
 * Level 3: Two-dome complex with garden link
 * Level 4: Grand Atrium with central holoprojector
 */
export const SocialHubFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

// Level 1: Primitive gathering area
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.8, 0.1, 1.8, mats.dirt, 0, 0, 0));

    // Central fire pit
    g.add(voxel(0.4, 0.15, 0.4, mats.concrete, 0, 0.1, 0));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.2, 0.2, 0.2, mats.emissiveOrange, 0, 0.25, 0));
    }

    // Log benches in circle
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const x = Math.cos(angle) * 0.6;
        const z = Math.sin(angle) * 0.6;
        const log = voxel(0.5, 0.2, 0.2, mats.wood, x, 0.1, z);
        log.rotation.y = angle + Math.PI / 2;
        g.add(log);
    }

    // Stick markers / lanterns
    g.add(voxel(0.08, 0.8, 0.08, mats.wood, -0.7, 0.1, -0.7));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.12, 0.12, 0.12, mats.emissiveYellow, -0.7, 0.9, -0.7));
    }

    return g;
}

// Level 2: Solaris Social Hub dome (Original)
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    const detailLevel = opts?.detailLevel ?? 'MEDIUM';
    g.add(voxel(2.0, 0.25, 2.0, mats.concrete, 0, 0, 0));
    g.add(dome(1.1, isPowered ? mats.glass : mats.darkPipe, 0, 0.25, 0, { detailLevel }));
    for (let r = 0.3; r <= 1.0; r += 0.35) {
        g.add(torusRing(r, 0.03, mats.metal, 0, 0.25 + Math.sqrt(1.1 * 1.1 - r * r) * 0.5, 0, {
            detailLevel,
            rotationX: Math.PI / 2,
        }));
    }
    g.add(cylinder(0.2, 1.6, mats.metal, 0, 0.25, 0));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.2, 0.2, 0.2, isPowered ? mats.emissiveCyan : mats.emissiveRed, 0, 1.85, 0));
    }
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * 0.7;
        const z = Math.sin(angle) * 0.7;
        g.add(cylinder(0.13, 0.15, mats.wood, x, 0.25, z));
    }
    g.add(voxel(0.5, 0.8, 0.15, mats.metal, 0, 0.25, 1.0));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.1, 0.1, 0.1, isPowered ? mats.emissiveGreen : mats.emissiveRed, 0.8, 0.5, 0));
        g.add(voxel(0.1, 0.1, 0.1, isPowered ? mats.emissiveCyan : mats.emissiveRed, -0.8, 0.5, 0));
    }
    return g;
}

// Level 3: Dual-dome complex
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    const detailLevel = opts?.detailLevel ?? 'MEDIUM';
    g.add(voxel(2.2, 0.25, 2.2, mats.concrete, 0, 0, 0));

    // Two smaller domes
    const addDome = (x: number, z: number) => {
        g.add(dome(0.8, isPowered ? mats.glass : mats.darkPipe, x, 0.25, z, { detailLevel }));
        g.add(cylinder(0.1, 1.2, mats.metal, x, 0.25, z));
    };
    addDome(-0.4, -0.4);
    addDome(0.4, 0.4);

    // Connecting corridor
    g.add(voxel(1.2, 0.6, 0.6, mats.metal, 0, 0.25, 0));

    // External garden patches
    g.add(voxel(0.6, 0.1, 0.6, mats.leaf, 0.6, 0.25, -0.6));
    g.add(voxel(0.6, 0.1, 0.6, mats.leaf, -0.6, 0.25, 0.6));

    if (!opts?.isUnderConstruction && isPowered) {
        g.add(voxel(0.15, 0.15, 0.15, mats.emissiveCyan, 0, 1.0, 0));
    }

    return g;
}

// Level 4: Grand Atrium
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    const detailLevel = opts?.detailLevel ?? 'MEDIUM';
    g.add(voxel(2.4, 0.3, 2.4, mats.concrete, 0, 0, 0));

    // Modern concrete atrium with glass sky-lights
    g.add(voxel(2.0, 2.2, 2.0, mats.concreteLight, 0, 0.3, 0));
    g.add(voxel(1.5, 0.1, 1.5, mats.glass, 0, 2.5, 0));

    // Central holoprojector
    g.add(cylinder(0.3, 0.4, mats.metalLight, 0, 0.3, 0));
    if (!opts?.isUnderConstruction && isPowered) {
        g.add(voxel(0.5, 1.2, 0.5, mats.emissiveCyan, 0, 0.8, 0));
        g.add(torusRing(0.6, 0.05, mats.emissiveCyan, 0, 1.5, 0, {
            detailLevel,
            rotationX: Math.PI / 3,
        }));
    }

    // Entrance with blue glow
    g.add(voxel(0.8, 1.2, 0.1, mats.glass, 0, 0.3, 1.01));
    if (isPowered) {
        g.add(voxel(0.85, 0.1, 0.1, mats.emissiveCyan, 0, 1.5, 1.05));
    }

    return g;
}
