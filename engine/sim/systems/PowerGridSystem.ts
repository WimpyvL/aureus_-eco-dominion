/**
 * Power Grid System
 * Calculates total power production and consumption across all buildings.
 * Buildings without sufficient power operate at reduced efficiency.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState, BuildingType } from '../../../types';
import { BUILDINGS } from '../../data/VoxelConstants';
import { ChunkStore } from '../../space/ChunkStore';
import { getSolarEfficiency } from '../dayNightCycle';
import { getWeatherGameplayEffects } from '../../weather/weatherModel';


export class PowerGridSystem extends BaseSimSystem {
    readonly id = 'powerGrid';
    readonly priority = 10; // Run early so ProductionSystem can use the results

    private lastUpdate = 0;
    private readonly INTERVAL = 1.0; // Update every second

    tick(ctx: FixedContext, state: GameState): void {
        if (ctx.time - this.lastUpdate < this.INTERVAL) return;
        this.lastUpdate = ctx.time;



        let totalProduced = 0;
        let totalConsumed = 0;

        // 1. Identify Sources and reset network state
        const openSet: { x: number, z: number }[] = [];
        const empoweredTiles = new Set<string>(); // Use "x,z" as key

        const isDaytime = state.dayNightCycle?.isDaytime ?? true;
        const timeOfDay = state.dayNightCycle?.timeOfDay ?? 12000;
        const weatherEffects = getWeatherGameplayEffects(state.weather);

        for (const chunk of Object.values(state.chunks)) {
            for (const tile of chunk.tiles) {
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
                            const solarEfficiency = getSolarEfficiency(timeOfDay);
                            production = Math.floor(def.power.produces * solarEfficiency * weatherEffects.solarMult);
                        }
                    }

                    // Wind turbines should meaningfully respond to gust fronts and storms.
                    if (tile.buildingType === BuildingType.WIND_TURBINE) {
                        production = Math.floor(def.power.produces * weatherEffects.windMult);
                    }

                    totalProduced += production;

                    // If producing power, it pushes to grid
                    if (production > 0) {
                        openSet.push({ x: tile.x, z: tile.z });
                        empoweredTiles.add(`${tile.x},${tile.z}`);
                        tile.powerStatus = 'CONNECTED';
                    } else {
                        tile.powerStatus = 'DISCONNECTED'; // Generator off/night
                    }
                } else if (tile.buildingType === BuildingType.POWER_LINE || def.power?.consumes) {
                    // Default to disconnected
                    tile.powerStatus = 'DISCONNECTED';
                }
            }
        }


        // 2. BFS Propagation
        let head = 0;
        while (head < openSet.length) {
            const { x, z } = openSet[head++];

            const neighbors = [
                { nx: x + 1, nz: z },
                { nx: x - 1, nz: z },
                { nx: x, nz: z + 1 },
                { nx: x, nz: z - 1 }
            ];

            for (const { nx, nz } of neighbors) {
                const key = `${nx},${nz}`;
                if (empoweredTiles.has(key)) continue;

                // Look up tile in chunks
                const neighbor = ChunkStore.getTile(state.chunks, nx, nz);
                if (!neighbor) continue;

                const nDef = BUILDINGS[neighbor.buildingType];
                if (!nDef) continue;

                if (neighbor.buildingType === BuildingType.POWER_LINE) {
                    neighbor.powerStatus = 'CONNECTED';
                    empoweredTiles.add(key);
                    openSet.push({ x: nx, z: nz });
                } else if (nDef.power?.consumes) {
                    neighbor.powerStatus = 'CONNECTED';
                    empoweredTiles.add(key);
                    // Do not propagate through buildings to avoid daisy-chaining without wires
                }
            }
        }

        // 3. Calculate Consumption
        for (const chunk of Object.values(state.chunks)) {
            for (const tile of chunk.tiles) {
                if (!tile) continue;
                const def = BUILDINGS[tile.buildingType];
                if (def && def.power?.consumes) {
                    totalConsumed += def.power.consumes;
                }
            }
        }

        state.powerGrid = {
            totalProduced,
            totalConsumed,
            deficit: Math.max(0, totalConsumed - totalProduced)
        };

    }
}
