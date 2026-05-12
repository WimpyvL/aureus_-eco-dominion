import { UndergroundState, UndergroundTile } from '../../types';

function key(x: number, z: number, depth: number): string {
    return `${x},${z},${depth}`;
}

function isPassableTunnel(tile: UndergroundTile | undefined): tile is UndergroundTile {
    if (!tile) return false;
    if (tile.status === 'COLLAPSED' || tile.status === 'HIDDEN') return false;
    return tile.hasTunnel || tile.status === 'DUG' || tile.status === 'REINFORCED';
}

function getNeighborIds(tile: UndergroundTile): string[] {
    return [
        key(tile.x + 1, tile.z, tile.depth),
        key(tile.x - 1, tile.z, tile.depth),
        key(tile.x, tile.z + 1, tile.depth),
        key(tile.x, tile.z - 1, tile.depth)
    ];
}

function findAccessRoots(tiles: UndergroundTile[]): UndergroundTile[] {
    const passable = tiles.filter(isPassableTunnel);

    // Prefer explicit surface access markers when existing data already has them.
    const explicitRoots = passable.filter(tile => tile.connectedToSurface);
    if (explicitRoots.length > 0) return explicitRoots;

    // MVP fallback: the first tunnel becomes the current access root until mine shafts
    // and dedicated access buildings are promoted into the underground model.
    return passable.length > 0 ? [passable[0]] : [];
}

export function recalculateUndergroundConnectivity(underground: UndergroundState): boolean {
    const tiles = Object.values(underground.tiles);
    const passableIds = new Set(
        tiles
            .filter(isPassableTunnel)
            .map(tile => tile.id)
    );

    const roots = findAccessRoots(tiles);
    const connectedIds = new Set<string>();
    const queue = [...roots];

    while (queue.length > 0) {
        const tile = queue.shift();
        if (!tile || connectedIds.has(tile.id) || !passableIds.has(tile.id)) continue;

        connectedIds.add(tile.id);

        for (const neighborId of getNeighborIds(tile)) {
            if (connectedIds.has(neighborId) || !passableIds.has(neighborId)) continue;
            const neighbor = underground.tiles[neighborId];
            if (isPassableTunnel(neighbor)) queue.push(neighbor);
        }
    }

    let changed = false;

    for (const tile of tiles) {
        const shouldBeConnected = connectedIds.has(tile.id);
        if (tile.connectedToSurface !== shouldBeConnected) {
            tile.connectedToSurface = shouldBeConnected;
            changed = true;
        }
    }

    return changed;
}

export function isUndergroundTileConnected(tile: UndergroundTile | undefined): boolean {
    if (!tile) return false;
    if (!isPassableTunnel(tile)) return false;
    return tile.connectedToSurface === true;
}
