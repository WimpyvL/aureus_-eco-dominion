
import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState, Job, GridTile, BuildingType, Chunk } from '../../../types';
import { isHarvestable, HARVESTABLE_TREES, HARVESTABLE_ROCKS } from '../../utils/GameUtils';
import { ChunkStore } from '../../space/ChunkStore';

export class JobGenerationSystem extends BaseSimSystem {
    readonly id = 'job_generation';
    readonly priority = 10;

    private lastRunTime = 0;
    private readonly RUN_INTERVAL = 0.5; // Throttle to every 0.5s for performance

    tick(ctx: FixedContext, state: GameState): void {
        const chunks = state.chunks;
        if (!chunks) return;

        if (ctx.time - this.lastRunTime < this.RUN_INTERVAL) return;
        this.lastRunTime = ctx.time;

        const jobs = state.jobs;

        // Clean up completed or invalid jobs First
        this.cleanupJobs(jobs, chunks);

        // Auto-mark resources near specialized buildings
        this.autoMarkResources(state);

        // Pre-calculate structures with clearing jobs
        const coordsWithClearingJobs = new Set<string>();
        for (const j of jobs) {
            if (j.type === 'MINE' && j.id.startsWith('clear_site_')) {
                coordsWithClearingJobs.add(`${j.targetX},${j.targetZ}`);
            }
        }

        // Scan ALL chunks for work
        for (const chunk of Object.values(chunks)) {
            for (const tile of chunk.tiles) {
                const tx = tile.x;
                const tz = tile.z;

                // 1. CONSTRUCTION SITES
                if (tile.isUnderConstruction) {
                    if (tile.foliage && tile.foliage !== 'NONE') {
                        this.ensureJob(jobs, `clear_site_${tx}_${tz}`, 'MINE', tx, tz, 95);
                    } else {
                        // Only spawn build jobs on the HEAD
                        if (tile.structureHeadX === undefined || (tile.structureHeadX === tx && tile.structureHeadZ === tz)) {
                            const isBlocked = coordsWithClearingJobs.has(`${tx},${tz}`);
                            if (!isBlocked) {
                                for (let j = 0; j < 3; j++) {
                                    this.ensureJob(jobs, `build_${tx}_${tz}_${j}`, 'BUILD', tx, tz, 90);
                                }
                            }
                        }
                    }
                }

                // 2. SURFACE MINING
                const isGold = tile.foliage === 'GOLD_VEIN';
                const canHarvest = isHarvestable(tile.foliage);

                if (canHarvest && tile.markedForHarvest) {
                    this.ensureJob(jobs, `mine_surf_${tx}_${tz}`, 'MINE', tx, tz, 85);
                } else if (isGold) {
                    this.ensureJob(jobs, `mine_surf_${tx}_${tz}`, 'MINE', tx, tz, 70);
                }
            }
        }
    }

    private ensureJob(jobs: Job[], id: string, type: any, tx: number, tz: number, priority: number): void {
        const exists = jobs.some(j => j.id === id);
        if (!exists) {
            jobs.push({
                id,
                type,
                targetX: tx,
                targetZ: tz,
                priority,
                assignedAgentId: null
            });
        }
    }

    private cleanupJobs(jobs: Job[], chunks: Record<string, Chunk>): void {
        for (let i = jobs.length - 1; i >= 0; i--) {
            const job = jobs[i];
            const tile = ChunkStore.getTile(chunks, job.targetX, job.targetZ);

            if (!tile) {
                jobs.splice(i, 1);
                continue;
            }

            let valid = true;
            if (job.type === 'BUILD') {
                if (!tile.isUnderConstruction) valid = false;
            } else if (job.type === 'MINE') {
                if (tile.foliage !== 'GOLD_VEIN' && !isHarvestable(tile.foliage)) valid = false;
                if (tile.foliage !== 'GOLD_VEIN' && !tile.markedForHarvest) valid = false;
            }

            if (!valid) {
                jobs.splice(i, 1);
            }
        }
    }

    private autoMarkResources(state: GameState): void {
        const radius = 12;

        for (const chunk of Object.values(state.chunks)) {
            for (const tile of chunk.tiles) {
                const type = tile.buildingType;
                if (tile.isUnderConstruction) continue;

                let targetType: 'WOOD' | 'STONE' | null = null;
                if (type === BuildingType.SAWMILL) targetType = 'WOOD';
                else if (type === BuildingType.STONE_QUARRY) targetType = 'STONE';

                if (!targetType) continue;

                // Scan area around building
                for (let dz = -radius; dz <= radius; dz++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const nx = tile.x + dx;
                        const nz = tile.z + dz;

                        const nTile = ChunkStore.getTile(state.chunks, nx, nz);
                        if (!nTile) continue;

                        if (nTile.foliage && nTile.foliage !== 'NONE' && !nTile.markedForHarvest) {
                            const f = nTile.foliage as any;
                            if (targetType === 'WOOD' && HARVESTABLE_TREES.includes(f)) {
                                nTile.markedForHarvest = true;
                            } else if (targetType === 'STONE' && HARVESTABLE_ROCKS.includes(f)) {
                                nTile.markedForHarvest = true;
                            }
                        }
                    }
                }
            }
        }
    }
}
