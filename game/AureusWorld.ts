/**
 * Aureus Game World (v2 - Engine Owned State)
 * 
 * The engine now owns ALL game state. React is a pure view layer.
 * - State lives in StateManager
 * - React subscribes via useEngineState hook
 * - UI actions call world methods directly
 * 
 * (|/) Klaasvaakie
 */

import { BaseWorld } from '../engine/world';
import { FrameContext, FixedContext } from '../engine/kernel';
import * as THREE from 'three';
import { StreamingManager } from '../engine/space';
import { JobSystem, MeshChunkResult, PathfindResult, WorkerPool } from '../engine/jobs';
import { ThreeRenderAdapter } from '../engine/render';
import { Simulation } from '../engine/sim';
import {
    AgentSystem, JobGenerationSystem, EnvironmentSystem, EconomySystem,
    ColonySystem, LogisticsSystem, EventSystem, MissionSystem,
    ProductionSystem, ConstructionSystem, EraSystem,
    PowerGridSystem, WaterNetworkSystem,
    TutorialDemoSystem, CommandDispatcher,
    ResearchSystem, EmploymentSystem, BureaucracySystem, AmbientNPCSystem
} from '../engine/sim/systems';
import { DungeonMinerSystem } from '../engine/sim/systems/DungeonMinerSystem';
import { DungeonStabilitySystem } from '../engine/sim/systems/DungeonStabilitySystem';
import { PersistenceManager } from '../engine/sim/PersistenceManager';
import { DungeonEngine } from '../engine/dungeon/DungeonEngine';

import { GameState, GameStep, Agent, GridTile, BuildingType, SfxType, TechId, Chunk, Action } from '../types';
import { getEcoMultiplier, isHarvestable } from '../engine/utils/GameUtils';
import { BUILDINGS, TECHNOLOGIES } from '../engine/data/VoxelConstants';
import { getBiomeAt } from '../engine/worldgen/Core';
import { TerrainRenderSystem } from './render/systems/TerrainRenderSystem';
import { waterFlowMaterial, oilWaterMaterial, reservoirWaterMaterial } from '../engine/render/materials/VoxelMaterials';
import { FoliageRenderSystem } from './render/systems/FoliageRenderSystem';
import { BuildingRenderSystem } from './render/systems/BuildingRenderSystem';
import { AgentRenderSystem } from './render/systems/AgentRenderSystem';
import { EnvironmentRenderSystem } from './render/systems/EnvironmentRenderSystem';
import { DungeonRenderSystem } from './render/systems/DungeonRenderSystem';
import { IsoCameraSystem } from './render/IsoCameraSystem';
import { DungeonCameraSystem } from './render/DungeonCameraSystem';
import { FPSCameraSystem } from './render/FPSCameraSystem';
import { DungeonInputHandler } from './dungeon/DungeonInputHandler';
import { InputSystem } from '../engine/input/InputSystem';
import { StateManager, StateListener } from '../engine/state/StateManager';
import {
    EconomyManager, BuildingManager, ResearchManager,
    AgentManager
} from './world';
import { ChunkStore } from '../engine/space/ChunkStore';
import { worldToChunk, worldToLocal, CHUNK_SIZE } from '../engine/utils/coords';
import { confirmMobilePlacement } from './mobilePlacement';


export interface AureusWorldConfig {
    container: HTMLElement;
    onTileClick?: (x: number, z: number, isTouch?: boolean) => void;
    onTileRightClick?: (x: number, z: number, isTouch?: boolean) => void;
    onAgentClick?: (agentId: string | null) => void;
    onTileHover?: (x: number | null, z: number | null) => void;
    onSfx?: (type: SfxType) => void;
}

export class AureusWorld extends BaseWorld {
    readonly id = 'aureus-main';

    // Core Engine Systems
    private render: ThreeRenderAdapter;
    private inputSystem: InputSystem | null = null;
    private streamMgr: StreamingManager;
    private jobs: JobSystem;
    private workerPool: WorkerPool;
    private sim: Simulation;
    private stateManager: StateManager;

    // Simulation Systems
    private agentSystem: AgentSystem;
    private constructionSystem: ConstructionSystem;
    private commandDispatcher: CommandDispatcher;

    // Render Systems
    private agentRenderSystem: AgentRenderSystem;
    private terrainRenderSystem: TerrainRenderSystem;
    private foliageRenderSystem: FoliageRenderSystem;
    private buildingRenderSystem: BuildingRenderSystem;
    private environmentRenderSystem: EnvironmentRenderSystem;
    protected cameraSystem!: IsoCameraSystem;
    protected dungeonCameraSystem!: DungeonCameraSystem;
    protected fpsCameraSystem!: FPSCameraSystem;
    private dungeonRenderSystem: DungeonRenderSystem;
    private dungeonInputHandler: DungeonInputHandler;

    private persistenceManager: PersistenceManager;

    // World Management Systems
    private economyManager: EconomyManager;
    private buildingManager: BuildingManager;
    private researchManager: ResearchManager;
    private agentManager: AgentManager;

    // Terrain height callback (used by agents and input)
    private getTerrainHeight: (worldX: number, worldZ: number) => number;

