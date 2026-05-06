
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

const roadAccentMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.7, metalness: 0.1 });
const roadLaneMarkMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.75,
    metalness: 0.05,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -4,
    depthWrite: false,
});

const configureRoadOverlay = (mesh: THREE.Mesh) => {
    mesh.renderOrder = 2;
    return mesh;
};

export const RoadFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    const deck = new THREE.Group();
    const conn = opts?.connections || {
        north: false, south: false, east: false, west: false,
        northDelta: 0, southDelta: 0, eastDelta: 0, westDelta: 0
    };

    // Count connections to determine road type
    const connCount = [conn.north, conn.south, conn.east, conn.west].filter(Boolean).length;
    const ROAD_THICKNESS = 0.08;
    const ROAD_SIZE = 1.04;
    const EDGE_OVERLAP = 0.18;
    const EDGE_INSET = 0.49;
    const CORNER_PATCH_SIZE = 0.26;

    const createLaneMark = (w: number, d: number, x = 0, z = 0) =>
        configureRoadOverlay(voxel(w, 0.02, d, roadLaneMarkMat, x, 0.1, z));

    const addEdgeOverlap = (direction: 'north' | 'south' | 'east' | 'west') => {
        if (direction === 'north') {
            deck.add(voxel(ROAD_SIZE - 0.02, ROAD_THICKNESS, EDGE_OVERLAP, mats.asphalt, 0, 0, -EDGE_INSET));
        } else if (direction === 'south') {
            deck.add(voxel(ROAD_SIZE - 0.02, ROAD_THICKNESS, EDGE_OVERLAP, mats.asphalt, 0, 0, EDGE_INSET));
        } else if (direction === 'east') {
            deck.add(voxel(EDGE_OVERLAP, ROAD_THICKNESS, ROAD_SIZE - 0.02, mats.asphalt, EDGE_INSET, 0, 0));
        } else if (direction === 'west') {
            deck.add(voxel(EDGE_OVERLAP, ROAD_THICKNESS, ROAD_SIZE - 0.02, mats.asphalt, -EDGE_INSET, 0, 0));
        }
    };

    const addCornerPatch = (x: number, z: number) => {
        deck.add(voxel(CORNER_PATCH_SIZE, ROAD_THICKNESS, CORNER_PATCH_SIZE, mats.asphalt, x, 0, z));
    };

    // Asphalt base - always present
    deck.add(voxel(ROAD_SIZE, ROAD_THICKNESS, ROAD_SIZE, mats.asphalt, 0, 0, 0));

    if (conn.north) addEdgeOverlap('north');
    if (conn.south) addEdgeOverlap('south');
    if (conn.east) addEdgeOverlap('east');
    if (conn.west) addEdgeOverlap('west');

    if (connCount === 0) {
        // Isolated road - show all directions as potential
        deck.add(createLaneMark(0.08, 0.3, 0, -0.3));
        deck.add(createLaneMark(0.08, 0.3, 0, 0.3));
    } else if (connCount === 1) {
        // Dead end - single direction
        if (conn.north || conn.south) {
            // Vertical road
            deck.add(createLaneMark(0.08, 0.8));
        } else {
            // Horizontal road
            deck.add(createLaneMark(0.8, 0.08));
        }
    } else if (connCount === 2) {
        // Straight or corner
        if ((conn.north && conn.south) || (conn.east && conn.west)) {
            // Straight road
            if (conn.north && conn.south) {
                // North-South straight
                deck.add(createLaneMark(0.08, 0.9));
            } else {
                // East-West straight
                deck.add(createLaneMark(0.9, 0.08));
            }
        } else {
            // Corner - no center line, just edge markings
            // Add corner accent
            if (conn.north && conn.east) {
                addCornerPatch(0.4, -0.4);
                deck.add(configureRoadOverlay(voxel(0.15, 0.03, 0.15, roadAccentMat, 0.35, 0.1, -0.35)));
            } else if (conn.north && conn.west) {
                addCornerPatch(-0.4, -0.4);
                deck.add(configureRoadOverlay(voxel(0.15, 0.03, 0.15, roadAccentMat, -0.35, 0.1, -0.35)));
            } else if (conn.south && conn.east) {
                addCornerPatch(0.4, 0.4);
                deck.add(configureRoadOverlay(voxel(0.15, 0.03, 0.15, roadAccentMat, 0.35, 0.1, 0.35)));
            } else if (conn.south && conn.west) {
                addCornerPatch(-0.4, 0.4);
                deck.add(configureRoadOverlay(voxel(0.15, 0.03, 0.15, roadAccentMat, -0.35, 0.1, 0.35)));
            }
        }
    } else if (connCount === 3) {
        // T-junction
        deck.add(configureRoadOverlay(voxel(0.3, 0.03, 0.3, roadAccentMat, 0, 0.1, 0)));
    } else {
        // 4-way intersection
        deck.add(configureRoadOverlay(voxel(0.4, 0.03, 0.4, roadAccentMat, 0, 0.1, 0)));
    }

    // Straight runs should tilt as a single deck instead of stacking connector blocks.
    if (connCount <= 2) {
        if ((conn.north || conn.south) && !(conn.east || conn.west)) {
            const northEdge = conn.north ? Math.max(conn.northDelta || 0, 0) : 0;
            const southEdge = conn.south ? Math.max(conn.southDelta || 0, 0) : 0;
            const rise = southEdge - northEdge;
            deck.rotation.x = -Math.atan2(rise, 1);
            deck.position.y = (northEdge + southEdge) * 0.5;
        } else if ((conn.east || conn.west) && !(conn.north || conn.south)) {
            const westEdge = conn.west ? Math.max(conn.westDelta || 0, 0) : 0;
            const eastEdge = conn.east ? Math.max(conn.eastDelta || 0, 0) : 0;
            const rise = eastEdge - westEdge;
            deck.rotation.z = Math.atan2(rise, 1);
            deck.position.y = (westEdge + eastEdge) * 0.5;
        }
    }

    g.add(deck);
    return g;
};
