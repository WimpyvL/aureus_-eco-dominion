/**
 * Persistence Manager
 * Handles saving and loading the game state to localStorage.
 * Manages serialization of complex objects like Maps.
 */

import { GameState, Agent, GridTile, BuildingType } from '../../types';
import { DEFAULT_VIEW_RADIUS } from '../utils/GameUtils';

export class PersistenceManager {
    private readonly STORAGE_KEY = 'aureus_save_v2';

    /**
     * Serializes and saves the current game state
     */
    public saveGame(state: GameState): boolean {
        try {
            const serialized = JSON.stringify(state, (key, value) => {
                // Prune non-essential chunk data to save space
                if (key === 'chunks' && value && typeof value === 'object') {
                    const prunedChunks: Record<string, any> = {};
                    for (const [chunkKey, chunk] of Object.entries(value)) {
                        const c = chunk as any;
                        prunedChunks[chunkKey] = {
                            tiles: c.tiles.map((tile: GridTile) => {
                                const pruned: any = {
                                    id: tile.id,
                                    x: tile.x,
                                    z: tile.z,
                                    biome: tile.biome
                                };

                                if (tile.buildingType && tile.buildingType !== 'EMPTY') pruned.buildingType = tile.buildingType;
                                if (tile.level && tile.level > 1) pruned.level = tile.level;
                                if (tile.foliage && tile.foliage !== 'NONE') pruned.foliage = tile.foliage;
                                if (tile.terrainHeight !== 0 && tile.terrainHeight !== undefined) pruned.terrainHeight = tile.terrainHeight;
                                if (tile.isUnderConstruction) pruned.isUnderConstruction = tile.isUnderConstruction;
                                if (tile.markedForHarvest) pruned.markedForHarvest = tile.markedForHarvest;
                                if (tile.underground) pruned.underground = tile.underground;
                                if (tile.digState) pruned.digState = tile.digState;
                                if (tile.structureHeadX !== undefined) pruned.structureHeadX = tile.structureHeadX;
                                if (tile.structureHeadZ !== undefined) pruned.structureHeadZ = tile.structureHeadZ;
                                if (tile.explored) pruned.explored = tile.explored;
                                if (tile.locked) pruned.locked = tile.locked;

                                return pruned;
                            })
                        };
                    }
                    return prunedChunks;
                }

                // Exclude large transient objects if any
                if (key === 'pendingEffects') return [];
                if (key === 'commandQueue') return [];

                return value;
            });

            localStorage.setItem(this.STORAGE_KEY, serialized);
            return true;
        } catch (e: any) {
            if (e.name === 'QuotaExceededError') {
                console.warn('[PersistenceManager] Storage quota exceeded. Game state too large for localStorage.');
            } else {
                console.error('[PersistenceManager] Failed to save game:', e);
            }
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

            // MIGRATION & REVIVAL: Ensure all tiles have required properties
            if (state.chunks) {
                for (const chunk of Object.values(state.chunks)) {
                    for (const tile of chunk.tiles) {
                        // Fill in defaults for pruned fields
                        if (tile.buildingType === undefined) tile.buildingType = BuildingType.EMPTY;
                        if (tile.level === undefined) tile.level = 1;
                        if (tile.foliage === undefined) tile.foliage = 'NONE';
                        if (tile.terrainHeight === undefined) tile.terrainHeight = 0;
                        if (tile.underground === undefined) tile.underground = {};

                        // Ensure explored and unlocked
                        tile.locked = false;
                        tile.explored = true;
                    }
                }
                console.log('[PersistenceManager] Revived and migrated chunk tiles.');
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

            // MIGRATION & REVIVAL: Ensure all tiles have required properties
            if (state.chunks) {
                for (const chunk of Object.values(state.chunks)) {
                    for (const tile of chunk.tiles) {
                        // Fill in defaults for pruned fields
                        if (tile.buildingType === undefined) tile.buildingType = BuildingType.EMPTY;
                        if (tile.level === undefined) tile.level = 1;
                        if (tile.foliage === undefined) tile.foliage = 'NONE';
                        if (tile.terrainHeight === undefined) tile.terrainHeight = 0;
                        if (tile.underground === undefined) tile.underground = {};

                        // Ensure explored and unlocked
                        tile.locked = false;
                        tile.explored = true;
                    }
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
