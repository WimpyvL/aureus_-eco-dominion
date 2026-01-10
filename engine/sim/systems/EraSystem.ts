/**
 * Era System
 * Handles game progression by checking unlock conditions for different eras.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState, Era, SfxType } from '../../../types';
import { ERAS } from '../../data/VoxelConstants';

export class EraSystem extends BaseSimSystem {
    readonly id = 'era';
    readonly priority = 5; // Run late to check conditions after other systems update state

    private lastCheck = 0;
    private readonly CHECK_INTERVAL = 1.0; // Check every second (sim time)

    tick(ctx: FixedContext, state: GameState): void {
        if (ctx.time - this.lastCheck < this.CHECK_INTERVAL) return;
        this.lastCheck = ctx.time;

        this.checkEraProgression(state);
    }

    private checkEraProgression(state: GameState): void {
        const eras = [Era.SETTLEMENT, Era.GROWTH, Era.INDUSTRY, Era.SUSTAINABILITY, Era.PROSPERITY];
        const currentIndex = eras.indexOf(state.currentEra);

        // Check if next era exists
        if (currentIndex < eras.length - 1) {
            const nextEra = eras[currentIndex + 1];
            const nextDef = ERAS[nextEra];

            if (this.isEraUnlocked(state, nextDef.unlockConditions)) {
                this.unlockEra(state, nextEra);
            }
        }
    }

    private isEraUnlocked(state: GameState, conditions: any): boolean {
        // If tutorial requirement exists
        // Note: We check if state.step is PLAYING or later
        if (conditions.tutorialComplete) {
            const stepOrder = ['INTRO', 'TUTORIAL_MINE', 'TUTORIAL_SELL', 'TUTORIAL_BUY', 'TUTORIAL_PLACE', 'PLAYING', 'GAME_OVER', 'VICTORY'];
            if (stepOrder.indexOf(state.step) < stepOrder.indexOf('PLAYING')) {
                return false;
            }
        }

        if (conditions.minColonists && state.agents.filter(a => a.type !== 'ILLEGAL_MINER').length < conditions.minColonists) return false;
        if (conditions.minAgt && state.resources.agt < conditions.minAgt) return false;
        if (conditions.minEco && state.resources.eco < conditions.minEco) return false;
        if (conditions.minTrust && state.resources.trust < conditions.minTrust) return false;

        if (conditions.minBuildings) {
            const count = state.grid.filter(t => t.buildingType !== 'EMPTY' && !t.isUnderConstruction).length;
            if (count < conditions.minBuildings) return false;
        }

        return true;
    }

    private unlockEra(state: GameState, era: Era): void {
        state.currentEra = era;
        if (!state.unlockedEras.includes(era)) {
            state.unlockedEras.push(era);
        }

        const def = ERAS[era];

        // Notification
        state.newsFeed.push({
            id: `era_${era}_${Date.now()}`,
            headline: `NEW ERA UNLOCKED: ${def.name}!`,
            type: 'POSITIVE',
            timestamp: Date.now()
        });

        // Audio Effect
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.COMPLETE });

        console.log(`[EraSystem] Unlocked ${era}`);
    }
}
