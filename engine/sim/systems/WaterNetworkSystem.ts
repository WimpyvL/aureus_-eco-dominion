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

        // 1. Identify Sources and reset network state
        const openSet: number[] = []; // Tiles with water
        const suppliedTiles = new Set<number>(); // Tiles that have received water
        const grid = state.grid;
        const size = Math.sqrt(grid.length);

        // Pre-scan to reset status and find sources
        for (const tile of grid) {
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
                openSet.push(tile.id);
                suppliedTiles.add(tile.id);
                tile.waterStatus = 'CONNECTED';
            } else if (tile.buildingType === BuildingType.PIPE || def.water?.consumes) {
                // Default to disconnected, will be set to CONNECTED if reached by BFS
                tile.waterStatus = 'DISCONNECTED';
            }
        }

        // 2. BFS Propagation
        // Flows from Sources -> Pipes -> Pipes/Consumers
        // Note: Consumers don't extend flow (unless they are also pipes/sources, which they aren't)
        let head = 0;
        while (head < openSet.length) {
            const currentId = openSet[head++];
            const currentTile = grid[currentId];

            // Get neighbors (NSEW)
            const neighbors = [
                currentId - size, // North
                currentId + size, // South
                currentId + 1,    // East
                currentId - 1     // West
            ];

            // Validate and process neighbors
            for (const nIdx of neighbors) {
                // Bounds check
                if (nIdx < 0 || nIdx >= grid.length) continue;
                // Wrap-around check (ensure same row for east/west)
                if (Math.abs((nIdx % size) - (currentId % size)) > 1) continue;

                // Skip if already visited
                if (suppliedTiles.has(nIdx)) continue;

                const neighbor = grid[nIdx];
                const nDef = BUILDINGS[neighbor.buildingType];
                if (!nDef) continue;

                // Logic:
                // Water flows INTO Pipes.
                // Water flows FROM Pipes INTO Consumers.
                // Water flows FROM Sources INTO Pipes.

                // If it's a Pipe, it accepts water and continues the flow
                if (neighbor.buildingType === BuildingType.PIPE) {
                    neighbor.waterStatus = 'CONNECTED';
                    suppliedTiles.add(nIdx);
                    openSet.push(nIdx); // Continue flow
                }
                // If it's a Consumer, it accepts water but STOPS flow (terminal node)
                else if (nDef.water?.consumes) {
                    neighbor.waterStatus = 'CONNECTED';
                    suppliedTiles.add(nIdx);
                    // Do NOT push to openSet; consumers don't output water to neighbors
                }
            }
        }

        // 3. Calculate Consumption & Deficit
        // Only CONNECTED consumers count towards "valid" consumption satisfaction
        // But for "deficit", we usually compare Total Potential Demand vs Total Supply
        // Or simply: Deficit = Demand - Supply.
        // If a building is disconnected, it still "demands" water (it's thirsty).

        for (const tile of grid) {
            if (!tile) continue;
            const def = BUILDINGS[tile.buildingType];
            if (def && def.water?.consumes) {
                totalConsumed += def.water.consumes;

                // Optional: Gameplay effect for disconnected buildings?
                // For now, we trust the deficit calc.
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
