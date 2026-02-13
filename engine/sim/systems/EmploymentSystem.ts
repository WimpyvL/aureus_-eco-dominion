
import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState, BuildingType, Agent, Chunk } from '../../../types';

/**
 * EmploymentSystem manages persistent job assignments.
 * It connects unemployed agents to built workplaces like Sawmills and Quarries.
 */
export class EmploymentSystem extends BaseSimSystem {
    readonly id = 'employment';
    readonly priority = 40; // High priority to ensure jobs are assigned before AI runs

    private lastCheckTime = 0;
    private readonly CHECK_INTERVAL = 2.0; // Check for employment every 2 seconds

    tick(ctx: FixedContext, state: GameState): void {
        if (ctx.time - this.lastCheckTime < this.CHECK_INTERVAL) return;
        this.lastCheckTime = ctx.time;

        const { agents, chunks } = state;
        if (!agents || !chunks) return;

        // 1. Identify all active buildings that require staff
        const workplaces = this.findWorkplaces(chunks);

        // 2. Clear out dead or invalid workplace references from agents
        this.validateCurrentEmployees(agents, chunks);

        // 3. Find Unemployed Agents
        const unemployed = agents.filter(a => !a.profession || a.profession === 'UNEMPLOYED');
        if (unemployed.length === 0) return;

        // 4. Match Unemployed Agents to Vacant Workplaces
        for (const workplace of workplaces) {
            if (unemployed.length === 0) break;

            // Check if anyone is already assigned to this workplace
            const isOccupied = agents.some(a =>
                a.workPlaceX === workplace.x && a.workPlaceZ === workplace.z
            );

            if (!isOccupied) {
                const agent = unemployed.shift()!;
                this.assignJob(agent, workplace, state, ctx);
            }
        }
    }

    private findWorkplaces(chunks: Record<string, Chunk>) {
        const results: { x: number, z: number, type: BuildingType }[] = [];
        for (const chunk of Object.values(chunks)) {
            for (const tile of chunk.tiles) {
                // Building must be fully built
                if (tile.buildingType !== BuildingType.EMPTY && !tile.isUnderConstruction) {
                    if (this.isProfessionalWorkplace(tile.buildingType)) {
                        // Only count the HEAD of multi-tile buildings to avoid double-counting
                        if (tile.structureHeadX === undefined || (tile.structureHeadX === tile.x && tile.structureHeadZ === tile.z)) {
                            results.push({ x: tile.x, z: tile.z, type: tile.buildingType });
                        }
                    }
                }
            }
        }
        return results;
    }

    private isProfessionalWorkplace(type: BuildingType): boolean {
        return [
            BuildingType.SAWMILL,
            BuildingType.STONE_QUARRY,
            BuildingType.WASH_PLANT,
            BuildingType.MINING_HEADFRAME,
            BuildingType.ORE_FOUNDRY,
            BuildingType.WORKSHOP
        ].includes(type);
    }

    private validateCurrentEmployees(agents: Agent[], chunks: Record<string, Chunk>) {
        for (const agent of agents) {
            if (agent.workPlaceX !== null && agent.workPlaceX !== undefined) {
                // Check if building still exists at location
                const tile = this.getTile(chunks, agent.workPlaceX, agent.workPlaceZ!);
                if (!tile || tile.buildingType === BuildingType.EMPTY || tile.isUnderConstruction) {
                    // workplace gone or under construction (e.g. bulldozed)
                    agent.profession = 'UNEMPLOYED';
                    agent.workPlaceX = null;
                    agent.workPlaceZ = null;
                }
            }
        }
    }

    private assignJob(agent: Agent, workplace: { x: number, z: number, type: BuildingType }, state: GameState, ctx: FixedContext) {
        let role = 'WORKER';
        switch (workplace.type) {
            case BuildingType.SAWMILL: role = 'LUMBERJACK'; break;
            case BuildingType.STONE_QUARRY: role = 'QUARRYMAN'; break;
            case BuildingType.WASH_PLANT:
            case BuildingType.MINING_HEADFRAME:
            case BuildingType.ORE_FOUNDRY:
                role = 'MINER'; break;
            case BuildingType.WORKSHOP: role = 'ENGINEER'; break;
        }

        agent.profession = role;
        agent.type = role as any; // Update legacy type field as well
        agent.workPlaceX = workplace.x;
        agent.workPlaceZ = workplace.z;

        state.newsFeed.unshift({
            id: ctx.getNextId?.('job') || `job_${Date.now()}`,
            headline: `${agent.name} has been hired at the ${workplace.type}!`,
            type: 'POSITIVE',
            timestamp: state.tickCount
        });
    }

    private getTile(chunks: Record<string, Chunk>, x: number, z: number) {
        const cx = Math.floor(x / 16);
        const cz = Math.floor(z / 16);
        const chunk = chunks[`${cx},${cz}`];
        if (!chunk) return null;
        const lx = ((x % 16) + 16) % 16;
        const lz = ((z % 16) + 16) % 16;
        return chunk.tiles[lz * 16 + lx];
    }
}
