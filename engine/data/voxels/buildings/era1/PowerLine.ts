
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

export const PowerLineFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    // Power status drives the emissive light on top
    const isConnected = opts?.powerStatus === 'CONNECTED' || false;

    // Base Pole
    g.add(voxel(0.15, 1.8, 0.15, mats.wood, 0, 0, 0));

    // Cross arm
    g.add(voxel(0.8, 0.1, 0.15, mats.wood, 0, 1.5, 0));

    // Insulators (White caps)
    g.add(voxel(0.12, 0.15, 0.12, mats.concreteLight, -0.35, 1.6, 0));
    g.add(voxel(0.12, 0.15, 0.12, mats.concreteLight, 0.35, 1.6, 0));

    // Status Light (Red/Green)
    // Only show if actually built
    if (!opts?.isUnderConstruction) {
        const lightMat = isConnected ? mats.emissiveGreen : mats.emissiveRed;
        g.add(voxel(0.1, 0.1, 0.1, lightMat, 0, 1.8, 0));
    }

    const conn = opts?.connections || { north: false, south: false, east: false, west: false };
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    const wireH = 1.65;

    if (conn.north) {
        g.add(voxel(0.05, 0.05, 0.5, wireMat, -0.35, wireH, -0.25));
        g.add(voxel(0.05, 0.05, 0.5, wireMat, 0.35, wireH, -0.25));
    }
    if (conn.south) {
        g.add(voxel(0.05, 0.05, 0.5, wireMat, -0.35, wireH, 0.25));
        g.add(voxel(0.05, 0.05, 0.5, wireMat, 0.35, wireH, 0.25));
    }
    if (conn.east) {
        g.add(voxel(0.5, 0.05, 0.05, wireMat, 0.25, wireH, 0));
    }
    if (conn.west) {
        g.add(voxel(0.5, 0.05, 0.05, wireMat, -0.25, wireH, 0));
    }

    return g;
};
