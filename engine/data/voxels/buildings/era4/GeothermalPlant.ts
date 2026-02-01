
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

export const GeothermalPlantFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    // Base platform
    g.add(voxel(2.0, 0.25, 2.0, mats.concrete, 0, 0, 0));
    // Main turbine building
    g.add(voxel(1.4, 1.2, 1.4, mats.metal, 0, 0.25, 0));
    // Steam vents
    g.add(voxel(0.3, 0.8, 0.3, mats.darkPipe, -0.65, 1.45, -0.65));
    g.add(voxel(0.3, 0.8, 0.3, mats.darkPipe, 0.65, 1.45, 0.65));

    // Steam caps (glowing hot when active)
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.35, 0.1, 0.35, mats.emissiveRed, -0.65, 2.25, -0.65));
        g.add(voxel(0.35, 0.1, 0.35, mats.emissiveRed, 0.65, 2.25, 0.65));
    }

    // Cooling towers
    g.add(voxel(0.5, 0.6, 0.5, mats.concrete, -0.7, 0.25, 0.7));
    g.add(voxel(0.5, 0.6, 0.5, mats.concrete, 0.7, 0.25, -0.7));
    // Pipes going into ground
    g.add(voxel(0.2, 0.25, 0.2, mats.darkPipe, 0, 0, 0));
    // Control panel
    g.add(voxel(0.4, 0.6, 0.15, mats.metal, 0, 0.6, 0.73));

    // Status light
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.2, 0.3, 0.05, mats.emissiveGreen, 0, 0.8, 0.78));
    }

    // Power cables out
    g.add(voxel(0.8, 0.1, 0.1, mats.darkPipe, 0.6, 0.8, 0));
    return g;
};
