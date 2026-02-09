
export type BiomeType = 'GRASS' | 'DIRT' | 'SAND' | 'STONE' | 'SNOW';

export type FoliageType =
    | 'NONE'
    // Functional
    | 'GOLD_VEIN'
    | 'MINE_HOLE'
    | 'ILLEGAL_CAMP'
    // Grass Biome
    | 'TREE_OAK'
    | 'TREE_BIRCH'
    | 'TREE_WILLOW'
    | 'TREE_APPLE'
    | 'BUSH_OAK'
    | 'FLOWER_YELLOW'
    // Snow Biome
    | 'TREE_PINE'
    | 'TREE_FROSTED_PINE'
    | 'TREE_TALL_PINE'
    | 'SHRUB_WINTER'
    | 'ROCK_ICY'
    // Sand Biome
    | 'CACTUS_SAGUARO'
    | 'CACTUS_BARREL'
    | 'TREE_PALM'
    | 'SHRUB_DRY'
    | 'ROCK_SANDSTONE'
    // Dirt Biome
    | 'TREE_DEAD'
    | 'TREE_STUMP'
    | 'BUSH_THORN'
    | 'MUSHROOM_GIANT'
    | 'BONE_RIB'
    // Stone Biome
    | 'ROCK_BOULDER'
    | 'ROCK_PEBBLE'
    | 'ROCK_MOSSY'
    | 'FLOWER_ALPINE'
    | 'CRYSTAL_SPIKE';

export type WeatherType = 'CLEAR' | 'CLOUDY' | 'RAINY' | 'STORM' | 'DUST_STORM' | 'ACID_RAIN';

export interface WeatherState {
    current: WeatherType;
    timeLeft: number; // Ticks remaining
    intensity: number; // 0-1
}

export interface UndergroundTile {
    excavated: boolean;
    oreType?: 'GOLD' | 'IRON' | 'GEM' | 'COAL';
    oreVisible: boolean;  // Fog-of-war: true when adjacent is excavated
    supportType?: 'PILLAR' | 'WOOD_BEAM' | 'STEEL_BEAM';
    collapseRisk: number; // 0-100
    collapsed?: boolean;
    trappedAgentIds?: string[];
    rescueDeadline?: number; // Tick when agents die
}

import { BuildingType } from './buildings';

export interface Chunk {
    cx: number;
    cz: number;
    tiles: GridTile[]; // Array of CHUNK_SIZE * CHUNK_SIZE
    meshDirty: boolean;
    simDirty: boolean;
    lastAccessTime: number;
    version: number;
}

export interface GridTile {
    id: number; // Global or chunk-unique ID
    x: number; // World X
    z: number; // World Z
    buildingType: BuildingType;
    level: number;
    terrainHeight: number;
    biome: BiomeType;
    foliage?: FoliageType;
    locked?: boolean;
    integrity?: number;
    isUnderConstruction?: boolean;
    constructionTimeLeft?: number;
    structureHeadX?: number;
    structureHeadZ?: number;
    waterStatus?: 'CONNECTED' | 'DISCONNECTED';
    powerStatus?: 'CONNECTED' | 'DISCONNECTED';
    rehabProgress?: number; // 0-100
    markedForHarvest?: boolean;
    explored?: boolean;

    // Dungeon Keeper System
    underground: Record<number, UndergroundTile>; // Layer -1 to -10
    hasEntrance?: boolean; // MINE_ENTRANCE on surface

    // Legacy compatibility (to be deprecated or mapped to layer -1)
    subBuildings?: Record<number, BuildingType>;
    digState?: Record<number, number>;
}
