
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

/**
 * Staff Quarters Factory - Multi-level housing
 * Level 1: Primitive tent camp
 * Level 2: Container/prefab units
 * Level 3: Brick row housing
 * Level 4: Modern apartment complex
 */
export const StaffQuartersFactory = (opts?: FactoryOptions) => {
    const level = opts?.level || 1;

    switch (level) {
        case 1: return buildLevel1(opts);
        case 2: return buildLevel2(opts);
        case 3: return buildLevel3(opts);
        case 4:
        default: return buildLevel4(opts);
    }
};

function getDetailFlags(opts?: FactoryOptions) {
    const detailLevel = opts?.detailLevel || 'MEDIUM';
    return {
        isLow: detailLevel === 'LOW',
        isHigh: detailLevel === 'HIGH',
    };
}

// Level 1: Primitive tent camp
function buildLevel1(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    const { isLow, isHigh } = getDetailFlags(opts);

    // --- TEXTURED FOUNDATION ---
    // Base dirt
    g.add(voxel(1.9, 0.1, 1.9, mats.dirt, 0, 0, 0));
    // Patches of stone and grass for texture
    if (!isLow) {
        g.add(voxel(0.4, 0.11, 0.4, mats.rock, -0.6, 0, -0.6));
        g.add(voxel(0.3, 0.11, 0.3, mats.rock, 0.7, 0, 0.5));
        g.add(voxel(0.5, 0.11, 0.4, mats.grass, 0.4, 0, -0.7));
    }

    // --- TENT 1 (Large Canvas Tent) ---
    // Frame
    g.add(voxel(0.06, 1.3, 0.06, mats.wood, -0.75, 0.1, -0.6));
    g.add(voxel(0.06, 1.3, 0.06, mats.wood, -0.75, 0.1, 0.6));
    g.add(voxel(0.06, 1.5, 0.06, mats.wood, -0.75, 0.1, 0));
    g.add(voxel(0.04, 0.04, 1.2, mats.wood, -0.75, 1.6, 0)); // Ridge pole

    // Canvas (Tarp)
    g.add(voxel(0.02, 1.0, 0.55, mats.sand, -0.75, 0.8, -0.3)); // Left side
    g.add(voxel(0.02, 1.0, 0.55, mats.sand, -0.75, 0.8, 0.3));  // Right side
    g.add(voxel(0.6, 0.02, 1.2, mats.sand, -0.45, 1.3, 0));    // Slanted top (simplified)

    // Guy Ropes (thin wood voxels)
    if (isHigh) {
        g.add(voxel(0.02, 0.7, 0.02, mats.wood, -0.3, 0.1, 0.7));
        g.add(voxel(0.02, 0.7, 0.02, mats.wood, -0.3, 0.1, -0.7));
    }

    // Interior Detail
    g.add(voxel(0.4, 0.05, 0.8, mats.wood, -0.7, 0.1, 0)); // Sleeping mat/cot

    // --- TENT 2 (Small Tarp) ---
    g.add(voxel(1.0, 0.04, 0.8, mats.leafDark, 0.6, 1.0, 0)); // Tarp roof
    g.add(voxel(0.06, 1.0, 0.06, mats.wood, 0.2, 0.1, 0.3));  // Pole
    g.add(voxel(0.3, 0.05, 0.6, mats.wood, 0.7, 0.1, 0));    // Cot 2

    // --- CAMPFIRE (Detailed) ---
    // Stone ring
    const stoneSize = 0.15;
    const fireRingCount = isHigh ? 12 : isLow ? 4 : 8;
    for (let i = 0; i < fireRingCount; i++) {
        const angle = (i / fireRingCount) * Math.PI * 2;
        g.add(voxel(stoneSize, stoneSize, stoneSize, mats.rock, Math.cos(angle) * 0.25, 0.1, Math.sin(angle) * 0.25));
    }
    // Ash/charcoal base
    g.add(voxel(0.3, 0.05, 0.3, mats.pit, 0, 0.1, 0));
    // Logs (cross shape)
    g.add(voxel(0.4, 0.1, 0.1, mats.wood, 0, 0.15, 0));
    g.add(voxel(0.1, 0.1, 0.4, mats.wood, 0, 0.15, 0));

    if (!opts?.isUnderConstruction && isPowered) {
        g.add(voxel(0.15, 0.15, 0.15, mats.emissiveOrange, 0, 0.25, 0));
    }

    // --- PROPS ---
    // Stacked crates
    if (!isLow) {
        g.add(voxel(0.3, 0.3, 0.3, mats.wood, -0.1, 0.1, -0.8));
        g.add(voxel(0.25, 0.25, 0.25, mats.wood, -0.1, 0.4, -0.8));
    }

    // Water barrel
    if (isHigh) {
        g.add(voxel(0.35, 0.5, 0.35, mats.blueMetal, 0.8, 0.1, -0.2));
        g.add(voxel(0.3, 0.05, 0.3, mats.metal, 0.8, 0.6, -0.2)); // Lid
    }

    // Simple bench near fire
    g.add(voxel(0.1, 0.2, 0.1, mats.wood, 0.5, 0.1, 0.2));
    g.add(voxel(0.1, 0.2, 0.1, mats.wood, 0.5, 0.1, -0.2));
    g.add(voxel(0.15, 0.05, 0.6, mats.wood, 0.5, 0.3, 0));

    return g;
}

