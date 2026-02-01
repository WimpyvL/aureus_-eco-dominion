
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Sawmill Factory - Multi-level wood processing
 * Level 1: Primitive hand saw station
 * Level 2: Steam-powered shed
 * Level 3: Industrial sawmill
 * Level 4: Automated wood complex
 */
export const SawmillFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

// Level 1: Hand saw station
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(1.8, 0.08, 1.8, mats.concrete, 0, 0, 0));
    g.add(voxel(0.08, 0.7, 0.08, mats.wood, -0.3, 0.08, -0.2));
    g.add(voxel(0.08, 0.7, 0.08, mats.wood, -0.3, 0.08, 0.2));
    g.add(voxel(0.08, 0.7, 0.08, mats.wood, 0.3, 0.08, -0.2));
    g.add(voxel(0.08, 0.7, 0.08, mats.wood, 0.3, 0.08, 0.2));
    g.add(voxel(0.6, 0.06, 0.06, mats.wood, 0, 0.5, 0));
    g.add(voxel(0.25, 0.25, 1.0, mats.wood, 0, 0.7, 0));
    g.add(voxel(0.02, 0.4, 0.3, mats.metal, 0.2, 0.6, 0.7));
    return g;
}

// Level 2: Steam-powered shed
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(2.0, 0.15, 2.0, mats.concrete, 0, 0, 0));
    // Wooden shed structure
    g.add(voxel(1.8, 1.2, 1.8, mats.wood, 0, 0.15, 0));
    // Corrugated metal roof
    g.add(voxel(2.0, 0.1, 2.0, mats.metal, 0, 1.35, 0));
    // Large circular saw (steam powered)
    g.add(voxel(0.1, 0.8, 0.8, mats.metal, 0.4, 0.15, 0));
    // Steam boiler
    g.add(voxel(0.6, 1.0, 0.6, mats.darkPipe, -0.5, 0.15, 0.5));
    if (!opts?.isUnderConstruction && isPowered) {
        g.add(voxel(0.2, 0.1, 0.2, mats.emissiveOrange, -0.5, 0.6, 0.5)); // Fire door
    }
    // Exhaust pipe
    g.add(voxel(0.15, 1.5, 0.15, mats.metal, -0.5, 1.15, 0.5));
    // Log pile
    g.add(voxel(0.3, 0.3, 1.2, mats.wood, 0.8, 0.15, -0.4));
    return g;
}

// Level 3: Industrial sawmill
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(2.2, 0.2, 2.2, mats.concrete, 0, 0, 0));
    // Metal structure
    g.add(voxel(2.0, 1.8, 1.8, mats.metalLight, 0, 0.2, 0));
    // Slanted factory roof
    g.add(voxel(2.2, 0.15, 2.0, mats.metal, 0, 2.0, 0));
    // Conveyor belt
    g.add(voxel(0.6, 0.1, 2.2, mats.darkPipe, 0.5, 0.6, 0));
    // Dual saw blades
    g.add(voxel(0.08, 1.0, 1.0, mats.metal, 0.5, 0.7, 0.2));
    g.add(voxel(0.08, 1.0, 1.0, mats.metal, 0.5, 0.7, -0.2));
    // Control panel
    g.add(voxel(0.3, 0.5, 0.2, mats.blueMetal, -0.7, 0.2, 0.7));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.1, 0.1, 0.05, isPowered ? mats.emissiveGreen : mats.emissiveRed, -0.7, 0.5, 0.81));
    }
    return g;
}

// Level 4: Automated wood complex
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(2.4, 0.3, 2.4, mats.concrete, 0, 0, 0));
    // Modern facility
    g.add(voxel(2.2, 2.5, 2.0, mats.concreteLight, -0.1, 0.3, 0));
    // Blue accent
    g.add(voxel(2.25, 0.1, 2.05, mats.blueMetal, -0.1, 1.0, 0));
    // Laser cutter station
    g.add(voxel(0.8, 1.2, 0.8, mats.glass, 0.6, 0.3, -0.6));
    if (!opts?.isUnderConstruction && isPowered) {
        g.add(voxel(0.05, 1.0, 0.05, mats.emissiveCyan, 0.6, 0.5, -0.6)); // Laser beam
    }
    // Ventilation unit
    g.add(voxel(0.5, 0.4, 0.5, mats.metal, -0.8, 2.8, 0.5));
    // Automated crane
    g.add(voxel(0.1, 1.5, 0.1, mats.hazard, 0.9, 0.3, 0.9));
    g.add(voxel(1.2, 0.1, 0.1, mats.hazard, 0.4, 1.8, 0.9));
    return g;
}
