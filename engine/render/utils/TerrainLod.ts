/**
 * Terrain LOD helpers shared by runtime chunk selection and worker meshing.
 * (|/) Klaasvaakie
 */

export function getTerrainChunkLod(distance: number, viewRadius: number): 1 | 2 | 4 {
    if (distance <= 2) {
        return 1;
    }

    if (distance >= Math.max(4, viewRadius - 1)) {
        return 4;
    }

    return 2;
}

export function getTerrainMacroStep(lod: number): number {
    if (lod >= 4) {
        return 4;
    }

    if (lod >= 2) {
        return 2;
    }

    return 1;
}
