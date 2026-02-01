
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

export const ReservoirFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';

    // Large concrete foundation
    g.add(voxel(3.0, 0.3, 3.0, mats.concrete, 0, 0, 0));

    // Concrete walls (rectangular basin)
    g.add(voxel(3.0, 1.0, 0.2, mats.concrete, 0, 0.3, -1.4)); // Back wall
    g.add(voxel(3.0, 1.0, 0.2, mats.concrete, 0, 0.3, 1.4));  // Front wall
    g.add(voxel(0.2, 1.0, 2.8, mats.concrete, -1.4, 0.3, 0)); // Left wall
    g.add(voxel(0.2, 1.0, 2.8, mats.concrete, 1.4, 0.3, 0));  // Right wall

    // Water surface
    g.add(voxel(2.6, 0.15, 2.6, isPowered ? mats.reservoirWater : mats.oilWater, 0, 0.9, 0));

    // Metal gantry walkway across top
    g.add(voxel(3.0, 0.1, 0.4, mats.metal, 0, 1.35, 0));
    // Gantry supports
    g.add(voxel(0.1, 0.8, 0.1, mats.metal, -1.3, 0.9, 0));
    g.add(voxel(0.1, 0.8, 0.1, mats.metal, 1.3, 0.9, 0));

    // Railings
    g.add(voxel(3.0, 0.4, 0.05, mats.metalLight, 0, 1.55, 0.18));
    g.add(voxel(3.0, 0.4, 0.05, mats.metalLight, 0, 1.55, -0.18));

    // Pump station (corner)
    g.add(voxel(0.8, 1.5, 0.8, mats.metal, -1.0, 0.3, -1.0));
    g.add(voxel(0.85, 0.1, 0.85, mats.metalLight, -1.0, 1.8, -1.0));

    // Pump pipes connecting to basin
    g.add(voxel(0.15, 0.15, 0.6, mats.blueMetal, -1.0, 0.6, -0.4));
    g.add(voxel(0.15, 0.6, 0.15, mats.blueMetal, -0.7, 0.4, -1.0));

    // Control panel on pump station
    g.add(voxel(0.3, 0.4, 0.1, mats.metal, -0.7, 1.0, -0.55));

    // Status light on pump
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.15, 0.2, 0.05, isPowered ? mats.emissiveGreen : mats.emissiveRed, -0.7, 1.15, -0.5));
    }

    // Outlet pipes (side)
    g.add(voxel(0.2, 0.2, 0.8, mats.blueMetal, 1.3, 0.5, 0.8));
    g.add(voxel(0.3, 0.3, 0.5, mats.metal, 1.5, 0.4, 1.2));

    // Water level gauge
    g.add(voxel(0.08, 0.8, 0.08, mats.glass, 1.35, 0.7, -0.8));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.1, 0.3, 0.1, isPowered ? mats.emissiveCyan : mats.metal, 1.35, 1.1, -0.8));
    }

    // Warning signage
    g.add(voxel(0.4, 0.3, 0.05, mats.hazard, 0, 1.0, 1.43));

    // Ladder access
    g.add(voxel(0.08, 1.2, 0.15, mats.metal, 0.8, 0.6, 1.35));

    // Overflow drain grate
    g.add(voxel(0.4, 0.05, 0.4, mats.metalLight, 1.1, 0.35, 1.1));

    return g;
};
