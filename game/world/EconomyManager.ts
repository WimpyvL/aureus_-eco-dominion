/**
 * Economy Manager
 * Handles all economy-related operations: selling, buying, and resource management.
 */

import { StateManager } from '../../engine/state/StateManager';
import { SfxType, BuildingType } from '../../types';
import { getEcoMultiplier } from '../../engine/utils/GameUtils';
import { BUILDINGS } from '../../engine/data/VoxelConstants';

export class EconomyManager {
    private stateManager: StateManager;

    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
    }

    /**
     * Sell a specific resource for AGT currency
     */
    sellResource(resource: 'minerals' | 'gems' | 'wood' | 'stone'): void {
        const state = this.stateManager.getMutableState();
        const amount = state.resources[resource];
        if (amount <= 0) return;

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
            timestamp: Date.now()
        });
    }

    /**
     * Sell minerals (Legacy/Convenience)
     */
    sellMinerals(): void {
        this.sellResource('minerals');
    }

    /**
     * Sell gems (special handling)
     */
    sellGems(address?: string): void {
        const state = this.stateManager.getMutableState();
        const amount = state.resources.gems;
        if (amount <= 0) return;

        // "Deposit" gems to external wallet
        state.resources.gems = 0;

        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_COIN });
        state.newsFeed.unshift({
            id: `deposit_gems_${Date.now()}`,
            headline: `Deposited ${Math.floor(amount)} Thundergems to ${address || 'External Wallet'}`,
            type: 'POSITIVE',
            timestamp: Date.now()
        });
    }

    /**
     * Sell wood
     */
    sellWood(): void { this.sellResource('wood'); }

    /**
     * Sell stone
     */
    sellStone(): void { this.sellResource('stone'); }

    /**
     * Buy a specific resource using AGT currency
     */
    buyResource(resource: 'minerals' | 'gems' | 'wood' | 'stone', amount: number): void {
        const state = this.stateManager.getMutableState();

        // Buyers pay a 25% "Import Fee" over market price
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
            timestamp: Date.now()
        });
    }

    /**
     * Buy a building and add it to inventory
     */
    buyBuilding(buildingType: string, cost: number): void {
        const state = this.stateManager.getMutableState();
        const def = BUILDINGS[buildingType as BuildingType];

        // Deduct multi-resource costs if defined
        if (def && def.costs) {
            Object.entries(def.costs).forEach(([res, amt]) => {
                const resourceKey = res as keyof typeof state.resources;
                const costAmt = amt as number;
                if (costAmt && typeof state.resources[resourceKey] === 'number') {
                    (state.resources[resourceKey] as number) -= costAmt;
                }
            });
        } else {
            // Legacy fall-back (usually AGT)
            state.resources.agt -= cost;
        }

        // Add to inventory
        const bType = buildingType as BuildingType;
        if (!state.inventory[bType]) {
            state.inventory[bType] = 0;
        }
        state.inventory[bType]!++;

        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_COIN });
    }

    /**
     * Configure auto-sell settings
     */
    setAutoSell(enabled: boolean, threshold: number): void {
        const state = this.stateManager.getMutableState();
        state.logistics.autoSell = enabled;
        state.logistics.sellThreshold = threshold;
    }
}
