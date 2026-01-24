
import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState, Job, GridTile, BuildingType } from '../../../types';

export class JobGenerationSystem extends BaseSimSystem {
    readonly id = 'job_generation';
    readonly priority = 10; // Run early to ensure work is available

    private lastRunTime = 0;
    private readonly RUN_INTERVAL = 0.5; // Run every 0.5 seconds

    tick(ctx: FixedContext, state: GameState): void {
        const grid = state.grid;
        if (!grid) return;

        // Throttle to avoid per-frame grid scanning
        if (ctx.time - this.lastRunTime < this.RUN_INTERVAL) return;
        this.lastRunTime = ctx.time;

        const jobs = state.jobs;

        // Clean up completed or invalid jobs first
        this.cleanupJobs(jobs, grid);

        for (let i = 0; i < grid.length; i++) {
            const tile = grid[i];

            // 1. GENERATE CONSTRUCTION JOBS
            if (tile.isUnderConstruction && (tile.structureHeadIndex === undefined || tile.id === tile.structureHeadIndex)) {
                this.ensureJob(jobs, `build_${tile.id}`, 'BUILD', tile.id, 90, 0);
            }

            // 2. GENERATE DIGGING JOBS
            if (tile.digState) {
                for (const layerStr in tile.digState) {
                    const layer = parseInt(layerStr);
                    const status = tile.digState[layer];
                    if (status === 1 || status === 4) { // 1 = Tunnel, 4 = Entrance
                        this.ensureJob(jobs, `dig_${tile.id}_${layer}`, 'DIG', tile.id, 80, layer);
                    }
                }
            }

            // 3. GENERATE SURFACE MINING JOBS
            if (tile.foliage === 'GOLD_VEIN') {
                this.ensureJob(jobs, `mine_surf_${tile.id}`, 'MINE', tile.id, 70, 0);
            }

            // 4. GENERATE UNDERGROUND MINING JOBS
            if (tile.underground) {
                for (let layer = -1; layer >= -10; layer--) {
                    const strata = tile.underground[layer];
                    if (strata && strata.oreType && strata.oreVisible && !strata.excavated) {
                        this.ensureJob(jobs, `mine_under_${tile.id}_${layer}`, 'MINE', tile.id, 75, layer);
                    }
                }
            }
        }
    }

    private ensureJob(jobs: Job[], id: string, type: any, targetTileId: number, priority: number, layer: number): void {
        const exists = jobs.some(j => j.id === id);
        if (!exists) {
            jobs.push({
                id,
                type,
                targetTileId,
                priority,
                layer,
                assignedAgentId: null
            });
        }
    }

    private cleanupJobs(jobs: Job[], grid: GridTile[]): void {
        for (let i = jobs.length - 1; i >= 0; i--) {
            const job = jobs[i];
            const tile = grid[job.targetTileId];
            if (!tile) {
                jobs.splice(i, 1);
                continue;
            }

            let valid = true;
            if (job.type === 'BUILD') {
                if (!tile.isUnderConstruction) valid = false;
            } else if (job.type === 'DIG') {
                if (!tile.digState || (tile.digState[job.layer || 0] !== 1 && tile.digState[job.layer || 0] !== 4)) valid = false;
            } else if (job.type === 'MINE') {
                if (job.layer === 0 || job.layer === undefined) {
                    if (tile.foliage !== 'GOLD_VEIN') valid = false;
                } else {
                    const strata = tile.underground?.[job.layer];
                    if (!strata || !strata.oreType || strata.excavated) valid = false;
                }
            }

            if (!valid) {
                jobs.splice(i, 1);
            }
        }
    }
}
