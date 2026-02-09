/**
 * Event System
 * Handles random world events, disasters, and special visual themes.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState, BuildingType, GridTile, SfxType, Chunk } from '../../../types';

import { checkAndGenerateEvent } from '../logic/AiLogic';

export class EventSystem extends BaseSimSystem {
    readonly id = 'events';
    readonly priority = 15;

    private lastEventCheck = 0;
    private readonly EVENT_CHECK_INTERVAL = 30.0; // Seconds

    tick(ctx: FixedContext, state: GameState): void {
        // 1. Process Active Events (Durations)
        this.processActiveEvents(ctx, state);

        // 2. Roll for New Events
        if (ctx.time - this.lastEventCheck > this.EVENT_CHECK_INTERVAL) {
            this.lastEventCheck = ctx.time;

            // Limit to one major event at a time
            if (state.activeEvents.length > 0) return;

            const { event, news, newChunks, newAgents } = checkAndGenerateEvent(ctx, state);

            if (event) state.activeEvents.push(event);
            if (news) state.newsFeed.push(news);
            if (newChunks) {
                // Bridge to React effects for visual sync
                for (const [key, chunk] of Object.entries(newChunks)) {
                    state.chunks[key] = chunk;
                    const [cx, cz] = key.split(',').map(Number);
                    state.pendingEffects.push({ type: 'CHUNK_UPDATE', cx, cz, updates: chunk.tiles });
                }
            }

            if (newAgents) state.agents = newAgents;


            if (event) {
                state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.ALARM });
            }
        }
    }

    private processActiveEvents(ctx: FixedContext, state: GameState) {
        const dt = ctx.fixedDt;
        if (state.activeEvents.length === 0) return;

        for (let i = 0; i < state.activeEvents.length; i++) {
            const event = state.activeEvents[i];
            event.duration -= dt * 10; // State duration is in arbitrary 'ticks' roughly

            if (event.duration <= 0) {
                state.activeEvents.splice(i, 1);
                i--;
                state.newsFeed.push({
                    id: ctx.getNextId?.('evt_end') || `end_${Date.now()}`,
                    headline: `Event Over: ${event.name} has concluded.`,
                    type: 'NEUTRAL',
                    timestamp: state.tickCount
                });
            }
        }
    }


}
