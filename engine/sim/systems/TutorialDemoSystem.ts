import { BaseSimSystem } from '../Simulation';
import { GameState, GameStep, BuildingType, SfxType, Era, GameCommand, GridTile } from '../../../types';
import { FixedContext, CommandContext, CommandResult } from '../../kernel/Types';
import { BUILDINGS } from '../../data/VoxelConstants';
import { ChunkStore } from '../../space/ChunkStore';
import { worldToChunk, CHUNK_SIZE } from '../../utils/coords';
import { updateWaterConnectivity } from '../../utils/GameUtils';

interface DemoTask {
    delay: number;
    run: (ctx: FixedContext, state: GameState) => void;
}

interface DemoBuilding {
    type: BuildingType;
    maxLevel: number;
    name: string;
}

const ALL_ERAS: Era[] = [
    Era.SETTLEMENT,
    Era.GROWTH,
    Era.INDUSTRY,
    Era.SUSTAINABILITY,
    Era.PROSPERITY,
];

export class TutorialDemoSystem extends BaseSimSystem {
    readonly id = 'tutorial_demo';
    readonly priority = 200;

    private tasks: DemoTask[] = [];
    private elapsedSinceStart = 0;
    private hasStarted = false;
    private priorCheatsEnabled = false;

    handleCommand(cmd: GameCommand, _ctx: CommandContext, state: GameState): CommandResult | null {
        if (cmd.type !== 'START_DEMO') return null;

        this.tasks = [];
        this.elapsedSinceStart = 0;
        this.hasStarted = false;
        this.priorCheatsEnabled = state.cheatsEnabled;

        state.step = GameStep.DEMO;
        state.gameOver = false;
        state.selectedBuilding = null;
        state.selectedAgentId = null;
        state.interactionMode = 'INSPECT';
        state.newsFeed = [];
        state.activeGoal = null;
        state.ui.lastCommandResult = null;
        state.debug.commandTrace = [];
        state.isLoading = true;
        state.loadingMessage = 'Preparing demo colony...';

        // Demo mode should be deterministic and not fail on inventory or era gating.
        state.cheatsEnabled = true;
        state.currentEra = Era.PROSPERITY;
        state.unlockedEras = [...ALL_ERAS];

        return { ok: true };
    }

    tick(ctx: FixedContext, state: GameState): void {
        if (state.step !== GameStep.DEMO) {
            this.hasStarted = false;
            this.tasks = [];
            this.elapsedSinceStart = 0;
            return;
        }

        if (!this.hasStarted) {
            this.startDemoSequence(ctx, state);
            this.hasStarted = true;
        }

        this.elapsedSinceStart += ctx.fixedDt;

        for (let i = this.tasks.length - 1; i >= 0; i--) {
            const task = this.tasks[i];
            if (this.elapsedSinceStart >= task.delay) {
                task.run(ctx, state);
                this.tasks.splice(i, 1);
            }
        }
    }

