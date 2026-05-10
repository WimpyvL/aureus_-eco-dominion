
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

export const RailLineFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    const conn = opts?.connections || { north: false, south: false, east: false, west: false };
    const connCount = [conn.north, conn.south, conn.east, conn.west].filter(Boolean).length;

    // Rail bed (gravel)
    g.add(voxel(1.0, 0.08, 1.0, mats.concrete, 0, 0, 0));

    // Rail implementation based on connections (simplified)
    if (conn.north || conn.south || connCount === 0) {
        // Vertical Rails
        g.add(voxel(0.06, 0.06, 1.0, mats.metal, -0.2, 0.08, 0));
        g.add(voxel(0.06, 0.06, 1.0, mats.metal, 0.2, 0.08, 0));
        // Sleepers
        for (let z = -0.35; z <= 0.35; z += 0.35) {
            g.add(voxel(0.6, 0.04, 0.1, mats.wood, 0, 0.05, z));
        }
    } else if (conn.east || conn.west) {
        // Horizontal Rails
        g.add(voxel(1.0, 0.06, 0.06, mats.metal, 0, 0.08, -0.2));
        g.add(voxel(1.0, 0.06, 0.06, mats.metal, 0, 0.08, 0.2));
        // Sleepers
        for (let x = -0.35; x <= 0.35; x += 0.35) {
            g.add(voxel(0.1, 0.04, 0.6, mats.wood, x, 0.05, 0));
        }
    }

    return g;
};
