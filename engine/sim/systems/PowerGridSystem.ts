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

        // 1. Identify Sources and reset network state
        const openSet: number[] = [];
        const empoweredTiles = new Set<number>();
        const grid = state.grid;
        const size = Math.sqrt(grid.length);

        const isDaytime = state.dayNightCycle?.isDaytime ?? true;
        const timeOfDay = state.dayNightCycle?.timeOfDay ?? 12000;

        for (const tile of grid) {
            if (!tile) continue;

            const def = BUILDINGS[tile.buildingType];
            if (!def) continue;

            // Sources
            if (def.power?.produces) {
                let production = def.power.produces;

                // Solar Logic
                if (tile.buildingType === BuildingType.SOLAR_ARRAY) {
                    if (!isDaytime) {
                        production = 0;
                    } else {
                        const distFromNoon = Math.abs(timeOfDay - 12000);
                        const dayHalfWidth = 6000;
                        const solarEfficiency = Math.max(0.3, 1 - (distFromNoon / dayHalfWidth) * 0.5);
                        production = Math.floor(def.power.produces * solarEfficiency);
                    }
                }

                // Wind Logic
                if (tile.buildingType === BuildingType.WIND_TURBINE) {
                    if (state.weather?.current === 'STORM' || state.weather?.current === 'DUST_STORM') {
                        production = Math.floor(def.power.produces * 1.5);
                    } else if (state.weather?.current === 'CLEAR') {
                        production = Math.floor(def.power.produces * 0.7);
                    }
                }

                totalProduced += production;

                // If producing power, it pushes to grid
                if (production > 0) {
                    openSet.push(tile.id);
                    empoweredTiles.add(tile.id);
                    tile.powerStatus = 'CONNECTED';
                } else {
                    tile.powerStatus = 'DISCONNECTED'; // Generator off/night
                }
            } else if (tile.buildingType === BuildingType.POWER_LINE || def.power?.consumes) {
                // Default to disconnected
                tile.powerStatus = 'DISCONNECTED';
            }
        }

        // 2. BFS Propagation
        let head = 0;
        while (head < openSet.length) {
            const currentId = openSet[head++];

            const neighbors = [
                currentId - size,
                currentId + size,
                currentId + 1,
                currentId - 1
            ];

            for (const nIdx of neighbors) {
                if (nIdx < 0 || nIdx >= grid.length) continue;
                if (Math.abs((nIdx % size) - (currentId % size)) > 1) continue;
                if (empoweredTiles.has(nIdx)) continue;

                const neighbor = grid[nIdx];
                const nDef = BUILDINGS[neighbor.buildingType];
                if (!nDef) continue;

                // Power flows seamlessly through POWER_LINE and CONSUMERS (unlike water where consumer is terminal)
                // Actually, let's keep consumers distinct. Does power flow THROUGH a building to the next line? 
                // Typically no, lines are the conduit. Buildings tap into lines.
                // Let's assume POWER_LINE conducts.

                if (neighbor.buildingType === BuildingType.POWER_LINE) {
                    neighbor.powerStatus = 'CONNECTED';
                    empoweredTiles.add(nIdx);
                    openSet.push(nIdx);
                } else if (nDef.power?.consumes) {
                    neighbor.powerStatus = 'CONNECTED';
                    empoweredTiles.add(nIdx);
                    // Do not propagate through buildings to avoid daisy-chaining without wires
                }
            }
        }

        // 3. Calculate Consumption
        for (const tile of grid) {
            if (!tile) continue;
            const def = BUILDINGS[tile.buildingType];
            if (def && def.power?.consumes) {
                totalConsumed += def.power.consumes;
            }
        }

        state.powerGrid = {
            totalProduced,
            totalConsumed,
            deficit: Math.max(0, totalConsumed - totalProduced)
        };
    }
}
