import { AureusWorld } from './AureusWorld';
import { BuildingType } from '../types';
import {
    ensureUndergroundState,
    revealUndergroundArea
} from '../engine/underground/UndergroundGenerator';
import { SURVEY_DRILL } from './surveyDrillBuildingPatch';

/**
 * Phase 1 Deep Ledger foundation.
 *
 * This keeps the first underground survey slice scoped and safe:
 * - Backfills underground state for new games and old saves.
 * - Reveals deterministic Sector B1 tiles around completed survey/mining access buildings.
 * - Prefers Survey Drill as the canonical scanner, with mining structures retained as fallback emitters.
 */
const proto = AureusWorld.prototype as any;

const SURVEY_RADIUS = 4;
const SURVEY_BUILDINGS = new Set<string>([
    SURVEY_DRILL,
    BuildingType.MINE_SHAFT,
    BuildingType.MINING_HEADFRAME
]);

function scanForSurveySources(world: any): void {
    const stateManager = world.stateManager;
    if (!stateManager) return;

    const state = stateManager.getState();
    const underground = ensureUndergroundState(state);

    let changed = false;

    for (const chunk of Object.values(state.chunks ?? {}) as any[]) {
        for (const tile of chunk.tiles ?? []) {
            if (!SURVEY_BUILDINGS.has(tile.buildingType)) continue;
            if (tile.isUnderConstruction) continue;

            const tileChanged = revealUndergroundArea(
                underground,
                tile.x,
                tile.z,
                underground.depthLevel,
                SURVEY_RADIUS,
                state.seed
            );

            changed = changed || tileChanged;
        }
    }

    if (changed || state.underground !== underground) {
        underground.unlocked = underground.unlocked || state.dungeon?.unlocked || Object.keys(underground.tiles).length > 0;
        stateManager.markDirty('underground' as any);
    }
}

if (!proto.__deepLedgerFoundationPatched) {
    const originalGetState = proto.getState;
    const originalDraw = proto.draw;
    const originalLoadGame = proto.loadGame;

    proto.getState = function patchedGetState(this: any): any {
        const state = originalGetState.call(this);
        ensureUndergroundState(state);
        return state;
    };

    proto.draw = function patchedDraw(this: any, ctx: any): void {
        scanForSurveySources(this);
        return originalDraw.call(this, ctx);
    };

    proto.loadGame = function patchedLoadGame(this: any, data?: string): void {
        originalLoadGame.call(this, data);
        const state = this.stateManager?.getState?.();
        if (state) {
            ensureUndergroundState(state);
            this.stateManager.markDirty('underground' as any);
            this.stateManager.forceNotify?.();
        }
    };

    proto.__deepLedgerFoundationPatched = true;
}
