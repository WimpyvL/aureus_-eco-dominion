/**
 * StateManager
 * The engine's authoritative game state container.
 * React subscribes to changes; engine systems mutate directly.
 */

import {
    GameState, BuildingType, Agent, GridTile, GameStep,
    SfxType, GameCommand, Era
} from '../../types';
import { generateInitialGrid, GRID_SIZE } from '../utils/GameUtils';
import { INITIAL_RESOURCES } from '../data/VoxelConstants';

export type StateListener = (state: GameState) => void;

export class StateManager {
    private state: GameState;
    private listeners: Set<StateListener> = new Set();
    private dirtyFlag = false;
    private dirtyKeys = new Set<keyof GameState>();

    constructor(initialState?: Partial<GameState>) {
        this.state = this.createInitialState(initialState);
    }

    private createInitialState(overrides?: Partial<GameState>): GameState {
        const grid = generateInitialGrid();

        return {
            grid,
            agents: this.createInitialAgents(),
            jobs: [],
            commandQueue: [],

            resources: {
                agt: 5000,
                minerals: 0,
                gems: INITIAL_RESOURCES.gems,
                eco: INITIAL_RESOURCES.eco,
                trust: INITIAL_RESOURCES.trust,
                income: 0,
                maintenance: 0,
            },

            selectedBuilding: null,
            selectedAgentId: null,
            interactionMode: 'BUILD',
            viewMode: 'SURFACE',
            step: GameStep.INTRO,
            gameOver: false,
            debugMode: false,
            cheatsEnabled: true, // DEV: Creative mode disabled
            tickCount: 0,

            market: {
                minerals: {
                    basePrice: 10,
                    currentPrice: 10,
                    trend: 'STABLE',
                    history: [10],
                    volatility: 0.1
                },
                gems: {
                    basePrice: 50,
                    currentPrice: 50,
                    trend: 'STABLE',
                    history: [50],
                    volatility: 0.05
                },
                eventDuration: 0,
            },

            logistics: {
                autoSell: false,
                sellThreshold: 100,
            },

            weather: {
                current: 'CLEAR',
                timeLeft: 300,
                intensity: 0,
            },

            activeEvents: [],
            newsFeed: [],
            activeGoal: null,

            inventory: {},

            research: {
                unlocked: [],
            },

            contracts: [],

            pendingEffects: [],

            experiments: {
                BIOLUMINESCENCE: true,
                GREEDY_MESHING_V2: false,
                HIERARCHICAL_PATHFINDING: false,
                SHARED_BUFFER_TRANSFER: false,
            },

            dayNightCycle: {
                timeOfDay: 6000,
                dayCount: 1,
                isDaytime: true,
            },

            agentRequests: [],

            currentEra: Era.SETTLEMENT,
            unlockedEras: [Era.SETTLEMENT],

            powerGrid: {
                totalProduced: 0,
                totalConsumed: 0,
                deficit: 0,
            },

            waterNetwork: {
                totalProduced: 0,
                totalConsumed: 0,
                deficit: 0,
            },

            ...overrides,
        } as GameState;
    }

    private createInitialAgents(): Agent[] {
        const center = Math.floor(GRID_SIZE / 2);
        const names = ['Marcus', 'Elena', 'Kofi'];

        return names.map((name, i): Agent => ({
            id: `agent_${i}`,
            name,
            type: 'WORKER',
            x: center + (i - 1),
            z: center,
            visualX: center + (i - 1),
            visualZ: center,
            state: 'IDLE',
            energy: 80 + Math.random() * 20,
            hunger: 80 + Math.random() * 20,
            mood: 80 + Math.random() * 20,
            skills: {
                mining: 1,
                construction: 1,
                plants: 1,
                intelligence: 1,
            },
            currentJobId: null,
            targetTileId: null,
            path: null,
        }));
    }

    // --- State Access ---
    getDirtyKeys(): Set<keyof GameState> {
        return this.dirtyKeys;
    }

    getState(): GameState {
        return this.state;
    }

    // --- State Mutation (Engine Systems use these) ---

    mutate<K extends keyof GameState>(key: K, value: GameState[K]): void {
        this.state[key] = value;
        this.dirtyFlag = true;
        this.dirtyKeys.add(key);
    }

    update(partial: Partial<GameState>): void {
        Object.assign(this.state, partial);
        this.dirtyFlag = true;
        for (const key in partial) {
            this.dirtyKeys.add(key as keyof GameState);
        }
    }

    getMutableState(): GameState {
        this.dirtyFlag = true;
        // Mark grid as dirty since most mutations affect the grid
        this.dirtyKeys.add('grid');
        return this.state;
    }

    // --- Subscription ---

    subscribe(listener: StateListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notifyIfDirty(): void {
        if (this.dirtyFlag) {
            this.dirtyFlag = false;
            const snapshot = { ...this.state };
            this.listeners.forEach(listener => listener(snapshot));
            this.dirtyKeys.clear();
        }
    }

    forceNotify(): void {
        const snapshot = { ...this.state };
        this.listeners.forEach(listener => listener(snapshot));
        this.dirtyKeys.clear();
    }

    // --- Save/Load ---

    loadState(saved: Partial<GameState>): void {
        this.state = { ...this.createInitialState(), ...saved };
        this.forceNotify();
    }

    serializeState(): string {
        return JSON.stringify(this.state);
    }

    // --- Helpers ---

    pushCommand(type: GameCommand['type'], payload: any): void {
        this.state.commandQueue.push({
            id: `cmd_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            type,
            payload
        });
        this.dirtyFlag = true;
        this.dirtyKeys.add('commandQueue');
    }

    pushEffect(effect: any): void {
        this.state.pendingEffects.push(effect);
        this.dirtyFlag = true;
        this.dirtyKeys.add('pendingEffects');
    }

    incrementTick(): void {
        this.state.tickCount++;
        this.dirtyFlag = true;
        this.dirtyKeys.add('tickCount');
    }
}
