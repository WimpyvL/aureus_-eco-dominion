
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { cylinder, dome, torusRing, voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Community Garden Factory - Multi-level green space
 * Level 1: Primitive soil patches with stick markers
 * Level 2: Raised wooden planter beds (Original)
 * Level 3: Stone-walled garden with water feature
 * Level 4: Modern hydroponic/glass-enclosed biosphere
 */
export const CommunityGardenFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

// Level 1: Primitive soil patches
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    // Raw dirt base with uneven edges
    g.add(voxel(1.9, 0.1, 1.9, mats.dirt, 0, 0, 0));

    // Scattered stone borders
    g.add(voxel(0.3, 0.2, 0.3, mats.concrete, -0.8, 0.05, -0.8));
    g.add(voxel(0.4, 0.15, 0.3, mats.concrete, 0.7, 0.05, 0.6));

    // Simple soil mounds
    const plant = (x: number, z: number, color: THREE.Material) => {
        g.add(voxel(0.4, 0.1, 0.4, mats.dirt, x, 0.1, z));
        g.add(voxel(0.1, 0.4, 0.1, mats.wood, x, 0.15, z)); // Stick marker
        g.add(voxel(0.25, 0.25, 0.25, color, x, 0.3, z)); // Small sprout
    };

    plant(-0.5, -0.5, mats.leaf);
    plant(0.5, -0.5, mats.progressGreen);
    plant(-0.5, 0.5, mats.progressGreen);
    plant(0.5, 0.5, mats.leaf);

    // Water barrel (old wood)
    g.add(voxel(0.3, 0.4, 0.3, mats.wood, 0.7, 0.1, -0.7));

    return g;
}

// Level 2: Raised wooden planter beds (Original-ish)
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(2.0, 0.15, 2.0, mats.dirt, 0, 0, 0));
    g.add(voxel(0.3, 0.08, 2.0, mats.concrete, 0, 0.15, 0));
    g.add(voxel(2.0, 0.08, 0.3, mats.concrete, 0, 0.15, 0));

    const planter = (x: number, z: number, plantColor: THREE.Material, height: number) => {
        g.add(voxel(0.75, 0.35, 0.75, mats.wood, x, 0.15, z));
        g.add(voxel(0.65, height, 0.65, plantColor, x, 0.35, z));
    };

    planter(-0.55, -0.55, mats.leaf, 0.5);
    planter(0.55, -0.55, mats.progressGreen, 0.6);
    planter(-0.55, 0.55, mats.progressGreen, 0.4);
    planter(0.55, 0.55, mats.leaf, 0.55);

    g.add(voxel(0.15, 0.8, 0.15, mats.wood, -0.55, 0.5, -0.55));
    g.add(voxel(0.4, 0.4, 0.4, mats.leaf, -0.55, 1.0, -0.55));
    g.add(voxel(0.25, 0.5, 0.25, mats.blueMetal, 0.85, 0.15, 0));

    return g;
}

// Level 3: Stone-walled garden
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(2.0, 0.2, 2.0, mats.concrete, 0, 0, 0));

    // Stone walls
    g.add(voxel(2.05, 0.4, 0.15, mats.concrete, 0, 0.2, 0.95));
    g.add(voxel(2.05, 0.4, 0.15, mats.concrete, 0, 0.2, -0.95));
    g.add(voxel(0.15, 0.4, 2.05, mats.concrete, 0.95, 0.2, 0));
    g.add(voxel(0.15, 0.4, 2.05, mats.concrete, -0.95, 0.2, 0));

    // Central fountain
    g.add(voxel(0.6, 0.5, 0.6, mats.concrete, 0, 0.2, 0));
    g.add(voxel(0.4, 0.1, 0.4, mats.waterMaterial, 0, 0.7, 0));

    // Lush plant beds
    const bed = (x: number, z: number) => {
        g.add(voxel(0.6, 0.3, 0.6, mats.dirt, x, 0.2, z));
        g.add(voxel(0.5, 0.6, 0.5, mats.leaf, x, 0.5, z));
    };
    bed(-0.5, -0.5);
    bed(0.5, -0.5);
    bed(-0.5, 0.5);
    bed(0.5, 0.5);

    return g;
}

// Level 4: Modern Hydroponic Biosphere
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const detailLevel = opts?.detailLevel ?? 'MEDIUM';
    g.add(voxel(2.0, 0.25, 2.0, mats.concrete, 0, 0, 0));

    // Glass dome/structure
    g.add(dome(1.1, mats.glass, 0, 0.25, 0, { detailLevel }));
    g.add(torusRing(1.1, 0.05, mats.blueMetal, 0, 0.25, 0, {
        detailLevel,
        rotationX: Math.PI / 2,
    }));
    g.add(torusRing(0.7, 0.04, mats.blueMetal, 0, 0.95, 0, {
        detailLevel,
        rotationX: Math.PI / 2,
    }));

    // Hydroponic towers
    const tower = (x: number, z: number) => {
        g.add(cylinder(0.14, 1.4, mats.metalLight, x, 0.25, z));
        for (let y = 0.5; y < 1.6; y += 0.4) {
            g.add(torusRing(0.22, 0.06, mats.progressGreen, x, y, z, {
                detailLevel,
                rotationX: Math.PI / 2,
            }));
        }
    };
    tower(-0.5, -0.5);
    tower(0.5, -0.5);
    tower(-0.5, 0.5);
    tower(0.5, 0.5);

    // Glowing core
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.26, 1.0, 0.26, mats.glass, 0, 0.5, 0));
        g.add(voxel(0.12, 0.84, 0.12, mats.emissiveCyan, 0, 0.58, 0));
    }

    return g;
}
