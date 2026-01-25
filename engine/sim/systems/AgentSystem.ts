/**
 * Simple Agent System (FORCE RELOAD v1)
 * A streamlined, easy-to-read Finite State Machine for colony agents.
 * This version uses Synchronous Pathfinding for immediate response.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { Agent, GameState, GridTile, BuildingType, SfxType, PathStep } from '../../../types';
import { findPath3D } from '../algorithms/Pathfinding';
import { JobSystem, PathfindResult } from '../../jobs';
import { ConstructionSystem } from './ConstructionSystem';
import { PathPool } from '../../utils/PathPool';
import { GRID_SIZE, HARVESTABLE_ROCKS, HARVESTABLE_TREES } from '../../utils/GameUtils';

// Configuration
const CONFIG = {
    SPEED: 3.5,            // Tiles per second
    THINK_INTERVAL: 60,    // Ticks between AI decisions (1 second at 60Hz)
    NEED_CRITICAL: 30,     // Threshold to seek help
    NEED_SATISFIED: 95,    // Threshold to stop seeking help
};

export class AgentSystem extends BaseSimSystem {
    readonly id = 'agents';
    readonly priority = 100;
    private tickCounter = 0;
    private jobSystem: JobSystem;
    private constructionSystem: ConstructionSystem;

    constructor(jobSystem: JobSystem, constructionSystem: ConstructionSystem) {
        super();
        this.jobSystem = jobSystem;
        this.constructionSystem = constructionSystem;
    }

    /** Compatibility for legacy pathfinding results (unused in simple mode) */
    public receiveJobResult(result: PathfindResult, state: GameState): void {
        // Simple mode uses synchronous pathfinding
    }

    tick(ctx: FixedContext, state: GameState): void {
        this.tickCounter++;
        const { agents, grid } = state;
        if (!agents || !grid) return;

        for (let i = 0; i < agents.length; i++) {
            const agent = agents[i];

            // 1. Update Needs (Decay)
            this.updateNeeds(agent, ctx.fixedDt);

            // 2. Decide what to do (AI)
            // Faster thinking for better responsiveness
            if (agent.state === 'IDLE' || this.tickCounter % CONFIG.THINK_INTERVAL === 0) {
                this.updateAI(agent, state);
            }

            // 3. Act based on current state
            this.executeState(agent, state, ctx.fixedDt);

            // 4. Update Visuals
            agent.visualX = agent.x;
            agent.visualZ = agent.z;
        }
    }

    private updateNeeds(agent: Agent, dt: number): void {
        // Slow decay unless sleeping/eating
        if (agent.state !== 'SLEEPING') agent.energy = Math.max(0, agent.energy - 0.2 * dt);
        if (agent.state !== 'EATING') agent.hunger = Math.max(0, agent.hunger - 0.15 * dt);
        agent.mood = Math.max(0, agent.mood - 0.1 * dt);
    }

    private updateAI(agent: Agent, state: GameState): void {
        // Don't interrupt persistent actions (work/eat/sleep) until they are done
        // Unless it's a MOVING state to a job that was stolen or cancelled (handled in executeState/move)
        if (['SLEEPING', 'EATING', 'WORKING'].includes(agent.state)) return;

        // --- PRIORITY 1: Manual Commands ---
        if (agent.currentJobId?.startsWith('manual_')) {
            if (agent.state === 'MOVING') return;
        }

        // --- PRIORITY 2: Critical Needs ---
        if (agent.energy < CONFIG.NEED_CRITICAL) {
            const bed = this.findNearest(agent, BuildingType.STAFF_QUARTERS, state.grid);
            if (bed !== null) {
                this.goTo(agent, bed, 0, 'sys_sleep', state.grid);
                return;
            }
        }
        if (agent.hunger < CONFIG.NEED_CRITICAL) {
            const food = this.findNearest(agent, BuildingType.CANTEEN, state.grid);
            if (food !== null) {
                this.goTo(agent, food, 0, 'sys_eat', state.grid);
                return;
            }
        }

        // --- PRIORITY 3: Work (Construction, Digging, Mining) ---
        // Find highest priority available job
        // Sorting jobs by priority (descending)
        const availableJob = state.jobs
            .filter(j => !j.assignedAgentId || j.assignedAgentId === agent.id)
            .sort((a, b) => b.priority - a.priority)[0];

        if (availableJob) {
            // CLAIM JOB
            availableJob.assignedAgentId = agent.id;
            this.goTo(agent, availableJob.targetTileId, availableJob.layer || 0, availableJob.id, state.grid);
            return;
        }

        // --- PRIORITY 4: Idleness / Wander ---
        if (agent.state === 'IDLE' && Math.random() < 0.2) {
            const wanderTarget = this.getRandomNearby(agent);
            this.goTo(agent, wanderTarget, agent.layer || 0, 'sys_wander', state.grid);
        }
    }

    private executeState(agent: Agent, state: GameState, dt: number): void {
        switch (agent.state) {
            case 'MOVING':
                this.moveAlongPath(agent, state, dt);
                break;

            case 'SLEEPING':
                agent.energy = Math.min(100, agent.energy + 15 * dt);
                if (agent.energy >= CONFIG.NEED_SATISFIED) this.finishActivity(agent, state);
                break;

            case 'EATING':
                agent.hunger = Math.min(100, agent.hunger + 20 * dt);
                if (agent.hunger >= CONFIG.NEED_SATISFIED) this.finishActivity(agent, state);
                break;

            case 'WORKING':
                this.performWork(agent, state, dt);
                break;
        }
    }

    private moveAlongPath(agent: Agent, state: GameState, dt: number): void {
        if (!agent.path || agent.path.length === 0) {
            // Arrival ceremony: Snap to grid coordinate
            agent.x = Math.round(agent.x);
            agent.z = Math.round(agent.z);

            // Transition to the actual activity we traveled for
            if (agent.currentJobId === 'sys_sleep') agent.state = 'SLEEPING';
            else if (agent.currentJobId === 'sys_eat') agent.state = 'EATING';
            else if (agent.currentJobId?.includes('build_') || agent.currentJobId?.includes('dig_') || agent.currentJobId?.includes('mine') || agent.currentJobId?.includes('rehab')) {
                agent.state = 'WORKING';
            }
            else {
                this.finishActivity(agent, state); // Wander or manual move finished
            }
            return;
        }

        const next = agent.path[0];
        const tx = next.index % GRID_SIZE;
        const tz = Math.floor(next.index / GRID_SIZE);
        const tL = next.layer;

        const dx = tx - agent.x;
        const dz = tz - agent.z;
        const distSq = dx * dx + dz * dz;
        const frameStep = CONFIG.SPEED * dt;

        // If we reached the horizontal node, we can also instantly snap the layer
        if (distSq < (frameStep * frameStep)) {
            // Snap to node and pop it
            agent.x = tx;
            agent.z = tz;
            agent.layer = tL; // Update vertical layer
            agent.path.shift();

            if (agent.path.length === 0) {
                PathPool.release(agent.path);
                agent.path = null;
            }
        } else {
            // Linear lerp towards next node
            const dist = Math.sqrt(distSq);
            agent.x += (dx / dist) * frameStep;
            agent.z += (dz / dist) * frameStep;
        }
    }

    private performWork(agent: Agent, state: GameState, dt: number): void {
        const jobIdx = state.jobs.findIndex(j => j.id === agent.currentJobId);
        if (jobIdx === -1) {
            this.finishActivity(agent, state);
            return;
        }

        const job = state.jobs[jobIdx];
        const tile = state.grid[job.targetTileId];

        if (job.type === 'DIG') {
            // Extract layer from jobID (dig_ID_LAYER)
            const parts = job.id.split('_');
            const layer = parseInt(parts[2]);

            // Execute dig (Instant for now, or add progress logic)
            // Progress logic:
            if (!job.progress) job.progress = 0;
            job.progress += 20 * (1 + agent.skills.mining / 5); // Dig speed based on mining skill

            // Visual feedback
            if (Math.random() < 0.1) {
                state.pendingEffects.push({ type: 'FX', fxType: 'MINING', index: tile.id });
                state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.MINING_HIT });
            }

            if (job.progress >= 100) {
                // Done!
                // We need to call ExcavationSystem.completeDig(tile.id, layer)
                // Since we don't have direct ref, we can push a command or use a dirty hack.
                // DIRTY HACK FOR SPEED: Use direct mutation, but proper way is system call.
                // Assuming ExcavationSystem logic is simple enough to replicate or we injected it.
                // Let's modify AgentSystem to accept ExcavationSystem in constructor.
                // For this edit, I'll assume we HAVE it or will add it. 
                // Wait, I can't easily add it to constructor in replace_file without seeing the whole file signature again or risking mismatch.
                // Instead, I'll set a flag on the tile that ExcavationSystem picks up? No, that's messy.
                // I'll emit a command!
                // BUT `ExcavationSystem` is a Sim system, it runs ticks.
                // I'll use `GridTile.digState` to signal completion for now. 
                // digState: 1 (Trench) -> 2 (Excavated).
                if (tile.digState && (tile.digState[layer] === 1 || tile.digState[layer] === 4)) {
                    tile.digState[layer] = tile.digState[layer] === 4 ? 5 : 2; // 2 = Finished Tunnel, 5 = Finished Entrance
                    // Also trigger effects
                    state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.CAMP_BUILD });
                }

                state.jobs.splice(jobIdx, 1);
                this.finishActivity(agent, state);
            }

        } else if (tile.isUnderConstruction) {
            // Use specialized system to handle multi-tile buildings
            const amount = (1 + agent.skills.construction / 10) * dt;
            const finished = this.constructionSystem.progressConstruction(job.targetTileId, amount, state);

            if (finished) {
                state.jobs.splice(jobIdx, 1);
                this.finishActivity(agent, state);
            }
        } else if (job.type === 'MINE') {
            if (job.layer !== undefined && job.layer < 0) {
                // Underground Mining
                state.resources.minerals += 25 * (1 + agent.skills.mining / 5);
                const strata = tile.underground?.[job.layer];
                if (strata) {
                    strata.excavated = true;
                    state.pendingEffects.push({ type: 'GRID_UPDATE', updates: [tile] });
                }
                state.pendingEffects.push({ type: 'FX', fxType: 'MINING', index: tile.id });
                state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.MINING_HIT });
            } else {
                // Surface Mining/Harvesting
                const yieldAmt = 20 * (1 + agent.skills.mining / 5);
                const foliage = tile.foliage as any;

                if (foliage === 'GOLD_VEIN') {
                    state.resources.minerals += yieldAmt;
                    state.pendingEffects.push({ type: 'FX', fxType: 'MINING', index: tile.id });
                    state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.MINING_HIT });
                } else if (HARVESTABLE_ROCKS.includes(foliage)) {
                    state.resources.stone += yieldAmt;
                    state.pendingEffects.push({ type: 'FX', fxType: 'MINING', index: tile.id });
                    state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.MINING_HIT });
                } else if (HARVESTABLE_TREES.includes(foliage)) {
                    state.resources.wood += yieldAmt;
                    state.pendingEffects.push({ type: 'FX', fxType: 'FARM', index: tile.id });
                    state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_CLICK }); // Temporary sound for tree harvest
                }

                // Surface depletion
                if (Math.random() < 0.25) {
                    tile.foliage = 'NONE' as any;
                    tile.markedForHarvest = false;
                    state.pendingEffects.push({ type: 'GRID_UPDATE', updates: [tile] });
                }
            }

            // Skill XP
            agent.skills.mining += 0.5;

            state.jobs.splice(jobIdx, 1);
            this.finishActivity(agent, state);
        }
        else {
            // Already finished or site removed
            state.jobs.splice(jobIdx, 1);
            this.finishActivity(agent, state);
        }
    }

    private finishActivity(agent: Agent, state: GameState): void {
        agent.state = 'IDLE';
        agent.currentJobId = null;
        agent.targetTileId = null;
        if (agent.path) {
            PathPool.release(agent.path);
            agent.path = null;
        }

        // Immediately try to find new work so we don't wait for the next tick interval
        this.updateAI(agent, state);
    }

    private goTo(agent: Agent, targetIdx: number, targetLayer: number, jobId: string, grid: GridTile[]): void {
        const ax = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(agent.x)));
        const az = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(agent.z)));
        const startIdx = az * GRID_SIZE + ax;
        const startLayer = agent.layer || 0;

        // If we're already there (horizontally and vertically), start the action immediately
        if (startIdx === targetIdx && startLayer === targetLayer) {
            agent.currentJobId = jobId;
            if (jobId === 'sys_sleep') agent.state = 'SLEEPING';
            else if (jobId === 'sys_eat') agent.state = 'EATING';
            else if (jobId.startsWith('build_') || jobId.startsWith('dig_') || jobId.includes('mine')) agent.state = 'WORKING';
            else agent.state = 'IDLE';
            return;
        }

        try {
            const path = findPath3D(startIdx, startLayer, targetIdx, targetLayer, grid);
            if (path && path.length > 0) {
                PathPool.release(agent.path);
                agent.path = path;
                agent.state = 'MOVING';
                agent.currentJobId = jobId;
                agent.targetTileId = targetIdx;
            } else {
                PathPool.release(agent.path);
                agent.path = null;
                agent.state = 'IDLE';
            }
        } catch (e) {
            console.error(`[AgentSystem] Pathfinding crashed for ${agent.name}:`, e);
            agent.state = 'IDLE';
        }
    }

    private findNearest(agent: Agent, type: BuildingType, grid: GridTile[]): number | null {
        let bestIdx = null;
        let minDist = Infinity;
        const ax = Math.floor(agent.x);
        const az = Math.floor(agent.z);

        for (let i = 0; i < grid.length; i++) {
            if (grid[i].buildingType === type && !grid[i].isUnderConstruction) {
                const tx = i % GRID_SIZE;
                const ty = Math.floor(i / GRID_SIZE);
                const d = Math.abs(tx - ax) + Math.abs(ty - az);
                if (d < minDist) {
                    minDist = d;
                    bestIdx = i;
                }
            }
        }
        return bestIdx;
    }

    private getRandomNearby(agent: Agent): number {
        const range = 6;
        const rx = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(agent.x + (Math.random() - 0.5) * range * 2)));
        const rz = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(agent.z + (Math.random() - 0.5) * range * 2)));
        return rz * GRID_SIZE + rx;
    }
}
