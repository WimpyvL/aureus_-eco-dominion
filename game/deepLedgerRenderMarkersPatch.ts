import { AureusWorld } from './AureusWorld';
import { ensureUndergroundState } from '../engine/underground/UndergroundGenerator';
import { UndergroundTile } from '../types';

/**
 * Deep Ledger render markers v0.
 *
 * This adds a lightweight underground visual layer without touching the Three.js
 * render pipeline yet. It gives the player immediate state readability while the
 * proper UndergroundRenderSystem can be built later.
 */
const proto = AureusWorld.prototype as any;
const LAYER_ID = 'deep-ledger-render-markers';
const MAX_MARKERS = 90;
const GRID_SCALE = 18;

let collapsedLegend = true;

function getLayer(): HTMLDivElement | null {
    if (typeof document === 'undefined') return null;

    let layer = document.getElementById(LAYER_ID) as HTMLDivElement | null;

    if (!layer) {
        layer = document.createElement('div');
        layer.id = LAYER_ID;
        layer.style.position = 'fixed';
        layer.style.inset = '0';
        layer.style.zIndex = '42';
        layer.style.pointerEvents = 'none';
        layer.style.overflow = 'hidden';
        document.body.appendChild(layer);
    }

    return layer;
}

function markerColor(tile: UndergroundTile): string {
    if (tile.status === 'COLLAPSED') return '#ef4444';
    if (tile.status === 'REINFORCED' || tile.hasSupport) return '#34d399';
    if (tile.status === 'DUG' || tile.hasTunnel) return '#f59e0b';
    if (tile.hazard !== 'NONE') return '#fb7185';
    if (tile.resourceType === 'AUREUS_VEIN') return '#fbbf24';
    if (tile.resourceType === 'GEMS') return '#c084fc';
    if (tile.resourceType === 'RELIC_FRAGMENT') return '#22d3ee';
    if (tile.resourceType === 'MINERALS') return '#94a3b8';
    return '#475569';
}

function markerLabel(tile: UndergroundTile): string {
    if (tile.status === 'COLLAPSED') return 'X';
    if (tile.status === 'REINFORCED' || tile.hasSupport) return 'S';
    if (tile.status === 'DUG' || tile.hasTunnel) return 'T';
    if (tile.hazard !== 'NONE') return '!';
    if (tile.resourceType === 'AUREUS_VEIN') return 'A';
    if (tile.resourceType === 'GEMS') return 'G';
    if (tile.resourceType === 'RELIC_FRAGMENT') return 'R';
    if (tile.resourceType === 'MINERALS') return 'M';
    return '·';
}

function markerPriority(tile: UndergroundTile): number {
    let score = 0;
    if (tile.status === 'COLLAPSED') score += 5000;
    if (tile.status === 'REINFORCED' || tile.hasSupport) score += 4200;
    if (tile.status === 'DUG' || tile.hasTunnel) score += 4000;
    if (tile.hazard !== 'NONE') score += 3000;
    if (tile.resourceType !== 'NONE') score += 2000;
    score += tile.oreRichness;
    score += Math.max(0, 100 - tile.stability);
    return score;
}

function renderLegend(): string {
    return `
        <div style="position:fixed;left:16px;top:96px;pointer-events:auto;background:rgba(2,6,23,.88);border:1px solid rgba(148,163,184,.35);border-radius:10px;color:#cbd5e1;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;box-shadow:0 16px 32px rgba(0,0,0,.35);overflow:hidden;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 11px;background:rgba(15,23,42,.9);">
                <div style="font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#f59e0b;">Deep Map</div>
                <button id="deep-ledger-marker-legend-toggle" style="background:rgba(30,41,59,.9);color:#f59e0b;border:1px solid rgba(245,158,11,.35);border-radius:6px;cursor:pointer;font-size:10px;font-weight:900;padding:4px 8px;text-transform:uppercase;">${collapsedLegend ? 'Open' : 'Min'}</button>
            </div>
            ${collapsedLegend ? '' : `
                <div style="display:grid;gap:6px;padding:10px 12px;font-size:10px;line-height:1.2;">
                    <div><span style="color:#475569;">·</span> Surveyed</div>
                    <div><span style="color:#f59e0b;">T</span> Tunnel</div>
                    <div><span style="color:#34d399;">S</span> Supported</div>
                    <div><span style="color:#ef4444;">X</span> Collapsed</div>
                    <div><span style="color:#fb7185;">!</span> Hazard</div>
                    <div><span style="color:#fbbf24;">A</span> Aureus</div>
                    <div><span style="color:#c084fc;">G</span> Gems</div>
                    <div><span style="color:#94a3b8;">M</span> Minerals</div>
                    <div><span style="color:#22d3ee;">R</span> Relic</div>
                </div>
            `}
        </div>
    `;
}

