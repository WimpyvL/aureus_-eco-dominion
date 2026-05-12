import { AureusWorld } from './AureusWorld';
import { ensureUndergroundState } from '../engine/underground/UndergroundGenerator';
import { UndergroundTile } from '../types';
import { getSelectedDeepLedgerTileId, setSelectedDeepLedgerTileId } from './deepLedgerSelection';

/**
 * Deep Ledger tile inspector v0.
 *
 * Proper underground click-picking belongs in the render/input systems. This patch
 * gives players immediate readable survey intelligence by cycling through the
 * most important revealed Sector B1 tiles: hazards and deposits first.
 */
const proto = AureusWorld.prototype as any;
const INSPECTOR_ID = 'deep-ledger-tile-inspector';

let selectedIndex = 0;

function getInspector(): HTMLDivElement | null {
    if (typeof document === 'undefined') return null;

    let inspector = document.getElementById(INSPECTOR_ID) as HTMLDivElement | null;

    if (!inspector) {
        inspector = document.createElement('div');
        inspector.id = INSPECTOR_ID;
        inspector.style.position = 'fixed';
        inspector.style.right = '16px';
        inspector.style.bottom = '24px';
        inspector.style.zIndex = '73';
        inspector.style.pointerEvents = 'auto';
        inspector.style.minWidth = '290px';
        inspector.style.maxWidth = '330px';
        document.body.appendChild(inspector);
    }

    return inspector;
}

function priority(tile: UndergroundTile): number {
    let score = 0;
    if (tile.hazard !== 'NONE') score += 1000;
    if (tile.resourceType !== 'NONE') score += 500;
    score += tile.oreRichness;
    score += Math.max(0, 100 - tile.stability);
    return score;
}

function getInspectableTiles(state: any): UndergroundTile[] {
    const underground = ensureUndergroundState(state);
    const selectedId = getSelectedDeepLedgerTileId();
    const tiles = (Object.values(underground.tiles) as UndergroundTile[])
        .filter(tile => tile.status !== 'HIDDEN')
        .sort((a, b) => priority(b) - priority(a));

    if (!selectedId) return tiles;

    const selectedTile = tiles.find(tile => tile.id === selectedId);
    if (!selectedTile) return tiles;

    return [selectedTile, ...tiles.filter(tile => tile.id !== selectedId)];
}

function recommendation(tile: UndergroundTile): string {
    if (tile.status === 'COLLAPSED') return 'Collapsed. Re-open or route around this tile in a later connectivity pass.';
    if (tile.status === 'REINFORCED' || tile.hasSupport) return 'Supported tunnel. Safer candidate for extraction.';
    if (tile.status === 'DUG' || tile.hasTunnel) return 'Open tunnel. Consider support before repeated extraction.';
    if (tile.hazard === 'GAS') return 'Ventilation recommended before extraction.';
    if (tile.hazard === 'WATER') return 'Pump support recommended before tunneling.';
    if (tile.hazard === 'INSTABILITY') return 'Reinforcement recommended before drilling.';
    if (tile.hazard === 'ILLEGAL_TUNNEL') return 'Security sweep recommended. Possible illegal miner route.';
    if (tile.resourceType === 'AUREUS_VEIN') return 'High-value target. Stabilize before extraction.';
    if (tile.resourceType === 'GEMS') return 'Valuable deposit. Mark for controlled extraction.';
    if (tile.resourceType === 'RELIC_FRAGMENT') return 'Research value detected. Preserve until Relic Lab exists.';
    if (tile.resourceType === 'MINERALS') return 'Standard extraction candidate.';
    return 'No immediate action required.';
}

