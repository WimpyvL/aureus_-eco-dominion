/**
 * Deep Ledger survey core.
 * Kept self-contained so Node can execute the contract tests without the repo's
 * browser-oriented extensionless import chain. (|/) Klaasvaakie
 */

export const SURVEY_DRILL_BUILDING_TYPE = 'SURVEY_DRILL';
export const SURVEY_REVEAL_RADIUS = 4;

const LEGACY_ACCESS_BUILDING_TYPES = new Set([
    'MINE_SHAFT',
    'MINING_HEADFRAME',
]);

type UndergroundTileStatus =
    | 'HIDDEN'
    | 'SURVEYED'
    | 'DUG'
    | 'REINFORCED'
    | 'COLLAPSED'
    | 'FLOODED'
    | 'SEALED';

type UndergroundResourceType =
    | 'NONE'
    | 'MINERALS'
    | 'GEMS'
    | 'AUREUS_VEIN'
    | 'RELIC_FRAGMENT';

type UndergroundHazardType =
    | 'NONE'
    | 'GAS'
    | 'WATER'
    | 'HEAT'
    | 'INSTABILITY'
    | 'ILLEGAL_TUNNEL';

interface UndergroundTileLike {
    id: string;
    x: number;
    z: number;
    depth: number;
    status: UndergroundTileStatus;
    resourceType: UndergroundResourceType;
    oreRichness: number;
    stability: number;
    hazard: UndergroundHazardType;
    hasTunnel: boolean;
    hasSupport: boolean;
    connectedToSurface: boolean;
}

interface UndergroundStateLike {
    unlocked: boolean;
    depthLevel: number;
    exposureRisk: number;
    globalStability: number;
    oxygen: number;
    activeHazards: UndergroundHazardType[];
    selectedTileId: string | null;
    tiles: Record<string, UndergroundTileLike>;
}

interface SurfaceTileLike {
    x: number;
    z: number;
    buildingType?: string;
    isUnderConstruction?: boolean;
    structureHeadX?: number;
    structureHeadZ?: number;
}

interface ChunkLike {
    tiles?: SurfaceTileLike[];
}

interface SurveyStateLike {
    seed?: number;
    underground?: Partial<UndergroundStateLike>;
    dungeon?: { unlocked?: boolean };
    chunks?: Record<string, ChunkLike>;
}

export function undergroundTileKey(x: number, z: number, depth: number): string {
    return `${x},${z},${depth}`;
}

function hashNoise(x: number, z: number, depth: number, seed: number): number {
    const n = Math.sin(x * 127.1 + z * 311.7 + depth * 74.7 + seed * 0.017) * 43758.5453123;
    return n - Math.floor(n);
}

export function createInitialUndergroundState(): UndergroundStateLike {
    return {
        unlocked: false,
        depthLevel: 1,
        exposureRisk: 0,
        globalStability: 100,
        oxygen: 100,
        activeHazards: [],
        selectedTileId: null,
        tiles: {},
    };
}

export function normalizeUndergroundState(existing?: Partial<UndergroundStateLike> | null): UndergroundStateLike {
    return {
        ...createInitialUndergroundState(),
        ...(existing ?? {}),
        activeHazards: Array.isArray(existing?.activeHazards) ? [...existing.activeHazards] : [],
        tiles: existing?.tiles ?? {},
    };
}

function undergroundNeedsNormalization(existing: unknown): boolean {
    if (!existing || typeof existing !== 'object') return true;
    const candidate = existing as Partial<UndergroundStateLike>;
    return (
        typeof candidate.unlocked !== 'boolean' ||
        typeof candidate.depthLevel !== 'number' ||
        typeof candidate.exposureRisk !== 'number' ||
        typeof candidate.globalStability !== 'number' ||
        typeof candidate.oxygen !== 'number' ||
        !Array.isArray(candidate.activeHazards) ||
        !('tiles' in candidate)
    );
}

