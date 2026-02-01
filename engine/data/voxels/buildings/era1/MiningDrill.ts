
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Mining Drill Factory - Multi-level subterranean extraction
 * Level 1: Hand-cranked pivot drill (primitive)
 * Level 2: Standard industrial drill (Original)
 * Level 3: Dual-head automated drill
 * Level 4: Thermal-lance subterranean borer
 */
export const MiningDrillFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

// Level 1: Primitive pivot drill
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.0, 0.2, 1.0, mats.stone, 0, 0, 0));

    // Wooden pivot frame
    g.add(voxel(0.1, 1.2, 0.1, mats.wood, -0.3, 0.2, 0));
    g.add(voxel(0.1, 1.2, 0.1, mats.wood, 0.3, 0.2, 0));
    g.add(voxel(0.8, 0.1, 0.1, mats.wood, 0, 1.2, 0));

    // Makeshift drill bit
    g.add(voxel(0.1, 1.5, 0.1, mats.metal, 0, -0.2, 0));
    g.add(voxel(0.2, 0.2, 0.2, mats.darkPipe, 0, 1.2, 0));

    return g;
}

// Level 2: Standard industrial drill (Original)
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(1.2, 0.4, 1.2, mats.concrete, 0, 0, 0));
    g.add(voxel(0.8, 1.0, 0.8, mats.metal, 0, 0.4, 0));
    g.add(voxel(0.2, 2.0, 0.2, mats.darkPipe, 0, 0, 0));
    g.add(voxel(0.4, 0.2, 0.4, mats.hazard, 0, 0.6, 0));
    g.add(voxel(0.4, 0.2, 0.4, mats.hazard, 0, 1.2, 0));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.15, 0.1, 0.15, isPowered ? mats.emissiveGreen : mats.emissiveRed, 0.3, 1.4, 0.3));
    }
    return g;
}

// Level 3: Dual-head automated drill
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(1.4, 0.5, 1.4, mats.concrete, 0, 0, 0));

    // Main dual housing
    g.add(voxel(1.2, 1.2, 1.0, mats.metalLight, 0, 0.5, 0));

    // Two drill heads
    const addDrill = (x: number) => {
        g.add(voxel(0.2, 2.5, 0.2, mats.darkPipe, x, -0.5, 0));
        g.add(voxel(0.5, 0.1, 0.5, mats.hazard, x, 0.5, 0));
        g.add(voxel(0.5, 0.1, 0.5, mats.hazard, x, 1.2, 0));
        if (isPowered) {
            g.add(voxel(0.3, 0.3, 0.3, mats.emissiveCyan, x, 1.8, 0));
        }
    };
    addDrill(-0.4);
    addDrill(0.4);

    return g;
}

// Level 4: Thermal-lance borer
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(1.6, 0.6, 1.6, mats.concrete, 0, 0, 0));

    // High-tech core
    g.add(voxel(1.3, 1.5, 1.3, mats.concreteLight, 0, 0.6, 0));
    g.add(voxel(1.4, 0.1, 1.4, mats.blueMetal, 0, 1.2, 0));

    // Thermal beam assembly
    g.add(voxel(0.6, 3.0, 0.6, mats.metal, 0, -1.0, 0)); // Borer barrel
    if (!opts?.isUnderConstruction && isPowered) {
        // Glowing thermal lance
        g.add(voxel(0.4, 1.0, 0.4, mats.emissiveOrange, 0, -0.5, 0));
        g.add(voxel(0.1, 0.1, 0.1, mats.emissiveOrange, 0, 2.2, 0)); // Top pulse
    }

    // Cooling radiators
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const x = Math.cos(angle) * 0.5;
        const z = Math.sin(angle) * 0.5;
        g.add(voxel(0.2, 1.2, 0.2, mats.blueMetal, x, 0.6, z));
    }

    return g;
}
