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
    PowerGridSystem, WaterNetworkSystem, ExcavationSystem
} from '../engine/sim/systems';

import { GameState, GameStep, Agent, GridTile, BuildingType, SfxType, TechId } from '../types';
import { GRID_SIZE, getEcoMultiplier } from '../engine/utils/GameUtils';
import { BUILDINGS, TECHNOLOGIES } from '../engine/data/VoxelConstants';
import { TerrainRenderSystem } from './render/systems/TerrainRenderSystem';
import { FoliageRenderSystem } from './render/systems/FoliageRenderSystem';
import { BuildingRenderSystem } from './render/systems/BuildingRenderSystem';
import { AgentRenderSystem } from './render/systems/AgentRenderSystem';
import { EnvironmentRenderSystem } from './render/systems/EnvironmentRenderSystem';
import { IsoCameraSystem } from './render/IsoCameraSystem';
import { InputSystem } from '../engine/input/InputSystem';
import { StateManager, StateListener } from '../engine/state/StateManager';
import { UndergroundDecorationSystem } from './render/systems/UndergroundDecorationSystem';

export interface AureusWorldConfig {
    container: HTMLElement;
    onTileClick?: (index: number) => void;
    onTileRightClick?: (index: number) => void;
    onAgentClick?: (agentId: string | null) => void;
    onTileHover?: (index: number | null) => void;
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

    // Render Systems
    private agentRenderSystem: AgentRenderSystem;
    private terrainRenderSystem: TerrainRenderSystem;
    private foliageRenderSystem: FoliageRenderSystem;
    private buildingRenderSystem: BuildingRenderSystem;
    private environmentRenderSystem: EnvironmentRenderSystem;
    private undergroundDecorationSystem: UndergroundDecorationSystem;
    private cameraSystem: IsoCameraSystem;

    // Game State
    private gamePaused = false;
    private config: AureusWorldConfig | null = null;

    constructor(render: ThreeRenderAdapter) {
        super();
        this.render = render;

        // Initialize State Manager (Engine owns state)
        this.stateManager = new StateManager();

        // Initialize engine subsystems
        this.streamMgr = new StreamingManager({
            viewRadiusH: 6,
            viewRadiusV: 1,
            maxLoadsPerFrame: 4,
            maxUnloadsPerFrame: 8,
        });

        this.jobs = new JobSystem();
        this.workerPool = new WorkerPool();
        this.sim = new Simulation();

        // Simulation Systems
        this.constructionSystem = new ConstructionSystem();
        this.sim.addSystem(this.constructionSystem);
        this.sim.addSystem(new JobGenerationSystem());
        this.sim.addSystem(new EnvironmentSystem());
        this.sim.addSystem(new EconomySystem());
        this.sim.addSystem(new ColonySystem());
        this.sim.addSystem(new LogisticsSystem());
        this.sim.addSystem(new EventSystem());
        this.sim.addSystem(new MissionSystem());
        this.sim.addSystem(new PowerGridSystem());
        this.sim.addSystem(new WaterNetworkSystem());
        this.sim.addSystem(new ProductionSystem());
        this.sim.addSystem(new EraSystem());

        // Dungeon Keeper Systems
        this.sim.addSystem(new ExcavationSystem());

        this.agentSystem = new AgentSystem(this.jobs, this.constructionSystem);
        this.sim.addSystem(this.agentSystem);

        // Render Systems
        const getHeight = (worldX: number, worldZ: number) => {
            const offset = (GRID_SIZE - 1) / 2;
            const gridX = Math.floor(worldX + offset + 0.5);
            const gridZ = Math.floor(worldZ + offset + 0.5);

            if (gridX < 0 || gridX >= GRID_SIZE || gridZ < 0 || gridZ >= GRID_SIZE) {
                return 0;
            }

            const state = this.stateManager.getState();
            if (state.grid) {
                const tileId = gridZ * GRID_SIZE + gridX;
                const tile = state.grid[tileId];
                if (tile) {
                    return tile.terrainHeight * 0.5;
                }
            }
            return 0;
        };

        this.agentRenderSystem = new AgentRenderSystem(
            this.render.getScene(),
            GRID_SIZE,
            getHeight
        );

        // Store reference for cursor height calculation
        const getTerrainHeight = getHeight;

        this.terrainRenderSystem = new TerrainRenderSystem(
            this.render.getScene(),
            GRID_SIZE,
            this.jobs
        );

        this.foliageRenderSystem = new FoliageRenderSystem(this.render.getScene());
        this.buildingRenderSystem = new BuildingRenderSystem(this.render.getScene(), GRID_SIZE);
        this.environmentRenderSystem = new EnvironmentRenderSystem(this.render);
        this.undergroundDecorationSystem = new UndergroundDecorationSystem(this.render.getScene());
        this.cameraSystem = new IsoCameraSystem(this.render);

        // Wire Terrain -> Foliage
        this.terrainRenderSystem.onFoliageUpdate = (key: string, items: any[]) => {
            this.foliageRenderSystem.updateChunk(key, items);
        };
        this.terrainRenderSystem.onChunkDispose = (key: string) => {
            this.foliageRenderSystem.removeChunk(key);
        };

        // Enable camera by default (no legacy mode)
        this.cameraSystem.setEnabled(true);
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

    placeBuilding(index: number, type?: string): void {
        const state = this.stateManager.getMutableState();
        const buildingType = (type || state.selectedBuilding) as BuildingType;
        if (!buildingType) return;

        const def = BUILDINGS[buildingType];
        if (!def) return;

        // NEW: Era validation
        if (!state.cheatsEnabled && !state.unlockedEras.includes(def.era)) {
            console.warn(`Cannot place ${buildingType}: Era ${def.era} not unlocked`);
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ERROR });
            return;
        }

