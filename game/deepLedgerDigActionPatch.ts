import { AureusWorld } from './AureusWorld';
import { ensureUndergroundState } from '../engine/underground/UndergroundGenerator';
import { isUndergroundTileConnected, recalculateUndergroundConnectivity } from '../engine/underground/UndergroundConnectivity';
import { DEEP_LEDGER_TUNING } from '../engine/underground/DeepLedgerTuning';
import { SfxType, UndergroundTile } from '../types';
import { getSelectedDeepLedgerTileId, setSelectedDeepLedgerTileId } from './deepLedgerSelection';

/**
 * Adds a compact Deep Ledger tunnel action panel.
 *
 * This is intentionally separate from the inspector UI so the first tunnel action
 * can ship without replacing the entire inspector overlay.
 */
const proto = AureusWorld.prototype as any;
const PANEL_ID = 'deep-ledger-dig-action-panel';
const TUNING = DEEP_LEDGER_TUNING;
const COST_AGT = TUNING.actionCosts.openTunnelAGT;
const REINFORCE_COST_AGT = TUNING.actionCosts.reinforceTunnelAGT;
const CLEAR_COLLAPSE_COST_AGT = TUNING.actionCosts.clearCollapseAGT;
const MITIGATE_HAZARD_COST_AGT = TUNING.actionCosts.mitigateHazardAGT;
const TILE_STABILITY_COST = TUNING.tileStability.openTunnelCost;
const TILE_REINFORCE_GAIN = TUNING.tileStability.reinforceGain;
const TILE_CLEAR_STABILITY = TUNING.tileStability.clearCollapseMinimum;
const TILE_EXTRACT_STABILITY_COST = TUNING.tileStability.extractionCost;
const TILE_MITIGATION_STABILITY_GAIN = TUNING.tileStability.mitigationGain;
const ORE_DEPLETION_PER_EXTRACT = TUNING.extraction.oreDepletionPerExtract;
const GLOBAL_STABILITY_COST = TUNING.globalStability.openTunnelCost;
const GLOBAL_REINFORCE_GAIN = TUNING.globalStability.reinforceGain;
const GLOBAL_CLEAR_STABILITY_COST = TUNING.globalStability.clearCollapseCost;
const GLOBAL_MITIGATION_STABILITY_GAIN = TUNING.globalStability.mitigationGain;
const GLOBAL_EXTRACT_STABILITY_COST = TUNING.globalStability.extractionCost;

let selectedIndex = 0;
let collapsed = false;

function getPanel(): HTMLDivElement | null {
    if (typeof document === 'undefined') return null;

    let panel = document.getElementById(PANEL_ID) as HTMLDivElement | null;
    if (!panel) {
        panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.style.position = 'fixed';
        panel.style.left = '16px';
        panel.style.bottom = '24px';
        panel.style.zIndex = '73';
        panel.style.pointerEvents = 'auto';
        panel.style.minWidth = '260px';
        document.body.appendChild(panel);
    }

    return panel;
}

function scoreTile(tile: UndergroundTile): number {
    let score = 0;
    if (tile.status === 'COLLAPSED') score += 1400;
    if (tile.status === 'DUG' || tile.hasTunnel) score -= 500;
    if ((tile.status === 'DUG' || tile.status === 'REINFORCED') && tile.resourceType !== 'NONE') score += 900;
    if (tile.status === 'DUG' && !tile.hasSupport) score += 750;
    if (!tile.connectedToSurface && (tile.status === 'DUG' || tile.status === 'REINFORCED' || tile.hasTunnel)) score += 650;
    if (tile.hazard !== 'NONE') score += 1600;
    if (tile.resourceType !== 'NONE') score += 500;
    score += tile.oreRichness;
    score += Math.max(0, 100 - tile.stability);
    return score;
}

function getTiles(state: any): UndergroundTile[] {
    const underground = ensureUndergroundState(state);
    recalculateUndergroundConnectivity(underground);
    const selectedId = getSelectedDeepLedgerTileId();
    const tiles = (Object.values(underground.tiles) as UndergroundTile[])
        .filter(tile => tile.status !== 'HIDDEN')
        .sort((a, b) => scoreTile(b) - scoreTile(a));

    if (!selectedId) return tiles;

    const selectedTile = tiles.find(tile => tile.id === selectedId);
    if (!selectedTile) return tiles;

    return [selectedTile, ...tiles.filter(tile => tile.id !== selectedId)];
}

