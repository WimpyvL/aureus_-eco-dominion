
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * INITIAL GRID GENERATION
 * Internal logic for creating the starting game world.
 */

import { GridTile, BuildingType, BiomeType, FoliageType } from '../../types';
import { getBiomeAt, getFoliageAt } from './Core';

// Map Constants - DO NOT EDIT
export const GRID_SIZE = 64;

export function generateInitialGrid(): GridTile[] {
    const offset = (GRID_SIZE - 1) / 2;

    return Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
        const x = i % GRID_SIZE;
        const y = Math.floor(i / GRID_SIZE);

        const worldX = x - offset;
        const worldY = y - offset;

        const { biome, height, detail } = getBiomeAt(worldX, worldY);

        const isWater = height === 0;

        // Use the centralized foliage logic from Core.ts
        const foliage = getFoliageAt(worldX, worldY, biome, height, detail);

        return {
            id: i,
            x,
            y,
            buildingType: isWater ? BuildingType.POND : BuildingType.EMPTY,
            level: 0,
            terrainHeight: height,
            biome: biome as BiomeType,
            foliage,
            locked: false,
            explored: true,
            underground: {},
            markedForHarvest: false
        };
    });
}
