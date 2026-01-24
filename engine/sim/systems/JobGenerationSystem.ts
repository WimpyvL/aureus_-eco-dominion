
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
                    // Check if it's a sub-building (underground)
                    let layer: number | undefined = undefined;
                    // If tile has subBuildings, we need to know WHICH one is under construction.
                    // Simplified: If head index is set, we can look at the tile.
                    // But wait, tile.subBuildings is a map.
                    // If isUnderConstruction is true, check if any subBuilding is also under construction?
                    // The tile.isUnderConstruction flag is shared.
                    // We need a smart way to detect layer.
                    // If ViewMode is underground? No, JobSystem runs independently.

                    if (tile.subBuildings) {
                        // Find the layer that matches the construction state?
                        // Actually ConstructionSystem updates tile.isUnderConstruction.
                        // But if we have multiple layers?
                        // For now, heuristic: default to surface layer (undefined/0).
                        // If we want to support underground building jobs, we need to store 'constructionLayer' on the tile
                        // OR infer from `structureHeadIndex`.
                    }

                    // IMPROVEMENT: If the tile is solid earth at layer 0 implies nothing there, but we are constructing? 
                    // Actually, let's look at `subBuildings`.
                    // If tile.buildingType is EMPTY but `subBuildings` has entries, assume underground job?
                    // No, `placeSubBuilding` sets `buildingType` to EMPTY usually? No, it leaves it alone.

                    const job: Job = {
                        id: jobId,
                        type: 'BUILD',
                        targetTileId: tile.id,
                        priority: 90,
                        assignedAgentId: null,
                        layer: layer // Explicitly include layer if found (currently logic defaults to undefined=0)
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

                    if (status === 1 || status === 4) { // 1 = Tunnel, 4 = Entrance
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