// Level 2: Container/Prefab units
function buildLevel2(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    const { isLow, isHigh } = getDetailFlags(opts);

    // --- FOUNDATION & EXTERIOR ---
    // Concrete pad
    g.add(voxel(2.0, 0.15, 2.0, mats.concrete, 0, 0, 0));

    // Entry Stairs
    g.add(voxel(0.6, 0.08, 0.3, mats.concrete, 0.3, 0.08, 0.85));

    // External conduit/pipe
    g.add(voxel(0.05, 0.6, 0.05, mats.darkPipe, -0.85, 0.15, -0.7));
    g.add(voxel(0.4, 0.05, 0.05, mats.darkPipe, -0.65, 0.75, -0.7));

    // === MODULAR CONTAINER 1 (Primary) ===
    const c1Mat = mats.blueMetal;
    g.add(voxel(1.4, 1.0, 0.7, c1Mat, -0.2, 0.15, -0.4));

    // Corrugation detail (thin vertical strips)
    for (let x = -0.8; x <= 0.4; x += isHigh ? 0.14 : isLow ? 0.35 : 0.2) {
        g.add(voxel(0.02, 1.0, 0.75, mats.metal, x, 0.15, -0.4));
    }

    // Door with frame
    g.add(voxel(0.4, 0.8, 0.05, mats.metal, 0.3, 0.15, -0.05));
    g.add(voxel(0.45, 0.85, 0.02, mats.metalLight, 0.3, 0.15, -0.02)); // Door frame

    // Window with awning
    g.add(voxel(0.3, 0.25, 0.05, isPowered ? mats.glass : mats.darkPipe, -0.4, 0.6, -0.05));
    g.add(voxel(0.4, 0.02, 0.15, mats.metal, -0.4, 0.85, -0.08)); // Awning

    // Rooftop Antenna
    if (!isLow) {
        g.add(voxel(0.04, 0.6, 0.04, mats.metal, -0.7, 1.15, -0.6));
        g.add(voxel(0.1, 0.1, 0.1, mats.metal, -0.7, 1.75, -0.6));
    }

    // === MODULAR CONTAINER 2 (Auxiliary) ===
    g.add(voxel(0.7, 0.9, 1.0, mats.hazard, 0.55, 0.15, 0.3));
    // Window 2
    g.add(voxel(0.05, 0.25, 0.3, isPowered ? mats.glass : mats.darkPipe, 0.9, 0.5, 0.3));

    // --- DECK & FURNITURE ---
    // Small porch/deck
    g.add(voxel(0.7, 0.08, 0.7, mats.wood, 0.5, 0.15, -0.5));

    // Folding Chair on deck
    if (isHigh) {
        g.add(voxel(0.05, 0.25, 0.05, mats.metal, 0.3, 1.23, -0.45)); // simplified seat back
        g.add(voxel(0.25, 0.05, 0.25, mats.wood, 0.3, 0.4, -0.45)); // seat
    }

    // Small table
    if (!isLow) {
        g.add(voxel(0.05, 0.35, 0.05, mats.metal, 0.55, 0.15, -0.35));
        g.add(voxel(0.2, 0.05, 0.2, mats.wood, 0.55, 0.5, -0.35));
    }

    // Power hookup
    g.add(voxel(0.1, 0.6, 0.1, mats.metal, -0.85, 0.15, 0));
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.08, 0.08, 0.08, isPowered ? mats.emissiveGreen : mats.emissiveRed, -0.85, 0.75, 0));
    }

    return g;
}

