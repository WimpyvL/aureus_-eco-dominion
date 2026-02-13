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

        if (this.tasks[this.taskIndex]) {
            const task = this.tasks[this.taskIndex];
            if (this.timer >= task.delay) {
                task.run(ctx, state);
                this.taskIndex++;
                this.timer = 0;
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

        this.addTask(1.0, (c, s) => this.notify(c, s, "DEMO MODE: ERA PROGRESSION SHOWCASE", "POSITIVE"));
        this.addTask(0.5, (c, s) => this.notify(c, s, "INITIALIZING SECTORS...", "NEUTRAL"));

        // Define building list
        const allBuildings = [
            // Era 1
            BuildingType.STAFF_QUARTERS, BuildingType.CANTEEN, BuildingType.STORAGE_DEPOT,
            BuildingType.WASH_PLANT, BuildingType.SAWMILL, BuildingType.STONE_QUARRY,
            BuildingType.SOLAR_ARRAY, BuildingType.WATER_WELL, BuildingType.WORKSHOP,
            BuildingType.GENERATOR, BuildingType.MINE_SHAFT, BuildingType.FENCE,
            BuildingType.POND, BuildingType.PIPE, BuildingType.POWER_LINE,
            BuildingType.ROAD, // Explicit road for manual placement checks
            // Era 2
            BuildingType.RECYCLING_PLANT, BuildingType.WIND_TURBINE, BuildingType.SOCIAL_HUB,
            BuildingType.SECURITY_POST, BuildingType.COMMUNITY_GARDEN, BuildingType.MEDICAL_BAY,
            BuildingType.TRAINING_CENTER, BuildingType.STOCKPILE,
            // Era 3
            BuildingType.MINING_HEADFRAME, BuildingType.ORE_FOUNDRY, BuildingType.GEM_REFINERY,
            BuildingType.DISTRIBUTION_HUB, BuildingType.RAIL_LINE,
            // Era 4 + 5
            BuildingType.RESERVOIR, BuildingType.WASTE_TREATMENT, BuildingType.HYDROPONICS,
            BuildingType.GEOTHERMAL_PLANT, BuildingType.LOCAL_SCHOOL, BuildingType.NATURE_RESERVE,
            BuildingType.MONUMENT, BuildingType.SPACEPORT, BuildingType.SAFARI_LODGE, BuildingType.GREEN_TECH_LAB
        ];

        // Valid buildings with definitions
        const validBuildings = allBuildings.filter(t => BUILDINGS[t]);

        // Group by Era
        const byEra: Record<string, BuildingType[]> = {};
        validBuildings.forEach(t => {
            const era = BUILDINGS[t].era;
            if (!byEra[era]) byEra[era] = [];
            byEra[era].push(t);
        });

        let currentZ = -40;
        const ERA_ORDER = [Era.SETTLEMENT, Era.GROWTH, Era.INDUSTRY, Era.SUSTAINABILITY, Era.PROSPERITY];

        // Lay out each Era's block
        ERA_ORDER.forEach(era => {
            const buildings = byEra[era] || [];
            if (buildings.length === 0) return;

            // Notification for Era Text
            this.addTask(1.0, (c, s) => this.notify(c, s, `CONSTRUCTING ERA: ${era}`, "NEUTRAL"));

            // Determine grid size for this Era (approx squareish keying off count)
            const count = buildings.length;
            const cols = 5;
            const rows = Math.ceil(count / cols);

            // Build Roads for this block
            // Vertical roads at edges, Horizontal roads between rows
            const blockHeight = rows * 5; // Approx 5 tiles per building slot (2-3 + spacing)

            // Road Grid
            this.addTask(0.2, (c, s) => {
                // Horizontal Roads
                for (let r = 0; r <= rows; r++) {
                    const z = cz + currentZ + (r * 5);
                    for (let xOff = -15; xOff <= 15; xOff++) {
                        this.pushPlacement(c, s, { x: cx + xOff, z: z }, BuildingType.ROAD);
                    }
                }
                // Vertical Roads
                for (let xOff = -15; xOff <= 15; xOff += 6) {
                    for (let zOff = 0; zOff <= blockHeight; zOff++) {
                        this.pushPlacement(c, s, { x: cx + xOff, z: cz + currentZ + zOff }, BuildingType.ROAD);
                    }
                }
            });

            // Place Buildings in slots
            buildings.forEach((type, idx) => {
                const r = Math.floor(idx / cols);
                const c = idx % cols;

                // Calculate center of slot
                const slotX = (c * 6) - 12; // -12, -6, 0, 6, 12
                const slotZ = currentZ + (r * 5) + 2; // Offset from road

                // Check Max Level (Upgrades)
                const def = BUILDINGS[type];
                const maxLevel = (def.upgrades?.length || 0) + 1;

                this.addTask(0.1, (ctx, s) => {
                    this.pushPlacement(ctx, s, { x: cx + slotX + 1, z: cz + slotZ }, type, 1);
                    // If it has upgrades, maybe bump it to max level immediately to show off?
                    // Or cycle levels? Let's just show Level 1 for clarity, or Max for cool factor.
                    // Doing Max Level for Era 4/5
                    if (era === Era.PROSPERITY || era === Era.SUSTAINABILITY) {
                        // We can't instant upgrade easily without multiple commands, 
                        // but ConstructionSystem Place supports level!
                        // Let's place Max Level for showcase
                        this.pushPlacement(ctx, s, { x: cx + slotX + 1, z: cz + slotZ }, type, maxLevel);
                    }
                });
            });

            currentZ += blockHeight + 4; // Gap between Eras
        });

        this.addTask(3.0, (c, s) => {
            s.step = GameStep.PLAYING;
            this.notify(c, s, "SHOWCASE COMPLETE. WELCOME TO AUREUS.", "POSITIVE");
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

    private pushPlacement(ctx: FixedContext, state: GameState, coord: { x: number, z: number }, type: BuildingType, level: number = 1): void {
        state.commandQueue.push({
            id: ctx.getNextId?.('demo_cmd') || `demo_${Date.now()}_${type}_${coord.x}_${coord.z}_${Math.random()}`,
            type: 'PLACE_BUILDING',
            payload: { x: coord.x, z: coord.z, buildingType: type, isInstant: true, level } // Instant build enabled
        });
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BUILD_START });
    }

}
