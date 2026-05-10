
export type BiomeType = 'GRASS' | 'DIRT' | 'SAND' | 'STONE' | 'SNOW';

export type FoliageType =
    | 'NONE'
    // Functional
    | 'GOLD_VEIN'
    | 'GOLD_VEIN_VAR'
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
    | 'CACTUS_SAGUARO_VAR'
    | 'CACTUS_BARREL'
    | 'TREE_PALM'
    | 'TREE_PALM_TALL'
    | 'SHRUB_DRY'
    | 'SHRUB_DRY_VAR'
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

import { BuildingType } from './buildings';

export interface Chunk {
    cx: number;
    cz: number;
    tiles: GridTile[]; // Array of CHUNK_SIZE * CHUNK_SIZE

    meshDirty: boolean;
    simDirty: boolean; // Surface sim dirty

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
    revealed?: boolean;
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
}
