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
        this.stateManager.pushCommand('SELL_RESOURCE', { resource });
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
        this.stateManager.pushCommand('SELL_RESOURCE', { resource: 'gems', address });
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
        this.stateManager.pushCommand('BUY_RESOURCE', { resource, amount });
    }

    /**
     * Buy a building and add it to inventory
     */
    buyBuilding(buildingType: string, cost: number): void {
        this.stateManager.pushCommand('BUY_BUILDING', { buildingType, cost });
    }

    /**
     * Configure auto-sell settings
     */
    setAutoSell(enabled: boolean, threshold: number): void {
        this.stateManager.pushCommand('SET_AUTO_SELL', { enabled, threshold });
    }
}