    private startDemoSequence(ctx: FixedContext, state: GameState): void {
        this.tasks = [];
        this.elapsedSinceStart = 0;

        this.notify(ctx, state, 'INITIALIZING SOLARIS DEMO SEQUENCE...', 'NEUTRAL');

        const buildables = this.getDemoBuildings();
        const cellWidth = 10;
        const cellHeight = 8;
        const buildingColumns = 3;
        const maxLevels = Math.max(...buildables.map((building) => building.maxLevel));
        const sectionWidth = (maxLevels * cellWidth) + 4;
        const sectionRows = Math.ceil(buildables.length / buildingColumns);
        const showcaseWidth = (buildingColumns * sectionWidth) + 2;
        const showcaseHeight = (sectionRows * cellHeight) + 2;
        const showcaseOrigin = this.findShowcaseOrigin(state, showcaseWidth, showcaseHeight);
        const originX = showcaseOrigin.x;
        const originZ = showcaseOrigin.z;
        // Build the full showcase in one batched state write instead of simulating hundreds of user actions.
        this.addTask(0, (taskCtx, taskState) => {
            taskState.loadingMessage = 'Laying infrastructure grid...';
            this.applyShowcaseDirect(taskState, buildables, {
                originX,
                originZ,
                showcaseWidth,
                showcaseHeight,
                buildingColumns,
                sectionWidth,
                cellWidth,
                cellHeight,
                maxLevels,
            });

            taskState.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.COMPLETE });
        });

        this.addTask(0.1, (_taskCtx, taskState) => {
            taskState.loadingMessage = 'Finalizing build showcase...';
        });

        this.addTask(0.6, (taskCtx, taskState) => {
            taskState.cheatsEnabled = this.priorCheatsEnabled;
            taskState.step = GameStep.PLAYING;
            taskState.isLoading = false;
            taskState.loadingMessage = '';
            this.notify(taskCtx, taskState, 'CATALOGUE COMPLETE. ALL BUILDINGS AND UPGRADE TIERS DEPLOYED.', 'POSITIVE');
        });
    }

    private getDemoBuildings(): DemoBuilding[] {
        return Object.entries(BUILDINGS)
            .filter(([type]) => type !== BuildingType.EMPTY && !type.startsWith('D_'))
            .map(([type, def]) => ({
                type: type as BuildingType,
                maxLevel: (def.upgrades?.length || 0) + 1,
                name: def.name,
                era: def.era,
            }))
            .sort((a, b) => {
                const eraOrder = ALL_ERAS.indexOf(a.era) - ALL_ERAS.indexOf(b.era);
                return eraOrder !== 0 ? eraOrder : a.name.localeCompare(b.name);
            })
            .map(({ era, ...building }) => building);
    }

    private findShowcaseOrigin(state: GameState, width: number, height: number): { x: number; z: number } {
        let best = {
            x: state.spawnX - Math.floor(width / 2),
            z: state.spawnZ - Math.floor(height / 2),
            waterTiles: Number.POSITIVE_INFINITY,
        };

        for (let offsetZ = -48; offsetZ <= 48; offsetZ += 8) {
            for (let offsetX = -48; offsetX <= 48; offsetX += 8) {
                const originX = state.spawnX + offsetX;
                const originZ = state.spawnZ + offsetZ;
                let waterTiles = 0;

                for (let z = 0; z < height; z += 4) {
                    for (let x = 0; x < width; x += 4) {
                        const worldX = originX + x;
                        const worldZ = originZ + z;
                        const { cx, cz } = worldToChunk(worldX, worldZ, CHUNK_SIZE);
                        ChunkStore.ensureChunk(state.chunks, cx, cz, state.seed);
                        const tile = ChunkStore.getTile(state.chunks, worldX, worldZ);

                        if (!tile || tile.buildingType === BuildingType.POND) {
                            waterTiles++;
                        }
                    }
                }

                if (waterTiles < best.waterTiles) {
                    best = { x: originX, z: originZ, waterTiles };
                }
            }
        }

        return { x: best.x, z: best.z };
    }

    private addTask(delay: number, run: (ctx: FixedContext, state: GameState) => void): void {
        this.tasks.push({ delay, run });
    }

    private applyShowcaseDirect(
        state: GameState,
        buildables: DemoBuilding[],
        layout: {
            originX: number;
            originZ: number;
            showcaseWidth: number;
            showcaseHeight: number;
            buildingColumns: number;
            sectionWidth: number;
            cellWidth: number;
            cellHeight: number;
            maxLevels: number;
        }
    ): void {
        const affectedChunks = new Map<string, GridTile[]>();
        const {
            originX,
            originZ,
            showcaseWidth,
            showcaseHeight,
            buildingColumns,
            sectionWidth,
            cellWidth,
            cellHeight,
            maxLevels,
        } = layout;

        const touchTile = (x: number, z: number): GridTile => {
            const { cx, cz } = worldToChunk(x, z, CHUNK_SIZE);
            ChunkStore.ensureChunk(state.chunks, cx, cz, state.seed);
            const tile = ChunkStore.getTile(state.chunks, x, z);
            if (!tile) {
                throw new Error(`Demo showcase failed to resolve tile at (${x}, ${z})`);
            }

            const key = `${cx},${cz}`;
            const updates = affectedChunks.get(key);
            if (updates) {
                if (!updates.includes(tile)) updates.push(tile);
            } else {
                affectedChunks.set(key, [tile]);
            }

            const chunk = state.chunks[key];
            if (chunk) {
                chunk.meshDirty = true;
                chunk.simDirty = true;
            }

            return tile;
        };

        // Flatten the showcase area first so we don't waste time fighting occupancy or water placement rules.
        for (let z = -2; z <= showcaseHeight; z++) {
            for (let x = -2; x <= showcaseWidth; x++) {
                const tile = touchTile(originX + x, originZ + z);
                Object.assign(tile, {
                    buildingType: BuildingType.EMPTY,
                    level: 0,
                    isUnderConstruction: false,
                    constructionTimeLeft: 0,
                    structureHeadX: undefined,
                    structureHeadZ: undefined,
                    foliage: 'NONE',
                    markedForHarvest: false,
                    revealed: true,
                    explored: true,
                });
            }
        }

        const placeDirect = (x: number, z: number, type: BuildingType, level: number = 1) => {
            const def = BUILDINGS[type];
            if (!def) return;

            const width = def.width || 1;
            const depth = def.depth || 1;

            for (let dz = 0; dz < depth; dz++) {
                for (let dx = 0; dx < width; dx++) {
                    const tile = touchTile(x + dx, z + dz);
                    Object.assign(tile, {
                        buildingType: type,
                        level,
                        isUnderConstruction: false,
                        constructionTimeLeft: 0,
                        structureHeadX: x,
                        structureHeadZ: z,
                        foliage: 'NONE',
                        markedForHarvest: false,
                        revealed: true,
                        explored: true,
                    });
                }
            }
        };

        for (let x = -1; x <= showcaseWidth; x++) {
            placeDirect(originX + x, originZ - 2, BuildingType.ROAD);
            placeDirect(originX + x, originZ + showcaseHeight, BuildingType.ROAD);
        }

        for (let z = -2; z <= showcaseHeight; z++) {
            placeDirect(originX - 2, originZ + z, BuildingType.ROAD);
        }

        buildables.forEach((building, rowIndex) => {
            const gridColumn = rowIndex % buildingColumns;
            const gridRow = Math.floor(rowIndex / buildingColumns);
            const rowX = originX + (gridColumn * sectionWidth);
            const rowZ = originZ + (gridRow * cellHeight);

            for (let x = -1; x <= (maxLevels * cellWidth); x++) {
                placeDirect(rowX + x, rowZ - 1, BuildingType.ROAD);
            }

            for (let level = 1; level <= building.maxLevel; level++) {
                placeDirect(rowX + ((level - 1) * cellWidth), rowZ, building.type, level);
            }
        });

        updateWaterConnectivity(state.chunks);

        for (const [key, updates] of affectedChunks.entries()) {
            const [cx, cz] = key.split(',').map(Number);
            state.pendingEffects.push({ type: 'CHUNK_UPDATE', cx, cz, updates });
        }
    }

    private notify(ctx: FixedContext, state: GameState, message: string, type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'CRITICAL'): void {
        state.newsFeed.unshift({
            id: ctx.getNextId?.('demo_msg') || `msg_${Date.now()}_${Math.random()}`,
            headline: message,
            type,
            timestamp: state.tickCount
        });
    }

}
