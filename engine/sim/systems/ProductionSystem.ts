/**
 * Production System
 * Handles building maintenance (upkeep), resource generation, and auto-sell logistics.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState, BuildingType, SfxType } from '../../../types';
import { BUILDINGS } from '../../data/VoxelConstants';
import { getEcoMultiplier, HARVESTABLE_TREES, HARVESTABLE_ROCKS } from '../../utils/GameUtils';
import { BASE_STORAGE_CAPACITY, DEPOT_CAPACITY_BONUS, STOCKPILE_CAPACITY_BONUS } from '../logic/SimulationLogic';
import { ChunkStore } from '../../space/ChunkStore';
import { worldToChunk, CHUNK_SIZE } from '../../utils/coords';
import { getEventEnvironmentModifiers, getWeatherGameplayEffects } from '../../weather/weatherModel';

export class ProductionSystem extends BaseSimSystem {
    readonly id = 'production';
    readonly priority = 25;

    private lastUpdate = 0;
    private readonly INTERVAL = 1.0; // Seconds

    tick(ctx: FixedContext, state: GameState): void {
        if (ctx.time - this.lastUpdate < this.INTERVAL) return;
        const dt = ctx.time - this.lastUpdate;
        this.lastUpdate = ctx.time;



        let mineralProd = 0;
        let woodProd = 0;
        let stoneProd = 0;
        let gemProd = 0;
        let trustProd = 0;
        let ecoChange = 0;
        let totalMaintenance = 0;

        const ecoMult = getEcoMultiplier(state.resources.eco);
        const trustMult = 1 + (state.resources.trust / 200);
        const modifiers = this.getModifiers(state);
        let totalIncome = 0;
        
        // Track global building effects
        let hasSpaceport = false;
        let hasWasteTreatment = false;

        for (const chunk of Object.values(state.chunks)) {
            for (const tile of chunk.tiles) {
                // Illegal camps penalize income
                if (tile.foliage === 'ILLEGAL_CAMP') {
                    totalIncome -= 5;
                }

                if (tile.buildingType === BuildingType.EMPTY || tile.isUnderConstruction) {
                    // Passive foliage effects
                    if (tile.foliage === 'MINE_HOLE') ecoChange += 0.01;
                    continue;
                }

                // Multi-tile building optimization: only process head
                if (tile.structureHeadX !== undefined && (tile.x !== tile.structureHeadX || tile.z !== tile.structureHeadZ)) continue;

                const def = BUILDINGS[tile.buildingType];
                if (!def) continue;

                // <UPGRADE LOGIC>
                let currentDef: any = def;
                if (def.upgrades && (tile.level || 1) > 1) {
                    const upgrade = def.upgrades.find(u => u.level === tile.level);
                    if (upgrade) {
                        currentDef = { ...def, ...upgrade };
                    }
                }
                // </UPGRADE LOGIC>

                if (tile.buildingType === BuildingType.SPACEPORT) hasSpaceport = true;
                if (tile.buildingType === BuildingType.WASTE_TREATMENT) hasWasteTreatment = true;

                // Maintenance (Cost per second)
                totalMaintenance += (currentDef.maintenance || 0) * modifiers.upkeep;

                // Pollution (Eco impact)
                ecoChange += (currentDef.pollution > 0 ? (currentDef.pollution * 0.05 / 10) : (currentDef.pollution / 10));

                // Power/Water efficiency
                let powerEfficiency = 1.0;
                let waterEfficiency = 1.0;

                // Buildings with power consumption operate at 25% if grid has deficit
                if (currentDef.power?.consumes && state.powerGrid?.deficit > 0) {
                    powerEfficiency = 0.25;
                }

                // Buildings with water consumption depend on being connected to pipes
                if (currentDef.water?.consumes) {
                    if (tile.waterStatus !== 'CONNECTED') {
                        waterEfficiency = 0.1; // Virtually idle without water connection
                    } else if (state.waterNetwork?.deficit > 0) {
                        waterEfficiency = 0.5; // Grid-wide pressure issues
                    }
                }

                const utilityEfficiency = powerEfficiency * waterEfficiency;

                // <RESOURCE CONSUMPTION LOGIC>
                let productionMult = 1.0;
                if (tile.buildingType === BuildingType.SAWMILL || tile.buildingType === BuildingType.STONE_QUARRY) {
                    const consumed = this.consumeEnvironment(state, tile, dt);
                    if (!consumed) {
                        productionMult = 0; // No resources nearby, building is idle!
                    }
                }
                // </RESOURCE CONSUMPTION LOGIC>

                // Production
                if (currentDef.productionType === 'MINERALS') {
                    mineralProd += (currentDef.production || 0) * modifiers.production * utilityEfficiency * 0.05;
                } else if (currentDef.productionType === 'WOOD') {
                    woodProd += (currentDef.production || 0) * modifiers.production * utilityEfficiency * 0.05 * productionMult;
                } else if (currentDef.productionType === 'STONE') {
                    stoneProd += (currentDef.production || 0) * modifiers.production * utilityEfficiency * 0.05 * productionMult;
                } else if (currentDef.productionType === 'GEMS') {
                    gemProd += (currentDef.production || 0) * modifiers.production * utilityEfficiency * 0.05;
                } else if (currentDef.productionType === 'TRUST') {
                    trustProd += (currentDef.production || 0) * utilityEfficiency * 0.05;
                } else if (currentDef.productionType === 'ECO') {
                    ecoChange -= (currentDef.production || 0) * utilityEfficiency * 0.05;
                } else if (currentDef.productionType === 'AGT') {
                    totalIncome += (currentDef.production || 0) * ecoMult * trustMult * utilityEfficiency;
                }
            }
        }

        // Apply Global Modifiers
        if (hasSpaceport) modifiers.sellPrice *= 10;
        if (hasWasteTreatment && ecoChange > 0) ecoChange *= 0.8; // 20% pollution reduction

        // Calculate Storage Capacity
        const allTiles = Object.values(state.chunks).flatMap(c => c.tiles);
        let totalCapacity = BASE_STORAGE_CAPACITY;
        
        for (const t of allTiles) {
            if (t.isUnderConstruction) continue;
            // Only count structure heads to avoid multi-counting
            if (t.structureHeadX !== undefined && (t.x !== t.structureHeadX || t.z !== t.structureHeadZ)) continue;
            
            if (t.buildingType === BuildingType.STORAGE_DEPOT || t.buildingType === BuildingType.STOCKPILE) {
                const def = BUILDINGS[t.buildingType];
                if (!def) continue;
                
                // Parse stats diff for correct storage size
                let addedStorage = t.buildingType === BuildingType.STORAGE_DEPOT ? DEPOT_CAPACITY_BONUS : STOCKPILE_CAPACITY_BONUS;
                
                if (def.upgrades && (t.level || 1) > 1) {
                    const upgrade = def.upgrades.find(u => u.level === t.level);
                    if (upgrade && upgrade.statsDiff) {
                        const match = upgrade.statsDiff.match(/\+?(\d+)\s*Storage/);
                        if (match && match[1]) {
                            addedStorage = parseInt(match[1], 10);
                        }
                    }
                }
                totalCapacity += addedStorage;
            }
        }

        // Apply Results
        state.resources.agt += (totalIncome - totalMaintenance) * dt;

        let ecoDelta = -(ecoChange / 8) * dt;
        if (ecoDelta > 0) {
            ecoDelta *= modifiers.ecoRegen;
        }
        state.resources.eco = Math.max(0, Math.min(100, state.resources.eco + ecoDelta));
        state.resources.trust = Math.min(100, state.resources.trust + (trustProd * dt * modifiers.trustGain));

        // Resource Clamping
        state.resources.minerals = Math.min(totalCapacity, state.resources.minerals + (mineralProd * dt));
        state.resources.wood = Math.min(totalCapacity, state.resources.wood + (woodProd * dt));
        state.resources.stone = Math.min(totalCapacity, state.resources.stone + (stoneProd * dt));
        state.resources.gems = Math.max(0, state.resources.gems + (gemProd * dt)); // UnCapped

        // Cache summary for UI
        state.resources.income = totalIncome;
        state.resources.maintenance = totalMaintenance;
        state.resources.maxCapacity = totalCapacity; // Store for UI to display

        // Auto-Sell Logic
        if (state.logistics.autoSell && state.resources.minerals >= state.logistics.sellThreshold) {
            this.executeAutoSell(ctx, state, modifiers);
        }
    }

    private getModifiers(state: GameState) {
        const weatherEffects = getWeatherGameplayEffects(state.weather);
        const eventEffects = getEventEnvironmentModifiers(state.activeEvents);
        const mods = {
            production: weatherEffects.productionMult * eventEffects.productionMult,
            sellPrice: eventEffects.sellPriceMult,
            upkeep: weatherEffects.upkeepMult * eventEffects.upkeepMult,
            ecoRegen: weatherEffects.ecoRegenMult * eventEffects.ecoRegenMult,
            trustGain: weatherEffects.trustGainMult * eventEffects.trustGainMult,
        };

        // Research / Technology
        const unlocked = state.research.unlocked;
        if (unlocked.includes('ADVANCED_DRILLING')) mods.production *= 1.2;
        if (unlocked.includes('MARKET_ANALYTICS')) mods.sellPrice *= 1.1;
        if (unlocked.includes('AUTOMATION')) mods.upkeep *= 0.9;

        return mods;
    }

    private consumeEnvironment(state: GameState, buildingTile: any, dt: number): boolean {
        const radius = 10;
        const isWood = buildingTile.buildingType === BuildingType.SAWMILL;
        const targetFoliage = isWood ? HARVESTABLE_TREES : HARVESTABLE_ROCKS;

        // Find a suitable tile in radius
        // To be efficient, we search for the first one. 
        // A better version might cache the "Current Extraction Tile"
        for (let dz = -radius; dz <= radius; dz++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const tx = buildingTile.x + dx;
                const tz = buildingTile.z + dz;
                const tile = ChunkStore.getTile(state.chunks, tx, tz);

                if (tile && tile.foliage && targetFoliage.includes(tile.foliage as any)) {
                    // Consume integrity
                    if (tile.integrity === undefined || tile.integrity <= 0) tile.integrity = 100;

                    // Buildings consume 5% of a tile per second (adjust for difficulty)
                    const consumptionRate = 5.0;
                    const prevIntegrity = tile.integrity;
                    tile.integrity -= consumptionRate * dt;

                    // <VISUAL DEGRADATION STAGES>
                    let changed = false;
                    if (isWood) {
                        if (tile.foliage.startsWith('TREE_') && tile.integrity < 50 && prevIntegrity >= 50) {
                            tile.foliage = 'BUSH_OAK' as any;
                            changed = true;
                        } else if (tile.foliage === 'BUSH_OAK' && tile.integrity < 20 && prevIntegrity >= 20) {
                            tile.foliage = 'TREE_STUMP' as any;
                            changed = true;
                        }
                    } else {
                        if (tile.foliage === 'ROCK_BOULDER' && tile.integrity < 50 && prevIntegrity >= 50) {
                            tile.foliage = 'ROCK_PEBBLE' as any;
                            changed = true;
                        }
                    }
                    // </VISUAL DEGRADATION STAGES>

                    if (tile.integrity <= 0 || changed) {
                        if (tile.integrity <= 0) {
                            tile.foliage = 'NONE' as any;
                            tile.markedForHarvest = false;
                            tile.integrity = 100;
                        }

                        // Force mesh update
                        const { cx, cz } = worldToChunk(tx, tz, CHUNK_SIZE);
                        const chunk = state.chunks[`${cx},${cz}`];
                        if (chunk) {
                            chunk.meshDirty = true;
                            chunk.simDirty = true;
                        }
                        state.pendingEffects.push({ type: 'CHUNK_UPDATE', cx, cz, updates: [tile] });

                        // FX for stage change or destruction
                        if (changed) {
                            state.pendingEffects.push({ type: 'FX', fxType: isWood ? 'FARM' : 'MINING', x: tx, z: tz });
                        }
                    }
                    return true;
                }
            }
        }

        return false;
    }

    private executeAutoSell(ctx: FixedContext, state: GameState, modifiers: any) {
        const ecoMult = getEcoMultiplier(state.resources.eco);
        const trustMult = 1 + (state.resources.trust / 200);
        const price = state.market.minerals.currentPrice;

        const value = Math.floor(state.resources.minerals * price * modifiers.sellPrice * ecoMult * trustMult);

        state.resources.agt += value;
        state.resources.minerals = 0;

        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.SELL });
        state.newsFeed.push({
            id: ctx.getNextId?.('sell') || `sell_${Date.now()}`,
            headline: `Logistics: Auto-sold minerals for ${value} AGT.`,
            type: 'POSITIVE',
            timestamp: state.tickCount
        });
    }
}
