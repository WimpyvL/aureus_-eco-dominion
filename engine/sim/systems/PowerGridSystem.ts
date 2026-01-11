/**
 * Power Grid System
 * Calculates total power production and consumption across all buildings.
 * Buildings without sufficient power operate at reduced efficiency.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState, BuildingType } from '../../../types';
import { BUILDINGS } from '../../data/VoxelConstants';

export class PowerGridSystem extends BaseSimSystem {
    readonly id = 'powerGrid';
    readonly priority = 10; // Run early so ProductionSystem can use the results

    private lastUpdate = 0;
    private readonly INTERVAL = 1.0; // Update every second

    tick(ctx: FixedContext, state: GameState): void {
        if (ctx.time - this.lastUpdate < this.INTERVAL) return;
        this.lastUpdate = ctx.time;

        // Ensure powerGrid exists (handles old saves)
        if (!state.powerGrid) {
            state.powerGrid = { totalProduced: 0, totalConsumed: 0, deficit: 0 };
        }

        // Safety check for grid
        if (!state.grid || !Array.isArray(state.grid)) return;

        let totalProduced = 0;
        let totalConsumed = 0;

        const isDaytime = state.dayNightCycle?.isDaytime ?? true;
        const timeOfDay = state.dayNightCycle?.timeOfDay ?? 12000;

        for (const tile of state.grid) {
            if (!tile) continue; // Skip undefined tiles

            // Skip empty or under construction
            if (tile.buildingType === BuildingType.EMPTY || tile.isUnderConstruction) continue;

            // Skip multi-tile tails (only process head)
            if (tile.structureHeadIndex !== undefined && tile.id !== tile.structureHeadIndex) continue;

            const def = BUILDINGS[tile.buildingType];
            if (!def) continue;

            // Power Production
            if (def.power?.produces) {
                let production = def.power.produces;

                // Solar panels produce less at night
                if (tile.buildingType === BuildingType.SOLAR_ARRAY) {
                    if (!isDaytime) {
                        // Night: 0% production
                        production = 0;
                    } else {
                        // Day: Scale based on time (peak at noon = 12000)
                        const distFromNoon = Math.abs(timeOfDay - 12000);
                        const dayHalfWidth = 6000; // 6AM to 6PM
                        const solarEfficiency = Math.max(0.3, 1 - (distFromNoon / dayHalfWidth) * 0.5);
                        production = Math.floor(def.power.produces * solarEfficiency);
                    }
                }

                // Wind turbines affected by weather
                if (tile.buildingType === BuildingType.WIND_TURBINE) {
                    if (state.weather?.current === 'STORM' || state.weather?.current === 'DUST_STORM') {
                        production = Math.floor(def.power.produces * 1.5); // More wind!
                    } else if (state.weather?.current === 'CLEAR') {
                        production = Math.floor(def.power.produces * 0.7); // Less wind
                    }
                }

                totalProduced += production;
            }

            // Power Consumption
            if (def.power?.consumes) {
                totalConsumed += def.power.consumes;
            }
        }

        // Update state
        state.powerGrid = {
            totalProduced,
            totalConsumed,
            deficit: Math.max(0, totalConsumed - totalProduced)
        };
    }
}
