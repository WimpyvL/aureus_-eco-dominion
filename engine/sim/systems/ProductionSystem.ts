/**
 * Production System
 * Handles building maintenance (upkeep), resource generation, and auto-sell logistics.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { BuildingType, FactoryNodeState, FactoryResourceType, FactoryState, GameState, SfxType } from '../../../types';
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
    private readonly FACTORY_OUTPUT_CAP = 20;

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
        const factory = this.getFactoryState(state);

        let hasSpaceport = false;
        let hasWasteTreatment = false;

        for (const chunk of Object.values(state.chunks)) {
            for (const tile of chunk.tiles) {
                if (tile.foliage === 'ILLEGAL_CAMP') {
                    totalIncome -= 5;
                }

                if (tile.buildingType === BuildingType.EMPTY || tile.isUnderConstruction) {
                    if (tile.foliage === 'MINE_HOLE') ecoChange += 0.01;
                    continue;
                }

                if (tile.structureHeadX !== undefined && (tile.x !== tile.structureHeadX || tile.z !== tile.structureHeadZ)) continue;

                const def = BUILDINGS[tile.buildingType];
                if (!def) continue;

                let currentDef: any = def;
                if (def.upgrades && (tile.level || 1) > 1) {
                    const upgrade = def.upgrades.find((u) => u.level === tile.level);
                    if (upgrade) {
                        currentDef = { ...def, ...upgrade };
                    }
                }

                if (tile.buildingType === BuildingType.SPACEPORT) hasSpaceport = true;
                if (tile.buildingType === BuildingType.WASTE_TREATMENT) hasWasteTreatment = true;

                totalMaintenance += (currentDef.maintenance || 0) * modifiers.upkeep;
                ecoChange += currentDef.pollution > 0 ? currentDef.pollution * 0.05 / 10 : currentDef.pollution / 10;

                let powerEfficiency = 1.0;
                let waterEfficiency = 1.0;

                if (currentDef.power?.consumes && state.powerGrid?.deficit > 0) {
                    powerEfficiency = 0.25;
                }

                if (currentDef.water?.consumes) {
                    if (tile.waterStatus !== 'CONNECTED') {
                        waterEfficiency = 0.1;
                    } else if (state.waterNetwork?.deficit > 0) {
                        waterEfficiency = 0.5;
                    }
                }

                const utilityEfficiency = powerEfficiency * waterEfficiency;

                let productionMult = 1.0;
                if (tile.buildingType === BuildingType.SAWMILL || tile.buildingType === BuildingType.STONE_QUARRY) {
                    const consumed = this.consumeEnvironment(state, tile, dt);
                    if (!consumed) {
                        productionMult = 0;
                    }
                }

                if (tile.buildingType === BuildingType.MINING_HEADFRAME) {
                    const node = this.getFactoryNode(factory, tile.x, tile.z, tile.buildingType, 'SOURCE', state.tickCount);
                    this.pushOutput(node, 'ORE', (currentDef.production || 0) * modifiers.production * utilityEfficiency * 0.05);
                } else if (tile.buildingType === BuildingType.SAWMILL) {
                    const node = this.getFactoryNode(factory, tile.x, tile.z, tile.buildingType, 'SOURCE', state.tickCount);
                    if (productionMult > 0) {
                        this.pushOutput(node, 'WOOD', (currentDef.production || 0) * modifiers.production * utilityEfficiency * 0.05);
                    }
                } else if (tile.buildingType === BuildingType.STONE_QUARRY) {
                    const node = this.getFactoryNode(factory, tile.x, tile.z, tile.buildingType, 'SOURCE', state.tickCount);
                    if (productionMult > 0) {
                        this.pushOutput(node, 'STONE', (currentDef.production || 0) * modifiers.production * utilityEfficiency * 0.05);
                    }
                } else if (tile.buildingType === BuildingType.WASH_PLANT || tile.buildingType === BuildingType.RECYCLING_PLANT) {
                    const node = this.getFactoryNode(factory, tile.x, tile.z, tile.buildingType, 'PROCESSOR', state.tickCount);
                    const ore = this.pullInput(node, 'ORE', Math.max(0.5, (currentDef.production || 0) * 0.03 * utilityEfficiency));
                    if (ore > 0) {
                        this.pushOutput(node, 'CONCENTRATE', ore * 0.85);
                    } else {
                        node.stalledTicks += 1;
                    }
                } else if (tile.buildingType === BuildingType.ORE_FOUNDRY) {
                    const node = this.getFactoryNode(factory, tile.x, tile.z, tile.buildingType, 'PROCESSOR', state.tickCount);
                    const concentrateAvailable = node.inputBuffer.CONCENTRATE || 0;
                    const stoneAvailable = node.inputBuffer.STONE || 0;
                    const batch = Math.min(concentrateAvailable, stoneAvailable * 3, Math.max(0.5, (currentDef.production || 0) * 0.025 * utilityEfficiency));
                    if (batch > 0) {
                        this.pullInput(node, 'CONCENTRATE', batch);
                        this.pullInput(node, 'STONE', batch / 3);
                        this.pushOutput(node, 'MINERALS', batch * 1.1);
                    } else {
                        node.stalledTicks += 1;
                    }
                } else if (tile.buildingType === BuildingType.GEM_REFINERY) {
                    const node = this.getFactoryNode(factory, tile.x, tile.z, tile.buildingType, 'PROCESSOR', state.tickCount);
                    const concentrate = this.pullInput(node, 'CONCENTRATE', Math.max(0.2, (currentDef.production || 0) * 0.02 * utilityEfficiency));
                    if (concentrate > 0) {
                        this.pushOutput(node, 'GEMS', concentrate * 0.25);
                    } else {
                        node.stalledTicks += 1;
                    }
                } else if (currentDef.productionType === 'TRUST') {
                    trustProd += (currentDef.production || 0) * utilityEfficiency * 0.05;
                } else if (currentDef.productionType === 'ECO') {
                    ecoChange -= (currentDef.production || 0) * utilityEfficiency * 0.05;
                } else if (currentDef.productionType === 'AGT') {
                    totalIncome += (currentDef.production || 0) * ecoMult * trustMult * utilityEfficiency;
                } else if (currentDef.productionType === 'MINERALS') {
                    mineralProd += (currentDef.production || 0) * modifiers.production * utilityEfficiency * 0.02;
                } else if (currentDef.productionType === 'WOOD') {
                    woodProd += (currentDef.production || 0) * modifiers.production * utilityEfficiency * 0.02 * productionMult;
                } else if (currentDef.productionType === 'STONE') {
                    stoneProd += (currentDef.production || 0) * modifiers.production * utilityEfficiency * 0.02 * productionMult;
                } else if (currentDef.productionType === 'GEMS') {
                    gemProd += (currentDef.production || 0) * modifiers.production * utilityEfficiency * 0.01;
                }
            }
        }

        if (hasSpaceport) modifiers.sellPrice *= 10;
        if (hasWasteTreatment && ecoChange > 0) ecoChange *= 0.8;

        const allTiles = Object.values(state.chunks).flatMap((c) => c.tiles);
        let totalCapacity = BASE_STORAGE_CAPACITY;

        for (const t of allTiles) {
            if (t.isUnderConstruction) continue;
            if (t.structureHeadX !== undefined && (t.x !== t.structureHeadX || t.z !== t.structureHeadZ)) continue;

            if (t.buildingType === BuildingType.STORAGE_DEPOT || t.buildingType === BuildingType.STOCKPILE) {
                const def = BUILDINGS[t.buildingType];
                if (!def) continue;

                let addedStorage = t.buildingType === BuildingType.STORAGE_DEPOT ? DEPOT_CAPACITY_BONUS : STOCKPILE_CAPACITY_BONUS;

                if (def.upgrades && (t.level || 1) > 1) {
                    const upgrade = def.upgrades.find((u) => u.level === t.level);
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

        state.resources.agt += (totalIncome - totalMaintenance) * dt;

        let ecoDelta = -(ecoChange / 8) * dt;
        if (ecoDelta > 0) {
            ecoDelta *= modifiers.ecoRegen;
        }
        state.resources.eco = Math.max(0, Math.min(100, state.resources.eco + ecoDelta));
        state.resources.trust = Math.min(100, state.resources.trust + trustProd * dt * modifiers.trustGain);

        state.resources.minerals = Math.min(totalCapacity, state.resources.minerals + mineralProd * dt);
        state.resources.wood = Math.min(totalCapacity, state.resources.wood + woodProd * dt);
        state.resources.stone = Math.min(totalCapacity, state.resources.stone + stoneProd * dt);
        state.resources.gems = Math.max(0, state.resources.gems + gemProd * dt);

        state.resources.income = totalIncome;
        state.resources.maintenance = totalMaintenance;
        state.resources.maxCapacity = totalCapacity;

        if (state.logistics.autoSell && state.resources.minerals >= state.logistics.sellThreshold) {
            this.executeAutoSell(ctx, state, modifiers);
        }
    }

    private getFactoryState(state: GameState): FactoryState {
        if (!state.factory) {
            state.factory = {
                nodes: {},
                throughput: 0,
                backlog: 0,
                stalledNodes: 0,
                lastNetworkTick: 0,
            };
        }

        return state.factory;
    }

    private getFactoryNode(
        factory: FactoryState,
        x: number,
        z: number,
        buildingType: BuildingType,
        mode: FactoryNodeState['mode'],
        tickCount: number,
    ): FactoryNodeState {
        const key = `${x},${z}`;
        const existing = factory.nodes[key];
        if (existing) {
            existing.buildingType = buildingType;
            existing.mode = mode;
            return existing;
        }

        factory.nodes[key] = {
            key,
            x,
            z,
            buildingType,
            mode,
            buffer: {},
            inputBuffer: {},
            stalledTicks: 0,
            lastActiveTick: tickCount,
        };

        return factory.nodes[key];
    }

    private pushOutput(node: FactoryNodeState, resource: FactoryResourceType, amount: number): void {
        if (amount <= 0) return;
        const current = node.buffer[resource] || 0;
        node.buffer[resource] = Math.min(this.FACTORY_OUTPUT_CAP, current + amount);
    }

    private pullInput(node: FactoryNodeState, resource: FactoryResourceType, amount: number): number {
        const current = node.inputBuffer[resource] || 0;
        const taken = Math.min(current, amount);
        node.inputBuffer[resource] = current - taken;
        if (node.inputBuffer[resource]! <= 0.001) {
            delete node.inputBuffer[resource];
        }
        return taken;
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

        for (let dz = -radius; dz <= radius; dz++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const tx = buildingTile.x + dx;
                const tz = buildingTile.z + dz;
                const tile = ChunkStore.getTile(state.chunks, tx, tz);

                if (tile && tile.foliage && targetFoliage.includes(tile.foliage as any)) {
                    if (tile.integrity === undefined || tile.integrity <= 0) tile.integrity = 100;

                    const consumptionRate = 5.0;
                    const prevIntegrity = tile.integrity;
                    tile.integrity -= consumptionRate * dt;

                    let changed = false;
                    if (isWood) {
                        if (tile.foliage.startsWith('TREE_') && tile.integrity < 50 && prevIntegrity >= 50) {
                            tile.foliage = 'BUSH_OAK' as any;
                            changed = true;
                        } else if (tile.foliage === 'BUSH_OAK' && tile.integrity < 20 && prevIntegrity >= 20) {
                            tile.foliage = 'TREE_STUMP' as any;
                            changed = true;
                        }
                    } else if (tile.foliage === 'ROCK_BOULDER' && tile.integrity < 50 && prevIntegrity >= 50) {
                        tile.foliage = 'ROCK_PEBBLE' as any;
                        changed = true;
                    }

                    if (tile.integrity <= 0 || changed) {
                        if (tile.integrity <= 0) {
                            tile.foliage = 'NONE' as any;
                            tile.markedForHarvest = false;
                            tile.integrity = 100;
                        }

                        const { cx, cz } = worldToChunk(tx, tz, CHUNK_SIZE);
                        const chunk = state.chunks[`${cx},${cz}`];
                        if (chunk) {
                            chunk.meshDirty = true;
                            chunk.simDirty = true;
                        }
                        state.pendingEffects.push({ type: 'CHUNK_UPDATE', cx, cz, updates: [tile] });

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
            timestamp: state.tickCount,
        });
    }
}