function addNews(state: any, headline: string, type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'CRITICAL'): void {
    state.newsFeed.unshift({
        id: `deep_ledger_action_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        headline,
        type,
        timestamp: Date.now()
    });
    state.newsFeed = state.newsFeed.slice(0, 12);
}

function digSelectedTile(world: any, tile: UndergroundTile): void {
    const stateManager = world.stateManager;
    const state = stateManager?.getState?.();
    if (!state) return;

    const underground = ensureUndergroundState(state);
    const liveTile = underground.tiles[tile.id];
    if (!liveTile) return;

    if (liveTile.status === 'DUG' || liveTile.hasTunnel) {
        addNews(state, 'That Sector B1 tile already has an open tunnel.', 'NEUTRAL');
        stateManager.markDirty?.('newsFeed' as any);
        return;
    }

    if (liveTile.status !== 'SURVEYED' && liveTile.status !== 'REINFORCED') {
        addNews(state, 'Only surveyed Sector B1 tiles can be opened.', 'NEGATIVE');
        stateManager.pushEffect?.({ type: 'AUDIO', sfx: SfxType.ERROR });
        stateManager.markDirty?.('newsFeed' as any, 'pendingEffects' as any);
        return;
    }

    if (!state.cheatsEnabled && state.resources.agt < COST_AGT) {
        addNews(state, `Tunnel operation requires ${COST_AGT} AGT.`, 'NEGATIVE');
        stateManager.pushEffect?.({ type: 'AUDIO', sfx: SfxType.ERROR });
        stateManager.markDirty?.('newsFeed' as any, 'pendingEffects' as any);
        return;
    }

    if (!state.cheatsEnabled) {
        state.resources.agt -= COST_AGT;
    }

    liveTile.status = 'DUG';
    liveTile.hasTunnel = true;
    liveTile.stability = Math.max(5, liveTile.stability - TILE_STABILITY_COST);
    underground.globalStability = Math.max(0, underground.globalStability - GLOBAL_STABILITY_COST);
    recalculateUndergroundConnectivity(underground);

    if (liveTile.hazard !== 'NONE') {
        underground.exposureRisk = Math.min(100, underground.exposureRisk + TUNING.exposure.openHazardTunnel);
    }

    addNews(state, `Tunnel opened at Sector B${liveTile.depth} (${liveTile.x}, ${liveTile.z}).`, 'POSITIVE');
    stateManager.pushEffect?.({ type: 'AUDIO', sfx: SfxType.BUILD });
    stateManager.markDirty?.('resources' as any, 'underground' as any, 'newsFeed' as any, 'pendingEffects' as any);
}

function reinforceSelectedTile(world: any, tile: UndergroundTile): void {
    const stateManager = world.stateManager;
    const state = stateManager?.getState?.();
    if (!state) return;

    const underground = ensureUndergroundState(state);
    const liveTile = underground.tiles[tile.id];
    if (!liveTile) return;

    if (!liveTile.hasTunnel && liveTile.status !== 'DUG' && liveTile.status !== 'REINFORCED') {
        addNews(state, 'Only open tunnel tiles can be reinforced.', 'NEGATIVE');
        stateManager.pushEffect?.({ type: 'AUDIO', sfx: SfxType.ERROR });
        stateManager.markDirty?.('newsFeed' as any, 'pendingEffects' as any);
        return;
    }

    if (liveTile.hasSupport || liveTile.status === 'REINFORCED') {
        addNews(state, 'That Sector B1 tunnel is already reinforced.', 'NEUTRAL');
        stateManager.markDirty?.('newsFeed' as any);
        return;
    }

    if (!state.cheatsEnabled && state.resources.agt < REINFORCE_COST_AGT) {
        addNews(state, `Reinforcement requires ${REINFORCE_COST_AGT} AGT.`, 'NEGATIVE');
        stateManager.pushEffect?.({ type: 'AUDIO', sfx: SfxType.ERROR });
        stateManager.markDirty?.('newsFeed' as any, 'pendingEffects' as any);
        return;
    }

    if (!state.cheatsEnabled) {
        state.resources.agt -= REINFORCE_COST_AGT;
    }

    liveTile.hasSupport = true;
    liveTile.hasTunnel = true;
    liveTile.status = 'REINFORCED';
    liveTile.stability = Math.min(100, liveTile.stability + TILE_REINFORCE_GAIN);
    underground.globalStability = Math.min(100, underground.globalStability + GLOBAL_REINFORCE_GAIN);
    recalculateUndergroundConnectivity(underground);

    addNews(state, `Support beams installed at Sector B${liveTile.depth} (${liveTile.x}, ${liveTile.z}).`, 'POSITIVE');
    stateManager.pushEffect?.({ type: 'AUDIO', sfx: SfxType.BUILD });
    stateManager.markDirty?.('resources' as any, 'underground' as any, 'newsFeed' as any, 'pendingEffects' as any);
}

function clearCollapsedTile(world: any, tile: UndergroundTile): void {
    const stateManager = world.stateManager;
    const state = stateManager?.getState?.();
    if (!state) return;

    const underground = ensureUndergroundState(state);
    const liveTile = underground.tiles[tile.id];
    if (!liveTile) return;

    if (liveTile.status !== 'COLLAPSED') {
        addNews(state, 'Only collapsed Sector B1 tiles can be cleared.', 'NEGATIVE');
        stateManager.pushEffect?.({ type: 'AUDIO', sfx: SfxType.ERROR });
        stateManager.markDirty?.('newsFeed' as any, 'pendingEffects' as any);
        return;
    }

    if (!state.cheatsEnabled && state.resources.agt < CLEAR_COLLAPSE_COST_AGT) {
        addNews(state, `Clearing collapsed rubble requires ${CLEAR_COLLAPSE_COST_AGT} AGT.`, 'NEGATIVE');
        stateManager.pushEffect?.({ type: 'AUDIO', sfx: SfxType.ERROR });
        stateManager.markDirty?.('newsFeed' as any, 'pendingEffects' as any);
        return;
    }

    if (!state.cheatsEnabled) {
        state.resources.agt -= CLEAR_COLLAPSE_COST_AGT;
    }

    liveTile.status = 'DUG';
    liveTile.hasTunnel = true;
    liveTile.hasSupport = false;
    liveTile.stability = Math.max(TILE_CLEAR_STABILITY, liveTile.stability);
    underground.globalStability = Math.max(0, underground.globalStability - GLOBAL_CLEAR_STABILITY_COST);
    underground.exposureRisk = Math.min(100, underground.exposureRisk + TUNING.exposure.clearCollapse);
    recalculateUndergroundConnectivity(underground);

    addNews(state, `Rubble cleared at Sector B${liveTile.depth} (${liveTile.x}, ${liveTile.z}). Tunnel reopened but remains unstable.`, 'POSITIVE');
    stateManager.pushEffect?.({ type: 'AUDIO', sfx: SfxType.BUILD });
    stateManager.markDirty?.('resources' as any, 'underground' as any, 'newsFeed' as any, 'pendingEffects' as any);
}

function mitigateHazard(world: any, tile: UndergroundTile): void {
    const stateManager = world.stateManager;
    const state = stateManager?.getState?.();
    if (!state) return;

    const underground = ensureUndergroundState(state);
    const liveTile = underground.tiles[tile.id];
    if (!liveTile) return;

    if (liveTile.status === 'COLLAPSED') {
        addNews(state, 'Clear collapsed rubble before mitigating hazards.', 'NEGATIVE');
        stateManager.pushEffect?.({ type: 'AUDIO', sfx: SfxType.ERROR });
        stateManager.markDirty?.('newsFeed' as any, 'pendingEffects' as any);
        return;
    }

    if (liveTile.hazard === 'NONE') {
        addNews(state, 'No active hazard remains on that Sector B1 tile.', 'NEUTRAL');
        stateManager.markDirty?.('newsFeed' as any);
        return;
    }

    if (!state.cheatsEnabled && state.resources.agt < MITIGATE_HAZARD_COST_AGT) {
        addNews(state, `Hazard mitigation requires ${MITIGATE_HAZARD_COST_AGT} AGT.`, 'NEGATIVE');
        stateManager.pushEffect?.({ type: 'AUDIO', sfx: SfxType.ERROR });
        stateManager.markDirty?.('newsFeed' as any, 'pendingEffects' as any);
        return;
    }

    if (!state.cheatsEnabled) {
        state.resources.agt -= MITIGATE_HAZARD_COST_AGT;
    }

    const oldHazard = liveTile.hazard;
    liveTile.hazard = 'NONE';
    liveTile.stability = Math.min(100, liveTile.stability + TILE_MITIGATION_STABILITY_GAIN);
    underground.globalStability = Math.min(100, underground.globalStability + GLOBAL_MITIGATION_STABILITY_GAIN);

    if (oldHazard === 'GAS') {
        underground.oxygen = Math.min(100, underground.oxygen + TUNING.oxygen.gasMitigationGain);
        addNews(state, `Vent crews cleared gas from Sector B${liveTile.depth} (${liveTile.x}, ${liveTile.z}).`, 'POSITIVE');
    } else if (oldHazard === 'WATER') {
        addNews(state, `Pumps cleared water from Sector B${liveTile.depth} (${liveTile.x}, ${liveTile.z}).`, 'POSITIVE');
    } else if (oldHazard === 'INSTABILITY') {
        liveTile.stability = Math.min(100, liveTile.stability + TILE_MITIGATION_STABILITY_GAIN);
        addNews(state, `Instability stabilized at Sector B${liveTile.depth} (${liveTile.x}, ${liveTile.z}).`, 'POSITIVE');
    } else if (oldHazard === 'ILLEGAL_TUNNEL') {
        underground.exposureRisk = Math.max(0, underground.exposureRisk - TUNING.exposure.illegalTunnelMitigationReduction);
        addNews(state, `Illegal tunnel secured at Sector B${liveTile.depth} (${liveTile.x}, ${liveTile.z}). Exposure reduced.`, 'POSITIVE');
    } else if (oldHazard === 'HEAT') {
        addNews(state, `Heat pocket cooled at Sector B${liveTile.depth} (${liveTile.x}, ${liveTile.z}).`, 'POSITIVE');
    }

    recalculateUndergroundConnectivity(underground);
    stateManager.pushEffect?.({ type: 'AUDIO', sfx: SfxType.BUILD });
    stateManager.markDirty?.('resources' as any, 'underground' as any, 'newsFeed' as any, 'pendingEffects' as any);
}

function extractSelectedTile(world: any, tile: UndergroundTile): void {
    const stateManager = world.stateManager;
    const state = stateManager?.getState?.();
    if (!state) return;

    const underground = ensureUndergroundState(state);
    recalculateUndergroundConnectivity(underground);
    const liveTile = underground.tiles[tile.id];
    if (!liveTile) return;

    const isOpen = liveTile.status === 'DUG' || liveTile.status === 'REINFORCED' || liveTile.hasTunnel;
    if (!isOpen) {
        addNews(state, 'Only open Sector B1 tunnels can be extracted.', 'NEGATIVE');
        stateManager.pushEffect?.({ type: 'AUDIO', sfx: SfxType.ERROR });
        stateManager.markDirty?.('newsFeed' as any, 'pendingEffects' as any);
        return;
    }

    if (!isUndergroundTileConnected(liveTile)) {
        addNews(state, 'That tunnel is disconnected from surface access. Reconnect the route before extraction.', 'NEGATIVE');
        stateManager.pushEffect?.({ type: 'AUDIO', sfx: SfxType.ERROR });
        stateManager.markDirty?.('underground' as any, 'newsFeed' as any, 'pendingEffects' as any);
        return;
    }

    if (liveTile.resourceType === 'NONE' || liveTile.oreRichness <= 0) {
        addNews(state, 'No extractable deposit remains in that tunnel.', 'NEUTRAL');
        stateManager.markDirty?.('newsFeed' as any);
        return;
    }

    const yieldAmount = Math.max(1, Math.ceil(liveTile.oreRichness / 10));
    let headline = '';

    if (liveTile.resourceType === 'MINERALS') {
        state.resources.minerals = (state.resources.minerals ?? 0) + yieldAmount;
        headline = `Extracted ${yieldAmount} minerals from Sector B${liveTile.depth}.`;
    } else if (liveTile.resourceType === 'GEMS') {
        const agt = yieldAmount * TUNING.extraction.gemAGTPerYield;
        state.resources.agt += agt;
        headline = `Sold gem yield from Sector B${liveTile.depth} for ${agt} AGT.`;
    } else if (liveTile.resourceType === 'AUREUS_VEIN') {
        const agt = yieldAmount * TUNING.extraction.aureusAGTPerYield;
        state.resources.agt += agt;
        underground.exposureRisk = Math.min(100, underground.exposureRisk + TUNING.exposure.aureusExtraction);
        headline = `Aureus vein extraction yielded ${agt} AGT. Exposure risk increased.`;
    } else if (liveTile.resourceType === 'RELIC_FRAGMENT') {
        const research = yieldAmount;
        if ('research' in state.resources) {
            state.resources.research = (state.resources.research ?? 0) + research;
            headline = `Recovered ${research} relic research from Sector B${liveTile.depth}.`;
        } else {
            const agt = yieldAmount * TUNING.extraction.relicFallbackAGTPerYield;
            state.resources.agt += agt;
            headline = `Recovered relic fragments from Sector B${liveTile.depth} and liquidated them for ${agt} AGT.`;
        }
        underground.exposureRisk = Math.min(100, underground.exposureRisk + TUNING.exposure.relicExtraction);
    }

    liveTile.oreRichness = Math.max(0, liveTile.oreRichness - ORE_DEPLETION_PER_EXTRACT);
    liveTile.stability = Math.max(0, liveTile.stability - TILE_EXTRACT_STABILITY_COST);
    underground.globalStability = Math.max(0, underground.globalStability - GLOBAL_EXTRACT_STABILITY_COST);
    recalculateUndergroundConnectivity(underground);

    if (liveTile.hazard !== 'NONE') {
        underground.exposureRisk = Math.min(100, underground.exposureRisk + TUNING.exposure.hazardousExtraction);
    }

    if (liveTile.oreRichness <= 0) {
        liveTile.resourceType = 'NONE';
        liveTile.oreRichness = 0;
        headline += ' Deposit depleted.';
    }

    addNews(state, headline, 'POSITIVE');
    stateManager.pushEffect?.({ type: 'AUDIO', sfx: SfxType.BUILD });
    stateManager.markDirty?.('resources' as any, 'underground' as any, 'newsFeed' as any, 'pendingEffects' as any);
}

function renderPanel(world: any, state: any): void {
    const panel = getPanel();
    if (!panel) return;

    if (state.activeView !== 'DUNGEON') {
        panel.style.display = 'none';
        return;
    }

    const underground = ensureUndergroundState(state);
    recalculateUndergroundConnectivity(underground);
    const tiles = getTiles(state);
    const selectedId = getSelectedDeepLedgerTileId();
    if (selectedId) {
        const selectedPosition = tiles.findIndex(tile => tile.id === selectedId);
        if (selectedPosition >= 0) selectedIndex = selectedPosition;
    }
    if (selectedIndex >= tiles.length) selectedIndex = Math.max(0, tiles.length - 1);
    if (selectedIndex < 0) selectedIndex = 0;

    const tile = tiles[selectedIndex];
    const isMarkerSelected = Boolean(tile && getSelectedDeepLedgerTileId() === tile.id);
    const isCollapsed = tile?.status === 'COLLAPSED';
    const isOpen = Boolean(tile && (tile.status === 'DUG' || tile.status === 'REINFORCED' || tile.hasTunnel));
    const isConnected = isUndergroundTileConnected(tile);
    const canOpen = Boolean(tile && !isCollapsed && (tile.status === 'SURVEYED' || tile.status === 'REINFORCED'));
    const canClear = Boolean(tile && isCollapsed);
    const canMitigate = Boolean(tile && !isCollapsed && tile.hazard !== 'NONE');
    const canReinforce = Boolean(tile && !isCollapsed && (tile.status === 'DUG' || tile.hasTunnel) && !tile.hasSupport && tile.status !== 'REINFORCED');
    const canExtract = Boolean(tile && !isCollapsed && isOpen && isConnected && tile.resourceType !== 'NONE' && tile.oreRichness > 0);
    const title = tile ? `B${tile.depth} // ${tile.x}, ${tile.z}` : 'No surveyed tiles';
    const supportState = tile?.hasSupport || tile?.status === 'REINFORCED' ? 'SUPPORTED' : 'UNSUPPORTED';
    const connectionState = isConnected ? 'CONNECTED' : 'DISCONNECTED';
    const detail = tile
        ? `${tile.status} | ${connectionState} | ${supportState} | ${tile.resourceType} | ${tile.oreRichness}% ore | ${tile.stability}% stability | ${tile.hazard}`
        : 'Scan Sector B1 with a Survey Drill first.';

    panel.style.display = 'block';
    panel.innerHTML = `
        <div style="background:rgba(2,6,23,.94);border:1px solid ${isMarkerSelected ? 'rgba(255,255,255,.78)' : 'rgba(245,158,11,.4)'};border-radius:10px;color:#e2e8f0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;box-shadow:0 20px 40px rgba(0,0,0,.45);overflow:hidden;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 12px;background:rgba(15,23,42,.92);">
                <div>
                    <div style="color:#f59e0b;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;">Tunnel Action${isMarkerSelected ? ' // Selected' : ''}</div>
                    <div style="color:#94a3b8;font-size:10px;margin-top:2px;">${title}</div>
                </div>
                <button id="deep-ledger-dig-collapse" style="background:rgba(30,41,59,.9);color:#f59e0b;border:1px solid rgba(245,158,11,.35);border-radius:6px;cursor:pointer;font-size:10px;font-weight:900;padding:4px 8px;text-transform:uppercase;">${collapsed ? 'Open' : 'Min'}</button>
            </div>
            ${collapsed ? '' : `
                <div style="padding:12px;font-size:11px;color:#94a3b8;line-height:1.45;">${detail}</div>
                <div style="display:flex;border-top:1px solid rgba(51,65,85,.8);">
                    <button id="deep-ledger-dig-prev" style="flex:1;padding:9px;background:rgba(15,23,42,.95);color:#cbd5e1;border:0;border-right:1px solid rgba(51,65,85,.8);cursor:pointer;font-weight:800;text-transform:uppercase;font-size:10px;">Prev</button>
                    <button id="deep-ledger-dig-next" style="flex:1;padding:9px;background:rgba(15,23,42,.95);color:#cbd5e1;border:0;border-right:1px solid rgba(51,65,85,.8);cursor:pointer;font-weight:800;text-transform:uppercase;font-size:10px;">Next</button>
                    <button id="deep-ledger-open-tunnel" ${canOpen ? '' : 'disabled'} style="flex:1.05;padding:9px;background:${canOpen ? 'linear-gradient(135deg,rgba(245,158,11,.95),rgba(180,83,9,.95))' : 'rgba(30,41,59,.75)'};color:${canOpen ? '#1c1917' : '#64748b'};border:0;border-right:1px solid rgba(51,65,85,.8);cursor:${canOpen ? 'pointer' : 'not-allowed'};font-weight:900;text-transform:uppercase;font-size:10px;">Open</button>
                    <button id="deep-ledger-clear-collapse" ${canClear ? '' : 'disabled'} style="flex:1.15;padding:9px;background:${canClear ? 'linear-gradient(135deg,rgba(251,113,133,.95),rgba(190,18,60,.95))' : 'rgba(30,41,59,.75)'};color:${canClear ? '#fff1f2' : '#64748b'};border:0;border-right:1px solid rgba(51,65,85,.8);cursor:${canClear ? 'pointer' : 'not-allowed'};font-weight:900;text-transform:uppercase;font-size:10px;">Clear</button>
                    <button id="deep-ledger-mitigate-hazard" ${canMitigate ? '' : 'disabled'} style="flex:1.2;padding:9px;background:${canMitigate ? 'linear-gradient(135deg,rgba(56,189,248,.95),rgba(14,116,144,.95))' : 'rgba(30,41,59,.75)'};color:${canMitigate ? '#ecfeff' : '#64748b'};border:0;border-right:1px solid rgba(51,65,85,.8);cursor:${canMitigate ? 'pointer' : 'not-allowed'};font-weight:900;text-transform:uppercase;font-size:10px;">Mitigate</button>
                    <button id="deep-ledger-reinforce-tunnel" ${canReinforce ? '' : 'disabled'} style="flex:1.25;padding:9px;background:${canReinforce ? 'linear-gradient(135deg,rgba(52,211,153,.95),rgba(5,150,105,.95))' : 'rgba(30,41,59,.75)'};color:${canReinforce ? '#022c22' : '#64748b'};border:0;border-right:1px solid rgba(51,65,85,.8);cursor:${canReinforce ? 'pointer' : 'not-allowed'};font-weight:900;text-transform:uppercase;font-size:10px;">Support</button>
                    <button id="deep-ledger-extract-tile" ${canExtract ? '' : 'disabled'} style="flex:1.25;padding:9px;background:${canExtract ? 'linear-gradient(135deg,rgba(168,85,247,.95),rgba(126,34,206,.95))' : 'rgba(30,41,59,.75)'};color:${canExtract ? '#faf5ff' : '#64748b'};border:0;cursor:${canExtract ? 'pointer' : 'not-allowed'};font-weight:900;text-transform:uppercase;font-size:10px;">Extract</button>
                </div>
            `}
        </div>
    `;

    panel.querySelector('#deep-ledger-dig-collapse')?.addEventListener('click', () => {
        collapsed = !collapsed;
        renderPanel(world, state);
    });
    panel.querySelector('#deep-ledger-dig-prev')?.addEventListener('click', () => {
        selectedIndex = tiles.length ? (selectedIndex - 1 + tiles.length) % tiles.length : 0;
        if (tiles[selectedIndex]) setSelectedDeepLedgerTileId(tiles[selectedIndex].id);
        renderPanel(world, state);
    });
    panel.querySelector('#deep-ledger-dig-next')?.addEventListener('click', () => {
        selectedIndex = tiles.length ? (selectedIndex + 1) % tiles.length : 0;
        if (tiles[selectedIndex]) setSelectedDeepLedgerTileId(tiles[selectedIndex].id);
        renderPanel(world, state);
    });
    panel.querySelector('#deep-ledger-open-tunnel')?.addEventListener('click', () => {
        if (tile) {
            setSelectedDeepLedgerTileId(tile.id);
            digSelectedTile(world, tile);
        }
        renderPanel(world, state);
    });
    panel.querySelector('#deep-ledger-clear-collapse')?.addEventListener('click', () => {
        if (tile) {
            setSelectedDeepLedgerTileId(tile.id);
            clearCollapsedTile(world, tile);
        }
        renderPanel(world, state);
    });
    panel.querySelector('#deep-ledger-mitigate-hazard')?.addEventListener('click', () => {
        if (tile) {
            setSelectedDeepLedgerTileId(tile.id);
            mitigateHazard(world, tile);
        }
        renderPanel(world, state);
    });
    panel.querySelector('#deep-ledger-reinforce-tunnel')?.addEventListener('click', () => {
        if (tile) {
            setSelectedDeepLedgerTileId(tile.id);
            reinforceSelectedTile(world, tile);
        }
        renderPanel(world, state);
    });
    panel.querySelector('#deep-ledger-extract-tile')?.addEventListener('click', () => {
        if (tile) {
            setSelectedDeepLedgerTileId(tile.id);
            extractSelectedTile(world, tile);
        }
        renderPanel(world, state);
    });
}

if (!proto.__deepLedgerDigActionPatched) {
    const originalDraw = proto.draw;
    const originalTeardown = proto.onTeardown;

    proto.draw = function patchedDeepLedgerDigActionDraw(this: any, ctx: any): void {
        const result = originalDraw.call(this, ctx);
        const state = this.stateManager?.getState?.();
        if (state) renderPanel(this, state);
        return result;
    };

    proto.onTeardown = async function patchedDeepLedgerDigActionTeardown(this: any): Promise<void> {
        const panel = typeof document !== 'undefined' ? document.getElementById(PANEL_ID) : null;
        panel?.remove();
        return originalTeardown.call(this);
    };

    proto.__deepLedgerDigActionPatched = true;
}
