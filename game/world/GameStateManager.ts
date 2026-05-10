/**
 * Game State Manager
 * Handles save/load, tutorial progression, and debug features.
 */

import { StateManager } from '../../engine/state/StateManager';
import { WorkerPool } from '../../engine/jobs';
import { GameStep, SfxType } from '../../types';

export class GameStateManager {
    private stateManager: StateManager;
    private workerPool: WorkerPool;

    constructor(stateManager: StateManager, workerPool: WorkerPool) {
        this.stateManager = stateManager;
        this.workerPool = workerPool;
    }

    /**
     * Save the current game state to localStorage
     */
    saveGame(): void {
        const data = this.stateManager.serializeState();
        localStorage.setItem('aureus_save_v2', data);
    }

    /**
     * Load game state from saved data
     */
    loadGame(data: string): void {
        try {
            const parsed = JSON.parse(data);
            this.stateManager.loadState(parsed);
            this.workerPool.broadcast({ type: 'SYNC_GRID', payload: parsed.grid });
        } catch (e) {
            console.error('[GameStateManager] Failed to load game:', e);
        }
    }

    /**
     * Advance the tutorial to the next step
     */
    advanceTutorial(): void {
        const state = this.stateManager.getState();
        const steps = [
            GameStep.INTRO,
            GameStep.TUTORIAL_MINE,
            GameStep.TUTORIAL_SELL,
            GameStep.TUTORIAL_BUY,
            GameStep.TUTORIAL_PLACE,
            GameStep.PLAYING
        ];

        const idx = steps.indexOf(state.step);
        if (idx !== -1 && idx < steps.length - 1) {
            state.step = steps[idx + 1];
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_COIN });
            this.stateManager.markDirty('step', 'pendingEffects');
        }
    }

    /**
     * Toggle debug mode
     */
    toggleDebug(): void {
        const state = this.stateManager.getState();
        state.debugMode = !state.debugMode;
        this.stateManager.markDirty('debugMode');
    }

    /**
     * Set interaction mode (BUILD, BULLDOZE, INSPECT, TEST_DESTRUCT)
     */
    setInteractionMode(mode: 'BUILD' | 'BULLDOZE' | 'INSPECT' | 'TEST_DESTRUCT'): void {
        const state = this.stateManager.getState();
        state.interactionMode = mode;
        this.stateManager.markDirty('interactionMode');
    }
}
