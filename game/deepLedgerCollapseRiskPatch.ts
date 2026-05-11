import { AureusWorld } from './AureusWorld';
import { ensureUndergroundState } from '../engine/underground/UndergroundGenerator';
import { SfxType, UndergroundTile } from '../types';

/**
 * Deep Ledger collapse risk v0.
 *
 * Adds lightweight cave-in pressure for unsupported, low-stability underground tunnels.
 * Reinforced tunnels are intentionally protected so the player has clear counterplay.
 */
const proto = AureusWorld.prototype as any;

const CHECK_INTERVAL_MS = 7000;
const WARNING_STABILITY = 35;
const CRITICAL_STABILITY = 18;
const GLOBAL_STABILITY_LOSS = 2;
const EXPOSURE_ON_COLLAPSE = 3;

let lastCheckAt = 0;

function addNews(state: any, headline: string, type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'CRITICAL'): void {
    state.newsFeed.unshift({
        id: `deep_ledger_collapse_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        headline,
        type,
        timestamp: Date.now()
    });
    state.newsFeed = state.newsFeed.slice(0, 12);
}

function seededRoll(tile: UndergroundTile, tick: number): number {
    const n = Math.sin(tile.x * 41.17 + tile.z * 97.31 + tile.depth * 13.13 + tick * 0.00037) * 10000;
    return n - Math.floor(n);
}

function collapseChance(tile: UndergroundTile, undergroundGlobalStability: number): number {
    if (tile.hasSupport || tile.status === 'REINFORCED') return 0;
    if (!tile.hasTunnel && tile.status !== 'DUG') return 0;
    if (tile.status === 'COLLAPSED') return 0;

    const localRisk = Math.max(0, WARNING_STABILITY - tile.stability) / 100;
    const globalRisk = Math.max(0, 50 - undergroundGlobalStability) / 250;
    const hazardRisk = tile.hazard === 'INSTABILITY' ? 0.18 : 0;
    const criticalRisk = tile.stability <= CRITICAL_STABILITY ? 0.22 : 0;

    return Math.min(0.55, localRisk + globalRisk + hazardRisk + criticalRisk);
}

function runCollapseCheck(world: any): void {
    const stateManager = world.stateManager;
    const state = stateManager?.getState?.();
    if (!state || state.activeView !== 'DUNGEON') return;

    const underground = ensureUndergroundState(state);
    const tiles = Object.values(underground.tiles) as UndergroundTile[];
    let changed = false;
    let warnings = 0;
    let collapses = 0;

    for (const tile of tiles) {
        if (tile.status !== 'DUG' && !tile.hasTunnel) continue;
        if (tile.status === 'COLLAPSED') continue;
        if (tile.hasSupport || tile.status === 'REINFORCED') continue;

        if (tile.stability <= WARNING_STABILITY && warnings < 1) {
            addNews(state, `Sector B${tile.depth} instability warning at (${tile.x}, ${tile.z}). Support recommended.`, 'NEGATIVE');
            warnings += 1;
            changed = true;
        }

        const chance = collapseChance(tile, underground.globalStability);
        if (chance <= 0) continue;

        if (seededRoll(tile, Date.now()) < chance) {
            tile.status = 'COLLAPSED';
            tile.hasTunnel = false;
            tile.hasSupport = false;
            tile.connectedToSurface = false;
            tile.stability = Math.max(0, tile.stability - 10);

            underground.globalStability = Math.max(0, underground.globalStability - GLOBAL_STABILITY_LOSS);
            underground.exposureRisk = Math.min(100, underground.exposureRisk + EXPOSURE_ON_COLLAPSE);

            addNews(state, `Cave-in reported at Sector B${tile.depth} (${tile.x}, ${tile.z}).`, 'CRITICAL');
            collapses += 1;
            changed = true;

            if (collapses >= 1) break;
        }
    }

    if (changed) {
        if (collapses > 0) {
            stateManager.pushEffect?.({ type: 'AUDIO', sfx: SfxType.ERROR });
        }
        stateManager.markDirty?.('underground' as any, 'newsFeed' as any, 'pendingEffects' as any);
    }
}

if (!proto.__deepLedgerCollapseRiskPatched) {
    const originalDraw = proto.draw;

    proto.draw = function patchedDeepLedgerCollapseDraw(this: any, ctx: any): void {
        const result = originalDraw.call(this, ctx);
        const now = Date.now();

        if (now - lastCheckAt >= CHECK_INTERVAL_MS) {
            lastCheckAt = now;
            runCollapseCheck(this);
        }

        return result;
    };

    proto.__deepLedgerCollapseRiskPatched = true;
}
