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
        state.resources.agt = 500000;
        state.resources.trust = 50;
        state.resources.eco = 80;
        state.resources.gems = 500;

        const c = Math.floor(GRID_SIZE / 2);
        this.tasks = [];

        // --- THE SCRIPT ---

        // Start
        this.addTask(0.5, (s) => this.notify(s, "SYSTEM INITIATED. COMMENCING SECTOR-7 EXPANSION.", "POSITIVE"));

        // Central Spine (Roads placed one by one)
        for (let i = -5; i <= 5; i++) {
            this.addTask(0.1, (s) => this.pushPlacement(s, (c + i) * GRID_SIZE + c, BuildingType.ROAD));
        }
        for (let i = -5; i <= 5; i++) {
            if (i === 0) continue; // Skip intersection center
            this.addTask(0.1, (s) => this.pushPlacement(s, c * GRID_SIZE + (c + i), BuildingType.ROAD));
        }

        this.addTask(0.5, (s) => this.notify(s, "URBAN ARTERIES ESTABLISHED. DEPLOYING POWER GRID.", "NEUTRAL"));

        // Power setup
        this.addTask(0.3, (s) => this.pushPlacement(s, (c + 1) * GRID_SIZE + c + 1, BuildingType.POWER_LINE));
        this.addTask(0.3, (s) => this.pushPlacement(s, (c + 2) * GRID_SIZE + c + 2, BuildingType.SOLAR_ARRAY));
        this.addTask(0.3, (s) => this.pushPlacement(s, (c + 2) * GRID_SIZE + c + 4, BuildingType.SOLAR_ARRAY));

        this.addTask(0.8, (s) => this.notify(s, "COLONY INFRASTRUCTURE: WASH PLANT ALPHA", "POSITIVE"));

        // Industry
        this.addTask(1.0, (s) => this.pushPlacement(s, (c - 4) * GRID_SIZE + c - 4, BuildingType.WASH_PLANT));
        this.addTask(0.5, (s) => this.pushPlacement(s, (c - 3) * GRID_SIZE + c - 2, BuildingType.ROAD));
        this.addTask(0.5, (s) => this.pushPlacement(s, (c - 3) * GRID_SIZE + c - 1, BuildingType.PIPE));

        this.addTask(1.0, (s) => this.notify(s, "RESIDENTIAL CLUSTER INCOMING", "NEUTRAL"));

        // Housing
        this.addTask(0.4, (s) => this.pushPlacement(s, (c + 2) * GRID_SIZE + c - 5, BuildingType.STAFF_QUARTERS));
        this.addTask(0.4, (s) => this.pushPlacement(s, (c + 4) * GRID_SIZE + c - 5, BuildingType.STAFF_QUARTERS));
        this.addTask(0.4, (s) => this.pushPlacement(s, (c + 3) * GRID_SIZE + c - 2, BuildingType.ROAD));
        this.addTask(0.4, (s) => this.pushPlacement(s, (c + 6) * GRID_SIZE + c - 5, BuildingType.CANTEEN));

        // Era Up
        this.addTask(2.0, (s) => {
            s.currentEra = Era.GROWTH;
            if (!s.unlockedEras.includes(Era.GROWTH)) s.unlockedEras.push(Era.GROWTH);
            this.notify(s, "PHASE 1 COMPLETE. GROWTH ERA PROTOCOLS ACTIVE.", "POSITIVE");
        });

        // Advanced Tech
        this.addTask(1.0, (s) => this.pushPlacement(s, (c + 7) * GRID_SIZE + c + 4, BuildingType.WIND_TURBINE));
        this.addTask(0.5, (s) => this.pushPlacement(s, (c + 10) * GRID_SIZE + c + 4, BuildingType.WIND_TURBINE));
        this.addTask(1.0, (s) => this.pushPlacement(s, (c + 1) * GRID_SIZE + c - 8, BuildingType.WATER_WELL));
        this.addTask(0.5, (s) => {
            // Pipe line from well to spine
            for (let x = -7; x <= -2; x++) {
                this.pushPlacement(s, (c + 1) * GRID_SIZE + c + x, BuildingType.PIPE);
            }
        });

        this.addTask(1.0, (s) => this.notify(s, "DEEP CORE EXTRACTION READY", "NEUTRAL"));

        // Heavy Industry
        this.addTask(1.5, (s) => this.pushPlacement(s, (c - 10) * GRID_SIZE + c - 6, BuildingType.MINING_HEADFRAME));
        this.addTask(0.8, (s) => this.pushPlacement(s, (c - 6) * GRID_SIZE + c + 2, BuildingType.SECURITY_POST));

        // Final Flourish
        this.addTask(2.0, (s) => {
            s.currentEra = Era.SUSTAINABILITY;
            if (!s.unlockedEras.includes(Era.SUSTAINABILITY)) s.unlockedEras.push(Era.SUSTAINABILITY);
            this.notify(s, "MILESTONE: SUSTAINTABILITY ARCHITECTURE UNLOCKED", "POSITIVE");
        });

        this.addTask(1.5, (s) => this.pushPlacement(s, (c - 2) * GRID_SIZE + c - 12, BuildingType.COMMUNITY_GARDEN));
        this.addTask(0.5, (s) => this.pushPlacement(s, (c - 5) * GRID_SIZE + c - 12, BuildingType.NATURE_RESERVE));

        this.addTask(2.0, (s) => {
            this.pushPlacement(s, (c - 1) * GRID_SIZE + c - 1, BuildingType.MONUMENT);
            this.notify(s, "AUREUS DOMINION: VICTORY PROTOCOLS INITIALIZED.", "POSITIVE");
        });

        this.addTask(5.0, (s) => {
            s.step = GameStep.PLAYING;
            this.notify(s, "DEMO COMPLETE. PROCEED TO FULL OPERATIONS.", "POSITIVE");
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
            payload: { index, buildingType: type, isInstant: false } // False to see it "grow"
        });
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BUILD_START });
    }
}