        // Validate placement
        const tile = state.grid[index];
        if (!tile || tile.locked) return;
        if (tile.buildingType !== BuildingType.EMPTY && tile.buildingType !== BuildingType.POND) return;

        // Check if building is in inventory
        if (!state.inventory[buildingType] || state.inventory[buildingType] <= 0) {
            console.warn(`Cannot place ${buildingType}: not in inventory`);
            return;
        }

        // Consume from inventory
        state.inventory[buildingType]--;

        // Clear selection if inventory is empty
        if (state.inventory[buildingType] === 0) {
            state.selectedBuilding = null;
            // Clear ghost building projection
            this.buildingRenderSystem.setGhostBuilding(null);
        }

        // Context-aware placement
        if (state.viewMode === 'UNDERGROUND') {
            // For now, only allow PIPES underground
            if (buildingType === BuildingType.PIPE) {
                this.stateManager.pushCommand('PLACE_SUB_BUILDING', { index, buildingType, layer: -1 });
                state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BUILD });
                return;
            } else {
                console.warn("Only Pipes can be placed underground currently.");
                state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ERROR });
                return;
            }
        }

        // Place via ConstructionSystem
        this.stateManager.pushCommand('PLACE_BUILDING', { index, buildingType });

        // Audio effect
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BUILD });
    }

    bulldozeTile(index: number): void {
        const state = this.stateManager.getMutableState();
        const tile = state.grid[index];
        if (!tile || tile.locked) return;

        if (state.viewMode === 'UNDERGROUND') {
            const hasSub = tile.subBuildings && tile.subBuildings[-1];
            if (hasSub) {
                this.stateManager.pushCommand('BULLDOZE_SUB', { index, layer: -1 });
                state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BULLDOZE });
            }
            return;
        }

        this.stateManager.pushCommand('BULLDOZE', { index });

        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BUILD });
    }

    selectBuilding(type: string | null): void {
        const state = this.stateManager.getMutableState();
        state.selectedBuilding = type as BuildingType | null;
        this.buildingRenderSystem.setGhostBuilding(type as BuildingType | null);
    }

    pinBuildingForConfirmation(index: number): void {
        // Pin the ghost building at this location for mobile confirmation
        this.buildingRenderSystem.setPinnedGhost(index);
    }

    clearPinnedBuilding(): void {
        // Clear the pinned ghost (user cancelled)
        this.buildingRenderSystem.setPinnedGhost(null);
    }

    selectAgent(id: string | null): void {
        const state = this.stateManager.getMutableState();
        state.selectedAgentId = id;
    }

    commandAgent(agentId: string, tileId: number): void {
        const state = this.stateManager.getMutableState();
        const agent = state.agents.find(a => a.id === agentId);
        if (!agent) return;

        // Manual command - create a manual job
        agent.currentJobId = `manual_${tileId}_${Date.now()}`;
        agent.targetTileId = tileId;
        agent.state = 'IDLE'; // Will trigger pathfinding on next think
    }

    setInteractionMode(mode: 'BUILD' | 'BULLDOZE' | 'INSPECT' | 'DIG'): void {
        const state = this.stateManager.getMutableState();
        state.interactionMode = mode;
        this.buildingRenderSystem.setCursorMode(mode);
    }

    sellMinerals(): void {
        const state = this.stateManager.getMutableState();
        if (state.resources.minerals <= 0) return;

        const ecoMult = getEcoMultiplier(state.resources.eco);
        const trustMult = 1 + (state.resources.trust / 200);
        const price = state.market.minerals.currentPrice;

        const value = Math.floor(state.resources.minerals * price * ecoMult * trustMult);
        state.resources.agt += value;
        state.resources.minerals = 0;

        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.SELL });
        state.newsFeed.push({
            id: `sell_${Date.now()}`,
            headline: `Sold minerals for ${value} AGT`,
            type: 'POSITIVE',
            timestamp: Date.now()
        });
    }

    buyBuilding(buildingType: string, cost: number): void {
        const state = this.stateManager.getMutableState();

        // Deduct cost
        state.resources.agt -= cost;

        // Add to inventory
        if (!state.inventory[buildingType]) {
            state.inventory[buildingType] = 0;
        }
        state.inventory[buildingType]++;

        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_COIN });
    }

    setAutoSell(enabled: boolean, threshold: number): void {
        const state = this.stateManager.getMutableState();
        state.logistics.autoSell = enabled;
        state.logistics.sellThreshold = threshold;
    }

    researchTech(techId: string): void {
        const state = this.stateManager.getMutableState();

        // 1. Validate Tech
        const tech = TECHNOLOGIES[techId as TechId];
        if (!tech) {
            console.warn(`[AureusWorld] Unknown tech: ${techId}`);
            return;
        }

        const id = techId as TechId;

        // 2. Check if already unlocked
        if (state.research.unlocked.includes(id)) return;

        // 3. Check Prereqs
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

        console.log(`[AureusWorld] Unlocked tech: ${id}`);
    }

    toggleDebug(): void {
        const state = this.stateManager.getMutableState();
        state.debugMode = !state.debugMode;
    }

    toggleViewMode(): void {
        const state = this.stateManager.getMutableState();
        if (state.viewMode === 'SURFACE') {
            state.viewMode = 'UNDERGROUND';

            // Update Camera Target Height
            this.cameraSystem.setTargetHeight(-0.5); // Focus on layer -1
            this.inputSystem?.setRayPlaneHeight(-1.0); // Focus interaction on layer -1
        } else {
            state.viewMode = 'SURFACE';
            this.cameraSystem.setTargetHeight(0); // Surface focus
            this.inputSystem?.setRayPlaneHeight(0); // Surface interaction
        }

        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_CLICK });

        this.environmentRenderSystem.setViewMode(state.viewMode);
        this.terrainRenderSystem.setViewMode(state.viewMode);

        // Sync grid to force re-render with new view mode (will be passed to worker)
        this.terrainRenderSystem.syncGrid(state.grid);

        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_CLICK });
    }

    speedUpConstruction(index: number): void {
        this.stateManager.pushCommand('SPEED_UP', { index });
    }

    queueDig(index: number, layer: number): void {
        const state = this.stateManager.getMutableState();
        const tile = state.grid[index];
        if (!tile) return;

        // Initialize digState if missing
        if (!tile.digState) tile.digState = {};

        // Mark as Designated (1)
        tile.digState[layer] = 1;

        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_CLICK });

        // This will be picked up by JobGenerationSystem in the next tick
    }

    acceptContract(contractId: string): void {
        // Contracts use amount field, not status
        console.log(`[AureusWorld] Accept contract: ${contractId}`);
    }

    advanceTutorial(): void {
        const state = this.stateManager.getMutableState();
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
        }
    }

    deliverContract(contractId: string): void {
        const state = this.stateManager.getMutableState();
        const contract = state.contracts.find(c => c.id === contractId);
        if (contract && contract.amount > 0) {
            // Check if we have the resources
            const resource = contract.resource === 'MINERALS' ? 'minerals' : 'gems';
            if (state.resources[resource] >= contract.amount) {
                state.resources[resource] -= contract.amount;
                state.resources.agt += contract.reward;
                state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.COMPLETE });
            }
        }
    }

    saveGame(): void {
        const data = this.stateManager.serializeState();
        localStorage.setItem('aureus_save_v2', data);
    }

    loadGame(data: string): void {
        try {
            const parsed = JSON.parse(data);
            this.stateManager.loadState(parsed);
            this.workerPool.broadcast({ type: 'SYNC_GRID', payload: parsed.grid });
        } catch (e) {
            console.error('Failed to load game:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ENGINE LIFECYCLE
    // ═══════════════════════════════════════════════════════════════

    configure(config: AureusWorldConfig): void {
        this.config = config;

        this.inputSystem = new InputSystem(this.render);

        this.inputSystem.onTileClick = (index) => {
            if (this.stateManager.getState().viewMode === 'UNDERGROUND') {
                this.handleUndergroundInteraction(index, 'click');
            } else {
                this.handleSurfaceInteraction(index, 'click');
            }
        };

        this.inputSystem.onTileRightClick = (index) => {
            if (this.stateManager.getState().viewMode === 'UNDERGROUND') {
                this.handleUndergroundInteraction(index, 'right-click');
            } else {
                this.handleSurfaceInteraction(index, 'right-click');
            }
        };

        this.inputSystem.onTileHover = (index) => {
            if (this.stateManager.getState().viewMode === 'UNDERGROUND') {
                this.handleUndergroundInteraction(index || -1, 'hover');
            } else {
                this.handleSurfaceInteraction(index || -1, 'hover');
            }
            if (this.config?.onTileHover) this.config.onTileHover(index);
        };

        this.inputSystem.init();
    }

    protected async onInit(): Promise<void> {
        console.log('[AureusWorld] Initializing...');

        this.workerPool.init();
        this.sim.init();

        // Sync initial grid to worker
        const state = this.stateManager.getState();

        // Procedural Underground Generation (Once per save)
        // If underground layer is missing, generate it now
        if (state.grid.length > 0 && (!state.grid[0].underground || Object.keys(state.grid[0].underground).length === 0)) {
            console.log("Generating underground layers...");
            for (const tile of state.grid) {
                // Initialize underground structure
                tile.underground = {};

                // Layers -1 to -10
                for (let layer = -1; layer >= -10; layer--) {
                    // Default solid earth
                    tile.underground[layer] = {
                        excavated: false,
                        collapseRisk: 0,
                        oreVisible: false
                    };

                    // Ore Generation Logic
                    // Deeper layers = better ores, but rarer
                    const rand = Math.random();
                    let oreType: 'GOLD' | 'IRON' | 'GEM' | 'COAL' | undefined;

                    if (layer <= -8) { // Deep layers (-8 to -10): Gems, Gold
                        if (rand < 0.05) oreType = 'GEM';
                        else if (rand < 0.15) oreType = 'GOLD';
                    } else if (layer <= -4) { // Mid layers (-4 to -7): Gold, Iron
                        if (rand < 0.05) oreType = 'GOLD';
                        else if (rand < 0.20) oreType = 'IRON';
                        else if (rand < 0.30) oreType = 'COAL';
                    } else { // Shallow layers (-1 to -3): Coal, Iron
                        if (rand < 0.05) oreType = 'IRON';
                        else if (rand < 0.15) oreType = 'COAL';
                    }

                    if (oreType) {
                        tile.underground[layer].oreType = oreType;
                    }
                }
            }
        }

        this.workerPool.broadcast({ type: 'SYNC_GRID', payload: state.grid });
        this.terrainRenderSystem.syncGrid(state.grid);

        console.log('[AureusWorld] Ready');
    }

    protected async onTeardown(): Promise<void> {
        console.log('[AureusWorld] Tearing down...');
        this.undergroundDecorationSystem.dispose();
        this.sim.dispose();
        this.workerPool.dispose();
        this.jobs.clear();
        this.inputSystem?.dispose();
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
        const state = this.stateManager.getMutableState();

        for (const result of results) {
            if (result.kind === 'MESH_CHUNK' && result.success) {
                this.terrainRenderSystem.processResults([result as MeshChunkResult]);
            } else if (result.kind === 'PATHFIND') {
                this.agentSystem.receiveJobResult(result as PathfindResult, state);
            }
        }
    }

    simulation(ctx: FixedContext): void {
        if (this.gamePaused) return;

        const state = this.stateManager.getMutableState();
        if (state.step === GameStep.GAME_OVER) return;

        // Increment tick counter
        state.tickCount++;

        // Run simulation systems
        this.sim.tick(ctx, state);
    }

    draw(ctx: FrameContext): void {
        const state = this.stateManager.getState();

        // Update render systems
        this.cameraSystem.update(ctx.dt);
        this.agentRenderSystem.setSelectedAgent(state.selectedAgentId);
        const zoomLevel = this.cameraSystem.cameraZoom;
        this.agentRenderSystem.update(ctx.dt, ctx.time, state.agents, zoomLevel);

        this.terrainRenderSystem.update(this.cameraSystem.cameraFocus, this.render.getCamera());
        this.buildingRenderSystem.update(ctx.dt, ctx.time, state.grid, this.stateManager.getDirtyKeys(), state.viewMode);

        const cursor = this.inputSystem?.getCurrentCursor() || null;
        if (cursor) {
            const offset = (GRID_SIZE - 1) / 2;
            const gx = Math.floor(cursor.x + offset + 0.5);
            const gz = Math.floor(cursor.z + offset + 0.5);

            // Get height from tile if possible for precision
            const tile = state.grid[gz * GRID_SIZE + gx];
            const surfaceY = tile ? tile.terrainHeight * 0.5 : 0;

            if (state.viewMode === 'UNDERGROUND') {
                let deepestLayer = 0;
                if (tile?.underground) {
                    for (let l = -1; l >= -10; l--) {
                        if (tile.underground[l]?.excavated) {
                            deepestLayer = l;
                        } else {
                            break;
                        }
                    }
                }
                // If nothing is excavated yet but we are in underground view (ghost mode), 
                // default to -1 to show where the entrance would be.
                const depth = deepestLayer === 0 ? -1.0 : deepestLayer;
                cursor.y = surfaceY + depth;
            } else {
                cursor.y = surfaceY;
            }
        }

        this.buildingRenderSystem.updateCursor(
            cursor,
            this.cameraSystem.getFocus()
        );

        this.environmentRenderSystem.update(
            ctx.dt,
            state.dayNightCycle?.timeOfDay || 12000,
            state.weather?.current || 'CLEAR',
            this.cameraSystem.cameraFocus
        );

        this.undergroundDecorationSystem.update(
            ctx.dt,
            ctx.time,
            state.viewMode,
            this.cameraSystem.cameraFocus
        );

        this.render.draw(ctx);

        // Process and clear pending effects
        if (state.pendingEffects.length > 0) {
            state.pendingEffects.forEach(effect => {
                if (effect.type === 'AUDIO' && this.config?.onSfx) {
                    this.config.onSfx(effect.sfx);
                } else if (effect.type === 'FX') {
                    this.buildingRenderSystem.triggerEffect(effect.index, effect.fxType, 0);
                } else if (effect.type === 'GRID_UPDATE') {
                    this.terrainRenderSystem.updateTiles(effect.updates);
                    this.workerPool.broadcast({ type: 'SYNC_GRID', payload: state.grid });
                }
            });
            // Clear the array (mutates the state object)
            state.pendingEffects.length = 0;
        }

        // Notify React of any state changes
        this.stateManager.notifyIfDirty();
    }

    frameEnd(_ctx: FrameContext): void {
        // Cleanup
    }

    // ═══════════════════════════════════════════════════════════════
    // INTERACTION STATES
    // ═══════════════════════════════════════════════════════════════

    private handleSurfaceInteraction(index: number, type: 'click' | 'right-click' | 'hover') {
        const state = this.stateManager.getState();
        const config = this.config!;

        if (index < 0) return;

        if (type === 'hover') return; // Hover handled by config.onTileHover directly if needed

        if (type === 'right-click') {
            if (state.selectedAgentId) {
                this.commandAgent(state.selectedAgentId, index);
            }
            config.onTileRightClick?.(index);
            return;
        }

        // Logic for Surface Clicks
        const x = index % GRID_SIZE;
        const z = Math.floor(index / GRID_SIZE);
        const agent = state.agents.find(a => {
            const ax = Math.round(a.visualX ?? a.x);
            const az = Math.round(a.visualZ ?? a.z);
            return ax === x && az === z;
        });

        // 1. Agent Selection
        if (agent && (state.interactionMode === 'INSPECT' || (state.interactionMode === 'BUILD' && !state.selectedBuilding))) {
            this.selectAgent(agent.id);
            config.onAgentClick?.(agent.id);
            return;
        }

        // 2. Building / Bulldoze
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window);

        if (state.interactionMode === 'BUILD' && state.selectedBuilding) {
            if (isMobile) {
                this.pinBuildingForConfirmation(index);
                config.onTileClick?.(index);
            } else {
                this.placeBuilding(index);
            }
        } else if (state.interactionMode === 'BULLDOZE') {
            this.bulldozeTile(index);
            config.onTileClick?.(index);
        } else {
            this.selectAgent(null);
            config.onAgentClick?.(null);
            config.onTileClick?.(index);
        }
    }

    private handleUndergroundInteraction(index: number, type: 'click' | 'right-click' | 'hover') {
        const state = this.stateManager.getState();
        const config = this.config!;

        if (index < 0) return;

        // In Underground Mode, we specifically ignore agents on surface
        // And we focus purely on layers -1 to -10

        if (type === 'hover') return;

        if (type === 'right-click') {
            // Right clicking underground currently does nothing unless we add underground-capable bots
            config.onTileRightClick?.(index);
            return;
        }

        // Logic for Underground Clicks
        if (state.interactionMode === 'BUILD' && state.selectedBuilding) {
            // Only allow subterranean construction
            this.placeBuilding(index);
        } else if (state.interactionMode === 'BULLDOZE') {
            this.bulldozeTile(index);
            config.onTileClick?.(index);
        } else if (state.interactionMode === 'DIG') {
            this.queueDig(index, -1);
            config.onTileClick?.(index);
        } else {
            // In underground, inspect might show ore data
            config.onTileClick?.(index);
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

    getDebugStats() {
        const renderStats = this.render.getStats();
        const state = this.stateManager.getState();

        return {
            // Render Stats
            drawCalls: renderStats.drawCalls,
            triangles: renderStats.triangles,
            points: renderStats.points,
            lines: renderStats.lines,
            geometries: renderStats.geometries,
            textures: renderStats.textures,
            programs: renderStats.programs,

            // Game Stats
            buildings: state.grid.filter(t => t.buildingType !== 'EMPTY').length,
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
