/**
 * Research System
 * Handles technology research and unlocking.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext, CommandContext, CommandResult, CommandErrorCode } from '../../kernel/Types';
import { GameState, GameCommand, TechId, SfxType } from '../../../types';
import { TECHNOLOGIES } from '../../data/VoxelConstants';

export class ResearchSystem extends BaseSimSystem {
    readonly id = 'research';
    readonly priority = 20;

    tick(): void { }

    handleCommand(cmd: GameCommand, ctx: CommandContext, state: GameState): CommandResult | null {
        if (cmd.type === 'RESEARCH_TECH') {
            return this.researchTech(cmd.payload.techId, ctx, state);
        }
        return null;
    }

    private researchTech(techId: string, ctx: CommandContext, state: GameState): CommandResult {
        // 1. Validate Tech
        const tech = (TECHNOLOGIES as any)[techId];
        if (!tech) {
            return { ok: false, code: CommandErrorCode.INVALID_TARGET, reason: `Unknown tech: ${techId}` };
        }

        const id = techId as TechId;

        // 2. Check if already unlocked
        if (state.research.unlocked.includes(id)) {
            return { ok: false, code: CommandErrorCode.INVALID_STATE, reason: 'Already researched' };
        }

        // 3. Check Prerequisites
        if (tech.prereq && !state.research.unlocked.includes(tech.prereq)) {
            return { ok: false, code: CommandErrorCode.FORBIDDEN, reason: `Prerequisite ${tech.prereq} not met` };
        }

        // 4. Check Resources
        if (state.resources.agt < tech.cost) {
            return { ok: false, code: CommandErrorCode.INSUFFICIENT_RESOURCES, reason: `Need ${tech.cost} AGT` };
        }

        // 5. Deduct Cost
        state.resources.agt -= tech.cost;

        // 6. Unlock (Instant)
        state.research.unlocked.push(id);

        // 7. Notification & Sound
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.COMPLETE });
        state.newsFeed.push({
            id: ctx.getNextId?.('tech') || `tech_${id}_${Date.now()}`,
            headline: `RESEARCH COMPLETE: ${tech.name}`,
            type: 'POSITIVE',
            timestamp: state.tickCount
        });

        return { ok: true };
    }
}