    // Game State
    private gamePaused = false;
    private config: AureusWorldConfig | null = null;

    // Auto-save system
    private autoSaveInterval: ReturnType<typeof setInterval> | null = null;
    private visibilityHandler: (() => void) | null = null;
    private readonly AUTO_SAVE_INTERVAL_MS = 60000; // Save every 60 seconds

    constructor(render: ThreeRenderAdapter) {
        super();
        this.render = render;

        // Initialize State Manager (Engine owns state)
        this.stateManager = new StateManager();
        this.persistenceManager = new PersistenceManager();

        // Initialize engine subsystems
        this.streamMgr = new StreamingManager({
            viewRadiusH: 12, // Increased from 6
            viewRadiusV: 2,
            maxLoadsPerFrame: 8, // Increased from 4
            maxUnloadsPerFrame: 16,
        });

        this.jobs = new JobSystem();
        this.workerPool = new WorkerPool();
        this.sim = new Simulation();

        // Simulation Systems
        this.commandDispatcher = new CommandDispatcher();
        this.sim.addSystem(this.commandDispatcher);

        this.constructionSystem = new ConstructionSystem();
        this.sim.addSystem(this.constructionSystem);
        this.sim.addSystem(new JobGenerationSystem());
        this.sim.addSystem(new EnvironmentSystem());

        const econ = new EconomySystem();
        this.sim.addSystem(econ);

        this.sim.addSystem(new ColonySystem());
        this.sim.addSystem(new LogisticsSystem());
        this.sim.addSystem(new EventSystem());
        this.sim.addSystem(new MissionSystem());
        this.sim.addSystem(new PowerGridSystem());
        this.sim.addSystem(new WaterNetworkSystem());
        this.sim.addSystem(new ProductionSystem());
        this.sim.addSystem(new EraSystem());
        const tutorialDemo = new TutorialDemoSystem();
        this.sim.addSystem(tutorialDemo);

        this.sim.addSystem(new DungeonMinerSystem());
        this.sim.addSystem(new DungeonStabilitySystem());
        const bureaucracySystem = new BureaucracySystem();
        this.sim.addSystem(bureaucracySystem);



        this.sim.addSystem(new EmploymentSystem());
        this.agentSystem = new AgentSystem(this.jobs, this.constructionSystem);
        this.sim.addSystem(this.agentSystem);

        this.sim.addSystem(new AmbientNPCSystem());

        const researchSystem = new ResearchSystem();
        this.sim.addSystem(researchSystem);

        // Register systems to dispatcher for command order
        // Only systems that implement handleCommand need to be registered here
        this.commandDispatcher.setSystems([
            econ,
            this.constructionSystem,
            this.agentSystem,
            researchSystem,
            tutorialDemo,
            bureaucracySystem
        ]);

        // Render Systems
        const getHeight = (worldX: number, worldZ: number) => {
            const state = this.stateManager.getState();
            const chunks = state.chunks;
            const tile = ChunkStore.getTile(chunks, Math.round(worldX), Math.round(worldZ));
            if (tile) return tile.terrainHeight * 0.5;

            // Fallback for distant/unloaded regions
            const biomeData = getBiomeAt(Math.round(worldX), Math.round(worldZ));
            return biomeData.height * 0.5;
        };

        this.agentRenderSystem = new AgentRenderSystem(
            this.render.getScene(),
            getHeight
        );

        // Store reference for later use with InputSystem
        this.getTerrainHeight = getHeight;

        this.terrainRenderSystem = new TerrainRenderSystem(
            this.render.getScene(),
            this.jobs
        );

        this.foliageRenderSystem = new FoliageRenderSystem(this.render.getScene());
        this.buildingRenderSystem = new BuildingRenderSystem(this.render.getScene());
        this.environmentRenderSystem = new EnvironmentRenderSystem(this.render);
        this.dungeonRenderSystem = new DungeonRenderSystem(this.render.getScene());
        this.cameraSystem = new IsoCameraSystem(this.render);
        this.dungeonCameraSystem = new DungeonCameraSystem(this.render);
        this.fpsCameraSystem = new FPSCameraSystem(this.render);
        this.fpsCameraSystem.setOnExit(() => this.dispatch({ type: 'EXIT_FPS' } as any));
        this.dungeonInputHandler = new DungeonInputHandler(this.stateManager, this.render.getScene());

        // Wire Terrain -> Foliage
        this.terrainRenderSystem.onFoliageUpdate = (key: string, items: any[]) => {
            this.foliageRenderSystem.updateChunk(key, items);
        };
        this.terrainRenderSystem.onChunkDispose = (key: string) => {
            this.foliageRenderSystem.removeChunk(key);
        };

        // Enable camera by default (no legacy mode)
        this.cameraSystem.setEnabled(true);

        // Jump camera to the randomized spawn location
        const state = this.stateManager.getState();
        this.cameraSystem.jumpTo(state.spawnX, state.spawnZ);

        // Initialize World Managers (Must happen after Render Systems)
        this.economyManager = new EconomyManager(this.stateManager);
        this.buildingManager = new BuildingManager(this.stateManager, this.buildingRenderSystem);
        this.researchManager = new ResearchManager(this.stateManager);
        this.researchManager = new ResearchManager(this.stateManager);
        this.agentManager = new AgentManager(this.stateManager, this.cameraSystem);
    }



