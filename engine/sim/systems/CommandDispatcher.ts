/**
 * Command Dispatcher System
 * Centralizes command processing, captures results, and logs trace.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext, CommandContext, CommandResult, CommandErrorCode } from '../../kernel/Types';
import { GameState, GameCommand } from '../../../types';

export class CommandDispatcher extends BaseSimSystem {
    readonly id = 'command-dispatcher';
    readonly priority = 100; // Run first to process input before logic systems

    private systems: any[] = [];

    /**
     * Register systems that can handle commands.
     * Order matters for handling priority.
     */
    setSystems(systems: any[]) {
        this.systems = systems;
    }

    tick(ctx: FixedContext, state: GameState): void {
        if (!state.commandQueue || state.commandQueue.length === 0) return;

        const queue = [...state.commandQueue];
        state.commandQueue = [];

        const commandCtx: CommandContext = {
            ...ctx,
            tick: state.tickCount,
            reportResult: (commandId, result) => this.reportResult(commandId, result, state)
        };

        for (const cmd of queue) {
            cmd.issuedAtTick = cmd.issuedAtTick ?? state.tickCount;
            this.dispatchCommand(cmd, commandCtx, state);
        }
    }

    private dispatchCommand(cmd: GameCommand, ctx: CommandContext, state: GameState) {
        let handledBy: string | null = null;
        let result: CommandResult | null = null;

        // Try each registered system in order
        for (const system of this.systems) {
            if (system.enabled && system.handleCommand) {
                result = system.handleCommand(cmd, ctx, state);
                if (result !== null) {
                    handledBy = system.id;
                    break;
                }
            }
        }

        // If not handled, report failure
        if (result === null) {
            result = {
                ok: false,
                code: CommandErrorCode.UNKNOWN,
                reason: `No system handled command type: ${cmd.type}`
            };
            handledBy = 'NONE';
        }

        this.reportResult(cmd.id, result, state, handledBy, cmd);
    }

    private reportResult(
        commandId: string,
        result: CommandResult,
        state: GameState,
        handledBy: string = 'UNKNOWN',
        cmd?: GameCommand
    ) {
        // 1. Update UI-safe feedback
        if (!result.ok || (cmd && ['PLACE_BUILDING', 'BUY_BUILDING'].includes(cmd.type))) {
            state.ui.lastCommandResult = {
                commandId,
                type: cmd?.type || 'UNKNOWN',
                ok: result.ok,
                code: !result.ok ? result.code : undefined,
                reason: !result.ok ? result.reason : undefined
            };
        }

        // 2. Log to Debug Trace (Ring Buffer)
        state.debug.commandTrace.push({
            tick: state.tickCount,
            commandId,
            commandType: cmd?.type || 'UNKNOWN',
            payloadSummary: this.summarizePayload(cmd?.payload),
            handledBy,
            result: {
                ok: result.ok,
                code: !result.ok ? result.code : undefined,
                reason: !result.ok ? result.reason : undefined
            }
        });

        if (state.debug.commandTrace.length > 200) {
            state.debug.commandTrace.shift();
        }

        // 3. Console Log for development
        if (!result.ok) {
            console.warn(`[CommandDispatcher] Command ${commandId} (${cmd?.type}) REJECTED: ${result.reason}`, result);
        } else {
            console.log(`[CommandDispatcher] Command ${commandId} (${cmd?.type}) ACCEPTED by ${handledBy}`);
        }
    }

    private summarizePayload(payload: any): string {
        if (!payload) return 'none';
        const str = JSON.stringify(payload);
        return str.length > 60 ? str.substring(0, 57) + '...' : str;
    }
}
