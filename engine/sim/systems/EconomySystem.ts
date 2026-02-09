/**
 * Economy System
 * Handles market price fluctuations and economic events.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState, BuildingType, SfxType } from '../../../types';
import { BUILDINGS } from '../../data/VoxelConstants';
import { getEcoMultiplier } from '../../utils/GameUtils';


export class EconomySystem extends BaseSimSystem {
    readonly id = 'economy';
    readonly priority = 40;

    private lastMarketUpdate = 0;
    private readonly MARKET_INTERVAL = 2.0; // Seconds

    tick(ctx: FixedContext, state: GameState): void {
        // 1. Process Commands
        this.processCommandQueue(ctx, state);

        if (ctx.time - this.lastMarketUpdate < this.MARKET_INTERVAL) return;
        this.lastMarketUpdate = ctx.time;

        const market = state.market;
        if (!market) return;

        // Fluctuate All Resources
        this.fluatuateResource(ctx, market.minerals);
        this.fluatuateResource(ctx, market.gems);
        this.fluatuateResource(ctx, market.wood);
        this.fluatuateResource(ctx, market.stone);

        // Random Trend Shifts
        this.updateTrend(ctx, market.minerals);
        this.updateTrend(ctx, market.gems);
        this.updateTrend(ctx, market.wood);
        this.updateTrend(ctx, market.stone);

        // Calculate and Enforce Capacity
        // Run every tick or throttled? Throttled is fine, or every 1s
        if (state.tickCount % 30 === 0) {
            this.calculateCapacity(state);
            this.enforceLimits(state);
        }
    }

    private calculateCapacity(state: GameState) {
        let cap = 500; // Base capacity

        // Scan chunks for storage buildings
        // Optimization: Use a cached count in state if this becomes slow
        for (const chunk of Object.values(state.chunks)) {
            for (const tile of chunk.tiles) {
                if (tile.isUnderConstruction) continue;

                // Only count "Head" tiles to avoid double counting multi-tile buildings
                if (tile.structureHeadX !== undefined && (tile.structureHeadX !== tile.x || tile.structureHeadZ !== tile.z)) continue;

                if (tile.buildingType === BuildingType.STORAGE_DEPOT) cap += 500;
                else if (tile.buildingType === BuildingType.STOCKPILE) cap += 2000;
                else if (tile.buildingType === BuildingType.STORAGE_EXTENSION) cap += 250;
            }
        }


        state.resources.maxCapacity = cap;
    }

    private enforceLimits(state: GameState) {
        const cap = state.resources.maxCapacity;

        if (state.resources.minerals > cap) state.resources.minerals = cap;
        if (state.resources.wood > cap) state.resources.wood = cap;
        if (state.resources.stone > cap) state.resources.stone = cap;
        // Gems and AGT usually uncapped or separate
    }

    private processCommandQueue(ctx: FixedContext, state: GameState) {
        if (!state.commandQueue) return;

        const economyCommands = ['BUY_BUILDING', 'SELL_RESOURCE', 'BUY_RESOURCE', 'SET_AUTO_SELL'];
        for (let i = state.commandQueue.length - 1; i >= 0; i--) {
            const cmd = state.commandQueue[i];
            if (economyCommands.includes(cmd.type)) {
                switch (cmd.type) {
                    case 'BUY_BUILDING':
                        this.handleBuyBuilding(cmd.payload.buildingType, cmd.payload.cost, state);
                        break;
                    case 'SELL_RESOURCE':
                        this.handleSellResource(cmd.payload.resource, cmd.payload.address, state);
                        break;
                    case 'BUY_RESOURCE':
                        this.handleBuyResource(cmd.payload.resource, cmd.payload.amount, state);
                        break;
                    case 'SET_AUTO_SELL':
                        state.logistics.autoSell = cmd.payload.enabled;
                        state.logistics.sellThreshold = cmd.payload.threshold;
                        break;
                }
                state.commandQueue.splice(i, 1);
            }
        }
    }

    private handleBuyBuilding(buildingType: string, cost: number, state: GameState) {
        const def = BUILDINGS[buildingType as BuildingType];
        if (def && def.costs) {
            Object.entries(def.costs).forEach(([res, amt]) => {
                const resourceKey = res as keyof typeof state.resources;
                if (typeof state.resources[resourceKey] === 'number') {
                    (state.resources[resourceKey] as number) -= (amt as number);
                }
            });
        } else {
            state.resources.agt -= cost;
        }

        const bType = buildingType as BuildingType;
        state.inventory[bType] = (state.inventory[bType] || 0) + 1;
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_COIN });
    }

    private handleSellResource(resource: 'minerals' | 'gems' | 'wood' | 'stone', address: string | undefined, state: GameState) {
        const amount = state.resources[resource];
        if (amount <= 0) return;

        if (resource === 'gems') {
            state.resources.gems = 0;
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_COIN });
            state.newsFeed.unshift({
                id: `deposit_gems_${Date.now()}`,
                headline: `Deposited ${Math.floor(amount)} Thundergems to ${address || 'External Wallet'}`,
                type: 'POSITIVE',
                timestamp: state.tickCount
            });
            return;
        }

        const ecoMult = getEcoMultiplier(state.resources.eco);
        const trustMult = 1 + (state.resources.trust / 200);
        const price = state.market[resource].currentPrice;
        const value = Math.floor(amount * price * ecoMult * trustMult);

        state.resources.agt += value;
        state.resources[resource] = 0;
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.SELL });
        state.newsFeed.unshift({
            id: `sell_${resource}_${Date.now()}`,
            headline: `Market Transaction: Sold ${resource} for ${value} AGT`,
            type: 'POSITIVE',
            timestamp: state.tickCount
        });
    }

    private handleBuyResource(resource: 'minerals' | 'gems' | 'wood' | 'stone', amount: number, state: GameState) {
        const price = state.market[resource].currentPrice * 1.25;
        const totalCost = Math.floor(price * amount);

        if (state.resources.agt < totalCost) {
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ERROR });
            return;
        }

        state.resources.agt -= totalCost;
        state.resources[resource] += amount;
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_COIN });
        state.newsFeed.unshift({
            id: `buy_${resource}_${Date.now()}`,
            headline: `Import Dispatch: Acquired ${amount} ${resource} for ${totalCost} AGT`,
            type: 'NEUTRAL',
            timestamp: state.tickCount
        });
    }

    private fluatuateResource(ctx: FixedContext, m: any) {
        const r = ctx.random ? ctx.random.next() : Math.random();
        const change = (r - 0.5) * m.volatility + (m.trend === 'RISING' ? 1.5 : m.trend === 'FALLING' ? -1.5 : 0);
        let newPrice = Math.max(1, Math.min(m.basePrice * 3, m.currentPrice + change));
        newPrice = Math.round(newPrice * 10) / 10;

        m.history.push(newPrice);
        if (m.history.length > 20) m.history.shift();
        m.currentPrice = newPrice;
    }

    private updateTrend(ctx: FixedContext, m: any) {
        const nextRand = () => ctx.random ? ctx.random.next() : Math.random();
        if (nextRand() < 0.05) {
            const r = nextRand();
            if (r < 0.3) m.trend = 'STABLE';
            else if (r < 0.6) m.trend = 'RISING';
            else m.trend = 'FALLING';
        }
    }
}
