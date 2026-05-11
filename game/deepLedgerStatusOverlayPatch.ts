import { AureusWorld } from './AureusWorld';
import { ensureUndergroundState } from '../engine/underground/UndergroundGenerator';
import { UndergroundTile } from '../types';

/**
 * Lightweight runtime HUD for the Deep Ledger survey foundation.
 *
 * The proper React HUD component exists, but this overlay keeps the first playable
 * slice decoupled from the large App shell until the UI layout is refactored.
 */
const proto = AureusWorld.prototype as any;
const OVERLAY_ID = 'deep-ledger-status-overlay';
let collapsed = false;

function getOverlay(): HTMLDivElement | null {
    if (typeof document === 'undefined') return null;

    let overlay = document.getElementById(OVERLAY_ID) as HTMLDivElement | null;

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.style.position = 'fixed';
        overlay.style.top = '96px';
        overlay.style.right = '16px';
        overlay.style.zIndex = '70';
        overlay.style.pointerEvents = 'auto';
        overlay.style.minWidth = '250px';
        document.body.appendChild(overlay);
    }

    return overlay;
}

function renderDeepLedgerOverlay(state: any): void {
    const overlay = getOverlay();
    if (!overlay) return;

    if (state.activeView !== 'DUNGEON') {
        overlay.style.display = 'none';
        return;
    }

    const underground = ensureUndergroundState(state);
    const visibleTiles = Object.values(underground.tiles) as UndergroundTile[];
    const surveyedTiles = visibleTiles.filter(tile => tile.status !== 'HIDDEN');
    const dugTiles = surveyedTiles.filter(tile => tile.status === 'DUG' || tile.hasTunnel).length;
    const hazardCount = surveyedTiles.filter(tile => tile.hazard !== 'NONE').length;
    const depositCount = surveyedTiles.filter(tile => tile.resourceType !== 'NONE').length;

    overlay.style.display = 'block';
    overlay.innerHTML = `
        <div style="background: rgba(2, 6, 23, 0.92); border: 1px solid rgba(245, 158, 11, 0.45); border-radius: 10px; color: #e2e8f0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; box-shadow: 0 20px 40px rgba(0,0,0,0.45); backdrop-filter: blur(10px); overflow: hidden;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; background: rgba(15, 23, 42, 0.88); border-bottom: ${collapsed ? '0' : '1px solid rgba(51, 65, 85, 0.8)'};">
                <div style="color: #f59e0b; font-size: 11px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase;">
                    Deep Ledger // B${underground.depthLevel}
                </div>
                <button id="deep-ledger-status-collapse" style="background: rgba(30, 41, 59, 0.9); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: 900; padding: 4px 8px; text-transform: uppercase;">
                    ${collapsed ? 'Open' : 'Min'}
                </button>
            </div>
            ${collapsed ? '' : `
                <div style="padding: 14px 16px;">
                    <div style="display: grid; gap: 7px; font-size: 12px;">
                        <div style="display: flex; justify-content: space-between; gap: 32px;"><span style="color: #64748b; text-transform: uppercase;">Stability</span><span>${underground.globalStability}%</span></div>
                        <div style="display: flex; justify-content: space-between; gap: 32px;"><span style="color: #64748b; text-transform: uppercase;">Oxygen</span><span>${underground.oxygen}%</span></div>
                        <div style="display: flex; justify-content: space-between; gap: 32px;"><span style="color: #64748b; text-transform: uppercase;">Exposure</span><span>${underground.exposureRisk}%</span></div>
                        <div style="height: 1px; background: rgba(51, 65, 85, 0.8); margin: 4px 0;"></div>
                        <div style="display: flex; justify-content: space-between; gap: 32px;"><span style="color: #64748b; text-transform: uppercase;">Surveyed</span><span>${surveyedTiles.length}</span></div>
                        <div style="display: flex; justify-content: space-between; gap: 32px;"><span style="color: #64748b; text-transform: uppercase;">Dug</span><span>${dugTiles}</span></div>
                        <div style="display: flex; justify-content: space-between; gap: 32px;"><span style="color: #64748b; text-transform: uppercase;">Deposits</span><span>${depositCount}</span></div>
                        <div style="display: flex; justify-content: space-between; gap: 32px;"><span style="color: #64748b; text-transform: uppercase;">Hazards</span><span style="color: ${hazardCount > 0 ? '#f59e0b' : '#e2e8f0'};">${hazardCount}</span></div>
                    </div>
                    <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(51, 65, 85, 0.8); color: #64748b; font-size: 10px; line-height: 1.35;">
                        The surface tells the public story. The Deep Ledger records what happens beneath it.
                    </div>
                </div>
            `}
        </div>
    `;

    overlay.querySelector('#deep-ledger-status-collapse')?.addEventListener('click', () => {
        collapsed = !collapsed;
        renderDeepLedgerOverlay(state);
    });
}

if (!proto.__deepLedgerStatusOverlayPatched) {
    const originalDraw = proto.draw;

    proto.draw = function patchedDeepLedgerOverlayDraw(this: any, ctx: any): void {
        const result = originalDraw.call(this, ctx);
        const state = this.stateManager?.getState?.();
        if (state) renderDeepLedgerOverlay(state);
        return result;
    };

    proto.__deepLedgerStatusOverlayPatched = true;
}