// Level 3: Brick row housing
function buildLevel3(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    const isWatered = opts?.waterStatus === 'CONNECTED';
    const { isLow, isHigh } = getDetailFlags(opts);

    // --- FOUNDATION & PATH ---
    g.add(voxel(2.0, 0.2, 2.0, mats.concrete, 0, 0, 0));
    // Small stone path to door
    g.add(voxel(0.5, 0.05, 0.3, mats.rock, 0, 0.2, 0.85));

    // --- MAIN BUILDING (2 Floors) ---
    g.add(voxel(1.6, 1.8, 1.4, mats.brick, 0, 0.2, 0));

    // Decorative Brick Trim (Quoining)
    for (let y = 0.2; y < 2.0; y += isHigh ? 0.25 : isLow ? 0.6 : 0.4) {
        g.add(voxel(0.1, 0.1, 0.1, mats.concrete, 0.76, y, 0.66));
        g.add(voxel(0.1, 0.1, 0.1, mats.concrete, -0.76, y, 0.66));
    }

    // Floor separator (White band)
    g.add(voxel(1.65, 0.1, 1.45, mats.sand, 0, 1.1, 0));

    // --- WINDOWS & DOORS ---
    const windowMat = isPowered ? mats.glass : mats.darkPipe;
    const sillMat = mats.concrete;

    const addWindow = (x: number, y: number) => {
        // Glass
        g.add(voxel(0.3, 0.4, 0.05, windowMat, x, y, 0.71));
        // Sill
        g.add(voxel(0.4, 0.05, 0.1, sillMat, x, y - 0.05, 0.73));
        // Shutters (wood)
        g.add(voxel(0.1, 0.4, 0.02, mats.wood, x - 0.22, y, 0.72));
        g.add(voxel(0.1, 0.4, 0.02, mats.wood, x + 0.22, y, 0.72));
    };

    // Windows (2 floors)
    addWindow(-0.5, 0.5);
    addWindow(0.5, 0.5);
    addWindow(-0.5, 1.4);
    addWindow(0, 1.4);
    addWindow(0.5, 1.4);

    // Entrance door with frame
    g.add(voxel(0.4, 0.7, 0.08, mats.wood, 0, 0.2, 0.71));
    g.add(voxel(0.45, 0.75, 0.04, mats.metal, 0, 0.2, 0.7)); // Door frame

    // Porch Light
    if (!opts?.isUnderConstruction) {
        g.add(voxel(0.1, 0.1, 0.05, isPowered ? mats.emissiveCyan : mats.emissiveRed, 0.25, 0.6, 0.75));
    }

    // --- ROOF & INFRASTRUCTURE ---
    // Slanted tile roof
    g.add(voxel(1.8, 0.1, 1.6, mats.blueMetal, 0, 2.0, 0));
    g.add(voxel(1.8, 0.05, 0.1, mats.metal, 0, 2.1, 0)); // Ridge tile

    // Chimney
    if (!isLow) {
        g.add(voxel(0.2, 0.6, 0.2, mats.brick, 0.6, 2.0, -0.4));
        g.add(voxel(0.25, 0.05, 0.25, mats.rock, 0.6, 2.6, -0.4)); // Cap
    }

    // Gutter Pipe
    g.add(voxel(0.06, 1.8, 0.06, mats.darkPipe, 0.75, 0.2, 0.65));
    g.add(voxel(0.2, 0.06, 0.06, mats.darkPipe, 0.65, 2.0, 0.65));

    // Roof Water Tank
    g.add(voxel(0.4, 0.4, 0.4, isWatered ? mats.blueMetal : mats.metal, -0.5, 2.1, 0.3));

    // --- PROPS ---
    // Garden Planter
    if (isHigh) {
        g.add(voxel(0.5, 0.15, 0.2, mats.wood, -0.5, 0.2, 0.75));
        g.add(voxel(0.45, 0.05, 0.15, mats.grass, -0.5, 0.35, 0.75));
    }

    // Wooden Bench
    if (!isLow) {
        g.add(voxel(0.6, 0.05, 0.25, mats.wood, 0.5, 0.35, 0.75)); // seat
        g.add(voxel(0.05, 0.2, 0.05, mats.wood, 0.25, 0.2, 0.75));  // leg
        g.add(voxel(0.05, 0.2, 0.05, mats.wood, 0.75, 0.2, 0.75));  // leg
    }

    return g;
}

