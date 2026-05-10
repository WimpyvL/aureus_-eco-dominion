/**
 * Contract Manager
 * Handles contract acceptance and delivery.
 */

import { StateManager } from '../../engine/state/StateManager';
import { SfxType } from '../../types';

export class ContractManager {
    private stateManager: StateManager;

    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
    }

    /**
     * Accept a contract
     */
    acceptContract(contractId: string): void {
        console.log(`[ContractManager] Accept contract: ${contractId}`);
        // Contracts use amount field, not status
    }

    /**
     * Deliver resources for a contract
     */
    deliverContract(contractId: string): void {
        const state = this.stateManager.getState();
        const contract = state.contracts.find(c => c.id === contractId);

        if (contract && contract.amount > 0) {
            // Check if we have the resources
            const resource = contract.resource === 'MINERALS' ? 'minerals' : 'gems';
            if (state.resources[resource] >= contract.amount) {
                state.resources[resource] -= contract.amount;
                state.resources.agt += contract.reward;
                state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.COMPLETE });
                this.stateManager.markDirty('contracts', 'resources', 'pendingEffects');
            }
        }
    }
}
