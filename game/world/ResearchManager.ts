/**
 * Research Manager
 * Handles technology research and unlocking.
 */

import { StateManager } from '../../engine/state/StateManager';
import { TechId, SfxType } from '../../types';
import { TECHNOLOGIES } from '../../engine/data/VoxelConstants';

export class ResearchManager {
    private stateManager: StateManager;

    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
    }

    /**
     * Research a technology
     */
    researchTech(techId: string): void {
        const state = this.stateManager.getMutableState();

        // 1. Validate Tech
        const tech = TECHNOLOGIES[techId as TechId];
        if (!tech) {
            console.warn(`[ResearchManager] Unknown tech: ${techId}`);
            return;
        }

        const id = techId as TechId;

        // 2. Check if already unlocked
        if (state.research.unlocked.includes(id)) return;

        // 3. Check Prerequisites
        if (tech.prereq && !state.research.unlocked.includes(tech.prereq)) {
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ERROR });
            return;
        }

        // 4. Check Resources
        if (state.resources.agt < tech.cost) {
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ERROR });
            return;
        }

        // 5. Deduct Cost
        state.resources.agt -= tech.cost;

        // 6. Unlock (Instant)
        state.research.unlocked.push(id);

        // 7. Notification & Sound
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.COMPLETE });
        state.newsFeed.push({
            id: `tech_${id}_${Date.now()}`,
            headline: `RESEARCH COMPLETE: ${tech.name}`,
            type: 'POSITIVE',
            timestamp: Date.now()
        });

        console.log(`[ResearchManager] Unlocked tech: ${id}`);
    }
}
