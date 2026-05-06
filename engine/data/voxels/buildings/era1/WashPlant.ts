
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { cylinder, taperedCylinder, voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Wash Plant Factory - Multi-level ore processing
 * Level 1: Primitive sluice box
 * Level 2: Wooden trommel (rotating drum)
 * Level 3: Industrial metal wash plant
 * Level 4: Automated high-throughput complex
 */
export const WashPlantFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

function getDetailFlags(opts?: FactoryOptions) {
    const detailLevel = opts?.detailLevel || 'MEDIUM';
    return {
        isLow: detailLevel === 'LOW',
        isHigh: detailLevel === 'HIGH',
    };
}

// Level 1: Primitive sluice box
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isWatered = opts?.waterStatus === 'CONNECTED';
    const { isLow, isHigh } = getDetailFlags(opts);
    g.add(voxel(1.8, 0.1, 1.8, mats.concrete, 0, 0, 0));
    g.add(voxel(1.6, 0.15, 0.5, mats.wood, 0, 0.45, 0));
    g.add(voxel(1.6, 0.2, 0.06, mats.wood, 0, 0.55, 0.22));
    g.add(voxel(1.6, 0.2, 0.06, mats.wood, 0, 0.55, -0.22));
    g.add(voxel(0.08, 0.45, 0.08, mats.wood, -0.7, 0.1, 0.15));
    g.add(voxel(0.08, 0.35, 0.08, mats.wood, 0.7, 0.1, 0.15));
    if (isWatered) {
        g.add(voxel(1.4, 0.04, 0.35, mats.waterMaterial, 0, 0.57, 0));
    }
    if (!isLow) {
        g.add(voxel(0.3, 0.45, 0.3, mats.wood, -0.75, 0.1, 0.6));
        g.add(voxel(0.2, 0.25, 0.2, mats.metal, 0.75, 0.1, 0));
    }
    if (isHigh) {
        for (let x = -0.5; x <= 0.5; x += 0.2) {
            g.add(voxel(0.05, 0.06, 0.02, mats.metal, x, 0.63, 0));
        }
    }
    return g;
}

// Level 2: Wooden trommel
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isWatered = opts?.waterStatus === 'CONNECTED';
    const { isLow, isHigh } = getDetailFlags(opts);
    g.add(voxel(1.9, 0.15, 1.9, mats.concrete, 0, 0, 0));
    // Rotating drum (trommel)
    const trommel = new THREE.Group();
    trommel.add(cylinder(0.4, 1.4, mats.wood, 0, -0.7, 0));
    if (!isLow) {
        trommel.add(cylinder(0.46, 0.08, mats.metal, 0, -0.7, -0.45));
        trommel.add(cylinder(0.46, 0.08, mats.metal, 0, -0.7, 0.45));
    }
    trommel.rotation.z = Math.PI / 2;
    trommel.position.set(0, 1.0, 0);
    g.add(trommel);
    // Support structure
    g.add(voxel(0.1, 1.0, 0.1, mats.wood, -0.6, 0.15, -0.3));
    g.add(voxel(0.1, 1.0, 0.1, mats.wood, -0.6, 0.15, 0.3));
    g.add(voxel(0.1, 0.8, 0.1, mats.wood, 0.6, 0.15, -0.3));
    g.add(voxel(0.1, 0.8, 0.1, mats.wood, 0.6, 0.15, 0.3));
    // Input hopper
    g.add(voxel(0.5, 0.5, 0.5, mats.wood, -0.7, 0.9, 0));
    // Water intake
    g.add(voxel(0.1, 0.6, 0.1, mats.darkPipe, -0.8, 0.15, 0.6));
    if (isWatered) {
        g.add(voxel(0.06, 0.06, 0.6, mats.waterMaterial, -0.8, 0.75, 0.3));
    }
    // Output bins
    if (!isLow) {
        g.add(voxel(0.4, 0.4, 0.4, mats.wood, 0.7, 0.15, 0.5));
        g.add(voxel(0.4, 0.4, 0.4, mats.wood, 0.7, 0.15, -0.5));
    }
    if (isHigh) {
        for (let z = -0.35; z <= 0.35; z += 0.18) {
            g.add(voxel(0.05, 0.05, 0.05, mats.metal, 0.55, 1.02, z));
        }
    }
    return g;
}

