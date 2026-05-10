
import { BaseSimSystem } from '../Simulation';
import { FixedContext, CommandContext, CommandResult, CommandErrorCode } from '../../kernel/Types';
import { GameState, GameCommand, SfxType } from '../../../types';
import { DIALOGUE_TREES } from '../../data/bureaucracy';

export class BureaucracySystem extends BaseSimSystem {
    readonly id = 'bureaucracy';
    readonly priority = 35; // Run after ColonySystem, before Economy

    tick(ctx: FixedContext, state: GameState): void {
        // Handle time-based bureaucracy updates (e.g., permit pending timers)
        const bureaucracy = state.bureaucracy;
        if (!bureaucracy) return;

        // Example: Process pending permits
        for (const permitId in bureaucracy.permits) {
            const permit = bureaucracy.permits[permitId];
            if (permit.status === 'PENDING') {
                // For now, simplicity: 1% chance to approve per tick if pending
                if (ctx.random.next() < 0.01) {
                    permit.status = 'APPROVED';
                    state.newsFeed.push({
                        id: `permit_appr_${permitId}_${ctx.time}`,
                        headline: `Permit Approved: ${permit.name}`,
                        type: 'POSITIVE',
                        timestamp: state.tickCount
                    });
                    state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.COMPLETE });
                }
            }
        }
    }

    handleCommand(cmd: GameCommand, ctx: CommandContext, state: GameState): CommandResult | null {
        const bureaucracy = state.bureaucracy;
        if (!bureaucracy) return null;

        switch (cmd.type) {
            case 'SUBMIT_PERMIT':
                if (!cmd.payload || !cmd.payload.permitId) {
                    return { ok: false, code: CommandErrorCode.INVALID_STATE, reason: 'Missing permitId' };
                }
                return this.handleSubmitPermit(cmd.payload.permitId, state);
            case 'TALK_TO_NPC':
                if (!cmd.payload || !cmd.payload.npcId) {
                    return { ok: false, code: CommandErrorCode.INVALID_STATE, reason: 'Missing npcId' };
                }
                return this.handleTalkToNPC(cmd.payload.npcId, state);
            case 'CHOOSE_DIALOGUE':
                if (!cmd.payload || cmd.payload.optionIndex === undefined) {
                    return { ok: false, code: CommandErrorCode.INVALID_STATE, reason: 'Missing optionIndex' };
                }
                return this.handleChooseDialogue(cmd.payload.optionIndex, state);
            case 'CLOSE_DIALOGUE':
                return this.handleCloseDialogue(state);
            default:
                return null;
        }
    }

    private handleSubmitPermit(permitId: string, state: GameState): CommandResult {
        const permit = state.bureaucracy.permits[permitId];
        if (!permit) return { ok: false, code: CommandErrorCode.INVALID_TARGET, reason: 'Unknown permit' };
        if (permit.status !== 'AVAILABLE') return { ok: false, code: CommandErrorCode.INVALID_STATE, reason: 'Permit not available' };

        if (state.resources.agt < permit.cost) return { ok: false, code: CommandErrorCode.INSUFFICIENT_RESOURCES, reason: 'Not enough AGT' };

        state.resources.agt -= permit.cost;
        permit.status = 'PENDING';

        state.newsFeed.push({
            id: `permit_sub_${permitId}_${Date.now()}`,
            headline: `Permit Submitted: ${permit.name}`,
            type: 'NEUTRAL',
            timestamp: state.tickCount
        });

        return { ok: true };
    }

    private handleTalkToNPC(npcId: string, state: GameState): CommandResult {
        const npc = state.bureaucracy.npcs[npcId];
        if (!npc) return { ok: false, code: CommandErrorCode.INVALID_TARGET, reason: 'Unknown NPC' };

        state.bureaucracy.activeNPCId = npcId;

        // Load dialogue tree for this NPC
        const tree = DIALOGUE_TREES[npcId];
        if (tree) {
            state.bureaucracy.dialogueTree = tree;
            state.bureaucracy.activeDialogue = tree.root || null;
        }

        return { ok: true };
    }

    private handleChooseDialogue(optionIndex: number, state: GameState): CommandResult {
        const bureaucracy = state.bureaucracy;
        const currentNode = bureaucracy.activeDialogue;
        if (!currentNode) return { ok: false, code: CommandErrorCode.INVALID_STATE, reason: 'No active dialogue' };

        const option = currentNode.options[optionIndex];
        if (!option) return { ok: false, code: CommandErrorCode.INVALID_TARGET, reason: 'Invalid option' };

        // Handle special actions
        if (option.action === 'START_TUTORIAL_PERMIT') {
            const permit = bureaucracy.permits['extraction-intent'];
            if (permit) permit.status = 'AVAILABLE';
        }

        // Advance dialogue
        if (option.nextNodeId) {
            const nextNode = bureaucracy.dialogueTree?.[option.nextNodeId];
            if (nextNode) {
                bureaucracy.activeDialogue = nextNode;
            } else {
                // End of dialogue
                bureaucracy.activeDialogue = null;
                bureaucracy.activeNPCId = null;
            }
        } else {
            // End of dialogue
            bureaucracy.activeDialogue = null;
            bureaucracy.activeNPCId = null;
        }

        return { ok: true };
    }

    private handleCloseDialogue(state: GameState): CommandResult {
        state.bureaucracy.activeDialogue = null;
        state.bureaucracy.activeNPCId = null;
        return { ok: true };
    }
}
