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
import { subterraneanClippingPlane } from '../engine/render/materials/VoxelMaterials';
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
    onTileClick?: (index: number, isTouch?: boolean) => void;
    onTileRightClick?: (index: number, isTouch?: boolean) => void;
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

        console.log('[placeBuilding] Called with index:', index, 'buildingType:', buildingType, 'viewMode:', state.viewMode);

        if (!buildingType) {
            console.warn('[placeBuilding] No buildingType, returning');
            return;
        }

        const def = BUILDINGS[buildingType];
        if (!def) {
            console.warn('[placeBuilding] No def for buildingType, returning');
            return;
        }

        // NEW: Era validation
        if (!state.cheatsEnabled && !state.unlockedEras.includes(def.era)) {
            console.warn(`Cannot place ${buildingType}: Era ${def.era} not unlocked`);
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ERROR });
            return;
        }

        // Validate placement
        const tile = state.grid[index];
        if (!tile || tile.locked) {
            console.warn('[placeBuilding] Tile is null or locked');
            return;
        }
        if (tile.buildingType !== BuildingType.EMPTY && tile.buildingType !== BuildingType.POND) {
            console.warn('[placeBuilding] Tile is not empty or pond, current type:', tile.buildingType);
            return;
        }

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
            const layer = state.currentUndergroundLayer;
            const strata = tile.underground ? tile.underground[layer] : null;

            // Only allow subterranean construction on excavated tiles
            if (!strata || !strata.excavated) {
                console.warn("Cannot build on unexcavated bedrock.");
                state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ERROR });
                return;
            }

            const subterraneanTypes = [
                BuildingType.PIPE,
                BuildingType.SUPPORT_PILLAR,
                BuildingType.MINING_DRILL,
                BuildingType.UNDERGROUND_FANS,
                BuildingType.ORE_EXTRACTOR
            ];

            if (subterraneanTypes.includes(buildingType)) {
                this.stateManager.pushCommand('PLACE_SUB_BUILDING', { index, buildingType, layer });
                state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BUILD });
                return;
            } else {
                console.warn(`${buildingType} cannot be placed underground.`);
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
            const layer = state.currentUndergroundLayer;
            const hasSub = tile.subBuildings && tile.subBuildings[layer];
            if (hasSub) {
                this.stateManager.pushCommand('BULLDOZE_SUB', { index, layer });
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

        // CRITICAL: Set interaction mode to BUILD when selecting a building
        // This was the missing link causing buildings not to be placed!
        if (type) {
            state.interactionMode = 'BUILD';
        } else {
            // When deselecting, revert to INSPECT
            state.interactionMode = 'INSPECT';
        }
    }

    pinBuildingForConfirmation(index: number): void {
        const state = this.stateManager.getState();
        const tile = state.grid[index];
        const surfaceY = tile ? tile.terrainHeight * 0.5 : 0;

        let y = surfaceY;
        if (state.viewMode === 'UNDERGROUND') {
            // Use 2.0 depth scaling for underground layers
            y = surfaceY + (state.currentUndergroundLayer * 2.0);
        }

        // Pin the ghost building at this location for mobile confirmation
        this.buildingRenderSystem.setPinnedGhost(index, y);
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

    speedUpConstruction(index: number): void {
        const state = this.stateManager.getMutableState();
        const tile = state.grid[index];
        if (!tile || !tile.isUnderConstruction) return;

        const rushCost = 1; // 1 gem per rush
        if (state.resources.gems >= rushCost) {
            this.stateManager.pushCommand('SPEED_UP', { index });
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.CONSTRUCT_SPEEDUP });
        } else {
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ERROR });
        }
    }

    /**
     * Zoom camera to focus on a specific agent
     * Useful for UI features like clicking on agent in a list
     */
    zoomToAgent(agentId: string): void {
        const state = this.stateManager.getState();
        const agent = state.agents.find(a => a.id === agentId);
        if (!agent) return;

        const offset = (GRID_SIZE - 1) / 2;
        const worldX = agent.x - offset;
        const worldZ = agent.z - offset;
        this.cameraSystem.zoomToPosition(worldX, worldZ, 2);
    }

    toggleViewMode(): void {
        const state = this.stateManager.getMutableState();
        if (state.viewMode === 'SURFACE') {
            // Check if at least one entrance exists
            const hasEntrance = state.grid.some(t => t.hasEntrance);
            if (!hasEntrance) {
                state.newsFeed.push({
                    id: `no_underground_${Date.now()}`,
                    headline: "Underground access locked. You must build a Mine Entrance first!",
                    type: 'NEUTRAL',
                    timestamp: Date.now()
                });
                state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ERROR });
                return;
            }

            state.viewMode = 'UNDERGROUND';
            this.cameraSystem.setUndergroundMode(true);

            // Focus on current layer with proper depth scaling
            // Each layer is 2 units deep for better visibility
            const layerY = (state.currentUndergroundLayer ?? -1) * 2.0;
            this.cameraSystem.setTargetHeight(layerY);
            this.inputSystem?.setRayPlaneHeight(layerY);
        } else {
            state.viewMode = 'SURFACE';
            this.cameraSystem.setUndergroundMode(false);
            this.cameraSystem.setTargetHeight(0);
            this.inputSystem?.setRayPlaneHeight(0);
        }

        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_CLICK });

        this.environmentRenderSystem.setViewMode(state.viewMode);
        this.terrainRenderSystem.setViewMode(state.viewMode);

        // Sync grid to force re-render with new view mode (will be passed to worker)
        this.terrainRenderSystem.syncGrid(state.grid);
    }

    public changeUndergroundLayer(delta: number): void {
        const state = this.stateManager.getMutableState();
        if (state.viewMode !== 'UNDERGROUND') return;

        const nextLayer = Math.max(-10, Math.min(-1, state.currentUndergroundLayer + delta));
        if (nextLayer === state.currentUndergroundLayer) return;

        state.currentUndergroundLayer = nextLayer;

        // Update Camera & Interaction with proper depth scaling
        this.cameraSystem.setTargetHeight(state.currentUndergroundLayer * 2.0);
        this.inputSystem?.setRayPlaneHeight(state.currentUndergroundLayer * 2.0);

        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_CLICK });

        // No need to sync grid fully, but might need to notify systems
        state.pendingEffects.push({ type: 'GRID_UPDATE', updates: [] });
    }

    queueDig(index: number, layer: number): void {
        const state = this.stateManager.getMutableState();
        const tile = state.grid[index];
        if (!tile) return;

        // DK2-Style: If in underground view, default to the current viewed layer
        // We only use the passed 'layer' if it's different from the current viewed layer (e.g. forced dig down)
        const targetLayer = state.viewMode === 'UNDERGROUND' ? (state.currentUndergroundLayer || -1) : layer;

        // Accessibility Check: Can we reach this layer to dig it?
        if (!this.isLayerAccessible(index, targetLayer, state.grid)) {
            console.warn(`Layer ${targetLayer} at ${index} is not reachable.`);
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ERROR });
            return;
        }

        if (!tile.digState) tile.digState = {};
        // Use status 4 for 'ENTRANCE DIG' and 1 for 'TUNNEL DIG'
        tile.digState[targetLayer] = (targetLayer === -1 && state.viewMode === 'SURFACE') ? 4 : 1;
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_CLICK });
    }

    private isLayerAccessible(index: number, layer: number, grid: GridTile[]): boolean {
        // Top layer always accessible from surface
        if (layer === -1) return true;

        const tile = grid[index];

        // DK2 Priority: Horizontal access (from neighbors at same depth)
        // This is the most common way to expand.
        const x = index % GRID_SIZE;
        const z = Math.floor(index / GRID_SIZE);
        const offsets = [{ dx: 0, dz: -1 }, { dx: 0, dz: 1 }, { dx: -1, dz: 0 }, { dx: 1, dz: 0 }];

        for (const off of offsets) {
            const nx = x + off.dx, nz = z + off.dz;
            if (nx >= 0 && nx < GRID_SIZE && nz >= 0 && nz < GRID_SIZE) {
                const nIdx = nz * GRID_SIZE + nx;
                if (grid[nIdx].underground[layer]?.excavated) return true;
            }
        }

        // Vertical access (from layer above) - only if the tile directly above is excavated
        if (grid[index].underground[layer + 1]?.excavated) return true;

        return false;
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

        this.inputSystem.onTileClick = (index, isTouch) => {
            if (this.stateManager.getState().viewMode === 'UNDERGROUND') {
                this.handleUndergroundInteraction(index, 'click', isTouch);
            } else {
                this.handleSurfaceInteraction(index, 'click', isTouch);
            }
        };

        this.inputSystem.onTileRightClick = (index, isTouch) => {
            if (this.stateManager.getState().viewMode === 'UNDERGROUND') {
                this.handleUndergroundInteraction(index, 'right-click', isTouch);
            } else {
                this.handleSurfaceInteraction(index, 'right-click', isTouch);
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

        // Zoom camera to first agent on game start for better initial view
        if (state.agents.length > 0) {
            const firstAgent = state.agents[0];
            const offset = (GRID_SIZE - 1) / 2;
            const worldX = firstAgent.x - offset;
            const worldZ = firstAgent.z - offset;
            this.cameraSystem.zoomToPosition(worldX, worldZ, 2); // Zoom level 2 for nice close view
            console.log(`[AureusWorld] Camera focused on agent "${firstAgent.name}" at (${worldX}, ${worldZ})`);
        }

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
        this.agentRenderSystem.update(ctx.dt, ctx.time, state.agents, zoomLevel, state.viewMode);

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

        if (state.viewMode === 'UNDERGROUND') {
            // Find terrain height at camera focus to set base slice height
            const focus = this.cameraSystem.cameraFocus;
            const offset = (GRID_SIZE - 1) / 2;
            const gx = Math.floor(focus.x + offset + 0.5);
            const gz = Math.floor(focus.z + offset + 0.5);
            const focusIndex = gz * GRID_SIZE + gx;
            const focusTile = state.grid[focusIndex];
            const baseSurfaceY = focusTile ? focusTile.terrainHeight * 0.5 : 5.0;

            // To hide everything ABOVE depth D, we use Normal(0, -1, 0)
            subterraneanClippingPlane.normal.set(0, -1, 0);

            // Set the cut-off with proper depth scaling (2 units per layer)
            // This ensures we see the excavated volume properly
            const layerDepth = state.currentUndergroundLayer * 2.0;
            subterraneanClippingPlane.constant = baseSurfaceY + layerDepth + 1.0;
        } else {
            // Restore to "no clipping"
            subterraneanClippingPlane.normal.set(0, 1, 0);
            subterraneanClippingPlane.constant = 1000;
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

    private handleSurfaceInteraction(index: number, type: 'click' | 'right-click' | 'hover', isTouch: boolean = false) {
        const state = this.stateManager.getState();
        const config = this.config!;

        if (index < 0) return;

        if (type === 'hover') return; // Hover handled by config.onTileHover directly if needed

        if (type === 'right-click') {
            if (state.selectedAgentId) {
                this.commandAgent(state.selectedAgentId, index);
            }
            config.onTileRightClick?.(index, isTouch);
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
        console.log('[handleSurfaceInteraction] interactionMode:', state.interactionMode, 'selectedBuilding:', state.selectedBuilding, 'isTouch:', isTouch);

        if (state.interactionMode === 'BUILD' && state.selectedBuilding) {
            console.log('[handleSurfaceInteraction] BUILD mode active, checking for confirmation:', index);
            // Always delegate to config.onTileClick so App.tsx can show the confirmation modal
            // App.tsx now handles the differentiation between touch (pinning) and mouse (direct modal)
            config.onTileClick?.(index, isTouch);
        } else if (state.interactionMode === 'BULLDOZE') {
            this.bulldozeTile(index);
            config.onTileClick?.(index, isTouch);
        } else {
            this.selectAgent(null);
            config.onAgentClick?.(null);
            config.onTileClick?.(index, isTouch);
        }
    }

    private handleUndergroundInteraction(index: number, type: 'click' | 'right-click' | 'hover', isTouch: boolean = false) {
        const state = this.stateManager.getState();
        const config = this.config!;

        if (index < 0) return;

        // In Underground Mode, we specifically ignore agents on surface
        // And we focus purely on layers -1 to -10

        if (type === 'hover') {
            const tile = state.grid[index];
            if (tile?.underground) {
                for (let l = -1; l >= -10; l--) {
                    const strata = tile.underground[l];
                    if (strata && strata.oreType && strata.oreVisible) {
                        if (Math.random() < 0.02) {
                            state.newsFeed.unshift({
                                id: `ore_${Date.now()}`,
                                headline: `Sensors indicate ${strata.oreType} at depth ${Math.abs(l)}.`,
                                type: 'NEUTRAL',
                                timestamp: Date.now()
                            });
                        }
                        break;
                    }
                }
            }
            return;
        }

        if (type === 'right-click') {
            // Right clicking underground can now command agents if they are underground
            if (state.selectedAgentId) {
                const agent = state.agents.find(a => a.id === state.selectedAgentId);
                if (agent) {
                    this.commandAgent(agent.id, index);
                }
            }
            config.onTileRightClick?.(index, isTouch);
            return;
        }

        // Logic for Underground Clicks
        if (state.interactionMode === 'BUILD' && state.selectedBuilding) {
            config.onTileClick?.(index, isTouch);
        } else if (state.interactionMode === 'BULLDOZE') {
            this.bulldozeTile(index);
            config.onTileClick?.(index, isTouch);
        } else if (state.interactionMode === 'DIG') {
            const tile = state.grid[index];

            // Find first unexcavated layer that is ACCESSIBLE
            let targetLayer = -1;
            const viewedLayer = state.currentUndergroundLayer || -1;
            if (tile.underground && tile.underground[viewedLayer] && !tile.underground[viewedLayer].excavated && (!tile.digState || tile.digState[viewedLayer] !== 1)) {
                if (this.isLayerAccessible(index, viewedLayer, state.grid)) {
                    targetLayer = viewedLayer;
                }
            }

            if (targetLayer !== -1) {
                this.queueDig(index, targetLayer);
            }
            config.onTileClick?.(index, isTouch);
        } else {
            // In underground, inspect might show ore data
            config.onTileClick?.(index, isTouch);
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
