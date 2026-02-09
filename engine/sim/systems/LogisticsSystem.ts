
import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState, Chunk } from '../../../types';
import { updateWaterConnectivity } from '../../utils/GameUtils';
import { ChunkStore } from '../../space/ChunkStore';

export class LogisticsSystem extends BaseSimSystem {
    readonly id = 'logistics';
    readonly priority = 20;

    private lastExplorationUpdate = 0;
    private lastWaterUpdate = 0;

    tick(ctx: FixedContext, state: GameState): void {
        const chunks = state.chunks;
        if (!chunks) return;

        // 1. Fog of War Reveal (Every 0.2s)
        if (ctx.time - this.lastExplorationUpdate > 0.2) {
            this.lastExplorationUpdate = ctx.time;
            this.updateExploration(state);
        }

        // 2. Water Connectivity (Every 1.0s)
        if (ctx.time - this.lastWaterUpdate > 1.0) {
            this.lastWaterUpdate = ctx.time;
            updateWaterConnectivity(state.chunks);
        }
    }

    private updateExploration(state: GameState) {
        const radius = 3;
        const chunks = state.chunks;

        for (const agent of state.agents) {
            const cx = Math.floor(agent.x);
            const cz = Math.floor(agent.z);

            for (let dz = -radius; dz <= radius; dz++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    if (dx * dx + dz * dz > radius * radius) continue;

                    const tx = cx + dx;
                    const tz = cz + dz;

                    const tile = ChunkStore.getTile(chunks, tx, tz);
                    if (tile && !tile.explored) {
                        tile.explored = true;
                    }
                }
            }
        }
    }
}
