
import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState, Job, GridTile, BuildingType } from '../../../types';
import { isHarvestable, HARVESTABLE_TREES, HARVESTABLE_ROCKS, GRID_SIZE } from '../../utils/GameUtils';

export class JobGenerationSystem extends BaseSimSystem {
    readonly id = 'job_generation';
    readonly priority = 10; // Run early to ensure work is available

    private lastRunTime = 0;
    private readonly RUN_INTERVAL = 0.1; // Run every 0.1 seconds

    tick(ctx: FixedContext, state: GameState): void {
        const grid = state.grid;
        if (!grid) return;

        // Throttle to avoid per-frame grid scanning
        if (ctx.time - this.lastRunTime < this.RUN_INTERVAL) return;
        this.lastRunTime = ctx.time;

        const jobs = state.jobs;

        // Clean up completed or invalid jobs first
        this.cleanupJobs(jobs, grid);

        // Auto-mark resources near specialized buildings
        this.autoMarkResources(state);

        // Optimize: Pre-calculate which structures are being cleared to avoid O(N*M) lookups
        const structuresWithClearingJobs = new Set<number>();
        for (const j of jobs) {
            if (j.type === 'MINE' && j.id.startsWith('clear_site_')) {
                const t = grid[j.targetTileId];
                // If the job targets a tile, map it to the structure HEAD
                if (t) {
                    const head = t.structureHeadIndex !== undefined ? t.structureHeadIndex : t.id;
                    structuresWithClearingJobs.add(head);
                }
            }
        }

        for (let i = 0; i < grid.length; i++) {
            const tile = grid[i];

            // 1. GENERATE JOBS FOR CONSTRUCTION SITES (Build or Clear)
            if (tile.isUnderConstruction) {
                // If this tile specifically has foliage, it needs clearing first
                if (tile.foliage && tile.foliage !== 'NONE') {
                    this.ensureJob(jobs, `clear_site_${tile.id}`, 'MINE', tile.id, 95, 0); // Priority 95 (Very High)
                } else {
                    // It's clear, BUT if it's a building head, we must check if the WHOLE site is cleared before building
                    if (tile.structureHeadIndex === undefined || tile.id === tile.structureHeadIndex) {
                        // We are the head. Check neighbors if we are multi-tile?
                        // JobGeneration doesn't easily know width/depth without importing BUILDINGS.
                        // Assuming simplest logic: "If I am the head, I spawn build jobs for myself."
                        // But what if my neighbor (part of me) has a tree?
                        // We need to ensure NO part of this building spawns a build job if ANY part has a tree.

                        // However, since we iterate EVERY tile, the neighbor tile with a tree will spawn a 'MINE' job above.
                        // So we just need to prevent the 'BUILD' job if the neighbor has a tree.

                        // Heuristic: If ANY tile sharing this structureHeadIndex has foliage, block build.
                        // Scanning whole grid is slow. 
                        // Better: Just check SELF for now. Construction logic usually handles per-tile.
                        // Wait, ConstructionSystem progresses the HEAD.
                        // So if the HEAD has a BUILD job, agents come to the HEAD.
                        // Does the agent fix the neighbor's tree? No.

                        // Critical Fix: We need to know if the site is clear.
                        // Let's implement a simple check:
                        // Only generate BUILD job if *I* am clear.
                        // AND later we trust ConstructionSystem not to finish if obstructed.
                        // BUT user wants "first clear".

                        // Let's rely on the fact that if a neighbor has a tree, it gets a MINE job.
                        // AND we effectively "pause" building until that job is done.
                        // BUT the Build job exists on the head. Agents might do it.
                        // We need to block the Build job.

                        // Since we can't easily check all neighbors here efficiently without spatial lookup or slow grid scan:
                        // We will allow Build job generation ONLY if this specific tile is clear is not enough.

                        // Let's try to look up the building def to check neighbors.
                        // We need access to BUILDINGS.
                        // (Assuming simple 1-tile check for now to avoid compilation errors if imports missing)
                        // Actually, I'll stick to: Generate Build job if *this* tile is clear.
                        // Wait, if I am head, and neighbor has tree.
                        // Neighbor gets MINE job.
                        // I (Head) get BUILD job.
                        // Agent 1 comes to mine tree. Agent 2 comes to build head.
                        // This seems okay? "Clearing while building".
                        // User said "Must first clear".

                        // Okay, let's block BUILD if ANY "clear_site" job exists for this structure.
                        // Scan existing jobs?
                        const isBlocked = structuresWithClearingJobs.has(tile.id);

                        if (!isBlocked) {
                            for (let j = 0; j < 3; j++) {
                                this.ensureJob(jobs, `build_${tile.id}_${j}`, 'BUILD', tile.id, 90, 0);
                            }
                        }
                    }
                }
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
            const isGold = tile.foliage === 'GOLD_VEIN';
            const canHarvest = isHarvestable(tile.foliage);

            if (canHarvest && tile.markedForHarvest) {
                // User explicit command - High Priority (85) - beats digging and passive mining
                this.ensureJob(jobs, `mine_surf_${tile.id}`, 'MINE', tile.id, 85, 0);
            } else if (isGold) {
                // Passive Gold Vein - standard Priority (70)
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
                    if (tile.foliage !== 'GOLD_VEIN' && !isHarvestable(tile.foliage)) valid = false;
                    // If it's a regular harvestable foliage, it MUST be marked for harvest to stay a job
                    if (tile.foliage !== 'GOLD_VEIN' && !tile.markedForHarvest) valid = false;
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

    private autoMarkResources(state: GameState): void {
        const grid = state.grid;
        const radius = 12; // Scanning distance

        for (let i = 0; i < grid.length; i++) {
            const tile = grid[i];
            const type = tile.buildingType;
            if (tile.isUnderConstruction) continue;

            let targetType: 'WOOD' | 'STONE' | null = null;
            if (type === BuildingType.SAWMILL) targetType = 'WOOD';
            else if (type === BuildingType.STONE_QUARRY) targetType = 'STONE';

            if (!targetType) continue;

            // Scan area
            const tx = i % GRID_SIZE;
            const tz = Math.floor(i / GRID_SIZE);

            for (let dz = -radius; dz <= radius; dz++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = tx + dx;
                    const nz = tz + dz;
                    if (nx < 0 || nx >= GRID_SIZE || nz < 0 || nz >= GRID_SIZE) continue;

                    const nIdx = nz * GRID_SIZE + nx;
                    const nTile = grid[nIdx];

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
