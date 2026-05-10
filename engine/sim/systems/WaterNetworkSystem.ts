/**
 * Water Network System
 * Calculates total water production and consumption across all buildings.
 * Buildings without sufficient water operate at reduced efficiency.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState, BuildingType } from '../../../types';
import { BUILDINGS } from '../../data/VoxelConstants';
import { ChunkStore } from '../../space/ChunkStore';


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


        let totalProduced = 0;
        let totalConsumed = 0;

        // 1. Identify Sources and reset network state
        const openSet: { x: number, z: number }[] = []; // Tiles with water
        const suppliedTiles = new Set<string>(); // Tiles that have received water

        // Pre-scan to reset status and find sources
        for (const chunk of Object.values(state.chunks)) {
            for (const tile of chunk.tiles) {
                if (!tile) continue;

                const def = BUILDINGS[tile.buildingType];
                if (!def) continue;

                // Reset status primarily for Pipes and Consumers
                // Sources start connected
                if (def.water?.produces) {
                    // Determine actual production
                    let production = def.water.produces;

                    // Weather effects
                    if (tile.buildingType === BuildingType.POND) {
                        if (state.weather?.current === 'RAINY' || state.weather?.current === 'STORM') {
                            production = Math.floor(def.water.produces * 1.5);
                        } else if (state.weather?.current === 'DUST_STORM') {
                            production = Math.floor(def.water.produces * 0.5);
                        }
                    }

                    // Power dependency for Reservoirs
                    if (tile.buildingType === BuildingType.RESERVOIR && state.powerGrid?.deficit > 0) {
                        production = Math.floor(def.water.produces * 0.25);
                    }

                    totalProduced += production;

                    // Mark as a source for BFS
                    openSet.push({ x: tile.x, z: tile.z });
                    suppliedTiles.add(`${tile.x},${tile.z}`);
                    tile.waterStatus = 'CONNECTED';
                } else if (tile.buildingType === BuildingType.PIPE || def.water?.consumes) {
                    // Default to disconnected, will be set to CONNECTED if reached by BFS
                    tile.waterStatus = 'DISCONNECTED';
                }
            }
        }


        // 2. BFS Propagation
        // Flows from Sources -> Pipes -> Pipes/Consumers
        let head = 0;
        while (head < openSet.length) {
            const { x, z } = openSet[head++];

            // Get neighbors (NSEW)
            const neighbors = [
                { nx: x, nz: z - 1 }, // North
                { nx: x, nz: z + 1 }, // South
                { nx: x + 1, nz: z }, // East
                { nx: x - 1, nz: z }  // West
            ];

            // Validate and process neighbors
            for (const { nx, nz } of neighbors) {
                const key = `${nx},${nz}`;
                if (suppliedTiles.has(key)) continue;

                const neighbor = ChunkStore.getTile(state.chunks, nx, nz);
                if (!neighbor) continue;

                const nDef = BUILDINGS[neighbor.buildingType];
                if (!nDef) continue;

                // If it's a Pipe, it accepts water and continues the flow
                if (neighbor.buildingType === BuildingType.PIPE) {
                    neighbor.waterStatus = 'CONNECTED';
                    suppliedTiles.add(key);
                    openSet.push({ x: nx, z: nz }); // Continue flow
                }
                // If it's a Consumer, it accepts water but STOPS flow (terminal node)
                else if (nDef.water?.consumes) {
                    neighbor.waterStatus = 'CONNECTED';
                    suppliedTiles.add(key);
                    // Do NOT push to openSet; consumers don't output water to neighbors
                }
            }
        }

        // 3. Calculate Consumption & Deficit
        for (const chunk of Object.values(state.chunks)) {
            for (const tile of chunk.tiles) {
                if (!tile) continue;
                const def = BUILDINGS[tile.buildingType];
                if (def && def.water?.consumes) {
                    totalConsumed += def.water.consumes;
                }
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
