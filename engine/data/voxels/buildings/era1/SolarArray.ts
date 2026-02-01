
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Solar Array Factory - Multi-level power generation
 * Level 1: Wooden frame panels
 * Level 2: Metal frame with fixed tile
 * Level 3: Dual-axis tracking array
 * Level 4: High-efficiency energy tower/concentrator
 */
export const SolarArrayFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

// Level 1: Primitive wooden frame
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.6, 0.1, 0.1, mats.wood, 0, 0, -0.4));
    g.add(voxel(1.6, 0.1, 0.1, mats.wood, 0, 0, 0.4));
    g.add(voxel(0.08, 0.6, 0.08, mats.wood, -0.7, 0.1, 0));
    g.add(voxel(0.08, 0.6, 0.08, mats.wood, 0, 0.1, 0));
    g.add(voxel(0.08, 0.6, 0.08, mats.wood, 0.7, 0.1, 0));
    const bed = new THREE.Group();
    bed.position.y = 0.7;
    bed.rotation.x = Math.PI / 6;
    bed.add(voxel(1.8, 0.08, 1.2, mats.wood, 0, 0, 0));
    for (let x = -0.65; x <= 0.65; x += 0.45) {
        for (let z = -0.4; z <= 0.4; z += 0.4) {
            bed.add(voxel(0.4, 0.04, 0.35, mats.solar, x, 0.05, z));
        }
    }
    g.add(bed);
    g.add(voxel(0.35, 0.3, 0.25, mats.wood, 0.85, 0.1, 0));
    return g;
}

// Level 2: Fixed metal frame
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.8, 0.15, 1.8, mats.concrete, 0, 0, 0));
    g.add(voxel(0.1, 0.8, 0.1, mats.metal, -0.7, 0.15, 0));
    g.add(voxel(0.1, 0.8, 0.1, mats.metal, 0.7, 0.15, 0));
    const bed = new THREE.Group();
    bed.position.y = 0.95;
    bed.rotation.x = Math.PI / 5;
    bed.add(voxel(2.0, 0.12, 1.4, mats.metal, 0, 0, 0));
    for (let x = -0.75; x <= 0.75; x += 0.5) {
        for (let z = -0.5; z <= 0.5; z += 0.5) {
            bed.add(voxel(0.45, 0.06, 0.45, mats.solar, x, 0.08, z));
        }
    }
    g.add(bed);
    g.add(voxel(0.4, 0.5, 0.3, mats.blueMetal, 0.8, 0.15, 0));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.1, 0.1, 0.05, mats.emissiveGreen, 0.8, 0.45, 0.16));
    }
    return g;
}

// Level 3: Dual-axis tracking
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.8, 0.2, 1.8, mats.concrete, 0, 0, 0));
    // Main tracking pillar
    g.add(voxel(0.3, 1.2, 0.3, mats.metalLight, 0, 0.2, 0));
    // Rotation pivot
    g.add(voxel(0.4, 0.4, 0.4, mats.blueMetal, 0, 1.4, 0));
    const bed = new THREE.Group();
    bed.position.y = 1.6;
    bed.rotation.x = Math.PI / 6;
    bed.rotation.y = Math.PI / 8;
    bed.add(voxel(2.2, 0.15, 1.6, mats.metal, 0, 0, 0));
    // Detailed solar cells
    for (let x = -0.8; x <= 0.8; x += 0.4) {
        for (let z = -0.6; z <= 0.6; z += 0.4) {
            bed.add(voxel(0.35, 0.05, 0.35, mats.solar, x, 0.08, z));
        }
    }
    g.add(bed);
    g.add(voxel(0.5, 0.3, 0.5, mats.metal, -0.6, 0.2, -0.6));
    return g;
}

// Level 4: Modern concentrator tower
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(2.0, 0.25, 2.0, mats.concrete, 0, 0, 0));
    // Central tower (Concrete)
    g.add(voxel(0.8, 2.5, 0.8, mats.concreteLight, 0, 0.25, 0));
    g.add(voxel(0.9, 0.1, 0.9, mats.blueMetal, 0, 1.0, 0));
    g.add(voxel(0.9, 0.1, 0.9, mats.blueMetal, 0, 2.0, 0));
    // Glowing top core
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.6, 0.6, 0.6, mats.emissiveCyan, 0, 2.75, 0));
    }
    // High-tech panel ring
    for (let i = 0; i < 4; i++) {
        const radius = 0.8;
        const angle = (i / 4) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const panel = new THREE.Group();
        panel.position.set(x, 1.5, z);
        panel.rotation.y = angle;
        panel.rotation.x = -Math.PI / 4;
        panel.add(voxel(0.8, 0.08, 0.6, mats.solar, 0, 0, 0));
        g.add(panel);
    }
    return g;
}
