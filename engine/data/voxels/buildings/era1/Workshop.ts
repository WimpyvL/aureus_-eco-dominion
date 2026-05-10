
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Workshop Factory - Multi-level maintenance/crafting facility
 * Level 1: Outdoor workspace with tarp
 * Level 2: Wooden shed with tools
 * Level 3: Metal building with equipment
 * Level 4: Industrial workshop with machinery
 */
export const WorkshopFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

// Level 1: Primitive outdoor workspace
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';

    g.add(voxel(1.8, 0.08, 1.8, mats.concrete, 0, 0, 0));

    // Tarp canopy
    g.add(voxel(0.08, 1.4, 0.08, mats.wood, -0.8, 0.08, -0.7));
    g.add(voxel(0.08, 1.4, 0.08, mats.wood, 0.8, 0.08, -0.7));
    g.add(voxel(0.08, 1.1, 0.08, mats.wood, -0.8, 0.08, 0.7));
    g.add(voxel(0.08, 1.1, 0.08, mats.wood, 0.8, 0.08, 0.7));
    g.add(voxel(1.8, 0.04, 1.6, mats.leafDark, 0, 1.25, 0));

    // Workbench
    g.add(voxel(1.2, 0.08, 0.5, mats.wood, 0, 0.65, -0.4));
    g.add(voxel(0.08, 0.57, 0.08, mats.wood, -0.5, 0.08, -0.55));
    g.add(voxel(0.08, 0.57, 0.08, mats.wood, 0.5, 0.08, -0.25));

    // Anvil
    g.add(voxel(0.3, 0.3, 0.3, mats.concrete, 0.5, 0.08, 0.4));
    g.add(voxel(0.2, 0.15, 0.15, mats.metal, 0.5, 0.38, 0.4));

    // Brazier
    g.add(voxel(0.35, 0.25, 0.35, mats.concrete, -0.5, 0.08, 0.4));
    if (!opts?.isUnderConstruction && isPowered) {
        g.add(voxel(0.2, 0.15, 0.2, mats.emissiveOrange, -0.5, 0.33, 0.4));
    }

    // Tools leaning
    g.add(voxel(0.04, 0.8, 0.04, mats.wood, -0.7, 0.08, -0.65));
    g.add(voxel(0.04, 0.7, 0.04, mats.wood, 0.7, 0.08, -0.65));

    return g;
}

// Level 2: Wooden shed workshop
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';

    g.add(voxel(1.9, 0.15, 1.9, mats.concrete, 0, 0, 0));

    // Wooden shed structure
    g.add(voxel(1.6, 1.4, 1.4, mats.wood, 0, 0.15, 0));

    // Slanted roof
    g.add(voxel(1.7, 0.1, 1.5, mats.metal, 0, 1.55, -0.05));
    g.add(voxel(1.5, 0.08, 1.3, mats.metal, 0, 1.65, -0.1));

    // Large door
    g.add(voxel(0.8, 1.1, 0.08, mats.metalLight, 0, 0.15, 0.71));

    // Window
    g.add(voxel(0.08, 0.4, 0.4, isPowered ? mats.glass : mats.darkPipe, 0.81, 0.7, 0));

    // Interior workbench visible
    g.add(voxel(0.6, 0.5, 0.3, mats.wood, -0.4, 0.15, -0.45));

    // Tool rack on wall
    g.add(voxel(0.08, 0.8, 0.5, mats.wood, -0.75, 0.6, 0));

    // Exterior tool storage
    g.add(voxel(0.4, 0.6, 0.3, mats.wood, 0.75, 0.15, 0.5));

    // Power hookup
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.08, 0.08, 0.08, isPowered ? mats.emissiveGreen : mats.emissiveRed, -0.75, 1.2, -0.65));
    }

    return g;
}

// Level 3: Metal building with equipment
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';

    g.add(voxel(2.0, 0.2, 2.0, mats.concrete, 0, 0, 0));

    // Metal building
    g.add(voxel(1.7, 1.8, 1.6, mats.metal, 0, 0.2, 0));

    // Corrugated roof
    g.add(voxel(1.8, 0.12, 1.7, mats.metalLight, 0, 2.0, 0));

    // Large garage door
    g.add(voxel(1.1, 1.4, 0.08, mats.hazard, 0, 0.2, 0.81));

    // Side windows
    g.add(voxel(0.08, 0.5, 0.6, isPowered ? mats.glass : mats.darkPipe, 0.86, 1.0, 0));
    g.add(voxel(0.08, 0.5, 0.6, isPowered ? mats.glass : mats.darkPipe, -0.86, 1.0, 0));

    // Ventilation
    g.add(voxel(0.35, 0.4, 0.35, mats.metal, 0.6, 2.0, -0.5));

    // External compressor/generator
    g.add(voxel(0.5, 0.4, 0.4, mats.blueMetal, -0.85, 0.2, 0.5));

    // Signage
    g.add(voxel(0.5, 0.25, 0.08, mats.hazard, 0, 1.65, 0.85));

    // Status light
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.12, 0.08, 0.12, isPowered ? mats.emissiveGreen : mats.emissiveRed, 0, 1.9, 0.88));
    }

    return g;
}

// Level 4: Industrial workshop with advanced machinery
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';

    g.add(voxel(2.0, 0.25, 2.0, mats.concrete, 0, 0, 0));

    // Main industrial building
    g.add(voxel(1.8, 2.2, 1.7, mats.metalLight, 0, 0.25, 0));

    // Upper floor office section (Concrete)
    g.add(voxel(0.8, 0.8, 0.6, mats.concreteLight, 0.4, 1.45, -0.5));

    // Large industrial doors
    g.add(voxel(0.6, 1.6, 0.08, mats.hazard, -0.35, 0.25, 0.86));
    g.add(voxel(0.6, 1.6, 0.08, mats.hazard, 0.35, 0.25, 0.86));

    // Windows
    const windowMat = isPowered ? mats.glass : mats.darkPipe;
    g.add(voxel(0.08, 0.5, 0.4, windowMat, 0.91, 1.2, 0.4));
    g.add(voxel(0.5, 0.4, 0.08, windowMat, 0.4, 1.8, -0.81));

    // Roof with skylights
    g.add(voxel(1.9, 0.1, 1.8, mats.metal, 0, 2.45, 0));
    g.add(voxel(0.6, 0.06, 0.4, mats.glass, -0.4, 2.55, 0.4));

    // Industrial crane/hoist
    g.add(voxel(0.1, 0.4, 0.1, mats.hazard, -0.7, 2.0, 0));
    g.add(voxel(1.0, 0.08, 0.08, mats.hazard, -0.2, 2.3, 0));

    // Heavy machinery (CNC/Mill)
    g.add(voxel(0.6, 0.7, 0.5, mats.blueMetal, -0.4, 0.25, -0.3));

    // External fuel/power
    g.add(voxel(0.3, 0.8, 0.3, mats.metal, -0.9, 0.25, 0));
    g.add(voxel(0.25, 0.7, 0.25, mats.metal, -0.9, 0.25, 0.5));

    // Status beacon
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.12, 0.2, 0.12, isPowered ? mats.emissiveCyan : mats.emissiveRed, 0, 2.65, 0));
    }

    return g;
}