// Level 4: Modern apartment complex
function buildLevel4(opts?: FactoryOptions) {
    const g = new THREE.Group();
    const isPowered = opts?.powerStatus === 'CONNECTED';
    const isWatered = opts?.waterStatus === 'CONNECTED';

    // --- FOUNDATION ---
    g.add(voxel(2.0, 0.25, 2.0, mats.concrete, 0, 0, 0));

    // --- MAIN BUILDING (3 Floors + Penthouse) ---
    // Recessed core (Concrete)
    g.add(voxel(1.6, 2.6, 1.6, mats.concrete, 0, 0.25, 0));

    // Architectural Facade Fins (Vertical)
    for (let x = -0.85; x <= 0.85; x += 0.85) {
        g.add(voxel(0.1, 2.8, 1.8, mats.blueMetal, x, 0.25, 0));
    }

    // Floor separators (Dark accent bands)
    for (let y = 0.9; y <= 2.1; y += 0.8) {
        g.add(voxel(1.8, 0.08, 1.8, mats.metal, 0, y, 0));
    }

    // --- WINDOWS & BALCONIES ---
    const windowMat = isPowered ? mats.glass : mats.darkPipe;

    const addBalcony = (x: number, y: number, z: number) => {
        // Floor
        g.add(voxel(0.5, 0.05, 0.4, mats.metalLight, x, y, z));
        // Railing (bottom)
        g.add(voxel(0.5, 0.02, 0.4, mats.metal, x, y + 0.05, z));
        // Glass panel
        g.add(voxel(0.5, 0.3, 0.02, mats.glass, x, y + 0.1, z + 0.19));
        // Railing (top)
        g.add(voxel(0.5, 0.02, 0.02, mats.metal, x, y + 0.4, z + 0.19));

        // Window behind balcony
        g.add(voxel(0.4, 0.6, 0.05, windowMat, x, y + 0.15, z - 0.1));
    };

    // Balconies (Floors 2 and 3)
    addBalcony(-0.45, 1.1, 0.7);
    addBalcony(0.45, 1.1, 0.7);
    addBalcony(-0.45, 1.9, 0.7);
    addBalcony(0.45, 1.9, 0.7);

    // Large corner windows
    for (let y = 0.4; y < 2.8; y += 0.8) {
        g.add(voxel(0.1, 0.6, 0.4, windowMat, 0.81, y, 0));
        g.add(voxel(0.1, 0.6, 0.4, windowMat, -0.81, y, 0));
    }

    // --- ENTRANCE LOBBY ---
    // Glass double doors
    g.add(voxel(0.6, 0.8, 0.05, mats.glass, 0, 0.25, 0.81));
    // Interior Glow/Desk
    if (!opts?.isUnderConstruction && isPowered) {
        g.add(voxel(0.4, 0.2, 0.05, mats.emissiveCyan, 0, 0.4, 0.75)); // "Reception desk" glow
    }
    // Overhang with recessed lights
    g.add(voxel(0.8, 0.1, 0.5, mats.sand, 0, 1.05, 1.0));
    if (!opts?.isUnderConstruction && isPowered) {
        g.add(voxel(0.1, 0.02, 0.1, mats.emissiveCyan, -0.2, 1.04, 1.1));
        g.add(voxel(0.1, 0.02, 0.1, mats.emissiveCyan, 0.2, 1.04, 1.1));
    }

    // --- ROOFTOP MECHANICAL ---
    // Mechanical Room (Penthouse)
    g.add(voxel(0.8, 0.6, 0.8, mats.concrete, 0, 2.85, -0.2));
    g.add(voxel(0.85, 0.05, 0.85, mats.blueMetal, 0, 3.45, -0.2)); // Penthouse roof

    // HVAC Units (Detailed)
    const addHVAC = (x: number, z: number) => {
        g.add(voxel(0.4, 0.3, 0.4, mats.metal, x, 2.85, z));
        g.add(voxel(0.3, 0.05, 0.3, mats.darkPipe, x, 3.15, z)); // Fan grill
    };
    addHVAC(0.5, 0.5);
    addHVAC(-0.6, -0.2);

    // Optimized Solar Array
    g.add(voxel(0.8, 0.05, 0.6, mats.solar, -0.4, 2.95, 0.4));
    g.add(voxel(0.04, 0.2, 0.6, mats.metal, -0.8, 2.85, 0.4)); // Frame support

    // Water Tank (Large Modern)
    g.add(voxel(0.4, 0.8, 0.4, isWatered ? mats.blueMetal : mats.metal, 0.5, 2.85, -0.6));

    // Maintenance Ladder
    for (let y = 0.25; y < 2.85; y += 0.3) {
        g.add(voxel(0.2, 0.02, 0.02, mats.metal, -0.85, y, -0.6));
    }

    // Status beacon
    if (!opts?.isUnderConstruction) {
        const statusMat = isPowered && isWatered ? mats.emissiveCyan : mats.emissiveRed;
        g.add(voxel(0.15, 0.3, 0.15, statusMat, 0, 3.6, -0.2));
    }

    return g;
}
