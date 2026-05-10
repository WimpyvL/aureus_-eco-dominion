/**
 * Mission System
 * Handles automated generation of goals and shipping contracts.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState } from '../../../types';
import { generateGoal } from '../logic/AiLogic';

export class MissionSystem extends BaseSimSystem {
    readonly id = 'missions';
    readonly priority = 10;

    private lastGoalCheck = 0;
    private lastContractCheck = 0;

    tick(ctx: FixedContext, state: GameState): void {
        // 1. Goal Generation (Every 30s if none active)
        if (!state.activeGoal && ctx.time - this.lastGoalCheck > 30) {
            this.lastGoalCheck = ctx.time;
            state.activeGoal = generateGoal(ctx, state);
        }

        // 2. Contract Management (Every 60s)
        if (ctx.time - this.lastContractCheck > 60) {
            this.lastContractCheck = ctx.time;
            this.updateContracts(ctx, state);
        }

        // 3. Contract Timers
        this.processContractTimers(ctx, state);
    }

    private updateContracts(ctx: FixedContext, state: GameState) {
        if (state.contracts.length < 3) {
            const nextRand = () => ctx.random ? ctx.random.next() : Math.random();
            const isGem = nextRand() > 0.7;
            const amount = isGem ? Math.floor(nextRand() * 5) + 2 : Math.floor(nextRand() * 100) + 50;
            const reward = isGem ? amount * 1000 : amount * 25;

            state.contracts.push({
                id: ctx.getNextId?.('cont') || `cont_${Date.now()}`,
                description: `Economic Demand: Needs ${amount} ${isGem ? 'Gems' : 'Minerals'} immediately.`,
                resource: isGem ? 'GEMS' : 'MINERALS',
                amount,
                reward,
                timeLeft: 300,
                penalty: Math.floor(reward * 0.2)
            });
        }
    }

    private processContractTimers(ctx: FixedContext, state: GameState) {
        const dt = ctx.fixedDt;
        for (let i = 0; i < state.contracts.length; i++) {
            const contract = state.contracts[i];
            contract.timeLeft -= dt;

            if (contract.timeLeft <= 0) {
                // Fail contract
                state.contracts.splice(i, 1);
                i--;
                state.resources.agt = Math.max(0, state.resources.agt - contract.penalty);
                state.newsFeed.push({
                    id: ctx.getNextId?.('fail') || `fail_${Date.now()}`,
                    headline: `Contract Failed: Penalized ${contract.penalty} AGT.`,
                    type: 'CRITICAL',
                    timestamp: state.tickCount
                });
            }
        }
    }
}
