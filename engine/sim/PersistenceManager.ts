/**
 * Persistence Manager
 * Handles saving and loading the game state to localStorage.
 * Manages serialization of complex objects like Maps.
 */

import { GameState, Agent, GridTile } from '../../types';
import { GRID_SIZE } from '../utils/GameUtils';

export class PersistenceManager {
    private readonly STORAGE_KEY = 'aureus_save_v2';

    /**
     * Serializes and saves the current game state
     */
    public saveGame(state: GameState): boolean {
        try {
            const serialized = JSON.stringify(state, (key, value) => {
                // Handle Maps (Agent Memory)
                if (value instanceof Map) {
                    return {
                        dataType: 'Map',
                        value: Array.from(value.entries()) // Convert to [key, value][]
                    };
                }

                // Exclude large transient objects if any (e.g. pendingEffects should be cleared)
                if (key === 'pendingEffects') return [];
                if (key === 'commandQueue') return [];

                return value;
            });

            localStorage.setItem(this.STORAGE_KEY, serialized);
            console.log('[PersistenceManager] Game saved successfully.');
            // Update last save timestamp metadata if we want
            return true;
        } catch (e) {
            console.error('[PersistenceManager] Failed to save game:', e);
            return false;
        }
    }

    /**
     * Loads and deserializes the game state
     */
    public loadGame(): GameState | null {
        try {
            const serialized = localStorage.getItem(this.STORAGE_KEY);
            if (!serialized) return null;

            const state = JSON.parse(serialized, (key, value) => {
                // Revive Maps
                if (typeof value === 'object' && value !== null && value.dataType === 'Map') {
                    return new Map(value.value);
                }
                return value;
            }) as GameState;

            // Post-load validation / migration
            // Ensure essential arrays exist
            if (!state.agents) state.agents = [];
            if (!state.jobs) state.jobs = [];
            if (!state.pendingEffects) state.pendingEffects = [];
            if (!state.commandQueue) state.commandQueue = [];

            // MIGRATION: Unlock all tiles and set explored (removes old area restrictions)
            if (state.grid) {
                for (const tile of state.grid) {
                    tile.locked = false;
                    tile.explored = true;
                }
                console.log('[PersistenceManager] Migrated grid: unlocked all tiles.');
            }

            // Revive Grid: JSON.parse makes generic objects, but GridTile is an interface so it's fine.
            // If we had class instances, we'd need to re-instantiate them.

            console.log('[PersistenceManager] Game loaded successfully.');
            return state;
        } catch (e) {
            console.error('[PersistenceManager] Failed to load game:', e);
            return null;
        }
    }

    /**
     * Revives state from a provided string
     */
    public reviveState(serialized: string): GameState | null {
        try {
            const state = JSON.parse(serialized, (key, value) => {
                // Revive Maps
                if (typeof value === 'object' && value !== null && value.dataType === 'Map') {
                    return new Map(value.value);
                }
                return value;
            }) as GameState;

            // Post-load validation / migration
            if (!state.agents) state.agents = [];
            if (!state.jobs) state.jobs = [];
            if (!state.pendingEffects) state.pendingEffects = [];
            if (!state.commandQueue) state.commandQueue = [];

            // MIGRATION: Unlock all tiles and set explored (removes old area restrictions)
            if (state.grid) {
                for (const tile of state.grid) {
                    tile.locked = false;
                    tile.explored = true;
                }
            }

            return state;
        } catch (e) {
            console.error('[PersistenceManager] Failed to revive state:', e);
            return null;
        }
    }

    public hasSave(): boolean {
        return !!localStorage.getItem(this.STORAGE_KEY);
    }

    public clearSave(): void {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('[PersistenceManager] Save cleared.');
    }
}