    // ═══════════════════════════════════════════════════════════════
    // STATE ACCESS (React subscribes here)
    // ═══════════════════════════════════════════════════════════════

    getState(): GameState {
        return this.stateManager.getState();
    }

    subscribeToState(listener: StateListener): () => void {
        return this.stateManager.subscribe(listener);
    }

    // ═══════════════════════════════════════════════════════════════
    // GAME ACTIONS (UI calls these)
    // ═══════════════════════════════════════════════════════════════

    placeBuilding(x: number, z: number, type?: string): void {
        const state = this.stateManager.getState();
        const buildingType = (type || state.selectedBuilding) as BuildingType;

        console.log('[placeBuilding] Called with (x, z):', x, z, 'buildingType:', buildingType);

        if (!buildingType) {
            console.warn('[placeBuilding] No buildingType, returning');
            return;
        }

        const def = BUILDINGS[buildingType];
        if (!def) {
            console.warn('[placeBuilding] No def for buildingType, returning');
            return;
        }

        // Place via ConstructionSystem
        this.stateManager.pushCommand('PLACE_BUILDING', { x, z, buildingType });

        // Audio effect
        this.stateManager.pushEffect({ type: 'AUDIO', sfx: SfxType.BUILD });
    }

    bulldozeTile(x: number, z: number): void {
        const state = this.stateManager.getState();
        const chunks = state.chunks;
        const tile = ChunkStore.getTile(chunks, x, z);
        if (!tile) return;

        this.stateManager.pushCommand('BULLDOZE', { x, z });

        this.stateManager.pushEffect({ type: 'AUDIO', sfx: SfxType.BUILD });
    }

    selectBuilding(type: string | null): void {
        this.buildingRenderSystem.setGhostBuilding(type as BuildingType | null);

        // CRITICAL: Set interaction mode to BUILD when selecting a building
        // This was the missing link causing buildings not to be placed!
        if (type) {
            this.stateManager.update({
                selectedBuilding: type as BuildingType,
                interactionMode: 'BUILD'
            });
        } else {
            // When deselecting, revert to INSPECT
            this.stateManager.update({
                selectedBuilding: null,
                selectedAgentId: null,
                interactionMode: 'INSPECT'
            });
        }
    }

    pinBuildingForConfirmation(x: number, z: number): void {
        const state = this.stateManager.getState();
        const tile = ChunkStore.getTile(state.chunks, x, z);
        const surfaceY = tile ? tile.terrainHeight * 0.5 : 0;
        let y = surfaceY;

        // Pin the ghost building at this location for mobile confirmation
        this.buildingRenderSystem.setPinnedGhost({ x, z }, y);
    }

    clearPinnedBuilding(): void {
        // Clear the pinned ghost (user cancelled)
        this.buildingRenderSystem.setPinnedGhost(null);
    }

    confirmMobileBuildingPlacement(index: number): boolean {
        return confirmMobilePlacement(
            () => false,
            () => this.clearPinnedBuilding(),
            index
        );
    }

    selectAgent(id: string | null): void {
        this.stateManager.update({ selectedAgentId: id });
    }

    commandAgent(agentId: string, x: number, z: number): void {
        this.stateManager.pushCommand('COMMAND_AGENT', { agentId, x, z });
    }

    setInteractionMode(mode: 'BUILD' | 'BULLDOZE' | 'INSPECT'): void {
        this.stateManager.update({ interactionMode: mode });
        this.buildingRenderSystem.setCursorMode(mode);
    }

    sellResource(resource: 'minerals' | 'gems' | 'wood' | 'stone'): void {
        this.economyManager.sellResource(resource);
    }

    sellMinerals(): void { this.economyManager.sellMinerals(); }
    sellGems(address?: string): void { this.economyManager.sellGems(address); }
    sellWood(): void { this.economyManager.sellWood(); }
    sellStone(): void { this.economyManager.sellStone(); }

    buyResource(resource: 'minerals' | 'gems' | 'wood' | 'stone', amount: number): void {
        this.economyManager.buyResource(resource, amount);
    }

    buyBuilding(buildingType: string, cost: number): void {
        this.economyManager.buyBuilding(buildingType, cost);
    }

    setAutoSell(enabled: boolean, threshold: number): void {
        this.economyManager.setAutoSell(enabled, threshold);
    }

    upgradeBuilding(x: number, z: number): void {
        this.buildingManager.upgradeBuilding(x, z);
    }

    researchTech(techId: string): void {
        this.stateManager.pushCommand('RESEARCH_TECH', { techId });
    }

    toggleDebug(): void {
        const state = this.stateManager.getState();
        this.stateManager.mutate('debugMode', !state.debugMode);
        this.stateManager.notifyIfDirty();
    }

    toggleCheats(): void {
        const state = this.stateManager.getState();
        this.stateManager.mutate('cheatsEnabled', !state.cheatsEnabled);
        this.stateManager.notifyIfDirty();
    }

    speedUpConstruction(x: number, z: number): void {
        this.buildingManager.speedUpConstruction(x, z);
    }

