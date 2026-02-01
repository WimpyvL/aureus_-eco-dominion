
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

export const RoadFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    const conn = opts?.connections || { north: false, south: false, east: false, west: false };

    // Count connections to determine road type
    const connCount = [conn.north, conn.south, conn.east, conn.west].filter(Boolean).length;

    // Asphalt base - always present
    g.add(voxel(1.0, 0.08, 1.0, mats.asphalt, 0, 0, 0));

    if (connCount === 0) {
        // Isolated road - show all directions as potential
        g.add(voxel(0.08, 0.02, 0.3, mats.concreteLight, 0, 0.08, -0.3));
        g.add(voxel(0.08, 0.02, 0.3, mats.concreteLight, 0, 0.08, 0.3));
    } else if (connCount === 1) {
        // Dead end - single direction
        if (conn.north || conn.south) {
            // Vertical road
            g.add(voxel(0.08, 0.02, 0.8, mats.concreteLight, 0, 0.08, 0));
        } else {
            // Horizontal road
            g.add(voxel(0.8, 0.02, 0.08, mats.concreteLight, 0, 0.08, 0));
        }
    } else if (connCount === 2) {
        // Straight or corner
        if ((conn.north && conn.south) || (conn.east && conn.west)) {
            // Straight road
            if (conn.north && conn.south) {
                // North-South straight
                g.add(voxel(0.08, 0.02, 0.9, mats.concreteLight, 0, 0.08, 0));
            } else {
                // East-West straight
                g.add(voxel(0.9, 0.02, 0.08, mats.concreteLight, 0, 0.08, 0));
            }
        } else {
            // Corner - no center line, just edge markings
            const cornerMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.7, metalness: 0.1 });

            // Add corner accent
            if (conn.north && conn.east) {
                g.add(voxel(0.15, 0.03, 0.15, cornerMat, 0.35, 0.08, -0.35));
            } else if (conn.north && conn.west) {
                g.add(voxel(0.15, 0.03, 0.15, cornerMat, -0.35, 0.08, -0.35));
            } else if (conn.south && conn.east) {
                g.add(voxel(0.15, 0.03, 0.15, cornerMat, 0.35, 0.08, 0.35));
            } else if (conn.south && conn.west) {
                g.add(voxel(0.15, 0.03, 0.15, cornerMat, -0.35, 0.08, 0.35));
            }
        }
    } else if (connCount === 3) {
        // T-junction
        const junctionMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.7, metalness: 0.1 });
        g.add(voxel(0.3, 0.03, 0.3, junctionMat, 0, 0.08, 0));
    } else {
        // 4-way intersection
        const crossMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.7, metalness: 0.1 });
        g.add(voxel(0.4, 0.03, 0.4, crossMat, 0, 0.08, 0));
    }

    return g;
};
