import { FixedContext } from '../../kernel/Types';
import { GameState } from '../../../types';
import { BaseSimSystem } from '../Simulation';
import { applyDeepLedgerSurvey } from '../../underground/UndergroundGenerator';

/**
 * Engine-owned Phase 1 Deep Ledger survey sync. (|/) Klaasvaakie
 */
export class UndergroundSurveySystem extends BaseSimSystem {
    readonly id = 'underground_survey';
    readonly priority = 55;

    tick(_ctx: FixedContext, state: GameState): void {
        if (state.tickCount % 30 !== 0) return;
        applyDeepLedgerSurvey(state);
    }
}
