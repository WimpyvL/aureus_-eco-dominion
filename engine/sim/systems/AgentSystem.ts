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
            // Backward compatibility: Initialize inventory if missing
            if (!agent.inventory) {
                agent.inventory = { type: null, amount: 0, capacity: 20 };
            }

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
                console.warn(`[Agent ${agent.name}] Pathfinding failed to ${targetIdx}. Staying IDLE.`);
                PathPool.release(agent.path);
                agent.path = null;
                agent.state = 'IDLE';
                // Release job so others can try (or we try again later)
                if (agent.currentJobId) {
                    const job = grid['active_state_ref']?.jobs?.find((j: any) => j.id === jobId);
                    // We don't have direct access to 'state' here easily without passing it, 
                    // but we can just leave it assigned; updateAI filters by assignedAgentId === agent.id.
                    // A better approach is to set it to null if we want OTHERS to try.
                }
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

    private findNearestStorage(agent: Agent, grid: GridTile[]): number | null {
        let bestIdx = null;
        let minDist = Infinity;
        const ax = Math.floor(agent.x);
        const az = Math.floor(agent.z);

        // Valid storage buildings
        const storageTypes = [BuildingType.STORAGE_DEPOT, BuildingType.STOCKPILE, BuildingType.MINING_HEADFRAME, BuildingType.STAFF_QUARTERS];

        for (let i = 0; i < grid.length; i++) {
            const tile = grid[i];
            if (storageTypes.includes(tile.buildingType) && !tile.isUnderConstruction) {
                const tx = i % GRID_SIZE;
                const ty = Math.floor(i / GRID_SIZE);
                const d = Math.abs(tx - ax) + Math.abs(ty - az);
                if (d < minDist) {
                    minDist = d;
                    bestIdx = i;
                }
            }
        }

        // Fallback: If no storage exists, return spawn point (center) or assume instant deposit
        if (bestIdx === null) {
            // Find ANY building to deposit at to avoid softlock
            for (let i = 0; i < grid.length; i++) {
                if (grid[i].buildingType !== BuildingType.EMPTY && !grid[i].isUnderConstruction) {
                    return i;
                }
            }
        }

        return bestIdx;
    }

    private updateAI(agent: Agent, state: GameState): void {
        // Don't interrupt persistent actions (work/eat/sleep) until they are done
        // Unless it's a MOVING state to a job that was stolen or cancelled
        if (['SLEEPING', 'EATING', 'WORKING', 'DEPOSITING'].includes(agent.state)) return;

        const isNight = !state.dayNightCycle.isDaytime;

        // --- PRIORITY 0: Night Time Sleep (Mandatory) ---
        if (isNight) {
            // If already sleeping, we handled above. If idle/wandering, go to bed.
            const bed = this.findNearest(agent, BuildingType.STAFF_QUARTERS, state.grid);
            if (bed !== null) {
                this.goTo(agent, bed, 0, 'sys_sleep', state.grid);
                return;
            } else {
                // No bed? Just sleep on the floor where you are?
                // Or wander near a fire? For now, let's just STAND STILL or wander nearby if no bed.
                // But better to try to sleep.
                // If we can't find a bed, we might just sleep on the spot if we are tired enough?
                // For "All agents must go to bed", we assume beds exist. If not, they might complain.
                if (agent.state === 'IDLE') {
                    // Try to find ANY shelter? Or just sleep on ground.
                    // Let's make them sleep on the ground if no bed found at night.
                    agent.state = 'SLEEPING'; // Forced sleep on ground
                    return;
                }
            }
        }

        // --- PRIORITY 1: Deposit Resources (Inventory Full or Holding Resources while Idle) ---
        if (agent.inventory && agent.inventory.amount > 0) {
            // If full OR if we are idle and holding stuff (finish up logic)
            // But NOT if it's night (already handled above, but for safety)
            if (!isNight && (agent.inventory.amount >= agent.inventory.capacity || agent.state === 'IDLE')) {
                const storage = this.findNearestStorage(agent, state.grid);
                if (storage !== null) {
                    this.goTo(agent, storage, 0, 'sys_deposit', state.grid);
                    return;
                }
            }
        }

        // --- PRIORITY 2: Manual Commands ---
        if (agent.currentJobId?.startsWith('manual_')) {
            if (agent.state === 'MOVING') return;
        }

        // --- PRIORITY 3: Critical Needs (Daytime) ---
        // At night, we sleep regardless of energy level
        if (!isNight) {
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
        }

        // --- PRIORITY 4: Work (Construction, Digging, Mining) ---
        // Only work during the day
        if (!isNight) {
            // Find highest priority available job
            const availableJob = state.jobs
                .filter(j => !j.assignedAgentId || j.assignedAgentId === agent.id)
                .sort((a, b) => b.priority - a.priority)[0];

            if (availableJob) {
                // CLAIM JOB
                availableJob.assignedAgentId = agent.id;
                // console.log(`[Agent ${agent.name}] Taking job: ${availableJob.id} (${availableJob.type}) at ${availableJob.targetTileId}`);
                this.goTo(agent, availableJob.targetTileId, availableJob.layer || 0, availableJob.id, state.grid);
                return;
            }
        }

        // --- PRIORITY 5: Idleness / Wander ---
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

            case 'DEPOSITING':
                this.performDeposit(agent, state);
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
            else if (agent.currentJobId === 'sys_deposit') agent.state = 'DEPOSITING';
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

    private performDeposit(agent: Agent, state: GameState): void {
        if (agent.inventory.amount > 0 && agent.inventory.type) {
            const type = agent.inventory.type;
            const amount = Math.floor(agent.inventory.amount);

            // Add to global resources
            if (type === 'minerals') state.resources.minerals += amount;
            else if (type === 'gems') state.resources.gems += amount;
            else if (type === 'wood') state.resources.wood += amount;
            else if (type === 'stone') state.resources.stone += amount;

            // Clear inventory
            agent.inventory.amount = 0;
            agent.inventory.type = null;

            // Audio & FX
            const tileId = Math.floor(agent.z) * GRID_SIZE + Math.floor(agent.x);
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_COIN });
            state.newsFeed.unshift({
                id: `dep_${Date.now()}_${agent.id}`,
                headline: `${agent.name} deposited ${amount} ${type}.`,
                type: 'NEUTRAL',
                timestamp: Date.now()
            });
        }
        this.finishActivity(agent, state);
    }

    private performWork(agent: Agent, state: GameState, dt: number): void {
        const jobIdx = state.jobs.findIndex(j => j.id === agent.currentJobId);
        if (jobIdx === -1) {
            this.finishActivity(agent, state);
            return;
        }

        const job = state.jobs[jobIdx];
        const tile = state.grid[job.targetTileId];

        // Check Inventory Capacity First for Gathering Jobs
        if (job.type === 'MINE') {
            if (agent.inventory.amount >= agent.inventory.capacity) {
                // Inventory Full! Stop working and deposit.
                // We do NOT cancel the job, we just stop working on it for now.
                // Reset assignment so someone else can take it or we come back later.
                job.assignedAgentId = null;
                this.finishActivity(agent, state);
                return;
            }
        }

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
            const workAmount = dt * (1 + agent.skills.mining / 5); // Base work speed
            // Yield per second roughly correlates to work amount
            const yieldAmt = 20 * workAmount;

            if (job.layer !== undefined && job.layer < 0) {
                // Underground Mining
                agent.inventory.type = 'minerals';
                agent.inventory.amount = Math.min(agent.inventory.capacity, agent.inventory.amount + yieldAmt);

                const strata = tile.underground?.[job.layer];
                if (strata) {
                    strata.excavated = true;
                    state.pendingEffects.push({ type: 'GRID_UPDATE', updates: [tile] });
                }
                state.pendingEffects.push({ type: 'FX', fxType: 'MINING', index: tile.id });
                state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.MINING_HIT });
            } else {
                // Surface Mining/Harvesting
                const foliage = tile.foliage as any;
                let resType: 'minerals' | 'stone' | 'wood' | null = null;

                if (foliage === 'GOLD_VEIN') resType = 'minerals';
                else if (HARVESTABLE_ROCKS.includes(foliage)) resType = 'stone';
                else if (HARVESTABLE_TREES.includes(foliage)) resType = 'wood';

                if (resType) {
                    // Check if we are mixing types (not allowed, simple inventory)
                    if (agent.inventory.type && agent.inventory.type !== resType && agent.inventory.amount > 0) {
                        // Stop to deposit first
                        job.assignedAgentId = null;
                        this.finishActivity(agent, state);
                        return;
                    }

                    // 1. Initialize Progress
                    if (!job.progress) job.progress = 0;

                    // 2. Add Progress
                    job.progress += 20 * (1 + agent.skills.mining / 5);

                    // 3. Add to Inventory partial amount
                    agent.inventory.type = resType;
                    agent.inventory.amount = Math.min(agent.inventory.capacity, agent.inventory.amount + yieldAmt);

                    // Feedback
                    state.pendingEffects.push({ type: 'FX', fxType: resType === 'wood' ? 'FARM' : 'MINING', index: tile.id });

                    // 4. Check Completion
                    if (job.progress >= 100) {
                        tile.foliage = 'NONE' as any;
                        tile.markedForHarvest = false;
                        state.pendingEffects.push({ type: 'GRID_UPDATE', updates: [tile] });

                        // Skill XP
                        agent.skills.mining += 0.5;

                        state.jobs.splice(jobIdx, 1);
                        this.finishActivity(agent, state);
                    }
                } else {
                    // Invalid target (foliage gone?), abort
                    state.jobs.splice(jobIdx, 1);
                    this.finishActivity(agent, state);
                }
            }
        }
        else {
            // Already finished or site removed
            state.jobs.splice(jobIdx, 1);
            this.finishActivity(agent, state);
        }
    }

    private getRandomNearby(agent: Agent): number {
        const range = 6;
        const rx = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(agent.x + (Math.random() - 0.5) * range * 2)));
        const rz = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(agent.z + (Math.random() - 0.5) * range * 2)));
        return rz * GRID_SIZE + rx;
    }
}
