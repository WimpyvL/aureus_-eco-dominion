export type UndergroundTileStatus =
    | 'HIDDEN'
    | 'SURVEYED'
    | 'DUG'
    | 'REINFORCED'
    | 'COLLAPSED'
    | 'FLOODED'
    | 'SEALED';

export type UndergroundResourceType =
    | 'NONE'
    | 'MINERALS'
    | 'GEMS'
    | 'AUREUS_VEIN'
    | 'RELIC_FRAGMENT';

export type UndergroundHazardType =
    | 'NONE'
    | 'GAS'
    | 'WATER'
    | 'HEAT'
    | 'INSTABILITY'
    | 'ILLEGAL_TUNNEL';

export interface UndergroundTile {
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

export interface UndergroundState {
    unlocked: boolean;
    depthLevel: number;
    exposureRisk: number;
    globalStability: number;
    oxygen: number;
    activeHazards: UndergroundHazardType[];
    selectedTileId: string | null;
    tiles: Record<string, UndergroundTile>;
}
