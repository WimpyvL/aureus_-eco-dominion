
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * INITIAL GRID GENERATION
 * Internal logic for creating the starting game world.
 */

import { GridTile, BuildingType, BiomeType, FoliageType } from '../../types';
import { getBiomeAt } from './Core';

// Map Constants - DO NOT EDIT
export const GRID_SIZE = 45;
const PLAYABLE_SIZE = 35;
const PADDING = 5;

export function generateInitialGrid(): GridTile[] {
    const offset = (GRID_SIZE - 1) / 2;

    return Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
        const x = i % GRID_SIZE;
        const y = Math.floor(i / GRID_SIZE);

        const worldX = x - offset;
        const worldY = y - offset;

        const isPlayable =
            x >= PADDING &&
            x < PADDING + PLAYABLE_SIZE &&
            y >= PADDING &&
            y < PADDING + PLAYABLE_SIZE;

        const { biome, height } = getBiomeAt(worldX, worldY);

        const isWater = height === 0;
        let foliage: FoliageType = 'NONE';
        const rand = Math.random();

        if (!isWater) {
            // Gold Veins (Rare)
            let goldChance = 0.002;
            if (biome === 'STONE' || height >= 8) goldChance = 0.035;
            else if (biome === 'DIRT') goldChance = 0.015;
            else if (biome === 'GRASS' && height >= 2) goldChance = 0.005;

            if (rand < goldChance) {
                foliage = 'GOLD_VEIN';
            } else {
                // Biome Specific Foliage
                if (biome === 'GRASS') {
                    if (rand < 0.05) foliage = 'TREE_OAK';
                    else if (rand < 0.08) foliage = 'TREE_BIRCH';
                    else if (rand < 0.09) foliage = 'TREE_APPLE';
                    else if (rand < 0.15) foliage = 'BUSH_OAK';
                    else if (rand < 0.20) foliage = 'FLOWER_YELLOW';
                    else if (rand < 0.22 && height < 2) foliage = 'TREE_WILLOW';
                } else if (biome === 'SNOW') {
                    if (rand < 0.06) foliage = 'TREE_PINE';
                    else if (rand < 0.10) foliage = 'TREE_FROSTED_PINE';
                    else if (rand < 0.12) foliage = 'TREE_TALL_PINE';
                    else if (rand < 0.20) foliage = 'SHRUB_WINTER';
                    else if (rand < 0.25) foliage = 'ROCK_ICY';
                } else if (biome === 'SAND') {
                    if (rand < 0.02) foliage = 'CACTUS_SAGUARO';
                    else if (rand < 0.05) foliage = 'CACTUS_BARREL';
                    else if (rand < 0.08) foliage = 'TREE_PALM';
                    else if (rand < 0.15) foliage = 'SHRUB_DRY';
                    else if (rand < 0.20) foliage = 'ROCK_SANDSTONE';
                } else if (biome === 'DIRT') {
                    if (rand < 0.02) foliage = 'TREE_DEAD';
                    else if (rand < 0.05) foliage = 'TREE_STUMP';
                    else if (rand < 0.10) foliage = 'BUSH_THORN';
                    else if (rand < 0.12) foliage = 'MUSHROOM_GIANT';
                    else if (rand < 0.14) foliage = 'BONE_RIB';
                } else if (biome === 'STONE') {
                    if (rand < 0.10) foliage = 'ROCK_BOULDER';
                    else if (rand < 0.20) foliage = 'ROCK_PEBBLE';
                    else if (rand < 0.25) foliage = 'ROCK_MOSSY';
                    else if (rand < 0.27) foliage = 'FLOWER_ALPINE';
                    else if (rand < 0.28) foliage = 'CRYSTAL_SPIKE';
                }
            }
        }

        return {
            id: i,
            x,
            y,
            buildingType: isWater ? BuildingType.POND : BuildingType.EMPTY,
            level: 0,
            terrainHeight: height,
            biome: biome as BiomeType,
            foliage,
            locked: !isPlayable,
            explored: isPlayable,
            underground: {},
            markedForHarvest: false
        };
    });
}
