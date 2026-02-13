import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel/Types';
import { GameState, GameStep, BuildingType, SfxType, Era } from '../../../types';
import { BUILDINGS } from '../../data/buildings';
import { ChunkStore } from '../../space/ChunkStore';
import { worldToChunk, CHUNK_SIZE } from '../../utils/coords';


/**
 * TutorialDemoSystem - The Living Simulation
 * Simulates a high-speed "pro-player" build sequence.
 * Buildings are placed individually with logical delays to create a "playing" feel.
 */
export class TutorialDemoSystem extends BaseSimSystem {
    readonly id = 'tutorial-demo';
    readonly priority = -10;

    handleCommand(cmd: any, ctx: any, state: GameState): any {
        if (cmd.type === 'ADVANCE_TUTORIAL') {
            const steps = [
                GameStep.INTRO, GameStep.TUTORIAL_NAV, GameStep.TUTORIAL_MINE,
                GameStep.TUTORIAL_SELL, GameStep.TUTORIAL_BUY, GameStep.TUTORIAL_PLACE,
                GameStep.TUTORIAL_NEEDS, GameStep.TUTORIAL_POWER, GameStep.TUTORIAL_UNDERGROUND,
                GameStep.TUTORIAL_RESEARCH, GameStep.TUTORIAL_ERA, GameStep.DEMO,
                GameStep.PLAYING
            ];
            const idx = steps.indexOf(state.step);
            if (idx !== -1 && idx < steps.length - 1) {
                state.step = steps[idx + 1];
                state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_COIN });
                return { ok: true };
            }
            return { ok: false, reason: 'Already at end' };
        }

        if (cmd.type === 'START_DEMO') {
            state.step = GameStep.DEMO;
            return { ok: true };
        }

        if (cmd.type === 'DISMISS_POPUP') {
            state.eraUnlockedPopup = null;
            return { ok: true };
        }

        return null;
    }

    private stateInitialized = false;
    private timer = 0;
    private taskIndex = 0;
    private tasks: { delay: number; run: (ctx: FixedContext, state: GameState) => void }[] = [];

    tick(ctx: FixedContext, state: GameState): void {
        if (state.step !== GameStep.DEMO) {
            this.stateInitialized = false;
            this.timer = 0;
            this.taskIndex = 0;
            return;
        }

        if (!this.stateInitialized) {
            this.initializeDemo(state);
            this.stateInitialized = true;
        }

        this.timer += ctx.fixedDt;

        if (this.taskIndex < this.tasks.length) {
            const task = this.tasks[this.taskIndex];
            if (this.timer >= task.delay) {
                task.run(ctx, state);
                this.taskIndex++;
                this.timer = 0; // Reset timer for next task delay
            }
        }
    }

    private initializeDemo(state: GameState) {
        state.cheatsEnabled = true;
        // Infinite Demo Resources
        state.resources.agt = 10000000;
        state.resources.minerals = 50000;
        state.resources.gems = 5000;
        state.resources.wood = 50000;
        state.resources.stone = 50000;
        state.resources.eco = 100;
        state.resources.trust = 100;

        state.currentEra = Era.PROSPERITY;
        state.unlockedEras = [Era.SETTLEMENT, Era.GROWTH, Era.INDUSTRY, Era.SUSTAINABILITY, Era.PROSPERITY];

        const cx = state.spawnX || 0;
        const cz = state.spawnZ || 0;
        this.tasks = [];

        const pos = (dx: number, dz: number) => ({ x: cx + dx, z: cz + dz });

        this.addTask(1.0, (c, s) => this.notify(c, s, "DEMO MODE: COMPACT CITY SHOWCASE", "POSITIVE"));
        this.addTask(0.5, (c, s) => this.notify(c, s, "GENERATING URBAN GRID...", "NEUTRAL"));

        // List of buildings to showcase
        const buildingTypes = [
            // Era 1
            BuildingType.STAFF_QUARTERS, BuildingType.CANTEEN, BuildingType.STORAGE_DEPOT,
            BuildingType.WASH_PLANT, BuildingType.SAWMILL, BuildingType.STONE_QUARRY,
            BuildingType.SOLAR_ARRAY, BuildingType.WATER_WELL, BuildingType.WORKSHOP,
            BuildingType.GENERATOR, BuildingType.MINE_SHAFT, BuildingType.FENCE,
            // Era 2
            BuildingType.RECYCLING_PLANT, BuildingType.WIND_TURBINE, BuildingType.SOCIAL_HUB,
            BuildingType.SECURITY_POST, BuildingType.COMMUNITY_GARDEN, BuildingType.MEDICAL_BAY,
            BuildingType.TRAINING_CENTER,
            // Era 3
            BuildingType.MINING_HEADFRAME, BuildingType.ORE_FOUNDRY, BuildingType.GEM_REFINERY,
            BuildingType.DISTRIBUTION_HUB,
            // Era 4 + 5
            BuildingType.RESERVOIR, BuildingType.WASTE_TREATMENT, BuildingType.HYDROPONICS,
            BuildingType.GEOTHERMAL_PLANT, BuildingType.LOCAL_SCHOOL, BuildingType.NATURE_RESERVE,
            BuildingType.MONUMENT, BuildingType.SPACEPORT, BuildingType.SAFARI_LODGE, BuildingType.GREEN_TECH_LAB
        ];

        let currentZ = -30;
        const COL_SPACING = 7;
        const ROW_EXTRA = 2; // Fixed road gap between rows

        // 1. Initial Road Paving (Vertical Arteries)
        this.addTask(0.1, (c, s) => {
            for (let xOff = -15; xOff <= 15; xOff++) {
                if (xOff % COL_SPACING === 0 || xOff === 15 || xOff === -15) {
                    for (let z = -40; z < 180; z++) {
                        this.pushPlacement(c, s, { x: cx + xOff, z: cz + z }, BuildingType.ROAD);
                    }
                }
            }
        });

        buildingTypes.forEach((type, idx) => {
            const def = BUILDINGS[type];
            if (!def) return;

            const w = def.width || 1;
            const d = def.depth || 1;

            // Horizontal Road before row
            this.addTask(0.01, (c, s) => {
                for (let x = -15; x <= 15; x++) {
                    this.pushPlacement(c, s, { x: cx + x, z: cz + currentZ - 1 }, BuildingType.ROAD);
                }
            });

            // Place 4 levels
            for (let level = 1; level <= 4; level++) {
                const offsetX = (level - 1) * COL_SPACING - 11; // More compact
                const tx = cx + offsetX;
                const tz = cz + currentZ;

                this.addTask(0.02, (c, s) => {
                    this.pushPlacement(c, s, { x: tx, z: tz }, type);

                    const head = ChunkStore.getTile(s.chunks, tx, tz);
                    if (head) {
                        head.level = level;
                        head.isUnderConstruction = false;
                        head.constructionTimeLeft = 0;
                        head.powerStatus = 'CONNECTED';
                        head.waterStatus = 'CONNECTED';

                        // Sync parts
                        for (let dz = 0; dz < d; dz++) {
                            for (let dx = 0; dx < w; dx++) {
                                const part = ChunkStore.getTile(s.chunks, tx + dx, tz + dz);
                                if (part) {
                                    part.level = level;
                                    part.isUnderConstruction = false;
                                    part.powerStatus = 'CONNECTED';
                                    part.waterStatus = 'CONNECTED';
                                    const { cx: chx, cz: chz } = worldToChunk(tx + dx, tz + dz, CHUNK_SIZE);
                                    const chunk = s.chunks[`${chx},${chz}`];
                                    if (chunk) chunk.meshDirty = true;
                                }
                            }
                        }
                    }
                });
            }

            currentZ += (d + ROW_EXTRA);
        });

        this.addTask(3.0, (c, s) => {
            s.step = GameStep.PLAYING;
            this.notify(c, s, "SHOWCASE COMPLETE. EXPLORE THE COMPACT CITY.", "POSITIVE");
        });
    }

    private addTask(delay: number, run: (ctx: FixedContext, s: GameState) => void) {
        this.tasks.push({ delay, run });
    }

    private notify(ctx: FixedContext, state: GameState, message: string, type: any): void {
        state.newsFeed.unshift({
            id: ctx.getNextId?.('demo_msg') || `msg_${Date.now()}_${Math.random()}`,
            headline: message,
            type: type,
            timestamp: state.tickCount
        });
    }

    private pushPlacement(ctx: FixedContext, state: GameState, coord: { x: number, z: number }, type: BuildingType): void {
        state.commandQueue.push({
            id: ctx.getNextId?.('demo_cmd') || `demo_${Date.now()}_${type}_${coord.x}_${coord.z}_${Math.random()}`,
            type: 'PLACE_BUILDING',
            payload: { x: coord.x, z: coord.z, buildingType: type, isInstant: true } // Instant build enabled
        });
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BUILD_START });
    }

}
