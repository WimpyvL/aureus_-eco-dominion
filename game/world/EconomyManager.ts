/**
 * Economy Manager
 * Handles all economy-related operations: selling, buying, and resource management.
 */

import { StateManager } from '../../engine/state/StateManager';
import { SfxType } from '../../types';
import { getEcoMultiplier } from '../../engine/utils/GameUtils';

export class EconomyManager {
    private stateManager: StateManager;

    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
    }

    /**
     * Sell all minerals for AGT currency
     */
    sellMinerals(): void {
        const state = this.stateManager.getMutableState();
        if (state.resources.minerals <= 0) return;

        const ecoMult = getEcoMultiplier(state.resources.eco);
        const trustMult = 1 + (state.resources.trust / 200);
        const price = state.market.minerals.currentPrice;

        const value = Math.floor(state.resources.minerals * price * ecoMult * trustMult);
        state.resources.agt += value;
        state.resources.minerals = 0;

        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.SELL });
        state.newsFeed.push({
            id: `sell_${Date.now()}`,
            headline: `Sold minerals for ${value} AGT`,
            type: 'POSITIVE',
            timestamp: Date.now()
        });
    }

    /**
     * Buy a building and add it to inventory
     */
    buyBuilding(buildingType: string, cost: number): void {
        const state = this.stateManager.getMutableState();

        // Deduct cost
        state.resources.agt -= cost;

        // Add to inventory
        if (!state.inventory[buildingType]) {
            state.inventory[buildingType] = 0;
        }
        state.inventory[buildingType]++;

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
