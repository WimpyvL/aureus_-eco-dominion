/**
 * Economy System
 * Handles market price fluctuations and economic events.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext, CommandContext, CommandResult, CommandErrorCode } from '../../kernel/Types';
import { GameState, BuildingType, SfxType, GameCommand } from '../../../types';
import { BUILDINGS } from '../../data/VoxelConstants';
import { getEcoMultiplier } from '../../utils/GameUtils';


export class EconomySystem extends BaseSimSystem {
    readonly id = 'economy';
    readonly priority = 40;

    private lastMarketUpdate = 0;
    private readonly MARKET_INTERVAL = 2.0; // Seconds

    tick(ctx: FixedContext, state: GameState): void {
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

    handleCommand(cmd: GameCommand, ctx: CommandContext, state: GameState): CommandResult | null {
        switch (cmd.type) {
            case 'BUY_BUILDING': {
                const bType = cmd.payload.buildingType ?? cmd.payload.type;
                return this.handleBuyBuilding(bType, cmd.payload.cost, state);
            }
            case 'SELL_RESOURCE':
                return this.handleSellResource(cmd.payload.resource, cmd.payload.address, state);
            case 'BUY_RESOURCE':
                return this.handleBuyResource(cmd.payload.resource, cmd.payload.amount, state);
            case 'SET_AUTO_SELL':
                state.logistics.autoSell = cmd.payload.enabled;
                state.logistics.sellThreshold = cmd.payload.threshold;
                return { ok: true };
            default:
                return null;
        }
    }

    private handleBuyBuilding(buildingTypeInput: string, cost: number, state: GameState): CommandResult {
        if (!buildingTypeInput) return { ok: false, code: CommandErrorCode.INVALID_TARGET, reason: 'Missing building type' };
        const buildingType = (buildingTypeInput as BuildingType);
        const def = BUILDINGS[buildingType];
        if (!def) return { ok: false, code: CommandErrorCode.INVALID_TARGET, reason: `Unknown building type: ${buildingTypeInput}` };

        if (!state.cheatsEnabled && def.trustReq !== undefined && state.resources.trust < def.trustReq) {
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ERROR });
            return {
                ok: false,
                code: CommandErrorCode.FORBIDDEN,
                reason: `Requires Trust ${def.trustReq}`
            };
        }

        if (def.costs) {
            // Check resources first
            for (const [res, amt] of Object.entries(def.costs)) {
                const resourceKey = res as keyof typeof state.resources;
                if (typeof state.resources[resourceKey] === 'number' && (state.resources[resourceKey] as number) < (amt as number)) {
                    state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ERROR });
                    return { ok: false, code: CommandErrorCode.INSUFFICIENT_RESOURCES, reason: `Insufficient ${res}` };
                }
            }

            // Deduct resources
            Object.entries(def.costs).forEach(([res, amt]) => {
                const resourceKey = res as keyof typeof state.resources;
                (state.resources[resourceKey] as number) -= (amt as number);
            });
        } else {
            if (state.resources.agt < cost) {
                state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ERROR });
                return { ok: false, code: CommandErrorCode.INSUFFICIENT_RESOURCES, reason: 'Insufficient AGT' };
            }
            state.resources.agt -= cost;
        }

        // Ensure inventory map exists and add the purchased unit
        state.inventory[buildingType] = (state.inventory?.[buildingType] || 0) + 1;
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_COIN });
        state.newsFeed.unshift({
            id: `buy_bld_${Date.now()}`,
            headline: `Acquired 1 ${def.name}.`,
            type: 'POSITIVE',
            timestamp: state.tickCount
        });
        return { ok: true };
    }

    private handleSellResource(resource: 'minerals' | 'gems' | 'wood' | 'stone', address: string | undefined, state: GameState): CommandResult {
        const amount = state.resources[resource];
        if (amount <= 0) return { ok: false, code: CommandErrorCode.INVALID_STATE, reason: `No ${resource} to sell` };

        if (resource === 'gems') {
            state.resources.gems = 0;
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_COIN });
            state.newsFeed.unshift({
                id: `deposit_gems_${Date.now()}`,
                headline: `Deposited ${Math.floor(amount)} Thundergems to ${address || 'External Wallet'}`,
                type: 'POSITIVE',
                timestamp: state.tickCount
            });
            return { ok: true };
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
        return { ok: true };
    }

    private handleBuyResource(resource: 'minerals' | 'gems' | 'wood' | 'stone', amount: number, state: GameState): CommandResult {
        const price = state.market[resource].currentPrice * 1.25;
        const totalCost = Math.floor(price * amount);

        if (state.resources.agt < totalCost) {
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ERROR });
            return { ok: false, code: CommandErrorCode.INSUFFICIENT_RESOURCES, reason: 'Insufficient AGT' };
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
        return { ok: true };
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
