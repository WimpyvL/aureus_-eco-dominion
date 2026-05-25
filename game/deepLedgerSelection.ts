const SELECTED_TILE_KEY = '__deepLedgerSelectedTileId';

export function getSelectedDeepLedgerTileId(): string | null {
    const root = globalThis as any;
    return typeof root[SELECTED_TILE_KEY] === 'string' ? root[SELECTED_TILE_KEY] : null;
}

export function setSelectedDeepLedgerTileId(tileId: string | null): void {
    const root = globalThis as any;

    if (tileId) {
        root[SELECTED_TILE_KEY] = tileId;
    } else {
        delete root[SELECTED_TILE_KEY];
    }
}

export function isSelectedDeepLedgerTile(tileId: string): boolean {
    return getSelectedDeepLedgerTileId() === tileId;
}
