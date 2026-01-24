
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
            let goldChance = 0.002;
            if (biome === 'STONE' || height >= 8) goldChance = 0.035;
            else if (biome === 'DIRT') goldChance = 0.015;
            else if (biome === 'GRASS' && height >= 2) goldChance = 0.005;

            if (rand < goldChance) foliage = 'GOLD_VEIN';
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
            underground: {}
        };
    });
}
