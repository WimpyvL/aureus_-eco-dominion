
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

export const PipeFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    const isConnected = opts?.waterStatus === 'CONNECTED';
    const conn = opts?.connections || { north: false, south: false, east: false, west: false };

    const connCount = [conn.north, conn.south, conn.east, conn.west].filter(Boolean).length;
    const pipeMat = isConnected ? mats.darkPipe : mats.metal;

    // Central junction box - lowered to sit in trench
    g.add(voxel(0.4, 0.4, 0.4, pipeMat, 0, 0, 0));

    // Pipe extensions based on connections
    if (conn.north || connCount === 0) {
        g.add(voxel(0.25, 0.25, 0.5, pipeMat, 0, 0, -0.25));
        g.add(voxel(0.3, 0.3, 0.08, mats.metal, 0, 0, -0.46));
    }
    if (conn.south || connCount === 0) {
        g.add(voxel(0.25, 0.25, 0.5, pipeMat, 0, 0, 0.25));
        g.add(voxel(0.3, 0.3, 0.08, mats.metal, 0, 0, 0.46));
    }
    if (conn.east || connCount === 0) {
        g.add(voxel(0.5, 0.25, 0.25, pipeMat, 0.25, 0, 0));
        g.add(voxel(0.08, 0.3, 0.3, mats.metal, 0.46, 0, 0));
    }
    if (conn.west || connCount === 0) {
        g.add(voxel(0.5, 0.25, 0.25, pipeMat, -0.25, 0, 0));
        g.add(voxel(0.08, 0.3, 0.3, mats.metal, -0.46, 0, 0));
    }

    // Valve stem - sticks out from trench
    g.add(voxel(0.12, 1.2, 0.12, mats.metal, 0, 0.4, 0));

    // Valve wheel on top
    g.add(voxel(0.3, 0.3, 0.08, mats.metal, 0, 1.0, 0));

    // Status indicator light
    const statusMat = isConnected ? mats.emissiveGreen : mats.emissiveRed;
    g.add(voxel(0.12, 0.08, 0.12, statusMat, 0, 1.1, 0));

    return g;
};
