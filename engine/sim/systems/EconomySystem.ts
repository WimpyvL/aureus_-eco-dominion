/**
 * Economy System
 * Handles market price fluctuations and economic events.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState } from '../../../types';

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
        this.fluatuateResource(market.minerals);
        this.fluatuateResource(market.gems);
        this.fluatuateResource(market.wood);
        this.fluatuateResource(market.stone);

        // Random Trend Shifts
        this.updateTrend(market.minerals);
        this.updateTrend(market.gems);
        this.updateTrend(market.wood);
        this.updateTrend(market.wood);
        this.updateTrend(market.stone);

        // Calculate and Enforce Capacity
        // Run every tick or throttled? Throttled is fine, or every 1s
        if (state.tickCount % 30 === 0) {
            this.calculateCapacity(state);
            this.enforceLimits(state);
        }
    }

    private calculateCapacity(state: GameState) {
        let cap = 500; // Base capacity

        // Scan grid for storage buildings (could cache this but grid scan is fast enough for <10k tiles in JS)
        // Optimization: Use a cached count in state if this becomes slow
        for (const tile of state.grid) {
            if (tile.isUnderConstruction) continue;

            // Only count "Head" tiles to avoid double counting multi-tile buildings
            if (tile.structureHeadIndex !== undefined && tile.structureHeadIndex !== tile.id) continue;

            if (tile.buildingType === 'STORAGE_DEPOT') cap += 500;
            else if (tile.buildingType === 'STOCKPILE') cap += 2000;
            else if (tile.buildingType === 'STORAGE_EXTENSION') cap += 250;
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

    private fluatuateResource(m: any) {
        const change = (Math.random() - 0.5) * m.volatility + (m.trend === 'RISING' ? 1.5 : m.trend === 'FALLING' ? -1.5 : 0);
        let newPrice = Math.max(1, Math.min(m.basePrice * 3, m.currentPrice + change));
        newPrice = Math.round(newPrice * 10) / 10;

        m.history.push(newPrice);
        if (m.history.length > 20) m.history.shift();
        m.currentPrice = newPrice;
    }

    private updateTrend(m: any) {
        if (Math.random() < 0.05) {
            const r = Math.random();
            if (r < 0.3) m.trend = 'STABLE';
            else if (r < 0.6) m.trend = 'RISING';
            else m.trend = 'FALLING';
        }
    }
}
