
import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { Agent, GameState, BuildingType, PathStep } from '../../../types';
import { findPath } from '../algorithms/Pathfinding';
import { PathPool } from '../../utils/PathPool';

const CONFIG = {
    MAX_NPCS: 10,
    SPEED: 2.5, // Slightly slower than workers
    THINK_INTERVAL: 60, // Think once per second (at 60fps)
    WANDER_RADIUS: 10,
};

export class AmbientNPCSystem extends BaseSimSystem {
    readonly id = 'ambient_npcs';
    readonly priority = 90; // Run after main agent system
    private tickCounter = 0;

    tick(ctx: FixedContext, state: GameState): void {
        this.tickCounter++;

        // 1. Ensure NPCs exist
        this.ensureNPCs(ctx, state);

        const { ambientNpcs } = state;
        if (!ambientNpcs) return;

        for (let i = 0; i < ambientNpcs.length; i++) {
            const npc = ambientNpcs[i];

            // 2. AI: Decide where to go if idle
            if (npc.state === 'IDLE' && this.tickCounter % CONFIG.THINK_INTERVAL === 0) {
                this.updateAI(ctx, npc, state);
            }

            // 3. Movement execution
            this.executeMovement(ctx, npc, state);

            // 4. Visual synchronization
            npc.visualX = npc.x;
            npc.visualZ = npc.z;
        }
    }

    private ensureNPCs(ctx: FixedContext, state: GameState): void {
        if (!state.ambientNpcs) state.ambientNpcs = [];
        
        // Only spawn if we have some buildings (a "town")
        const agentsCount = state.agents.length;
        if (agentsCount === 0) return;

        if (state.ambientNpcs.length < CONFIG.MAX_NPCS) {
            // Spawn one NPC if enough ticks passed or initially
            if (this.tickCounter % 300 === 0 || state.ambientNpcs.length === 0) {
                const spawnX = state.spawnX + (Math.random() - 0.5) * 10;
                const spawnZ = state.spawnZ + (Math.random() - 0.5) * 10;
                
                state.ambientNpcs.push(this.createNPC(ctx, spawnX, spawnZ));
            }
        }
    }

    private createNPC(ctx: FixedContext, x: number, z: number): Agent {
        const id = ctx.getNextId ? ctx.getNextId('npc') : `npc_${Date.now()}_${Math.random()}`;
        const names = ['Citizen', 'Visitor', 'Traveler', 'Townie', 'Bystander'];
        const name = names[Math.floor(Math.random() * names.length)] + " " + Math.floor(Math.random() * 100);

        return {
            id,
            name,
            type: 'CITIZEN',
            x,
            z: z,
            visualX: x,
            visualZ: z,
            layer: 0,
            state: 'IDLE',
            energy: 100,
            hunger: 100,
            mood: 100,
            skills: { mining: 0, construction: 0, plants: 0, intelligence: 0 },
            currentJobId: null,
            targetX: null,
            targetZ: null,
            path: null,
            inventory: { type: null, amount: 0, capacity: 0 }
        };
    }

    private updateAI(ctx: FixedContext, npc: Agent, state: GameState): void {
        // 20% chance to start moving if idle
        if (Math.random() > 0.2) return;

        // Pick a destination: either a random building or a random nearby spot
        const buildings = this.getAllBuildings(state);
        let targetX: number, targetZ: number;

        if (buildings.length > 0 && Math.random() < 0.7) {
            // Go to a building
            const b = buildings[Math.floor(Math.random() * buildings.length)];
            targetX = b.x;
            targetZ = b.z;
        } else {
            // Wander randomly
            targetX = Math.floor(npc.x + (Math.random() - 0.5) * CONFIG.WANDER_RADIUS * 2);
            targetZ = Math.floor(npc.z + (Math.random() - 0.5) * CONFIG.WANDER_RADIUS * 2);
        }

        this.goTo(npc, targetX, targetZ, state);
    }

    private getAllBuildings(state: GameState): { x: number, z: number }[] {
        const list: { x: number, z: number }[] = [];
        for (const chunk of Object.values(state.chunks)) {
            for (const tile of (chunk as any).tiles) {
                if (tile.buildingType !== BuildingType.EMPTY && !tile.isUnderConstruction) {
                    list.push({ x: tile.x, z: tile.z });
                }
            }
        }
        return list;
    }

    private goTo(npc: Agent, tx: number, tz: number, state: GameState): void {
        if (Math.floor(npc.x) === tx && Math.floor(npc.z) === tz) return;

        try {
            const path = findPath(Math.floor(npc.x), Math.floor(npc.z), tx, tz, state.chunks);
            if (path && path.length > 0) {
                if (npc.path) PathPool.release(npc.path);
                npc.path = path;
                npc.state = 'MOVING';
                npc.targetX = tx;
                npc.targetZ = tz;
            }
        } catch (e) {
            // Pathfinding failed, stay idle
        }
    }

    private executeMovement(ctx: FixedContext, npc: Agent, state: GameState): void {
        if (npc.state !== 'MOVING' || !npc.path || npc.path.length === 0) {
            if (npc.state === 'MOVING') {
                npc.state = 'IDLE';
                if (npc.path) PathPool.release(npc.path);
                npc.path = null;
            }
            return;
        }

        const dt = ctx.fixedDt;
        const next = npc.path[0];
        const dx = next.x - npc.x;
        const dz = next.z - npc.z;
        const distSq = dx * dx + dz * dz;
        const frameStep = CONFIG.SPEED * dt;

        if (distSq < (frameStep * frameStep)) {
            npc.x = next.x;
            npc.z = next.z;
            npc.path.shift();
            if (npc.path.length === 0) {
                PathPool.release(npc.path);
                npc.path = null;
                npc.state = 'IDLE';
            }
        } else {
            const dist = Math.sqrt(distSq);
            npc.x += (dx / dist) * frameStep;
            npc.z += (dz / dist) * frameStep;
        }
    }
}