    zoomToAgent(agentId: string): void {
        const state = this.stateManager.getState();
        const agent = state.agents.find(a => a.id === agentId);
        if (!agent) return;

        this.cameraSystem.zoomToPosition(agent.x, agent.z, 2);
    }

    enterFPS(agentId: string): void {
        this.selectAgent(agentId);
        this.fpsCameraSystem.attachTo(agentId);

        // Hide UI or notify UI of FPV mode if needed via state
        this.stateManager.update({
            interactionMode: 'INSPECT',
            isFPS: true
        });
    }

    exitFPS(): void {
        const state = this.stateManager.getState();
        if (state.selectedAgentId) {
            const agent = state.agents.find(a => a.id === state.selectedAgentId);
            if (agent) {
                if (agent.state === 'MANUAL') {
                    agent.state = 'IDLE';
                }
                // Focus camera back onto the agent
                this.cameraSystem.jumpTo(agent.x, agent.z);
            }
        }
        this.stateManager.markDirty('agents');
        this.fpsCameraSystem.setEnabled(false);
        this.stateManager.update({ isFPS: false });
    }

    /**
     * Dismiss the era unlocked popup
     */
    dismissEraPopup(): void {
        this.stateManager.pushCommand('DISMISS_POPUP', {});
    }


    acceptContract(contractId: string): void {
        // Contracts use amount field, not status
        console.log(`[AureusWorld] Accept contract: ${contractId}`);
    }

    advanceTutorial(): void {
        this.stateManager.pushCommand('ADVANCE_TUTORIAL', {});
    }

    startDemo(): void {
        this.stateManager.pushCommand('START_DEMO', {});
        this.setGamePaused(false);
    }

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

    rehabilitateTile(x: number, z: number): void {
        this.stateManager.pushCommand('REHABILITATE', { x, z });
    }

