/**
 * Simple Agent System (FORCE RELOAD v1)
 * A streamlined, easy-to-read Finite State Machine for colony agents.
 * This version uses Synchronous Pathfinding for immediate response.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { Agent, GameState, GridTile, BuildingType, SfxType, PathStep, Chunk } from '../../../types';
import { findPath } from '../algorithms/Pathfinding';
import { JobSystem, PathfindResult } from '../../jobs';
import { ConstructionSystem } from './ConstructionSystem';
import { PathPool } from '../../utils/PathPool';
import { ChunkStore } from '../../space/ChunkStore';
import { HARVESTABLE_ROCKS, HARVESTABLE_TREES } from '../../utils/GameUtils';
import { worldToChunk, CHUNK_SIZE } from '../../utils/coords';
import { getEventEnvironmentModifiers, getWeatherGameplayEffects } from '../../weather/weatherModel';

// Configuration
const CONFIG = {
    SPEED: 3.2,            // Reduced from 4.8 for more natural, relaxed movement
    THINK_INTERVAL: 20,    // Slightly slower AI decision cycle
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

    handleCommand(cmd: any, ctx: any, state: GameState): any {
        if (cmd.type === 'COMMAND_AGENT') {
            const { agentId, x, z } = cmd.payload;
            const agent = state.agents.find(a => a.id === agentId);
            if (!agent) return { ok: false, reason: 'Agent not found' };

            // Manual command overrides current activity
            agent.state = 'MOVING';
            agent.targetX = x;
            agent.targetZ = z;
            agent.currentJobId = null;
            if (agent.path) {
                PathPool.release(agent.path);
                agent.path = null;
            }
            return { ok: true };
        }

        if (cmd.type === 'MANUAL_MOVE_AGENT') {
            const { agentId, dx, dz } = cmd.payload;
            const agent = state.agents.find(a => a.id === agentId);
            if (!agent) return { ok: false, reason: 'Agent not found' };

            // Update position immediately
            agent.x += dx;
            agent.z += dz;
            agent.visualX = agent.x;
            agent.visualZ = agent.z;

            // Set state to MANUAL to prevent AI takeover
            agent.state = 'MANUAL';
            agent.currentJobId = null;
            if (agent.path) {
                PathPool.release(agent.path);
                agent.path = null;
            }
            return { ok: true };
        }
        return null;
    }

    tick(ctx: FixedContext, state: GameState): void {
        this.tickCounter++;
        const { agents } = state;
        if (!agents) return;

        for (let i = 0; i < agents.length; i++) {
            const agent = agents[i];
            // Backward compatibility: Initialize inventory if missing
            if (!agent.inventory) {
                agent.inventory = { type: null, amount: 0, capacity: 20 };
            }

            // 1. Update Needs (Decay)
            this.updateNeeds(agent, ctx.fixedDt, state);

            // 1b. Clear pathfinding cooldowns
            if (!agent.unreachableCooldowns) agent.unreachableCooldowns = {};
            for (const key in agent.unreachableCooldowns) {
                if (state.tickCount >= agent.unreachableCooldowns[key]) {
                    delete agent.unreachableCooldowns[key];
                }
            }

            // 2. Decide what to do (AI)
            // Faster thinking for better responsiveness
            if (agent.state === 'IDLE' || this.tickCounter % CONFIG.THINK_INTERVAL === 0) {
                this.updateAI(ctx, agent, state);
            }

            // 3. Act based on current state
            this.executeState(ctx, agent, state);

            // 4. Update Visuals
            agent.visualX = agent.x;
            agent.visualZ = agent.z;
        }
    }

    private updateNeeds(agent: Agent, dt: number, state: GameState): void {
        const weatherEffects = getWeatherGameplayEffects(state.weather);
        const eventEffects = getEventEnvironmentModifiers(state.activeEvents);
        const energyDecayMult = weatherEffects.energyDecayMult * eventEffects.energyDecayMult;

        // Slow decay unless sleeping/eating
        if (agent.state !== 'SLEEPING') agent.energy = Math.max(0, agent.energy - 0.2 * dt * energyDecayMult);
        if (agent.state !== 'EATING') agent.hunger = Math.max(0, agent.hunger - 0.15 * dt);
        agent.mood = Math.max(0, agent.mood - 0.1 * dt);
    }



    private finishActivity(ctx: FixedContext, agent: Agent, state: GameState): void {
        agent.state = 'IDLE';
        agent.currentJobId = null;
        agent.targetX = null;
        agent.targetZ = null;
        if (agent.path) {
            PathPool.release(agent.path);
            agent.path = null;
        }

        // Immediately try to find new work so we don't wait for the next tick interval
        this.updateAI(ctx, agent, state);
    }

    private goTo(agent: Agent, targetX: number, targetZ: number, jobId: string, state: GameState): void {
        const chunks = state.chunks;
        const ax = Math.floor(agent.x);
        const az = Math.floor(agent.z);

        // If we're already there, start the action immediately
        if (ax === targetX && az === targetZ) {
            agent.currentJobId = jobId;
            if (jobId === 'sys_sleep') agent.state = 'SLEEPING';
            else if (jobId === 'sys_eat') agent.state = 'EATING';
            else if (jobId.startsWith('build_') || jobId.includes('mine')) agent.state = 'WORKING';
            else agent.state = 'IDLE';
            return;
        }

        try {
            // DIAGNOSTIC: Check if start and target chunks exist
            const { cx: scx, cz: scz } = worldToChunk(ax, az, CHUNK_SIZE);
            const { cx: tcx, cz: tcz } = worldToChunk(targetX, targetZ, CHUNK_SIZE);

            if (!chunks[`${scx},${scz}`]) {
                console.warn(`[Agent ${agent.name}] START chunk (${scx}, ${scz}) is missing! Pathfinding will likely fail.`);
            }
            if (!chunks[`${tcx},${tcz}`]) {
                console.warn(`[Agent ${agent.name}] TARGET chunk (${tcx}, ${tcz}) is missing! Pathfinding will likely fail.`);
            }

            const path = findPath(ax, az, targetX, targetZ, chunks);
            if (path && path.length > 0) {
                PathPool.release(agent.path);
                agent.path = path;
                agent.state = 'MOVING';
                agent.currentJobId = jobId;
                agent.targetX = targetX;
                agent.targetZ = targetZ;
            } else {
                const targetKey = `${targetX},${targetZ}`;
                console.warn(`[Agent ${agent.name}] Pathfinding failed from (${ax},${az}) to (${targetX}, ${targetZ}). Job: ${jobId}. Cooldown started.`);

                // Set cooldown
                if (!agent.unreachableCooldowns) agent.unreachableCooldowns = {};
                agent.unreachableCooldowns[targetKey] = state.tickCount + 600;

                PathPool.release(agent.path);
                agent.path = null;
                agent.state = 'IDLE';
                // Release job
                if (agent.currentJobId) {
                    const job = state.jobs.find(j => j.id === jobId);
                    if (job) job.assignedAgentId = null;
                }
            }
        } catch (e) {
            console.error(`[AgentSystem] Pathfinding crashed for ${agent.name}:`, e);
            agent.state = 'IDLE';
        }
    }

    private findNearest(agent: Agent, type: BuildingType, chunks: Record<string, Chunk>): { x: number, z: number } | null {
        let bestTarget = null;
        let minDist = Infinity;
        const ax = Math.floor(agent.x);
        const az = Math.floor(agent.z);

        for (const chunk of Object.values(chunks)) {
            for (const tile of (chunk as any).tiles) {
                if (tile.buildingType === type && !tile.isUnderConstruction) {
                    const d = Math.abs(tile.x - ax) + Math.abs(tile.z - az);
                    if (d < minDist) {
                        minDist = d;
                        bestTarget = { x: tile.x, z: tile.z };
                    }
                }
            }
        }
        return bestTarget;
    }

    private findNearestStorage(agent: Agent, chunks: Record<string, Chunk>): { x: number, z: number } | null {
        let bestTarget = null;
        let minDist = Infinity;
        const ax = Math.floor(agent.x);
        const az = Math.floor(agent.z);

        // Valid storage buildings
        // Valid storage buildings
        const storageTypes = [
            BuildingType.STORAGE_DEPOT,
            BuildingType.MINING_HEADFRAME,
            BuildingType.STAFF_QUARTERS,
            BuildingType.SAWMILL,
            BuildingType.STONE_QUARRY,
            BuildingType.WASH_PLANT
        ];

        for (const chunk of Object.values(chunks)) {
            for (const tile of (chunk as any).tiles) {
                if (storageTypes.includes(tile.buildingType) && !tile.isUnderConstruction) {
                    const d = Math.abs(tile.x - ax) + Math.abs(tile.z - az);
                    if (d < minDist) {
                        minDist = d;
                        bestTarget = { x: tile.x, z: tile.z };
                    }
                }
            }
        }

        // Fallback: If no storage exists, return spawn point (center) or assume instant deposit
        if (bestTarget === null) {
            // Find ANY building to deposit at to avoid softlock
            for (const chunk of Object.values(chunks)) {
                for (const tile of (chunk as any).tiles) {
                    if (tile.buildingType !== BuildingType.EMPTY && !tile.isUnderConstruction) {
                        return { x: tile.x, z: tile.z };
                    }
                }
            }
        }

        return bestTarget;
    }

    private updateAI(ctx: FixedContext, agent: Agent, state: GameState): void {
        // Don't interrupt persistent actions (work/eat/sleep) until they are done
        // Unless it's a MOVING state to a job that was stolen or cancelled
        if (['SLEEPING', 'EATING', 'WORKING', 'DEPOSITING', 'MANUAL'].includes(agent.state)) return;

        const isNight = !state.dayNightCycle.isDaytime;

        // --- PRIORITY 0: Night Time Sleep (Mandatory) ---
        if (isNight) {
            // If already sleeping, we handled above. If idle/wandering, go to bed.
            const chunks = state.chunks;
            const bed = this.findNearest(agent, BuildingType.STAFF_QUARTERS, chunks);
            if (bed !== null) {
                this.goTo(agent, bed.x, bed.z, 'sys_sleep', state);
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
                const chunks = state.chunks;
                const storage = this.findNearestStorage(agent, chunks);
                if (storage !== null) {
                    this.goTo(agent, storage.x, storage.z, 'sys_deposit', state);
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
            const chunks = state.chunks;
            if (agent.energy < CONFIG.NEED_CRITICAL) {
                const bed = this.findNearest(agent, BuildingType.STAFF_QUARTERS, chunks);
                if (bed !== null) {
                    this.goTo(agent, bed.x, bed.z, 'sys_sleep', state);
                    return;
                }
            }
            if (agent.hunger < CONFIG.NEED_CRITICAL) {
                const food = this.findNearest(agent, BuildingType.CANTEEN, chunks);
                if (food !== null) {
                    this.goTo(agent, food.x, food.z, 'sys_eat', state);
                    return;
                }
            }
        }

        // --- PRIORITY 4: Work (Construction, Digging, Mining) ---
        // Only work during the day
        if (!isNight) {
            const hasProfession = agent.profession && agent.profession !== 'UNEMPLOYED';

            // Find highest priority available job
            const availableJob = state.jobs
                .filter(j => {
                    const isUnassigned = !j.assignedAgentId || j.assignedAgentId === agent.id;
                    if (!isUnassigned) return false;

                    const targetKey = `${j.targetX},${j.targetZ}`;
                    const isOnCooldown = agent.unreachableCooldowns?.[targetKey] && state.tickCount < agent.unreachableCooldowns[targetKey];
                    if (isOnCooldown) return false;

                    // PROFESSIONAL FILTER: If assigned to a workplace, prioritize nearby jobs
                    if (hasProfession && agent.workPlaceX !== null && agent.workPlaceX !== undefined) {
                        const distToWork = Math.abs(j.targetX - agent.workPlaceX) + Math.abs(j.targetZ - agent.workPlaceZ!);

                        // Professionals only take jobs within a 15-tile radius of their workplace
                        // and only jobs that match their skills
                        if (distToWork > 15) return false;

                        if (agent.profession === 'LUMBERJACK') {
                            // Only chop trees
                            const tile = ChunkStore.getTile(state.chunks, j.targetX, j.targetZ);
                            if (tile && !HARVESTABLE_TREES.includes(tile.foliage as any)) return false;
                        } else if (agent.profession === 'QUARRYMAN') {
                            // Only mine rocks
                            const tile = ChunkStore.getTile(state.chunks, j.targetX, j.targetZ);
                            if (tile && !HARVESTABLE_ROCKS.includes(tile.foliage as any)) return false;
                        }
                    } else if (hasProfession) {
                        // If they have a profession but NO workplace (maybe error state), they act as generalists for now
                    }

                    return true;
                })
                .sort((a, b) => {
                    // Professionals prioritize jobs CLOSER to their workplace
                    if (hasProfession && agent.workPlaceX !== null) {
                        const distA = Math.abs(a.targetX - agent.workPlaceX) + Math.abs(a.targetZ - agent.workPlaceZ!);
                        const distB = Math.abs(b.targetX - agent.workPlaceX) + Math.abs(b.targetZ - agent.workPlaceZ!);
                        if (distA !== distB) return distA - distB;
                    }
                    return b.priority - a.priority;
                })[0];

            if (availableJob) {
                // CLAIM JOB
                availableJob.assignedAgentId = agent.id;
                this.goTo(agent, availableJob.targetX, availableJob.targetZ, availableJob.id, state);
                return;
            }

            // If a professional has NO tasks near their workplace, they go wait AT the workplace
            if (hasProfession && agent.workPlaceX !== null) {
                const distToBuilding = Math.abs(agent.x - agent.workPlaceX) + Math.abs(agent.z - agent.workPlaceZ!);
                if (distToBuilding > 2) {
                    this.goTo(agent, agent.workPlaceX, agent.workPlaceZ!, 'sys_wait_at_work', state);
                    return;
                }
            }
        }

        // --- PRIORITY 5: Idleness / Wander ---
        if (agent.state === 'IDLE' && (ctx.random?.next() ?? Math.random()) < 0.2) {
            const wanderTarget = this.getRandomNearby(ctx, agent);

            // DIAGNOSTIC: Log if we are wandering into an unloaded chunk
            const { cx, cz } = worldToChunk(wanderTarget.x, wanderTarget.z, CHUNK_SIZE);
            if (!state.chunks[`${cx},${cz}`]) {
                console.log(`[Agent ${agent.name}] Attempting to wander into UNLOADED chunk (${cx}, ${cz}). Destination: (${wanderTarget.x}, ${wanderTarget.z})`);
            }

            this.goTo(agent, wanderTarget.x, wanderTarget.z, 'sys_wander', state);
        }
    }

    private executeState(ctx: FixedContext, agent: Agent, state: GameState): void {
        const dt = ctx.fixedDt;
        switch (agent.state) {
            case 'MOVING':
                this.moveAlongPath(ctx, agent, state);
                break;

            case 'SLEEPING':
                agent.energy = Math.min(100, agent.energy + 15 * dt);
                if (agent.energy >= CONFIG.NEED_SATISFIED) this.finishActivity(ctx, agent, state);
                break;

            case 'EATING':
                agent.hunger = Math.min(100, agent.hunger + 20 * dt);
                if (agent.hunger >= CONFIG.NEED_SATISFIED) this.finishActivity(ctx, agent, state);
                break;

            case 'WORKING':
                this.performWork(ctx, agent, state);
                break;

            case 'DEPOSITING':
                this.performDeposit(ctx, agent, state);
                break;
        }
    }

    private moveAlongPath(ctx: FixedContext, agent: Agent, state: GameState): void {
        const dt = ctx.fixedDt;
        if (!agent.path || agent.path.length === 0) {
            // Arrival ceremony: Snap to grid coordinate
            agent.x = Math.round(agent.x);
            agent.z = Math.round(agent.z);

            // Transition to the actual activity we traveled for
            if (agent.currentJobId === 'sys_sleep') agent.state = 'SLEEPING';
            else if (agent.currentJobId === 'sys_eat') agent.state = 'EATING';
            else if (agent.currentJobId === 'sys_deposit') agent.state = 'DEPOSITING';
            else if (agent.currentJobId?.includes('build_') || agent.currentJobId?.includes('mine') || agent.currentJobId?.includes('rehab')) {
                agent.state = 'WORKING';
            }
            else {
                this.finishActivity(ctx, agent, state); // Wander or manual move finished
            }
            return;
        }

        const next = agent.path[0];
        const tx = next.x;
        const tz = next.z;

        const dx = tx - agent.x;
        const dz = tz - agent.z;
        const distSq = dx * dx + dz * dz;
        const frameStep = CONFIG.SPEED * dt;

        // If we reached the horizontal node, we can also instantly snap the layer
        if (distSq < (frameStep * frameStep)) {
            // Snap to node and pop it
            agent.x = tx;
            agent.z = tz;
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

    private performDeposit(ctx: FixedContext, agent: Agent, state: GameState): void {
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
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_COIN });
            state.newsFeed.unshift({
                id: ctx.getNextId?.('dep') || `dep_${Date.now()}_${agent.id}`,
                headline: `${agent.name} deposited ${amount} ${type}.`,
                type: 'NEUTRAL',
                timestamp: state.tickCount
            });
        }
        this.finishActivity(ctx, agent, state);
    }

    private performWork(ctx: FixedContext, agent: Agent, state: GameState): void {
        const dt = ctx.fixedDt;
        const jobIdx = state.jobs.findIndex(j => j.id === agent.currentJobId);
        if (jobIdx === -1) {
            this.finishActivity(ctx, agent, state);
            return;
        }

        const job = state.jobs[jobIdx];
        const chunks = state.chunks;
        const tile = ChunkStore.getTile(chunks, job.targetX, job.targetZ);
        if (!tile) {
            this.finishActivity(ctx, agent, state);
            return;
        }

        if (tile.isUnderConstruction) {
            // Use specialized system to handle multi-tile buildings
            const amount = (1 + agent.skills.construction / 10) * dt;
            const finished = this.constructionSystem.progressConstruction(job.targetX, job.targetZ, amount, state);

            if (finished) {
                state.jobs.splice(jobIdx, 1);
                this.finishActivity(ctx, agent, state);
            }
        } else if (job.type === 'MINE') {
            const workAmount = dt * (1 + agent.skills.mining / 5);
            const yieldAmt = 20 * workAmount;

            // Surface Mining/Harvesting
            const foliage = tile.foliage as any;
            let resType: 'minerals' | 'stone' | 'wood' | null = null;

            if (foliage === 'GOLD_VEIN' || foliage === 'GOLD_VEIN_VAR') resType = 'minerals';
            else if (HARVESTABLE_ROCKS.includes(foliage)) resType = 'stone';
            else if (HARVESTABLE_TREES.includes(foliage)) resType = 'wood';

            if (resType) {
                if (agent.inventory.type && agent.inventory.type !== resType && agent.inventory.amount > 0) {
                    job.assignedAgentId = null;
                    this.finishActivity(ctx, agent, state);
                    return;
                }

                if (!job.progress) job.progress = 0;
                job.progress += 20 * (1 + agent.skills.mining / 5);

                agent.inventory.type = resType;
                agent.inventory.amount = Math.min(agent.inventory.capacity, agent.inventory.amount + yieldAmt);

                state.pendingEffects.push({ type: 'FX', fxType: resType === 'wood' ? 'FARM' : 'MINING', x: job.targetX, z: job.targetZ });

                if (job.progress >= 100) {
                    tile.foliage = 'NONE' as any;
                    tile.markedForHarvest = false;
                    const { cx, cz } = worldToChunk(job.targetX, job.targetZ, CHUNK_SIZE);
                    const chunk = state.chunks[`${cx},${cz}`];
                    if (chunk) {
                        chunk.meshDirty = true;
                        chunk.simDirty = true;
                    }
                    state.pendingEffects.push({ type: 'CHUNK_UPDATE', cx, cz, updates: [tile] });

                    agent.skills.mining += 0.5;
                    state.jobs.splice(jobIdx, 1);
                    this.finishActivity(ctx, agent, state);
                }
            } else {
                state.jobs.splice(jobIdx, 1);
                this.finishActivity(ctx, agent, state);
            }
        } else {
            state.jobs.splice(jobIdx, 1);
            this.finishActivity(ctx, agent, state);
        }
    }

    private getRandomNearby(ctx: FixedContext, agent: Agent): { x: number, z: number } {
        const range = 6;
        const nextRand = () => ctx.random ? ctx.random.next() : Math.random();
        const rx = Math.floor(agent.x + (nextRand() - 0.5) * range * 2);
        const rz = Math.floor(agent.z + (nextRand() - 0.5) * range * 2);
        return { x: rx, z: rz };
    }
}
