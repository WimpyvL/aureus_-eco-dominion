import {
    UndergroundHazardType,
    UndergroundResourceType,
    UndergroundState,
    UndergroundTile
} from '../../types';

export function undergroundTileKey(x: number, z: number, depth: number): string {
    return `${x},${z},${depth}`;
}

function hashNoise(x: number, z: number, depth: number, seed: number): number {
    const n = Math.sin(x * 127.1 + z * 311.7 + depth * 74.7 + seed * 0.017) * 43758.5453123;
    return n - Math.floor(n);
}

export function createInitialUndergroundState(): UndergroundState {
    return {
        unlocked: false,
        depthLevel: 1,
        exposureRisk: 0,
        globalStability: 100,
        oxygen: 100,
        activeHazards: [],
        selectedTileId: null,
        tiles: {}
    };
}

export function ensureUndergroundState(state: any): UndergroundState {
    const existing = state.underground ?? {};

    const underground: UndergroundState = {
        ...createInitialUndergroundState(),
        ...existing,
        tiles: existing.tiles ?? {}
    };

    state.underground = underground;
    return underground;
}

export function createUndergroundTile(
    x: number,
    z: number,
    depth: number,
    seed: number
): UndergroundTile {
    const oreRoll = hashNoise(x, z, depth, seed);
    const hazardRoll = hashNoise(x + 91, z - 37, depth + 13, seed);
    const stabilityRoll = hashNoise(x - 11, z + 23, depth, seed);

    let resourceType: UndergroundResourceType = 'NONE';

    if (oreRoll > 0.97) {
        resourceType = 'AUREUS_VEIN';
    } else if (oreRoll > 0.90) {
        resourceType = 'GEMS';
    } else if (oreRoll > 0.68) {
        resourceType = 'MINERALS';
    } else if (oreRoll < 0.03) {
        resourceType = 'RELIC_FRAGMENT';
    }

    let hazard: UndergroundHazardType = 'NONE';

    if (hazardRoll > 0.97) {
        hazard = 'ILLEGAL_TUNNEL';
    } else if (hazardRoll > 0.92) {
        hazard = 'GAS';
    } else if (hazardRoll > 0.86) {
        hazard = 'WATER';
    } else if (hazardRoll > 0.78) {
        hazard = 'INSTABILITY';
    }

    const baseStability = Math.round(55 + stabilityRoll * 45 - depth * 4);

    return {
        id: undergroundTileKey(x, z, depth),
        x,
        z,
        depth,
        status: 'HIDDEN',
        resourceType,
        oreRichness: Math.round(oreRoll * 100),
        stability: Math.max(15, Math.min(100, baseStability)),
        hazard,
        hasTunnel: false,
        hasSupport: false,
        connectedToSurface: false
    };
}

export function revealUndergroundArea(
    underground: UndergroundState,
    centerX: number,
    centerZ: number,
    depth: number,
    radius: number,
    seed: number
): boolean {
    let changed = false;

    for (let x = centerX - radius; x <= centerX + radius; x++) {
        for (let z = centerZ - radius; z <= centerZ + radius; z++) {
            const dx = x - centerX;
            const dz = z - centerZ;

            if (Math.sqrt(dx * dx + dz * dz) > radius) continue;

            const id = undergroundTileKey(x, z, depth);
            const existing = underground.tiles[id] ?? createUndergroundTile(x, z, depth, seed);

            if (existing.status === 'HIDDEN') {
                underground.tiles[id] = {
                    ...existing,
                    status: 'SURVEYED'
                };
                changed = true;
            } else if (!underground.tiles[id]) {
                underground.tiles[id] = existing;
                changed = true;
            }
        }
    }

    return changed;
}
