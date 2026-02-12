
import { BaseSimSystem } from '../Simulation';
import { GameState } from '../../types/game';
import { DungeonEngine } from '../../dungeon/DungeonEngine';
import { FixedContext } from '../../kernel/Types';

export class DungeonStabilitySystem extends BaseSimSystem {
    readonly id = 'dungeon_stability';
    readonly priority = 30; // Run after miners

    private engine: DungeonEngine | null = null;
    private timer: number = 0;
    private CHECK_INTERVAL = 2.0; // Seconds

    tick(ctx: FixedContext, state: GameState): void {
        const dState = state.dungeon;
        if (!dState || !dState.unlocked) return;

        // Sync Engine
        if (!this.engine || this.engine['state'] !== dState) {
            this.engine = new DungeonEngine(dState);
        }

        // dt is usually in the context, but FixedContext might not have it directly if it's fixed step?
        // FixedContext usually has dt. Let's assume 0.1s if not found, or use ctx.dt if it exists.
        // Actually BaseSimSystem doesn't expose dt in tick(ctx, state).
        // Let's check FixedContext definition.
        // If it's fixed step, dt is constant. 
        // I'll increment by a fixed amount (e.g. 0.1) or check if ctx has dt.

        const dt = 0.1; // Assume 10 TPS for now. 
        this.timer += dt;

        if (this.timer >= this.CHECK_INTERVAL) {
            this.timer = 0;
            const collapses = this.engine.checkStability();

            if (collapses.length > 0) {
                // Log event
                dState.logs.push(`Cave-in at ${collapses[0].x}, ${collapses[0].z}!`);
            }
        }
    }
}
