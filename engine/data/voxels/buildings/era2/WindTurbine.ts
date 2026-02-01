
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Wind Turbine Factory - Multi-level renewable power
 * Level 1: Lattice wooden tower with canvas sails
 * Level 2: Modern metal wind turbine (Original)
 * Level 3: Dual-rotor industrial turbine
 * Level 4: Vertical axis spiral turbine
 */
export const WindTurbineFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

// Level 1: Lattice wooden tower
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.0, 0.2, 1.0, mats.stone, 0, 0, 0));

    // Wooden lattice structure
    for (let y = 0.2; y < 4.0; y += 1.0) {
        g.add(voxel(0.1, 1.0, 0.1, mats.wood, -0.3, y, -0.3));
        g.add(voxel(0.1, 1.0, 0.1, mats.wood, 0.3, y, -0.3));
        g.add(voxel(0.1, 1.0, 0.1, mats.wood, -0.3, y, 0.3));
        g.add(voxel(0.1, 1.0, 0.1, mats.wood, 0.3, y, 0.3));
        // Cross braces
        g.add(voxel(0.6, 0.08, 0.08, mats.wood, 0, y + 0.5, 0.3));
        g.add(voxel(0.6, 0.08, 0.08, mats.wood, 0, y + 0.5, -0.3));
    }

    // Top pivot
    g.add(voxel(0.4, 0.4, 0.4, mats.wood, 0, 4.2, 0));

    // Sails (Canvas)
    const rotor = new THREE.Group();
    rotor.position.set(0, 4.4, 0.3);
    for (let i = 0; i < 4; i++) {
        const blade = new THREE.Group();
        blade.rotation.z = i * (Math.PI / 2);
        blade.add(voxel(0.1, 1.5, 0.05, mats.wood, 0, 0.75, 0));
        blade.add(voxel(0.5, 1.2, 0.02, mats.sand, 0.25, 0.75, 0.03)); // Canvas sail
        rotor.add(blade);
    }
    g.add(rotor);

    return g;
}

// Level 2: Modern wind turbine (Original)
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.0, 0.3, 1.0, mats.concrete, 0, 0, 0));
    g.add(voxel(0.5, 1.5, 0.5, mats.metalLight, 0, 0.3, 0));
    g.add(voxel(0.45, 1.5, 0.45, mats.metalLight, 0, 1.8, 0));
    g.add(voxel(0.4, 1.5, 0.4, mats.metalLight, 0, 3.3, 0));
    g.add(voxel(0.35, 1.5, 0.35, mats.metalLight, 0, 4.8, 0));
    g.add(voxel(0.8, 0.5, 0.4, mats.metalLight, 0, 6.3, 0.3));

    const rotor = new THREE.Group();
    rotor.position.set(0, 6.5, 0.9);
    rotor.add(voxel(0.25, 0.25, 0.3, mats.metal, 0, 0, 0));
    for (let i = 0; i < 3; i++) {
        const blade = new THREE.Group();
        blade.rotation.z = i * (Math.PI * 2 / 3);
        blade.add(voxel(0.25, 1.5, 0.06, mats.concreteLight, 0, 0.9, 0));
        blade.add(voxel(0.2, 1.5, 0.05, mats.concreteLight, 0, 2.4, 0));
        blade.add(voxel(0.15, 1.0, 0.04, mats.concreteLight, 0, 3.6, 0));
        rotor.add(blade);
    }
    g.add(rotor);
    g.add(voxel(0.15, 0.15, 0.15, mats.emissiveRed, 0, 6.85, 0));

    return g;
}

// Level 3: Dual-rotor turbine
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.2, 0.4, 1.2, mats.concrete, 0, 0, 0));

    // Tower
    g.add(voxel(0.6, 6.0, 0.6, mats.metalLight, 0, 0.4, 0));
    g.add(voxel(1.5, 0.6, 0.6, mats.metalLight, 0, 6.4, 0)); // Double nacelle

    // Two sets of rotors
    const addRotor = (z: number) => {
        const rotor = new THREE.Group();
        rotor.position.set(0, 6.7, z);
        rotor.add(voxel(0.3, 0.3, 0.4, mats.blueMetal, 0, 0, 0));
        for (let i = 0; i < 3; i++) {
            const blade = new THREE.Group();
            blade.rotation.z = i * (Math.PI * 2 / 3);
            blade.add(voxel(0.3, 4.5, 0.08, mats.concreteLight, 0, 2.25, 0));
            rotor.add(blade);
        }
        g.add(rotor);
    };
    addRotor(0.6);
    addRotor(-0.6);

    return g;
}

// Level 4: Vertical Axis Spiral Turbine
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    g.add(voxel(1.6, 0.4, 1.6, mats.concrete, 0, 0, 0));

    // Sleek central tower
    g.add(voxel(0.8, 8.0, 0.8, mats.concreteLight, 0, 0.4, 0));
    g.add(voxel(0.85, 0.2, 0.85, mats.emissiveCyan, 0, 4.0, 0));

    // Vertical spiral blades
    for (let r = 0; r < 3; r++) {
        const angle = (r / 3) * Math.PI * 2;
        for (let y = 1.0; y < 8.0; y += 0.5) {
            const rot = angle + (y * 0.5);
            const x = Math.cos(rot) * 0.8;
            const z = Math.sin(rot) * 0.8;
            g.add(voxel(0.2, 0.6, 0.05, mats.blueMetal, x, y, z));
        }
    }

    // Solar integration on base
    g.add(voxel(1.4, 0.05, 1.4, mats.solar, 0, 0.4, 0));

    return g;
}
