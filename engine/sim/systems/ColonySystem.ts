
import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState, BuildingType, SfxType, AgentRole, Agent, Chunk } from '../../../types';
import { createColonist, MAX_AGENTS, CAPACITY_PER_QUARTERS } from '../logic/SimulationLogic';

export class ColonySystem extends BaseSimSystem {
    readonly id = 'colony';
    readonly priority = 30;

    private lastRecruitmentCheck = 0;
    private readonly RECRUITMENT_INTERVAL = 60.0;
    private readonly RECRUITMENT_COST = 200;
    private readonly MIN_TRUST_FOR_RECRUITMENT = 10;
    private readonly MIN_CAPACITY_GAP = 2;

    tick(ctx: FixedContext, state: GameState): void {
        if (ctx.time - this.lastRecruitmentCheck < this.RECRUITMENT_INTERVAL) return;
        this.lastRecruitmentCheck = ctx.time;

        const agents = state.agents;
        const chunks = state.chunks;
        if (!agents || !chunks) return;

        // Recruitment Logic
        const aliveColonists = agents.filter(a => a.type !== 'ILLEGAL_MINER');
        if (aliveColonists.length < MAX_AGENTS) {
            let quarters = 0;
            for (const chunk of Object.values(chunks)) {
                quarters += chunk.tiles.filter(t => t.buildingType === BuildingType.STAFF_QUARTERS && !t.isUnderConstruction).length;
            }

            const capacity = (quarters * CAPACITY_PER_QUARTERS) + 4;
            const availableSlots = capacity - aliveColonists.length;

            if (
                availableSlots >= this.MIN_CAPACITY_GAP &&
                state.resources.agt >= this.RECRUITMENT_COST &&
                state.resources.trust >= this.MIN_TRUST_FOR_RECRUITMENT
            ) {
                state.resources.agt -= this.RECRUITMENT_COST;

                // Spawn at origin (0,0) or near the first agent
                const spawnX = 8;
                const spawnZ = 8;

                const role = this.determineNeededRole(chunks, agents);
                const newAgent = createColonist(spawnX, spawnZ, role, ctx);
                agents.push(newAgent);

                const roleNames: Record<AgentRole, string> = {
                    'WORKER': 'General Worker',
                    'MINER': 'Mining Specialist',
                    'ENGINEER': 'Construction Engineer',
                    'BOTANIST': 'Agricultural Botanist',
                    'SECURITY': 'Security Officer',
                    'ILLEGAL_MINER': 'Infiltrator',
                    'LUMBERJACK': 'Lumberjack',
                    'QUARRYMAN': 'Quarryman',
                    'UNEMPLOYED': 'Unemployed Colonist'
                };

                state.newsFeed.push({
                    id: ctx.getNextId?.('arr') || `arr_${Date.now()}`,
                    headline: `${newAgent.name} has joined as ${roleNames[role]}! (-${this.RECRUITMENT_COST} AGT)`,
                    type: 'POSITIVE',
                    timestamp: state.tickCount
                });

                state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_CLICK });
            } else {
                if ((ctx.random?.next() ?? Math.random()) < 0.1) {
                    let reason = '';
                    if (state.resources.agt < this.RECRUITMENT_COST) {
                        reason = `Recruitment blocked: Need ${this.RECRUITMENT_COST} AGT`;
                    } else if (state.resources.trust < this.MIN_TRUST_FOR_RECRUITMENT) {
                        reason = `Recruitment blocked: Need ${this.MIN_TRUST_FOR_RECRUITMENT} Trust`;
                    } else if (availableSlots < this.MIN_CAPACITY_GAP) {
                        reason = `Recruitment blocked: Build more Staff Quarters`;
                    }

                    if (reason) {
                        state.newsFeed.push({
                            id: ctx.getNextId?.('recruit_fail') || `recruit_fail_${Date.now()}`,
                            headline: reason,
                            type: 'NEGATIVE',
                            timestamp: state.tickCount
                        });
                    }
                }
            }
        }
    }

    private determineNeededRole(chunks: Record<string, Chunk>, agents: Agent[]): AgentRole {
        const roleCounts: Record<AgentRole, number> = {
            'WORKER': 0, 'MINER': 0, 'ENGINEER': 0, 'BOTANIST': 0, 'SECURITY': 0, 'ILLEGAL_MINER': 0,
            'LUMBERJACK': 0, 'QUARRYMAN': 0, 'UNEMPLOYED': 0
        };

        agents.forEach(a => {
            if (a.type !== 'ILLEGAL_MINER') {
                roleCounts[a.type]++;
            }
        });

        // Count buildings across chunks
        let washPlants = 0, recyclingPlants = 0, miningHeadframes = 0, gardens = 0, securityPosts = 0, constructionSites = 0;

        for (const chunk of Object.values(chunks)) {
            for (const tile of chunk.tiles) {
                const type = tile.buildingType;
                if (tile.isUnderConstruction) {
                    constructionSites++;
                    continue;
                }
                if (type === BuildingType.WASH_PLANT) washPlants++;
                else if (type === BuildingType.RECYCLING_PLANT) recyclingPlants++;
                else if (type === BuildingType.MINING_HEADFRAME) miningHeadframes++;
                else if (type === BuildingType.COMMUNITY_GARDEN) gardens++;
                else if (type === BuildingType.SECURITY_POST) securityPosts++;
            }
        }

        const needsMiners = (washPlants + recyclingPlants + miningHeadframes) * 2;
        const needsBotanists = gardens;
        const needsSecurity = securityPosts;
        const needsEngineers = Math.min(5, Math.ceil(constructionSites / 2));

        if (roleCounts.MINER < needsMiners && washPlants > 0) return 'MINER';
        if (roleCounts.ENGINEER < needsEngineers && constructionSites > 0) return 'ENGINEER';
        if (roleCounts.SECURITY < needsSecurity && securityPosts > 0) return 'SECURITY';
        if (roleCounts.BOTANIST < needsBotanists && gardens > 0) return 'BOTANIST';

        return 'WORKER';
    }
}