export function ensureUndergroundState(state: SurveyStateLike): UndergroundStateLike {
    const underground = normalizeUndergroundState(state.underground);
    state.underground = underground;
    return underground;
}

export function createUndergroundTile(
    x: number,
    z: number,
    depth: number,
    seed: number,
): UndergroundTileLike {
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
        connectedToSurface: false,
    };
}

export function revealUndergroundArea(
    underground: UndergroundStateLike,
    centerX: number,
    centerZ: number,
    depth: number,
    radius: number,
    seed: number,
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
                    status: 'SURVEYED',
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

function isStructureHead(tile: SurfaceTileLike): boolean {
    return tile.structureHeadX === undefined || (
        tile.structureHeadX === tile.x &&
        tile.structureHeadZ === tile.z
    );
}

function uniqueHazards(tiles: UndergroundTileLike[]): UndergroundHazardType[] {
    return Array.from(new Set(
        tiles
            .map(tile => tile.hazard)
            .filter((hazard): hazard is UndergroundHazardType => hazard !== 'NONE'),
    ));
}

function arraysMatch<T>(left: T[], right: T[]): boolean {
    return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function applyDeepLedgerSurvey(state: SurveyStateLike): {
    changed: boolean;
    surveyedTileCount: number;
    hazardCount: number;
    unlocked: boolean;
} {
    const changedByNormalization = undergroundNeedsNormalization(state.underground);
    const underground = ensureUndergroundState(state);
    const seed = state.seed ?? 0;
    let changed = changedByNormalization;
    let hasAccessSource = false;

    for (const chunk of Object.values(state.chunks ?? {})) {
        for (const tile of chunk.tiles ?? []) {
            const buildingType = tile.buildingType ?? '';

            if (!isStructureHead(tile) || tile.isUnderConstruction) continue;
            if (buildingType !== SURVEY_DRILL_BUILDING_TYPE && !LEGACY_ACCESS_BUILDING_TYPES.has(buildingType)) continue;

            hasAccessSource = true;
            const tileChanged = revealUndergroundArea(
                underground,
                tile.x,
                tile.z,
                underground.depthLevel,
                SURVEY_REVEAL_RADIUS,
                seed,
            );
            changed = changed || tileChanged;
        }
    }

    const visibleTiles = Object.values(underground.tiles).filter(tile => tile.status !== 'HIDDEN');
    const hazards = uniqueHazards(visibleTiles);
    const averageStability = visibleTiles.length > 0
        ? Math.round(visibleTiles.reduce((sum, tile) => sum + tile.stability, 0) / visibleTiles.length)
        : 100;

    const gasHazards = visibleTiles.filter(tile => tile.hazard === 'GAS').length;
    const heatHazards = visibleTiles.filter(tile => tile.hazard === 'HEAT').length;
    const waterHazards = visibleTiles.filter(tile => tile.hazard === 'WATER').length;
    const oxygen = Math.max(40, Math.min(100, 100 - (gasHazards * 5) - (heatHazards * 3) - (waterHazards * 2)));

    if (!arraysMatch(underground.activeHazards, hazards)) {
        underground.activeHazards = hazards;
        changed = true;
    }

    if (underground.globalStability !== averageStability) {
        underground.globalStability = averageStability;
        changed = true;
    }

    if (underground.oxygen !== oxygen) {
        underground.oxygen = oxygen;
        changed = true;
    }

    const shouldUnlock = Boolean(
        underground.unlocked ||
        state.dungeon?.unlocked ||
        hasAccessSource ||
        visibleTiles.length > 0,
    );

    if (underground.unlocked !== shouldUnlock) {
        underground.unlocked = shouldUnlock;
        changed = true;
    }

    if (state.dungeon && shouldUnlock && !state.dungeon.unlocked) {
        state.dungeon.unlocked = true;
        changed = true;
    }

    return {
        changed,
        surveyedTileCount: visibleTiles.length,
        hazardCount: visibleTiles.filter(tile => tile.hazard !== 'NONE').length,
        unlocked: underground.unlocked,
    };
}
