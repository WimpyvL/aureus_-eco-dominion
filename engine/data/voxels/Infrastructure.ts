

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { mats } from '../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../render/utils/VoxelBuilder';
import { BuildingType } from '../../../types';

// Connection flags for auto-connect infrastructure
export interface ConnectionFlags {
    north?: boolean;
    south?: boolean;
    east?: boolean;
    west?: boolean;
}

export const InfrastructureFactory = {
    // ROAD - Intelligent auto-connecting road
    [BuildingType.ROAD]: (opts?: FactoryOptions) => {
        const g = new THREE.Group();
        const conn = opts?.connections || { north: false, south: false, east: false, west: false };

        // Count connections to determine road type
        const connCount = [conn.north, conn.south, conn.east, conn.west].filter(Boolean).length;

        // Asphalt base - always present
        g.add(voxel(1.0, 0.08, 1.0, mats.asphalt, 0, 0, 0));

        if (connCount === 0) {
            // Isolated road - show all directions as potential
            g.add(voxel(0.08, 0.02, 0.3, mats.white, 0, 0.08, -0.3));
            g.add(voxel(0.08, 0.02, 0.3, mats.white, 0, 0.08, 0.3));
        } else if (connCount === 1) {
            // Dead end - single direction
            if (conn.north || conn.south) {
                // Vertical road
                g.add(voxel(0.08, 0.02, 0.8, mats.white, 0, 0.08, 0));
            } else {
                // Horizontal road
                g.add(voxel(0.8, 0.02, 0.08, mats.white, 0, 0.08, 0));
            }
        } else if (connCount === 2) {
            // Straight or corner
            if ((conn.north && conn.south) || (conn.east && conn.west)) {
                // Straight road
                if (conn.north && conn.south) {
                    // North-South straight
                    g.add(voxel(0.08, 0.02, 0.9, mats.white, 0, 0.08, 0));
                } else {
                    // East-West straight
                    g.add(voxel(0.9, 0.02, 0.08, mats.white, 0, 0.08, 0));
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
    },

    // PIPE - Auto-connecting water pipe
    [BuildingType.PIPE]: (opts?: FactoryOptions) => {
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
    },

    // FENCE - Auto-connecting security fence
    [BuildingType.FENCE]: (opts?: FactoryOptions) => {
        const g = new THREE.Group();
        const conn = opts?.connections || { north: false, south: false, east: false, west: false };

        const connCount = [conn.north, conn.south, conn.east, conn.west].filter(Boolean).length;

        // Center post - always present
        g.add(voxel(0.1, 1.4, 0.1, mats.metal, 0, 0, 0));

        // Post cap
        g.add(voxel(0.14, 0.08, 0.14, mats.metal, 0, 1.4, 0));

        // Fence segments based on connections
        if (conn.north || connCount === 0) {
            // Fence extending north
            g.add(voxel(0.06, 0.04, 0.5, mats.metal, 0, 0.4, -0.25));
            g.add(voxel(0.06, 0.04, 0.5, mats.metal, 0, 0.8, -0.25));
            g.add(voxel(0.06, 0.04, 0.5, mats.metal, 0, 1.2, -0.25));
            // Mesh fill
            g.add(voxel(0.04, 0.7, 0.45, mats.glass, 0, 0.5, -0.25)); // Use glass for mesh effect
        }
        if (conn.south || connCount === 0) {
            g.add(voxel(0.06, 0.04, 0.5, mats.metal, 0, 0.4, 0.25));
            g.add(voxel(0.06, 0.04, 0.5, mats.metal, 0, 0.8, 0.25));
            g.add(voxel(0.06, 0.04, 0.5, mats.metal, 0, 1.2, 0.25));
            g.add(voxel(0.04, 0.7, 0.45, mats.glass, 0, 0.5, 0.25));
        }
        if (conn.east || connCount === 0) {
            g.add(voxel(0.5, 0.04, 0.06, mats.metal, 0.25, 0.4, 0));
            g.add(voxel(0.5, 0.04, 0.06, mats.metal, 0.25, 0.8, 0));
            g.add(voxel(0.5, 0.04, 0.06, mats.metal, 0.25, 1.2, 0));
            g.add(voxel(0.45, 0.7, 0.04, mats.glass, 0.25, 0.5, 0));
        }
        if (conn.west || connCount === 0) {
            g.add(voxel(0.5, 0.04, 0.06, mats.metal, -0.25, 0.4, 0));
            g.add(voxel(0.5, 0.04, 0.06, mats.metal, -0.25, 0.8, 0));
            g.add(voxel(0.5, 0.04, 0.06, mats.metal, -0.25, 1.2, 0));
            g.add(voxel(0.45, 0.7, 0.04, mats.glass, -0.25, 0.5, 0));
        }

        // Add corner posts for connected corners
        if (connCount >= 2) {
            // Extra visual stability at junctions
            g.add(voxel(0.12, 0.1, 0.12, mats.concrete, 0, 0, 0));
        }

        return g;
    },

    // WATER WELL - Deep water extraction pump
    [BuildingType.WATER_WELL]: () => {
        const g = new THREE.Group();
        // Stone well base
        g.add(voxel(1.0, 0.5, 1.0, mats.concrete, 0, 0, 0));

        // Inner well hole (dark)
        g.add(voxel(0.5, 0.1, 0.5, mats.darkPipe, 0, 0.5, 0));

        // Pump housing
        g.add(voxel(0.4, 1.5, 0.4, mats.metal, 0, 0.5, 0));

        // Pump mechanism
        g.add(voxel(0.5, 0.2, 0.2, mats.metal, 0, 1.5, 0));
        g.add(voxel(0.15, 0.5, 0.15, mats.darkPipe, 0.3, 1.7, 0));

        // Handle
        g.add(voxel(0.4, 0.1, 0.1, mats.wood, 0, 1.3, 0.3));

        // Outlet pipe
        g.add(voxel(0.15, 0.15, 0.4, mats.darkPipe, 0, 0.7, 0.5));
        g.add(voxel(0.12, 0.12, 0.12, mats.emissiveCyan, 0, 0.75, 0.7));

        // Decorative stonework
        g.add(voxel(1.1, 0.15, 1.1, mats.concrete, 0, 0.5, 0));

        return g;
    },

    // POND - Natural water body (not buildable but rendered)
    [BuildingType.POND]: () => {
        const g = new THREE.Group();
        // Water surface handled by terrain shader
        return g;
    },

    // RESERVOIR - Large water storage (3x3 building)
    [BuildingType.RESERVOIR]: () => {
        const g = new THREE.Group();
        // Large concrete tank
        g.add(voxel(2.8, 0.3, 2.8, mats.concrete, 0, 0, 0));
        g.add(voxel(2.6, 1.5, 2.6, mats.concrete, 0, 0.3, 0));

        // Water inside (slightly lower)
        g.add(voxel(2.4, 0.3, 2.4, mats.glass, 0, 1.5, 0));

        // Pump house
        g.add(voxel(0.8, 1.2, 0.8, mats.metal, 1.0, 1.8, 1.0));
        g.add(voxel(0.3, 0.3, 0.05, mats.emissiveCyan, 1.0, 2.3, 1.41));

        // Pipes
        g.add(voxel(0.2, 0.2, 1.5, mats.darkPipe, 0.8, 0.5, 0));
        g.add(voxel(1.5, 0.2, 0.2, mats.darkPipe, 0, 0.5, 0.8));

        // Ladder
        g.add(voxel(0.1, 1.5, 0.1, mats.metal, -1.2, 0.3, 0));
        g.add(voxel(0.1, 1.5, 0.1, mats.metal, -1.0, 0.3, 0));

        // Warning signs
        g.add(voxel(0.3, 0.4, 0.05, mats.hazard, 0, 1.2, 1.31));

        return g;
    },

    // CONSTRUCTION - Scaffolding for buildings under construction
    'CONSTRUCTION': (opts?: FactoryOptions) => {
        const g = new THREE.Group();
        const w = opts?.width || 1;
        const d = opts?.depth || 1;
        const halfW = (w / 2) - 0.05;
        const halfD = (d / 2) - 0.05;

        // 4 Corner pillars
        g.add(voxel(0.12, 2.0, 0.12, mats.metal, -halfW, 0, -halfD));
        g.add(voxel(0.12, 2.0, 0.12, mats.metal, halfW, 0, -halfD));
        g.add(voxel(0.12, 2.0, 0.12, mats.metal, -halfW, 0, halfD));
        g.add(voxel(0.12, 2.0, 0.12, mats.metal, halfW, 0, halfD));

        // Cross bracing
        g.add(voxel(w, 0.08, 0.08, mats.metal, 0, 0.5, -halfD));
        g.add(voxel(w, 0.08, 0.08, mats.metal, 0, 0.5, halfD));
        g.add(voxel(w, 0.08, 0.08, mats.metal, 0, 1.2, -halfD));
        g.add(voxel(w, 0.08, 0.08, mats.metal, 0, 1.2, halfD));
        g.add(voxel(0.08, 0.08, d, mats.metal, -halfW, 1.2, 0));
        g.add(voxel(0.08, 0.08, d, mats.metal, halfW, 1.2, 0));

        // Top hazard rail
        g.add(voxel(w, 0.12, d, mats.hazard, 0, 2.0, 0));

        // Partial floor/progress indicator
        const progress = opts?.progress || 0.5;
        g.add(voxel(w * progress, 0.15, d * 0.8, mats.wood, -halfW * (1 - progress), 0.6, 0));

        return g;
    },

    // POWER_LINE - Electricity transmission
    [BuildingType.POWER_LINE]: (opts?: FactoryOptions) => {
        const g = new THREE.Group();
        // Power status drives the emissive light on top
        const isConnected = opts?.powerStatus === 'CONNECTED' || false;

        // Base Pole
        g.add(voxel(0.15, 1.8, 0.15, mats.wood, 0, 0, 0));

        // Cross arm
        g.add(voxel(0.8, 0.1, 0.15, mats.wood, 0, 1.5, 0));

        // Insulators (White caps)
        g.add(voxel(0.12, 0.15, 0.12, mats.white, -0.35, 1.6, 0));
        g.add(voxel(0.12, 0.15, 0.12, mats.white, 0.35, 1.6, 0));

        // Status Light (Red/Green)
        // Only show if actually built
        if (!opts?.isUnderConstruction) {
            const lightMat = isConnected ? mats.emissiveGreen : mats.emissiveRed;
            g.add(voxel(0.1, 0.1, 0.1, lightMat, 0, 1.8, 0));
        }

        const conn = opts?.connections || { north: false, south: false, east: false, west: false };
        const wireMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

        // Wires - simple straight lines for now
        // Note: Real catenary curves are hard with voxels, so we do straight bars

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
            // Need side cross-arms? Or just connect to center?
            // Standard power lines usually run rigid directions. 
            // Let's just run wires to center for E/W to keep it simple visually
            g.add(voxel(0.5, 0.05, 0.05, wireMat, 0.25, wireH, 0));
        }
        if (conn.west) {
            g.add(voxel(0.5, 0.05, 0.05, wireMat, -0.25, wireH, 0));
        }

        return g;
    }
}
