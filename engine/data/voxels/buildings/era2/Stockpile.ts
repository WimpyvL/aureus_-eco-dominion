
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Stockpile Factory - Multi-level resource storage
 * Level 1: Primitive open-air dirt patch with scattered crates
 * Level 2: Enclosed storage area with small crane (Original)
 * Level 3: Industrial silos and covered bays
 * Level 4: High-density nanotech storage vault
 */
export const StockpileFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

// Level 1: Primitive dirt patch
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(2.8, 0.1, 2.8, mats.dirt, 0, 0, 0));

    // Scattered wooden crates
    g.add(voxel(0.4, 0.4, 0.4, mats.wood, -0.6, 0.1, -0.6));
    g.add(voxel(0.4, 0.4, 0.4, mats.wood, -0.2, 0.1, -0.6));
    g.add(voxel(0.4, 0.4, 0.4, mats.wood, -0.6, 0.1, -0.2));

    // Stone pile
    g.add(voxel(0.8, 0.3, 0.8, mats.stone, 0.6, 0.1, 0.6));

    // Simple stick markers
    g.add(voxel(0.08, 0.8, 0.08, mats.wood, -1.3, 0.1, -1.3));
    g.add(voxel(0.08, 0.8, 0.08, mats.wood, 1.3, 0.1, 1.3));

    return g;
}

// Level 2: Enclosed logistics yard (Original)
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(3.0, 0.25, 3.0, mats.concrete, 0, 0, 0));
    for (let x = -1.4; x <= 1.4; x += 1.4) {
        for (let z = -1.4; z <= 1.4; z += 1.4) {
            if (Math.abs(x) > 0.1 || Math.abs(z) > 0.1) {
                g.add(voxel(0.1, 0.8, 0.1, mats.metal, x, 0.25, z));
            }
        }
    }
    g.add(voxel(2.8, 0.05, 0.05, mats.metal, 0, 0.8, 1.4));
    g.add(voxel(2.8, 0.05, 0.05, mats.metal, 0, 0.8, -1.4));
    g.add(voxel(0.05, 0.05, 2.8, mats.metal, 1.4, 0.8, 0));
    g.add(voxel(0.05, 0.05, 2.8, mats.metal, -1.4, 0.8, 0));
    const woodColor = mats.wood;
    for (let i = 0; i < 3; i++) {
        g.add(voxel(0.8, 0.3, 1.0, woodColor, -0.8, 0.25 + (i * 0.3), -0.5));
    }
    g.add(voxel(0.6, 0.3, 0.8, woodColor, -0.8, 1.15, -0.5));
    const stoneColor = mats.concrete;
    for (let x = 0.5; x <= 1.0; x += 0.5) {
        for (let z = -0.8; z <= 0.2; z += 0.5) {
            g.add(voxel(0.4, 0.4, 0.4, stoneColor, x, 0.25, z));
            g.add(voxel(0.35, 0.35, 0.35, stoneColor, x, 0.65, z));
        }
    }
    g.add(voxel(0.4, 1.5, 0.4, mats.metal, 1.0, 0.25, 1.0));
    g.add(voxel(0.3, 0.15, 1.5, mats.hazard, 0.4, 1.75, 1.0));
    g.add(voxel(0.1, 0.5, 0.1, mats.darkPipe, -0.3, 1.5, 1.0));
    g.add(voxel(0.1, 0.1, 0.1, mats.emissiveCyan, 1.4, 1.05, 1.4));
    g.add(voxel(0.1, 0.1, 0.1, mats.emissiveCyan, -1.4, 1.05, -1.4));
    return g;
}

// Level 3: Industrial Silos
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(3.0, 0.3, 3.0, mats.concrete, 0, 0, 0));

    // Four large silos
    const addSilo = (x: number, z: number) => {
        g.add(voxel(0.9, 2.5, 0.9, mats.metalLight, x, 0.3, z));
        g.add(voxel(1.0, 0.2, 1.0, mats.blueMetal, x, 0.3, z));
        g.add(voxel(1.0, 0.1, 1.0, mats.darkPipe, x, 2.8, z));
    };
    addSilo(-0.8, -0.8);
    addSilo(0.8, -0.8);
    addSilo(-0.8, 0.8);
    addSilo(0.8, 0.8);

    // Central control tower
    g.add(voxel(0.4, 1.5, 0.4, mats.metal, 0, 0.3, 0));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.2, 0.2, 0.05, mats.emissiveCyan, 0, 1.3, 0.21));
    }

    return g;
}

// Level 4: Nanotech Vault
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(3.2, 0.4, 3.2, mats.concrete, 0, 0, 0));

    // Modern concrete vault structure
    g.add(voxel(2.8, 1.8, 2.8, mats.concreteLight, 0, 0.4, 0));

    // Glowing nanotech lines
    g.add(voxel(2.9, 0.1, 0.1, mats.emissiveCyan, 0, 0.8, 1.41));
    g.add(voxel(2.9, 0.1, 0.1, mats.emissiveCyan, 0, 1.6, 1.41));
    g.add(voxel(0.1, 1.8, 0.1, mats.emissiveCyan, 1.41, 0.4, 1.41));
    g.add(voxel(0.1, 1.8, 0.1, mats.emissiveCyan, -1.41, 0.4, 1.41));

    // Modern loading portal
    g.add(voxel(1.2, 1.2, 0.1, mats.glass, 0, 0.4, 1.42));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(1.1, 1.1, 0.05, mats.emissiveCyan, 0, 0.45, 1.45));
    }

    return g;
}
