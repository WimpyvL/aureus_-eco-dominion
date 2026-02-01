
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Medical Bay Factory - Multi-level healthcare
 * Level 1: Field hospital (tents and wood boxes)
 * Level 2: Modern building (Original)
 * Level 3: Advanced clinic with drone bay
 * Level 4: High-tech med-center biosphere
 */
export const MedicalBayFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

// Level 1: Field hospital
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.8, 0.1, 1.8, mats.concrete, 0, 0, 0));

    // Medical tent 1
    g.add(voxel(0.08, 1.0, 0.08, mats.wood, -0.6, 0.1, -0.6));
    g.add(voxel(0.08, 1.0, 0.08, mats.wood, 0.6, 0.1, -0.6));
    g.add(voxel(1.4, 0.05, 1.2, mats.sand, 0, 1.1, -0.1)); // Tarp roof

    // Medical tent 2
    g.add(voxel(0.8, 0.8, 0.6, mats.sand, -0.4, 0.1, 0.5));
    // Red cross on tent
    g.add(voxel(0.3, 0.1, 0.05, mats.hazard, -0.4, 0.9, 0.81));

    // Stretcher/Cots
    g.add(voxel(0.6, 0.15, 0.3, mats.wood, 0.5, 0.1, 0.3));
    g.add(voxel(0.6, 0.15, 0.3, mats.wood, 0.5, 0.1, 0.7));

    // Supply crates
    g.add(voxel(0.35, 0.35, 0.35, mats.sand, -0.7, 0.1, -0.3));

    return g;
}

// Level 2: Modern building (Original)
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(2.0, 0.15, 2.0, mats.concrete, 0, 0, 0));
    g.add(voxel(1.8, 1.2, 1.8, mats.concreteLight, 0, 0.15, 0));
    const crossMat = isPowered ? mats.emissiveRed : mats.hazard;
    g.add(voxel(0.6, 0.1, 0.15, crossMat, 0, 1.4, 0));
    g.add(voxel(0.15, 0.1, 0.6, crossMat, 0, 1.4, 0));
    g.add(voxel(0.5, 0.4, 0.05, mats.glass, -0.5, 0.8, 0.91));
    g.add(voxel(0.5, 0.4, 0.05, mats.glass, 0.5, 0.8, 0.91));
    g.add(voxel(0.4, 0.8, 0.05, mats.metal, 0, 0.4, 0.91));
    g.add(voxel(0.8, 0.05, 0.4, mats.metalLight, -0.6, 1.0, 1.1));
    g.add(voxel(0.3, 0.6, 0.3, mats.metal, 0.75, 0.3, 0.75));

    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.1, 0.3, 0.1, isPowered ? mats.emissiveGreen : mats.emissiveRed, 0.75, 0.9, 0.75));
    }

    return g;
}

// Level 3: Advanced Clinic
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(2.0, 0.2, 2.0, mats.concrete, 0, 0, 0));

    // Two-story clinic
    g.add(voxel(1.8, 2.2, 1.4, mats.concreteLight, 0, 0.2, -0.1));
    g.add(voxel(1.85, 0.1, 1.45, mats.blueMetal, 0, 1.2, -0.1));

    // Large glass windows
    g.add(voxel(1.6, 0.6, 0.05, mats.glass, 0, 1.4, 0.61));
    g.add(voxel(0.6, 1.0, 0.05, mats.glass, 0.4, 0.5, 0.61));

    // Drone landing pad on side
    g.add(voxel(0.8, 0.1, 0.8, mats.concrete, -1.0, 1.2, 0.5));
    if (!opts?.isUnderConstruction && isPowered) {
        g.add(voxel(0.2, 0.2, 0.2, mats.emissiveCyan, -1.0, 1.35, 0.5)); // Ambulance drone
    }

    // Glowing cross sign
    const crossMat = isPowered ? mats.emissiveRed : mats.hazard;
    g.add(voxel(0.8, 0.2, 0.2, crossMat, 0, 2.5, -0.1));
    g.add(voxel(0.2, 0.2, 0.8, crossMat, 0, 2.5, -0.1));

    return g;
}

// Level 4: Med-Center Biosphere
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    g.add(voxel(2.2, 0.25, 2.2, mats.concrete, 0, 0, 0));

    // Modern concrete shell
    g.add(voxel(1.9, 1.2, 1.9, mats.concreteLight, 0, 0.25, 0));

    // Glass biosphere top
    g.add(voxel(1.5, 1.5, 1.5, mats.glass, 0, 1.45, 0));
    g.add(voxel(1.55, 0.1, 1.55, mats.blueMetal, 0, 1.45, 0));
    g.add(voxel(1.55, 0.1, 1.55, mats.blueMetal, 0, 2.95, 0));

    // Interior plants (healing herbs)
    g.add(voxel(0.4, 0.8, 0.4, mats.progressGreen, 0, 1.45, 0));

    // Holographic medical signs
    if (!opts?.isUnderConstruction && isPowered) {
        g.add(voxel(0.4, 0.4, 0.05, mats.emissiveCyan, 0, 2.0, 0.81));
        g.add(voxel(0.12, 0.12, 0.12, mats.emissiveRed, 0, 3.2, 0));
    }

    // Modern entrance overhang
    g.add(voxel(1.2, 0.08, 0.6, mats.metalLight, 0, 1.2, 1.0));

    return g;
}