// Level 3: Industrial metal wash plant
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    const isWatered = opts?.waterStatus === 'CONNECTED';
    const { isLow, isHigh } = getDetailFlags(opts);
    g.add(voxel(2.0, 0.2, 2.0, mats.concrete, 0, 0, 0));
    // Metal tower
    g.add(voxel(1.2, 2.2, 1.2, mats.metal, -0.3, 0.2, -0.3));
    g.add(voxel(1.3, 0.2, 1.3, mats.hazard, -0.3, 2.4, -0.3));
    // Shaking screen
    g.add(voxel(0.8, 0.2, 1.8, mats.metalLight, 0.4, 1.2, 0));
    if (isHigh) {
        for (let z = -0.75; z <= 0.75; z += 0.18) {
            g.add(voxel(0.7, 0.03, 0.04, mats.metal, 0.4, 1.28, z));
        }
    }
    // Conveyor
    const conveyor = voxel(0.5, 0.15, 2.0, mats.darkPipe, 0.5, 1.0, 0);
    conveyor.rotation.x = 0.2;
    g.add(conveyor);
    // Large pipes
    g.add(cylinder(0.1, 1.5, mats.darkPipe, -0.8, 0.2, 0.5));
    if (isWatered) {
        g.add(voxel(0.1, 0.1, 0.05, mats.emissiveCyan, -0.8, 1.0, 0.61));
    }
    // Control box
    g.add(voxel(0.3, 0.6, 0.2, mats.blueMetal, -0.8, 0.2, -0.4));
    if (isHigh) {
        g.add(voxel(0.5, 0.08, 0.08, mats.darkPipe, -0.2, 0.65, 0.9));
        g.add(voxel(0.08, 0.45, 0.08, mats.darkPipe, 0.05, 0.65, 0.9));
    }
    if (!opts?.isUnderConstruction) {
        const statusMat = isPowered && isWatered ? mats.emissiveGreen : mats.emissiveRed;
        g.add(voxel(0.1, 0.2, 0.05, statusMat, -0.8, 0.5, -0.21));
    }
    return g;
}

// Level 4: Automated high-throughput complex
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    const isWatered = opts?.waterStatus === 'CONNECTED';
    const { isLow, isHigh } = getDetailFlags(opts);
    g.add(voxel(2.2, 0.25, 2.2, mats.concrete, 0, 0, 0));
    // Enclosed processing unit (Concrete)
    g.add(voxel(1.6, 2.8, 1.5, mats.concreteLight, 0, 0.25, 0));
    g.add(voxel(1.65, 0.1, 1.55, mats.blueMetal, 0, 1.0, 0));
    // Cyclonic separators
    g.add(taperedCylinder(0.18, 0.34, 2.0, mats.metalLight, -0.7, 0.25, 0.8));
    if (!isLow) {
        g.add(taperedCylinder(0.18, 0.34, 2.0, mats.metalLight, 0.7, 0.25, 0.8));
    }
    // Top exhausts
    g.add(cylinder(0.15, 0.6, mats.metal, 0, 3.05, 0.4));
    if (!isLow) {
        g.add(cylinder(0.15, 0.6, mats.metal, 0, 3.05, -0.4));
    }
    // Status display
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.5, 0.3, 0.05, isPowered && isWatered ? mats.emissiveCyan : mats.emissiveRed, 0.4, 2.0, 0.76));
    }
    // High-pressure piping
    g.add(cylinder(0.08, 1.8, mats.darkPipe, 0.9, 0.25, -0.5));
    g.add(voxel(0.5, 0.15, 0.15, mats.darkPipe, 0.6, 2.0, -0.5));
    if (isHigh) {
        for (let x = -0.55; x <= 0.55; x += 0.22) {
            g.add(voxel(0.1, 0.04, 0.1, mats.emissiveGreen, x, 1.15, 0.86));
        }
    }
    return g;
}
