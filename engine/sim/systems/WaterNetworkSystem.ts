/**
 * Water Network System
 * Calculates total water production and consumption across all buildings.
 * Buildings without sufficient water operate at reduced efficiency.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState, BuildingType } from '../../../types';
import { BUILDINGS } from '../../data/VoxelConstants';

export class WaterNetworkSystem extends BaseSimSystem {
    readonly id = 'waterNetwork';
    readonly priority = 11; // Run right after PowerGridSystem

    private lastUpdate = 0;
    private readonly INTERVAL = 1.0; // Update every second

    tick(ctx: FixedContext, state: GameState): void {
        if (ctx.time - this.lastUpdate < this.INTERVAL) return;
        this.lastUpdate = ctx.time;

        // Ensure waterNetwork exists (handles old saves)
        if (!state.waterNetwork) {
            state.waterNetwork = { totalProduced: 0, totalConsumed: 0, deficit: 0 };
        }

        // Safety check for grid
        if (!state.grid || !Array.isArray(state.grid)) return;

        let totalProduced = 0;
        let totalConsumed = 0;

        for (const tile of state.grid) {
            if (!tile) continue; // Skip undefined tiles

            // Skip empty or under construction
            if (tile.buildingType === BuildingType.EMPTY || tile.isUnderConstruction) continue;

            // Skip multi-tile tails (only process head)
            if (tile.structureHeadIndex !== undefined && tile.id !== tile.structureHeadIndex) continue;

            const def = BUILDINGS[tile.buildingType];
            if (!def) continue;

            // Water Production
            if (def.water?.produces) {
                let production = def.water.produces;

                // Ponds produce more during rainy weather
                if (tile.buildingType === BuildingType.POND) {
                    if (state.weather?.current === 'RAINY' || state.weather?.current === 'STORM') {
                        production = Math.floor(def.water.produces * 1.5);
                    } else if (state.weather?.current === 'DUST_STORM') {
                        production = Math.floor(def.water.produces * 0.5); // Evaporation
                    }
                }

                // Reservoirs need power to pump - if power deficit, reduced output
                if (tile.buildingType === BuildingType.RESERVOIR && state.powerGrid?.deficit > 0) {
                    production = Math.floor(def.water.produces * 0.25);
                }

                totalProduced += production;
            }

            // Water Consumption
            if (def.water?.consumes) {
                totalConsumed += def.water.consumes;
            }
        }

        // Update state
        state.waterNetwork = {
            totalProduced,
            totalConsumed,
            deficit: Math.max(0, totalConsumed - totalProduced)
        };
    }
}