function renderInspector(state: any): void {
    const inspector = getInspector();
    if (!inspector) return;

    if (state.activeView !== 'DUNGEON') {
        inspector.style.display = 'none';
        return;
    }

    const tiles = getInspectableTiles(state);

    if (tiles.length === 0) {
        selectedIndex = 0;
        inspector.style.display = 'block';
        inspector.innerHTML = `
            <div style="background: rgba(2, 6, 23, 0.94); border: 1px solid rgba(71, 85, 105, 0.85); border-radius: 10px; padding: 14px 16px; color: #cbd5e1; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; box-shadow: 0 20px 40px rgba(0,0,0,0.45);">
                <div style="color: #94a3b8; font-size: 11px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 8px;">Tile Inspector</div>
                <div style="font-size: 12px; color: #64748b; line-height: 1.45;">No surveyed tiles yet. Place a Survey Drill or complete a mining access point to scan Sector B1.</div>
            </div>
        `;
        return;
    }

    const selectedId = getSelectedDeepLedgerTileId();
    if (selectedId) {
        const selectedPosition = tiles.findIndex(tile => tile.id === selectedId);
        if (selectedPosition >= 0) selectedIndex = selectedPosition;
    }

    if (selectedIndex >= tiles.length) selectedIndex = tiles.length - 1;
    if (selectedIndex < 0) selectedIndex = 0;

    const tile = tiles[selectedIndex];
    const isMarkerSelected = getSelectedDeepLedgerTileId() === tile.id;
    const resourceColor = tile.resourceType === 'AUREUS_VEIN'
        ? '#f59e0b'
        : tile.resourceType === 'GEMS'
            ? '#c084fc'
            : tile.resourceType === 'RELIC_FRAGMENT'
                ? '#22d3ee'
                : tile.resourceType === 'MINERALS'
                    ? '#94a3b8'
                    : '#64748b';

    const hazardColor = tile.hazard === 'NONE' ? '#64748b' : '#fb7185';
    const stabilityColor = tile.stability < 35 ? '#fb7185' : tile.stability < 60 ? '#f59e0b' : '#34d399';

    inspector.style.display = 'block';
    inspector.innerHTML = `
        <div style="background: rgba(2, 6, 23, 0.94); border: 1px solid ${isMarkerSelected ? 'rgba(255,255,255,.78)' : 'rgba(245, 158, 11, 0.36)'}; border-radius: 10px; color: #e2e8f0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; box-shadow: 0 20px 40px rgba(0,0,0,0.45); overflow: hidden; backdrop-filter: blur(10px);">
            <div style="padding: 12px 14px; background: rgba(15, 23, 42, 0.92); border-bottom: 1px solid rgba(51, 65, 85, 0.8);">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                    <div>
                        <div style="color: #f59e0b; font-size: 11px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase;">Tile Inspector${isMarkerSelected ? ' // Selected' : ''}</div>
                        <div style="color: #94a3b8; font-size: 10px; margin-top: 2px;">B${tile.depth} // ${tile.x}, ${tile.z}</div>
                    </div>
                    <div style="font-size: 10px; color: #64748b;">${selectedIndex + 1}/${tiles.length}</div>
                </div>
            </div>

            <div style="padding: 14px; display: grid; gap: 8px; font-size: 12px;">
                <div style="display: flex; justify-content: space-between; gap: 24px;"><span style="color:#64748b; text-transform: uppercase;">Status</span><span>${tile.status}</span></div>
                <div style="display: flex; justify-content: space-between; gap: 24px;"><span style="color:#64748b; text-transform: uppercase;">Resource</span><span style="color:${resourceColor};">${tile.resourceType}</span></div>
                <div style="display: flex; justify-content: space-between; gap: 24px;"><span style="color:#64748b; text-transform: uppercase;">Ore Richness</span><span>${tile.oreRichness}%</span></div>
                <div style="display: flex; justify-content: space-between; gap: 24px;"><span style="color:#64748b; text-transform: uppercase;">Stability</span><span style="color:${stabilityColor};">${tile.stability}%</span></div>
                <div style="display: flex; justify-content: space-between; gap: 24px;"><span style="color:#64748b; text-transform: uppercase;">Hazard</span><span style="color:${hazardColor};">${tile.hazard}</span></div>
                <div style="height: 1px; background: rgba(51, 65, 85, 0.8); margin: 2px 0;"></div>
                <div style="color: #94a3b8; font-size: 11px; line-height: 1.4;">${recommendation(tile)}</div>
            </div>

            <div style="display: flex; border-top: 1px solid rgba(51, 65, 85, 0.8);">
                <button id="deep-ledger-prev-tile" style="flex:1; padding: 10px; background: rgba(15, 23, 42, 0.95); color: #cbd5e1; border: 0; border-right: 1px solid rgba(51, 65, 85, 0.8); cursor: pointer; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.08em;">Prev</button>
                <button id="deep-ledger-next-tile" style="flex:1; padding: 10px; background: rgba(15, 23, 42, 0.95); color: #f59e0b; border: 0; cursor: pointer; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.08em;">Next</button>
            </div>
        </div>
    `;

    inspector.querySelector('#deep-ledger-prev-tile')?.addEventListener('click', () => {
        selectedIndex = (selectedIndex - 1 + tiles.length) % tiles.length;
        setSelectedDeepLedgerTileId(tiles[selectedIndex].id);
        renderInspector(state);
    });

    inspector.querySelector('#deep-ledger-next-tile')?.addEventListener('click', () => {
        selectedIndex = (selectedIndex + 1) % tiles.length;
        setSelectedDeepLedgerTileId(tiles[selectedIndex].id);
        renderInspector(state);
    });
}

if (!proto.__deepLedgerTileInspectorPatched) {
    const originalDraw = proto.draw;
    const originalTeardown = proto.onTeardown;

    proto.draw = function patchedDeepLedgerTileInspectorDraw(this: any, ctx: any): void {
        const result = originalDraw.call(this, ctx);
        const state = this.stateManager?.getState?.();
        if (state) renderInspector(state);
        return result;
    };

    proto.onTeardown = async function patchedDeepLedgerTileInspectorTeardown(this: any): Promise<void> {
        const inspector = typeof document !== 'undefined' ? document.getElementById(INSPECTOR_ID) : null;
        inspector?.remove();
        return originalTeardown.call(this);
    };

    proto.__deepLedgerTileInspectorPatched = true;
}