    saveGame(): void {
        const state = this.stateManager.getState();
        const success = this.persistenceManager.saveGame(state);

        if (success) {
            state.newsFeed.unshift({
                id: `save_${Date.now()}`,
                headline: "Game Progress Saved.",
                type: 'POSITIVE',
                timestamp: Date.now()
            });
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_COIN });
        } else {
            state.newsFeed.unshift({
                id: `save_err_${Date.now()}`,
                headline: "Save Failed!",
                type: 'CRITICAL',
                timestamp: Date.now()
            });
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ERROR });
        }
    }

    loadGame(data?: string): void {
        const loadedState = data ? this.persistenceManager.reviveState(data) : this.persistenceManager.loadGame();
        if (loadedState) {
            this.stateManager.loadState(loadedState);
            this.workerPool.broadcast({ type: 'SYNC_CHUNKS', payload: loadedState.chunks });

            // Re-sync visual systems
            this.terrainRenderSystem.syncGrid(Object.values(loadedState.chunks).flatMap(c => (c as any).tiles));

            console.log('[AureusWorld] Game Loaded.');
        } else {
            console.warn('[AureusWorld] No save file found.');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ENGINE LIFECYCLE
    // ═══════════════════════════════════════════════════════════════

    configure(config: AureusWorldConfig): void {
        this.config = config;

        this.inputSystem = new InputSystem(this.render, this.getTerrainHeight);

        this.inputSystem.onTileClick = (x, z, isTouch, clientX, clientY) => {
            this.handleSurfaceInteraction(x, z, 'click', isTouch, clientX, clientY);
        };

        this.inputSystem.onTileRightClick = (x, z, isTouch, clientX, clientY) => {
            this.handleSurfaceInteraction(x, z, 'right-click', isTouch, clientX, clientY);
        };

        this.inputSystem.onTileHover = (x, z, clientX, clientY) => {
            this.handleSurfaceInteraction(x || 0, z || 0, 'hover', false, clientX, clientY);
            if (this.config?.onTileHover) this.config.onTileHover(x, z);
        };

        this.fpsCameraSystem.onLeftClick = () => {
            const hit = this.getFPSIntersection();
            if (hit) this.handleSurfaceInteraction(hit.x, hit.z, 'click');
        };

        this.fpsCameraSystem.onRightClick = () => {
            const hit = this.getFPSIntersection();
            if (hit) this.handleSurfaceInteraction(hit.x, hit.z, 'right-click');
        };

        this.inputSystem.init();
    }

    private getFPSIntersection(): { x: number, z: number } | null {
        const camera = this.render.getPerspectiveCamera();
        const raycaster = new THREE.Raycaster();
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        raycaster.set(camera.position, direction);

        const target = new THREE.Vector3();
        let currentPlaneHeight = 0;

        for (let iter = 0; iter < 4; iter++) {
            const iterPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -currentPlaneHeight);
            const hit = raycaster.ray.intersectPlane(iterPlane, target);
            if (!hit) return null;
            const terrainHeight = this.getTerrainHeight(hit.x, hit.z);
            if (Math.abs(terrainHeight - currentPlaneHeight) < 0.1) {
                return { x: Math.round(hit.x), z: Math.round(hit.z) };
            }
            currentPlaneHeight = terrainHeight;
        }

        return { x: Math.round(target.x), z: Math.round(target.z) };
    }

    protected async onInit(): Promise<void> {
        console.log('[AureusWorld] Initializing...');

        this.workerPool.init();
        this.sim.init();

        // Sync initial grid to worker
        const state = this.stateManager.getState();


        // Initial sync of all currently loaded chunks
        this.workerPool.broadcast({ type: 'SYNC_CHUNKS', payload: state.chunks });
        this.terrainRenderSystem.syncGrid(Object.values(state.chunks).flatMap(c => (c as any).tiles));
        this.buildingRenderSystem.update(0, 0, state.chunks, new Set(), 'SURFACE', this.cameraSystem.cameraZoom);
        if (state.agents.length > 0) {
            const firstAgent = state.agents[0];
            this.cameraSystem.zoomToPosition(firstAgent.x, firstAgent.z, 2);
            console.log(`[AureusWorld] Camera focused on agent "${firstAgent.name}" at (${firstAgent.x}, ${firstAgent.z})`);
        }

        console.log('[AureusWorld] Ready');

        // Setup auto-save system
        this.setupAutoSave();
    }

    protected async onTeardown(): Promise<void> {
        console.log('[AureusWorld] Tearing down...');

        // Cleanup auto-save
        this.cleanupAutoSave();

        // Save game on exit
        this.saveGameQuiet();

        this.sim.dispose();
        this.workerPool.dispose();
        this.jobs.clear();
        this.inputSystem?.dispose();
    }

    /**
     * Setup automatic game saving
     */
    private setupAutoSave(): void {
        // Periodic auto-save
        this.autoSaveInterval = setInterval(() => {
            this.saveGameQuiet();
        }, this.AUTO_SAVE_INTERVAL_MS);

        // Save when tab becomes hidden or before unload
        this.visibilityHandler = () => {
            if (document.visibilityState === 'hidden') {
                this.saveGameQuiet();
            }
        };
        document.addEventListener('visibilitychange', this.visibilityHandler);

        // Save before page unload
        window.addEventListener('beforeunload', () => {
            this.saveGameQuiet();
        });

        console.log('[AureusWorld] Auto-save enabled (interval: 60s)');
    }

    /**
     * Cleanup auto-save handlers
     */
    private cleanupAutoSave(): void {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
        if (this.visibilityHandler) {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
            this.visibilityHandler = null;
        }
    }

    /**
     * Silent save without UI feedback (for auto-save)
     */
    private saveGameQuiet(): void {
        const state = this.stateManager.getState();
        const success = this.persistenceManager.saveGame(state);
        if (success) {
            console.log('[AureusWorld] Auto-saved.');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // FRAME PHASES
    // ═══════════════════════════════════════════════════════════════

    frameBegin(_ctx: FrameContext): void {
        // Input handled by InputSystem
    }

    streaming(_ctx: FrameContext): void {
        const camera = this.render.getCamera();
        const cameraChunk = {
            x: Math.floor(camera.position.x / 16),
            y: 0,
            z: Math.floor(camera.position.z / 16),
        };
        this.streamMgr.update(cameraChunk);
    }

    jobsFlush(_ctx: FrameContext): void {
        this.workerPool.dispatch(this.jobs);
        const results = this.jobs.drainResults();

        if (results.length > 0) {
            this.stateManager.setMutableContext("simTick");
            const state = this.stateManager.getMutableState();

            for (const result of results) {
                if (result.kind === 'MESH_CHUNK' && result.success) {
                    this.terrainRenderSystem.processResults([result as MeshChunkResult]);
                } else if (result.kind === 'PATHFIND') {
                    this.agentSystem.receiveJobResult(result as PathfindResult, state);
                }
            }
            this.stateManager.setMutableContext("none");
        }
    }

    /**
     * CORE SIMULATION TICK
     * Called by the host at a fixed frequency (e.g. 30Hz).
     * Handles all non-visual game logic: AI, Economy, Production.
     */
    simulation(ctx: FixedContext): void {
        if (this.gamePaused) return;

        // Populate context with deterministic utilities
        ctx.random = this.stateManager.getRandom();
        ctx.getNextId = (prefix) => this.stateManager.getNextId(prefix);

        this.stateManager.setMutableContext("simTick");
        const state = this.stateManager.getMutableState();
        if (state.step === GameStep.GAME_OVER) {
            this.stateManager.setMutableContext("none");
            return;
        }

        // Increment tick counter
        state.tickCount++;

        // FPS Movement Handling
        if (state.isFPS && state.selectedAgentId) {
            const move = this.fpsCameraSystem.getMovement();
            if (move.length() > 0) {
                const speed = 4.0;
                const dx = move.x * speed * ctx.fixedDt;
                const dz = move.z * speed * ctx.fixedDt;

                this.stateManager.pushCommand('MANUAL_MOVE_AGENT', {
                    agentId: state.selectedAgentId,
                    dx,
                    dz
                });
            }
        }

        // Run simulation systems
        this.sim.tick(ctx, state);

        this.stateManager.setMutableContext("none");
    }

    /**
     * CORE RENDERING FRAME
     * Called as fast as the browser allows (60-144 FPS).
     * Synchronizes 3D meshes and particles with the simulation state.
     */
    draw(ctx: FrameContext): void {
        const state = this.stateManager.getState();

        // 0. Update Water Animation Time
        waterFlowMaterial.uniforms.time.value = ctx.time;
        oilWaterMaterial.uniforms.time.value = ctx.time;
        reservoirWaterMaterial.uniforms.time.value = ctx.time;

        // Process and clear pending effects BEFORE render updates
        // This ensures that worker state is synced (UPDATE_CHUNK) before we potentially dispatch MESH_CHUNK jobs
        if (state.pendingEffects.length > 0) {
            state.pendingEffects.forEach(effect => {
                if (effect.type === 'AUDIO' && this.config?.onSfx) {
                    this.config.onSfx(effect.sfx);
                } else if (effect.type === 'FX') {
                    this.buildingRenderSystem.triggerEffect(effect.x, effect.z, effect.fxType, 0);
                } else if (effect.type === 'CHUNK_UPDATE') {
                    this.terrainRenderSystem.updateChunk(effect.cx, effect.cz, effect.updates);

                    // FIX: Sync chunk to worker
                    const key = `${effect.cx},${effect.cz}`;
                    const chunks = state.chunks;
                    const chunk = chunks[key];
                    if (chunk) {
                        this.workerPool.broadcast({ type: 'UPDATE_CHUNK', payload: { key, chunk } });
                    }
                }
            });
            state.pendingEffects.length = 0;
        }

        // Update render systems based on active view
        if (state.activeView === 'DUNGEON') {
            // Dungeon View
            this.dungeonRenderSystem.setVisible(true);
            this.dungeonRenderSystem.update(state.dungeon);

            // Switch to dungeon camera
            if (!this.dungeonCameraSystem.enabled) this.dungeonCameraSystem.setEnabled(true);
            if (this.cameraSystem.enabled) this.cameraSystem.setEnabled(false);
            if (this.fpsCameraSystem.enabled) this.fpsCameraSystem.setEnabled(false);

            this.dungeonInputHandler.setCamera(this.render.getCamera());
            this.dungeonInputHandler.setMeshGroup(this.dungeonRenderSystem.getMeshGroup());
            this.dungeonInputHandler.setDungeonEngine(new DungeonEngine(state.dungeon)); // Ensure it has the engine instance

        } else if (this.fpsCameraSystem.enabled) {
            // FPS View
            this.dungeonRenderSystem.setVisible(false);

            if (this.cameraSystem.enabled) this.cameraSystem.setEnabled(false);
            if (this.dungeonCameraSystem.enabled) this.dungeonCameraSystem.setEnabled(false);

            this.fpsCameraSystem.update(ctx.dt, state.agents, this.getTerrainHeight);

            this.agentRenderSystem.setSelectedAgent(state.selectedAgentId);
            const allAgents = [...state.agents, ...state.ambientNpcs];
            this.agentRenderSystem.update(ctx.dt, ctx.time, allAgents, 0.1); // Low zoom level for full detail

            this.terrainRenderSystem.update(this.render.getCamera().position, this.render.getCamera());
            this.buildingRenderSystem.update(
                ctx.dt,
                ctx.time,
                state.chunks,
                this.stateManager.getDirtyKeys(),
                'FIRST_PERSON',
                0.1,
                this.render.getRuntimeQuality().smoothDetail
            );
        } else {
            // Surface View
            this.dungeonRenderSystem.setVisible(false);

            // Switch to surface camera
            if (!this.cameraSystem.enabled) this.cameraSystem.setEnabled(true);
            if (this.dungeonCameraSystem.enabled) this.dungeonCameraSystem.setEnabled(false);
            if (this.fpsCameraSystem.enabled) this.fpsCameraSystem.setEnabled(false);

            this.cameraSystem.update(ctx.dt);
            this.agentRenderSystem.setSelectedAgent(state.selectedAgentId);
            const zoomLevel = this.cameraSystem.cameraZoom;
            const allAgents = [...state.agents, ...state.ambientNpcs];
            this.agentRenderSystem.update(ctx.dt, ctx.time, allAgents, zoomLevel);

            this.terrainRenderSystem.update(this.cameraSystem.cameraFocus, this.render.getCamera());
            this.buildingRenderSystem.update(
                ctx.dt,
                ctx.time,
                state.chunks,
                this.stateManager.getDirtyKeys(),
                'SURFACE',
                zoomLevel,
                this.render.getRuntimeQuality().smoothDetail
            );
        }

        const cursor = this.inputSystem?.getCurrentCursor() || null;
        if (cursor) {
            const gx = Math.round(cursor.x);
            const gz = Math.round(cursor.z);

            // Get height from tile if possible for precision
            const tile = ChunkStore.getTile(state.chunks, gx, gz);
            const surfaceY = tile ? tile.terrainHeight * 0.5 : 0;

            cursor.y = surfaceY;
        }

        // Disable clipping in single-layer mode
        this.render.getRenderer().localClippingEnabled = false;

        this.buildingRenderSystem.updateCursor(
            cursor,
            this.cameraSystem.getFocus()
        );

        this.environmentRenderSystem.update(
            ctx.dt,
            state.dayNightCycle?.timeOfDay || 12000,
            state.weather,
            this.cameraSystem.cameraFocus
        );

        this.render.draw(ctx);


        // Notify React of any state changes
        this.stateManager.notifyIfDirty();
    }

    frameEnd(_ctx: FrameContext): void {
        // Cleanup
    }

    // ═══════════════════════════════════════════════════════════════
    // INTERACTION STATES
    // ═══════════════════════════════════════════════════════════════

    private handleSurfaceInteraction(x: number, z: number, type: 'click' | 'right-click' | 'hover', isTouch: boolean = false, clientX?: number, clientY?: number) {
        const state = this.stateManager.getState();
        const config = this.config!;

        if (state.activeView === 'DUNGEON') {
            if (clientX !== undefined && clientY !== undefined) {
                if (type === 'click') this.dungeonInputHandler.handleClick(clientX, clientY);
                else if (type === 'hover') this.dungeonInputHandler.handleHover(clientX, clientY);
            }
            return;
        }

        if (type === 'hover') {
            config.onTileHover?.(x, z);
            return;
        }

        const chunks = state.chunks;
        const tile = ChunkStore.getTile(chunks, x, z);
        if (!tile) return;

        // Prioritize building interaction over agent selection and harvesting
        const hasBuilding = tile.buildingType !== BuildingType.EMPTY && tile.buildingType !== BuildingType.POND;

        // 1. Building Interaction (if a building exists)
        if (hasBuilding && (state.interactionMode === 'INSPECT' || (state.interactionMode === 'BUILD' && !state.selectedBuilding))) {
            this.selectAgent(null); // Deselect agent if a building is clicked
            config.onTileClick?.(x, z, isTouch); // Notify UI of tile click
            return;
        }

        // 2. Agent Selection
        const agent = state.agents.find(a => {
            const ax = Math.round(a.visualX ?? a.x);
            const az = Math.round(a.visualZ ?? a.z);
            return ax === x && az === z;
        });

        if (agent && (state.interactionMode === 'INSPECT' || (state.interactionMode === 'BUILD' && !state.selectedBuilding))) {
            this.selectAgent(agent.id);
            config.onAgentClick?.(agent.id);
            return;
        }

        // 3. Harvestable Tile Interaction
        const canHarvest = isHarvestable(tile.foliage);
        if (canHarvest && !hasBuilding && state.interactionMode !== 'BULLDOZE' && (!state.selectedBuilding || state.interactionMode !== 'BUILD')) {
            this.stateManager.pushCommand('MARK_HARVEST', { x, z });
            return;
        }

        // 4. Right-click actions
        if (type === 'right-click') {
            if (state.selectedAgentId) {
                this.stateManager.pushCommand('COMMAND_AGENT', { agentId: state.selectedAgentId, x, z });
            }
            config.onTileRightClick?.(x, z, isTouch);
            return;
        }

        // 5. Other interaction modes
        if (state.interactionMode === 'BUILD' && state.selectedBuilding) {
            config.onTileClick?.(x, z, isTouch);
        } else if (state.interactionMode === 'INSPECT' || (state.interactionMode === 'BUILD' && !state.selectedBuilding)) {
            config.onTileClick?.(x, z, isTouch);
        } else if (state.interactionMode === 'BULLDOZE') {
            this.bulldozeTile(x, z);
            config.onTileClick?.(x, z, isTouch);
        } else if (state.interactionMode === 'TEST_DESTRUCT') {
            this.stateManager.pushCommand('EXPLODE_TILE', { x, z, radius: 2.5, damage: 200 });
            config.onTileClick?.(x, z, isTouch);
        } else {
            this.selectAgent(null);
            config.onAgentClick?.(null);
            config.onTileClick?.(x, z, isTouch);
        }
    }


    // ═══════════════════════════════════════════════════════════════

    setGamePaused(paused: boolean): void {
        this.gamePaused = paused;
    }

    playIntroAnimation(onComplete: () => void): void {
        this.cameraSystem.playIntroAnimation(onComplete);
    }

    setGhostBuilding(type: BuildingType | null): void {
        this.buildingRenderSystem.setGhostBuilding(type);
    }

    /**
     * Toggle between surface and dungeon views
     */
    toggleViewMode(): void {
        const state = this.stateManager.getState();

        if (!state.dungeon.unlocked && !state.cheatsEnabled) {
            return;
        }

        if (state.activeView === 'SURFACE') {
            if (!state.cheatsEnabled && state.resources.trust < 50) {
                state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ERROR });
                state.newsFeed.push({
                    id: `dungeon_locked_${Date.now()}`,
                    headline: 'Underground access requires Trust level 50.',
                    type: 'NEGATIVE',
                    timestamp: Date.now(),
                });
                this.stateManager.markDirty('pendingEffects', 'newsFeed');
                return;
            }

            this.stateManager.mutate('activeView', 'DUNGEON');
            return;
        }

        this.stateManager.mutate('activeView', 'SURFACE');
    }

    toggleView(): void {
        this.toggleViewMode();
    }

    /**
     * Dispatch an engine action (compatibility with legacy Redux-style UI)
     */
    dispatch(action: Action): void {
        console.log(`[AureusWorld] Dispatching: ${action.type}`, (action as any).payload);

        switch (action.type) {
            case 'PLACE_BUILDING':
                this.placeBuilding(action.payload.x, action.payload.z);
                break;
            case 'BULLDOZE_TILE':
                this.bulldozeTile(action.payload.x, action.payload.z);
                break;
            case 'ACTIVATE_BULLDOZER':
                this.setInteractionMode('BULLDOZE');
                break;
            case 'UPGRADE_BUILDING':
                this.upgradeBuilding(action.payload.x, action.payload.z);
                break;
            case 'SPEED_UP_BUILDING':
                this.speedUpConstruction(action.payload.x, action.payload.z);
                break;
            case 'REHABILITATE_TILE':
                this.rehabilitateTile(action.payload.x, action.payload.z);
                break;
            case 'SELECT_BUILDING_TO_PLACE':
                this.selectBuilding(action.payload);
                break;
            case 'SELECT_AGENT':
                this.selectAgent(action.payload);
                break;
            case 'COMMAND_AGENT':
                this.commandAgent(action.payload.agentId, action.payload.x, action.payload.z);
                break;
            case 'SET_INTERACTION_MODE':
                this.setInteractionMode(action.payload as any);
                break;
            case 'SELL_MINERALS':
                this.sellMinerals();
                break;
            case 'SELL_GEMS':
                this.sellGems(action.payload.address);
                break;
            case 'SELL_WOOD':
                this.sellWood();
                break;
            case 'SELL_STONE':
                this.sellStone();
                break;
            case 'BUY_RESOURCE':
                this.buyResource(action.payload.resource, action.payload.amount);
                break;
            case 'BUY_BUILDING':
                this.buyBuilding(action.payload.type, action.payload.cost);
                this.selectBuilding(action.payload.type);
                break;
            case 'UPDATE_LOGISTICS':
                if (action.payload.autoSell !== undefined) {
                    this.setAutoSell(action.payload.autoSell, action.payload.sellThreshold || 100);
                }
                break;
            case 'UNLOCK_TECH':
                this.researchTech(action.payload);
                break;
            case 'TOGGLE_DEBUG':
                this.toggleDebug();
                break;
            case 'TOGGLE_CHEATS':
                this.toggleCheats();
                break;
            case 'TOGGLE_VIEW':
                this.toggleViewMode();
                break;
            case 'SAVE_GAME':
                this.saveGame();
                break;
            case 'LOAD_GAME':
                this.loadState(action.payload);
                break;
            case 'ADVANCE_TUTORIAL':
                this.advanceTutorial();
                break;
            case 'START_DEMO':
                this.startDemo();
                break;
            case 'ENTER_FPS':
                this.enterFPS(action.payload || this.stateManager.getState().selectedAgentId || '');
                break;
            case 'EXIT_FPS':
                this.exitFPS();
                break;
            case 'DISMISS_NEWS':
                // news system handles this via stateManager
                break;
            case 'SUBMIT_PERMIT':
                this.stateManager.pushCommand('SUBMIT_PERMIT', { permitId: action.payload });
                break;
            case 'TALK_TO_NPC':
                this.stateManager.pushCommand('TALK_TO_NPC', { npcId: action.payload });
                break;
            case 'CHOOSE_DIALOGUE':
                this.stateManager.pushCommand('CHOOSE_DIALOGUE', { optionIndex: action.payload });
                break;
            case 'CLOSE_DIALOGUE':
                this.stateManager.pushCommand('CLOSE_DIALOGUE', {});
                break;
            default:
                console.warn(`[AureusWorld] Unhandled action type: ${(action as any).type}`);
        }
    }

    private loadState(saved: any) {
        this.stateManager.loadState(saved);
    }

    /**
     * Check if a save exists
     */
    hasSave(): boolean {
        // Implementation for checking local storage or database
        return !!localStorage.getItem('aureus-game-state');
    }

    getDebugStats() {
        const renderStats = this.render.getStats();
        const state = this.stateManager.getState();

        return {
            qualityLevel: this.render.getRuntimeQuality().label,
            qualitySmoothDetail: this.render.getRuntimeQuality().smoothDetail,
            qualityPixelRatio: this.render.getRuntimeQuality().pixelRatio,
            qualityShadows: this.render.getRuntimeQuality().shadowMap,

            // Render Stats
            drawCalls: renderStats.drawCalls,
            triangles: renderStats.triangles,
            points: renderStats.points,
            lines: renderStats.lines,
            geometries: renderStats.geometries,
            textures: renderStats.textures,
            programs: renderStats.programs,

            // Game Stats
            buildings: Object.values(state.chunks).reduce((sum, chunk) =>
                sum + (chunk as any).tiles.filter((t: any) => t.buildingType !== 'EMPTY').length, 0),
            agents: state.agents.length,
            particles: 0, // Particle system not yet implemented

            // Streaming Stats
            instancedMeshes: this.streamMgr.activeCount, // Using this for chunks count

            // Queue Stats
            queuedJobs: this.jobs.queueLength,
            pendingJobs: this.jobs.pendingCount,
        };
    }
}
