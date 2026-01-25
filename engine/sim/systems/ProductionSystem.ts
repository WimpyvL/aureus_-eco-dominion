/**
 * Production System
 * Handles building maintenance (upkeep), resource generation, and auto-sell logistics.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState, BuildingType, SfxType } from '../../../types';
import { BUILDINGS } from '../../data/VoxelConstants';
import { getEcoMultiplier } from '../../utils/GameUtils';

export class ProductionSystem extends BaseSimSystem {
    readonly id = 'production';
    readonly priority = 25;

    private lastUpdate = 0;
    private readonly INTERVAL = 1.0; // Seconds

    tick(ctx: FixedContext, state: GameState): void {
        if (ctx.time - this.lastUpdate < this.INTERVAL) return;
        const dt = ctx.time - this.lastUpdate;
        this.lastUpdate = ctx.time;

        const grid = state.grid;
        if (!grid) return;

        let mineralProd = 0;
        let woodProd = 0;
        let stoneProd = 0;
        let ecoChange = 0;
        let totalMaintenance = 0;

        const ecoMult = getEcoMultiplier(state.resources.eco);
        const trustMult = 1 + (state.resources.trust / 200);
        const modifiers = this.getModifiers(state);
        let totalIncome = 0;

        for (const tile of grid) {
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
            if (tile.structureHeadIndex !== undefined && tile.id !== tile.structureHeadIndex) continue;

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

            // Production
            if (currentDef.productionType === 'MINERALS') {
                mineralProd += (currentDef.production || 0) * modifiers.production * utilityEfficiency * 0.05;
            } else if (currentDef.productionType === 'WOOD') {
                woodProd += (currentDef.production || 0) * modifiers.production * utilityEfficiency * 0.05;
            } else if (currentDef.productionType === 'STONE') {
                stoneProd += (currentDef.production || 0) * modifiers.production * utilityEfficiency * 0.05;
            } else if (currentDef.productionType === 'AGT') {
                totalIncome += (currentDef.production || 0) * ecoMult * trustMult * utilityEfficiency;
            }
        }

        // Apply Results
        state.resources.agt += (totalIncome - totalMaintenance) * dt;
        state.resources.eco = Math.max(0, Math.min(100, state.resources.eco - (ecoChange / 8) * dt));
        state.resources.minerals += mineralProd * dt;
        state.resources.wood += woodProd * dt;
        state.resources.stone += stoneProd * dt;

        // Cache summary for UI
        state.resources.income = totalIncome;
        state.resources.maintenance = totalMaintenance;

        // Auto-Sell Logic
        if (state.logistics.autoSell && state.resources.minerals >= state.logistics.sellThreshold) {
            this.executeAutoSell(state, modifiers);
        }
    }

    private getModifiers(state: GameState) {
        const mods = { production: 1, sellPrice: 1, upkeep: 1 };

        // Weather
        if (state.weather.current === 'DUST_STORM') {
            mods.upkeep *= 1.5;
            mods.production *= 0.7;
        } else if (state.weather.current === 'STORM' || state.weather.current === 'RAINY') {
            mods.production *= 0.5; // Solar panels etc
        }

        // Events
        state.activeEvents.forEach(e => {
            if (e.modifiers) {
                if (e.modifiers.productionMult) mods.production *= e.modifiers.productionMult;
                if (e.modifiers.sellPriceMult) mods.sellPrice *= e.modifiers.sellPriceMult;
            }
        });

        // Research / Technology
        const unlocked = state.research.unlocked;
        if (unlocked.includes('ADVANCED_DRILLING')) mods.production *= 1.2;
        if (unlocked.includes('MARKET_ANALYTICS')) mods.sellPrice *= 1.1;
        if (unlocked.includes('AUTOMATION')) mods.upkeep *= 0.9;

        return mods;
    }

    private executeAutoSell(state: GameState, modifiers: any) {
        const ecoMult = getEcoMultiplier(state.resources.eco);
        const trustMult = 1 + (state.resources.trust / 200);
        const price = state.market.minerals.currentPrice;

        const value = Math.floor(state.resources.minerals * price * modifiers.sellPrice * ecoMult * trustMult);

        state.resources.agt += value;
        state.resources.minerals = 0;

        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.SELL });
        state.newsFeed.push({
            id: `sell_${Date.now()}`,
            headline: `Logistics: Auto-sold minerals for ${value} AGT.`,
            type: 'POSITIVE',
            timestamp: Date.now()
        });
    }
}
