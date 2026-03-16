/**
 * StateManager
 * The engine's authoritative game state container.
 * React subscribes to changes; engine systems mutate directly.
 */

import {
    GameState, BuildingType, Agent, GridTile, GameStep,
    SfxType, GameCommand, Era, Chunk
} from '../../types';
import { INITIAL_RESOURCES } from '../data/VoxelConstants';
import { ChunkStore } from '../space/ChunkStore';
import { CHUNK_SIZE } from '../space/ChunkStore';
import { worldToChunk } from '../utils/coords';

import { Random } from '../kernel/Random';
import { INITIAL_NPCS, INITIAL_PERMITS } from '../data/bureaucracy';

export type StateListener = (state: GameState) => void;

export class StateManager {
    private state: GameState;
    private listeners: Set<StateListener> = new Set();
    private dirtyFlag = false;
    private dirtyKeys = new Set<keyof GameState>();
    private mutableContext: "simTick" | "none" = "none";
    private random: Random;

    constructor(initialState?: Partial<GameState>) {
        this.state = this.createInitialState(initialState);
        this.random = new Random(this.state.seed);
    }

    private createInitialState(overrides?: Partial<GameState>): GameState {
        const chunks: Record<string, Chunk> = {};
        const seed = overrides?.seed || Math.floor(Math.random() * 1000000);

        // Derive a random spawn offset from the seed
        // This gives each new game a unique starting position in the world
        const spawnX = overrides?.spawnX ?? Math.floor(Math.sin(seed * 0.7123) * 200);
        const spawnZ = overrides?.spawnZ ?? Math.floor(Math.cos(seed * 0.3456) * 200);

        // Generate initial chunks around the spawn location (3x3 area)
        // This ensures agents have enough space to wander without hitting unloaded boundary immediately
        const { cx: spawnCX, cz: spawnCZ } = worldToChunk(spawnX, spawnZ, CHUNK_SIZE);
        for (let dz = -1; dz <= 1; dz++) {
            for (let dx = -1; dx <= 1; dx++) {
                ChunkStore.ensureChunk(chunks, spawnCX + dx, spawnCZ + dz, seed);
            }
        }

        return {
            chunks,
            agents: this.createInitialAgents(spawnX, spawnZ),
            jobs: [],
            commandQueue: [],

            resources: {
                agt: 5000,
                minerals: 0,
                gems: INITIAL_RESOURCES.gems,
                wood: INITIAL_RESOURCES.wood,
                stone: INITIAL_RESOURCES.stone,
                eco: INITIAL_RESOURCES.eco,
                trust: INITIAL_RESOURCES.trust,
                income: 0,
                maintenance: 0,
                maxCapacity: 1000,
            },

            selectedBuilding: null,
            selectedAgentId: null,
            interactionMode: 'INSPECT',

            step: GameStep.INTRO,

            activeView: 'SURFACE',
            isFPS: false,
            dungeon: {
                unlocked: false,
                miners: [],
                buildings: [],
                gold: 0,
                gems: 0,
                mana: 0,
                logs: [],
                voxelData: null,
                revealedData: null,
                gridSize: { x: 32, y: 8, z: 32 }
            },

            gameOver: false,
            debugMode: false,
            cheatsEnabled: false, // DEV: Creative mode disabled
            tickCount: 0,
            idCounter: 0,
            seed: overrides?.seed || Math.floor(Math.random() * 1000000),
            spawnX,
            spawnZ,

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
                wood: {
                    basePrice: 5,
                    currentPrice: 5,
                    trend: 'STABLE',
                    history: [5],
                    volatility: 0.08
                },
                stone: {
                    basePrice: 8,
                    currentPrice: 8,
                    trend: 'STABLE',
                    history: [8],
                    volatility: 0.06
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
            eraUnlockedPopup: null,

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

            bureaucracy: {
                permits: { ...INITIAL_PERMITS },
                npcs: { ...INITIAL_NPCS },
                knownNpcIds: ['licensing', 'union'],
                dirtItems: [],
                activeNPCId: null,
                activePermitId: null,
                activeMiniGame: null,
                pendingPermitAction: null,
                tutorialStep: 0,
                activeDialogue: null,
                dialogueTree: null
            },

            // View Transition Loading
            isLoading: false,
            loadingMessage: '',

            // Command Pipeline
            debug: {
                commandTrace: []
            },
            ui: {
                lastCommandResult: null
            },

            ...overrides,
        } as GameState;
    }

    private createInitialAgents(spawnX: number, spawnZ: number): Agent[] {
        const names = ['Marcus', 'Elena', 'Kofi'];

        return names.map((name, i): Agent => ({
            id: `agent_${i}`,
            name,
            type: 'WORKER',
            x: spawnX + (i - 1),
            z: spawnZ,
            visualX: spawnX + (i - 1),
            visualZ: spawnZ,
            layer: 0,
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
            targetX: null,
            targetZ: null,
            path: null,

            inventory: { type: null, amount: 0, capacity: 10 }
        }));
    }

    // --- Determinism Helpers ---

    getNextId(prefix: string): string {
        const id = `${prefix}_${this.state.idCounter++}`;
        this.dirtyFlag = true;
        this.dirtyKeys.add('idCounter');
        return id;
    }

    getRandom(): Random {
        return this.random;
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



    setMutableContext(context: "simTick" | "none"): void {
        this.mutableContext = context;
    }

    private assertMutableContext(target: "simTick"): void {
        if (this.mutableContext !== target && !this.state.debugMode) {
            throw new Error(`CRITICAL: Mutable state accessed outside of ${target} context. Current context: ${this.mutableContext}`);
        }
    }

    getMutableState(): GameState {
        this.assertMutableContext("simTick");
        this.dirtyFlag = true;
        // Mark chunks as dirty since most mutations affect the world state
        this.dirtyKeys.add('chunks');
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

            // Shallow clone for React notification. 
            // Deep freezing 10k items per frame (in dev) is too expensive (1 FPS).
            const snapshot = { ...this.state };

            this.listeners.forEach(listener => listener(snapshot));
            this.dirtyKeys.clear();
        }
    }

    private deepFreeze(obj: any): any {
        if (obj === null || typeof obj !== 'object') return obj;

        // Don't freeze Three.js objects or other complex types if we encounter them
        // For game state, we mostly have grids, agents, resources which are plain objects/arrays
        Object.freeze(obj);

        Object.getOwnPropertyNames(obj).forEach(prop => {
            const value = obj[prop];
            if (value !== null &&
                (typeof value === 'object' || typeof value === 'function') &&
                !Object.isFrozen(value)) {
                this.deepFreeze(value);
            }
        });

        return obj;
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
            id: this.getNextId('cmd'),
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
