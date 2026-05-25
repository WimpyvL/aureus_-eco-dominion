import type { UndergroundState, UndergroundTile } from '../../types';

import {
    applyDeepLedgerSurvey as applyDeepLedgerSurveyCore,
    createInitialUndergroundState as createInitialUndergroundStateCore,
    createUndergroundTile as createUndergroundTileCore,
    ensureUndergroundState as ensureUndergroundStateCore,
    normalizeUndergroundState as normalizeUndergroundStateCore,
    revealUndergroundArea as revealUndergroundAreaCore,
    SURVEY_DRILL_BUILDING_TYPE,
    SURVEY_REVEAL_RADIUS,
    undergroundTileKey,
} from './DeepLedgerSurveyCore';

export {
    SURVEY_DRILL_BUILDING_TYPE,
    SURVEY_REVEAL_RADIUS,
    undergroundTileKey,
};

export function createInitialUndergroundState(): UndergroundState {
    return createInitialUndergroundStateCore() as UndergroundState;
}

export function normalizeUndergroundState(existing?: Partial<UndergroundState> | null): UndergroundState {
    return normalizeUndergroundStateCore(existing) as UndergroundState;
}

export function ensureUndergroundState(state: { underground?: Partial<UndergroundState> }): UndergroundState {
    return ensureUndergroundStateCore(state as any) as UndergroundState;
}

export function createUndergroundTile(
    x: number,
    z: number,
    depth: number,
    seed: number,
): UndergroundTile {
    return createUndergroundTileCore(x, z, depth, seed) as UndergroundTile;
}

export function revealUndergroundArea(
    underground: UndergroundState,
    centerX: number,
    centerZ: number,
    depth: number,
    radius: number,
    seed: number,
): boolean {
    return revealUndergroundAreaCore(underground as any, centerX, centerZ, depth, radius, seed);
}

export function applyDeepLedgerSurvey(state: any): {
    changed: boolean;
    surveyedTileCount: number;
    hazardCount: number;
    unlocked: boolean;
} {
    return applyDeepLedgerSurveyCore(state);
}
