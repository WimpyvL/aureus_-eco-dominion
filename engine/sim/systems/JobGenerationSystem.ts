
import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState, Job } from '../../../types';

export class JobGenerationSystem extends BaseSimSystem {
    readonly id = 'job_generation';
    readonly priority = 10; // Run early to ensure work is available

    private lastRunTime = 0;
    private readonly RUN_INTERVAL = 0.5; // Run every 0.5 seconds

    tick(ctx: FixedContext, state: GameState): void {
        const grid = state.grid;
        if (!grid) return;

        // Use the mutable jobs array from state
        // In a pure engine this would be its own structure, but we bridge to React state
        const jobs = state.jobs;

        // 1. GENERATE CONSTRUCTION JOBS
        // Scan grid for tiles under construction
        // Throttle to avoid per-frame grid scanning
        if (ctx.time - this.lastRunTime < this.RUN_INTERVAL) return;
        this.lastRunTime = ctx.time;

        for (let i = 0; i < grid.length; i++) {
            const tile = grid[i];

            if (tile.isUnderConstruction && (tile.structureHeadIndex === undefined || tile.id === tile.structureHeadIndex)) {
                const jobId = `build_${tile.id}`;

                // Check if job exists
                let exists = false;
                for (let j = 0; j < jobs.length; j++) {
                    if (jobs[j].id === jobId) {
                        exists = true;
                        break;
                    }
                }

                if (!exists) {
                    // Create Job
                    const job: Job = {
                        id: jobId,
                        type: 'BUILD',
                        targetTileId: tile.id,
                        priority: 90,
                        assignedAgentId: null
                    };
                    jobs.push(job);
                }
            }
        }
        // 2. GENERATE DIGGING JOBS
        for (let i = 0; i < grid.length; i++) {
            const tile = grid[i];

            // Check legacy digState or new underground designation
            // Assuming digState[layer] == 1 means "Marked for Digging"
            if (tile.digState) {
                for (const layerStr in tile.digState) {
                    const layer = parseInt(layerStr);
                    const status = tile.digState[layer];

                    if (status === 1) { // 1 = Designated/Trench
                        const jobId = `dig_${tile.id}_${layer}`;

                        // Check if job exists
                        let exists = false;
                        for (let j = 0; j < jobs.length; j++) {
                            if (jobs[j].id === jobId) {
                                exists = true;
                                break;
                            }
                        }

                        if (!exists) {
                            const job: Job = {
                                id: jobId,
                                type: 'DIG', // New JobType
                                targetTileId: tile.id,
                                priority: 80, // High priority but below emergency repairs
                                assignedAgentId: null,
                                // Store layer in ID or we need a payload field (Job interface doesn't have one, usually parsed from ID or lookup)
                            };
                            // Add layer metadata if we can, or parse from ID later
                            jobs.push(job);
                        }
                    }
                }
            }
        }
    }
}
