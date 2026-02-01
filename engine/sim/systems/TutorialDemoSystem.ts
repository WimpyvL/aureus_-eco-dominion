import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel/Types';
import { GameState, GameStep, BuildingType, SfxType, Era } from '../../../types';
import { GRID_SIZE } from '../../utils/GameUtils';

/**
 * TutorialDemoSystem - The Living Simulation
 * Simulates a high-speed "pro-player" build sequence.
 * Buildings are placed individually with logical delays to create a "playing" feel.
 */
export class TutorialDemoSystem extends BaseSimSystem {
    readonly id = 'tutorial-demo';
    readonly priority = -10;

    private stateInitialized = false;
    private timer = 0;
    private taskIndex = 0;
    private tasks: { delay: number; run: (state: GameState) => void }[] = [];

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
                task.run(state);
                this.taskIndex++;
                this.timer = 0; // Reset timer for next task delay
            }
        }
    }

    private initializeDemo(state: GameState) {
        state.cheatsEnabled = true;
        // Infinite Demo Resources
        state.resources.agt = 1000000;
        state.resources.minerals = 5000;
        state.resources.gems = 5000;
        state.resources.wood = 5000;
        state.resources.stone = 5000;
        state.resources.eco = 100;
        state.resources.trust = 100;

        state.currentEra = Era.SETTLEMENT;
        state.unlockedEras = [Era.SETTLEMENT];

        const c = Math.floor(GRID_SIZE / 2);
        this.tasks = [];

        const pos = (dx: number, dz: number) => (c + dz) * GRID_SIZE + (c + dx);

        // --- DEMO SCRIPT: NATURAL GROWTH ---

        this.addTask(1.0, (s) => this.notify(s, "DEMO SEQUENCE: NATURAL GROWTH", "POSITIVE"));
        this.addTask(0.5, (s) => this.notify(s, "CHEAT MODES ACTIVE: INSTANT CONSTRUCTION ENABLED", "NEUTRAL"));

        // 1. Central Hub (Settlement Era)
        this.addTask(0.2, s => this.pushPlacement(s, pos(0, 0), BuildingType.STORAGE_DEPOT));

        // Roads outward
        for (let i = 1; i <= 3; i++) {
            this.addTask(0.05, s => this.pushPlacement(s, pos(i, 0), BuildingType.ROAD));
            this.addTask(0.05, s => this.pushPlacement(s, pos(-i, 0), BuildingType.ROAD));
            this.addTask(0.05, s => this.pushPlacement(s, pos(0, i), BuildingType.ROAD));
            this.addTask(0.05, s => this.pushPlacement(s, pos(0, -i), BuildingType.ROAD));
        }

        // Basic Infrastructure
        this.addTask(0.5, s => this.pushPlacement(s, pos(2, 2), BuildingType.SOLAR_ARRAY));
        this.addTask(0.2, s => this.pushPlacement(s, pos(2, -2), BuildingType.WATER_WELL));

        this.addTask(0.5, s => this.notify(s, "FOUNDATION ESTABLISHED. EXPANDING RESIDENTIAL.", "POSITIVE"));

        // 2. Residential District (North)
        for (let z = -4; z >= -8; z--) this.addTask(0.05, s => this.pushPlacement(s, pos(0, z), BuildingType.ROAD));

        this.addTask(0.2, s => this.pushPlacement(s, pos(-2, -4), BuildingType.STAFF_QUARTERS));
        this.addTask(0.2, s => this.pushPlacement(s, pos(2, -4), BuildingType.STAFF_QUARTERS));
        this.addTask(0.2, s => this.pushPlacement(s, pos(-2, -6), BuildingType.STAFF_QUARTERS));
        this.addTask(0.2, s => this.pushPlacement(s, pos(2, -6), BuildingType.STAFF_QUARTERS));
        this.addTask(0.5, s => this.pushPlacement(s, pos(0, -9), BuildingType.CANTEEN));

        // 3. Era Upgrade (Growth)
        this.addTask(1.0, (s) => {
            s.currentEra = Era.GROWTH;
            if (!s.unlockedEras.includes(Era.GROWTH)) s.unlockedEras.push(Era.GROWTH);
            this.notify(s, "ERA UNLOCKED: GROWTH", "POSITIVE");
        });

        // 4. Industrial Sector (South)
        this.addTask(0.5, s => this.notify(s, "INITIATING INDUSTRIAL OPERATIONS", "NEUTRAL"));
        for (let z = 4; z <= 10; z++) this.addTask(0.05, s => this.pushPlacement(s, pos(0, z), BuildingType.ROAD));

        this.addTask(0.5, s => this.pushPlacement(s, pos(-3, 6), BuildingType.MINING_HEADFRAME));
        this.addTask(0.5, s => this.pushPlacement(s, pos(3, 6), BuildingType.WASH_PLANT));
        this.addTask(0.5, s => this.pushPlacement(s, pos(-3, 9), BuildingType.MINING_HEADFRAME));

        // 5. Advanced Tech (West)
        this.addTask(0.5, s => this.notify(s, "DEPLOYING ADVANCED POWER SYSTEMS", "NEUTRAL"));
        for (let x = -4; x >= -10; x--) this.addTask(0.05, s => this.pushPlacement(s, pos(x, 0), BuildingType.ROAD));

        this.addTask(0.5, s => this.pushPlacement(s, pos(-6, 2), BuildingType.WIND_TURBINE));
        this.addTask(0.2, s => this.pushPlacement(s, pos(-8, 2), BuildingType.WIND_TURBINE));
        this.addTask(0.2, s => this.pushPlacement(s, pos(-10, 2), BuildingType.WIND_TURBINE));

        // 6. Final Era & Monument
        this.addTask(2.0, (s) => {
            s.currentEra = Era.PROSPERITY;
            s.unlockedEras = [Era.SETTLEMENT, Era.GROWTH, Era.INDUSTRY, Era.SUSTAINABILITY, Era.PROSPERITY];
            this.notify(s, "MAXIMUM TECH LEVEL ACHIEVED", "POSITIVE");
        });

        this.addTask(1.0, s => this.pushPlacement(s, pos(0, -12), BuildingType.MONUMENT));
        this.addTask(1.0, s => this.pushPlacement(s, pos(-5, -5), BuildingType.COMMUNITY_GARDEN));
        this.addTask(0.5, s => this.pushPlacement(s, pos(5, -5), BuildingType.NATURE_RESERVE));

        this.addTask(3.0, (s) => {
            s.step = GameStep.PLAYING;
            this.notify(s, "DEMO SEQUENCE COMPLETE. HANDING OVER CONTROL.", "POSITIVE");
        });
    }

    private addTask(delay: number, run: (s: GameState) => void) {
        this.tasks.push({ delay, run });
    }

    private notify(state: GameState, message: string, type: any): void {
        state.newsFeed.unshift({
            id: `msg_${Date.now()}_${Math.random()}`,
            headline: message,
            type: type,
            timestamp: Date.now()
        });
    }

    private pushPlacement(state: GameState, index: number, type: BuildingType): void {
        state.commandQueue.push({
            id: `demo_${Date.now()}_${type}_${index}_${Math.random()}`,
            type: 'PLACE_BUILDING',
            payload: { index, buildingType: type, isInstant: true } // Instant build enabled
        });
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BUILD_START });
    }
}