function renderMarkers(state: any): void {
    const layer = getLayer();
    if (!layer) return;

    if (state.activeView !== 'DUNGEON') {
        layer.style.display = 'none';
        return;
    }

    const underground = ensureUndergroundState(state);
    const tiles = (Object.values(underground.tiles) as UndergroundTile[])
        .filter(tile => tile.status !== 'HIDDEN')
        .sort((a, b) => markerPriority(b) - markerPriority(a))
        .slice(0, MAX_MARKERS);

    layer.style.display = 'block';

    if (tiles.length === 0) {
        layer.innerHTML = renderLegend();
        layer.querySelector('#deep-ledger-marker-legend-toggle')?.addEventListener('click', () => {
            collapsedLegend = !collapsedLegend;
            renderMarkers(state);
        });
        return;
    }

    const avgX = tiles.reduce((sum, tile) => sum + tile.x, 0) / tiles.length;
    const avgZ = tiles.reduce((sum, tile) => sum + tile.z, 0) / tiles.length;
    const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 640;
    const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 360;

    const markerHtml = tiles.map(tile => {
        const color = markerColor(tile);
        const label = markerLabel(tile);
        const left = centerX + (tile.x - avgX) * GRID_SCALE;
        const top = centerY + (tile.z - avgZ) * GRID_SCALE;
        const opacity = tile.status === 'SURVEYED' && tile.resourceType === 'NONE' && tile.hazard === 'NONE' ? 0.42 : 0.9;
        const size = tile.status === 'COLLAPSED' || tile.status === 'REINFORCED' || tile.hasTunnel || tile.resourceType !== 'NONE' || tile.hazard !== 'NONE' ? 20 : 12;
        const border = tile.hazard !== 'NONE' ? '#fb7185' : color;

        return `
            <div title="B${tile.depth} // ${tile.x}, ${tile.z} | ${tile.status} | ${tile.resourceType} | ${tile.hazard} | ${tile.stability}% stability" style="position:absolute;left:${left}px;top:${top}px;width:${size}px;height:${size}px;transform:translate(-50%,-50%);border:1px solid ${border};border-radius:${tile.status === 'COLLAPSED' ? '2px' : '999px'};background:${color}22;color:${color};opacity:${opacity};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;text-shadow:0 1px 2px #000;box-shadow:0 0 12px ${color}66;">
                ${label}
            </div>
        `;
    }).join('');

    layer.innerHTML = `
        <div style="position:absolute;inset:0;background:radial-gradient(circle at center, rgba(245,158,11,.045), rgba(2,6,23,0) 45%);"></div>
        ${markerHtml}
        ${renderLegend()}
    `;

    layer.querySelector('#deep-ledger-marker-legend-toggle')?.addEventListener('click', () => {
        collapsedLegend = !collapsedLegend;
        renderMarkers(state);
    });
}

if (!proto.__deepLedgerRenderMarkersPatched) {
    const originalDraw = proto.draw;
    const originalTeardown = proto.onTeardown;

    proto.draw = function patchedDeepLedgerRenderMarkersDraw(this: any, ctx: any): void {
        const result = originalDraw.call(this, ctx);
        const state = this.stateManager?.getState?.();
        if (state) renderMarkers(state);
        return result;
    };

    proto.onTeardown = async function patchedDeepLedgerRenderMarkersTeardown(this: any): Promise<void> {
        const layer = typeof document !== 'undefined' ? document.getElementById(LAYER_ID) : null;
        layer?.remove();
        return originalTeardown.call(this);
    };

    proto.__deepLedgerRenderMarkersPatched = true;
}
