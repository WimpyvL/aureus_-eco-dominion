
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

export const OreFoundryFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';

    // Heavy Industrial Deck
    g.add(voxel(2.8, 0.4, 2.8, mats.concrete, 0, 0, 0));

    // Main Smelting Kiln (Horizontal Processing Tube)
    g.add(voxel(2.4, 1.2, 1.2, mats.metal, 0, 1.0, 0));
    g.add(voxel(1.0, 1.0, 1.0, mats.metalLight, -1.2, 1.0, 0)); // Feed head
    g.add(voxel(1.0, 1.0, 1.0, mats.metalLight, 1.2, 1.0, 0)); // Output head

    // High-Temp Furnace Core
    g.add(voxel(1.5, 2.0, 1.5, mats.concrete, 0, 1.2, -0.8));

    // Glowing slag view-port - glows when powered
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.6, 0.6, 0.1, isPowered ? mats.hazard : mats.brick, 0, 1.2, -0.1));
    }

    // Molten Slag Vats
    g.add(voxel(0.8, 0.4, 0.8, mats.metal, -0.8, 0.4, 0.8));
    if (!opts?.isUnderConstruction && isPowered) {
        g.add(voxel(0.6, 0.1, 0.6, mats.hazard, -0.8, 0.61, 0.8)); // Liquid orange slag
    }
    g.add(voxel(0.8, 0.4, 0.8, mats.metal, 0.8, 0.4, 0.8));
    if (!opts?.isUnderConstruction && isPowered) {
        g.add(voxel(0.6, 0.1, 0.6, mats.hazard, 0.8, 0.61, 0.8));
    }

    // Triple Smokestacks (Heat Dissipation)
    g.add(voxel(0.4, 4.0, 0.4, mats.concrete, -0.8, 2.0, -0.8));
    g.add(voxel(0.4, 3.5, 0.4, mats.concrete, 0.8, 1.8, -0.8));
    g.add(voxel(0.3, 4.2, 0.3, mats.metal, 0, 2.1, 0.8));

    // Complex Pipe Network
    g.add(voxel(0.15, 0.15, 1.5, mats.metalLight, -0.6, 1.8, 0));
    g.add(voxel(1.5, 0.15, 0.15, mats.metalLight, 0, 2.5, -0.8));
    g.add(voxel(0.15, 1.2, 0.15, mats.metalLight, 0.5, 0.8, 0.5)); // Vertical riser

    // Emergency Steam Vents
    g.add(voxel(0.3, 0.6, 0.3, mats.hazard, 1.2, 1.6, 0.4));
    g.add(voxel(0.3, 0.6, 0.3, mats.hazard, -1.2, 1.6, 0.4));

    // Status light
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.2, 0.2, 0.2, isPowered ? mats.emissiveGreen : mats.emissiveRed, 1.2, 2.2, 0.4));
    }

    return g;
};
