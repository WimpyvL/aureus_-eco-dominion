import test from 'node:test';
import assert from 'node:assert/strict';

import { getTerrainChunkLod, getTerrainMacroStep } from '../engine/render/utils/TerrainLod.ts';

test('terrain chunk lod stays high near camera and drops in distance bands', () => {
    assert.equal(getTerrainChunkLod(0, 6), 1);
    assert.equal(getTerrainChunkLod(2, 6), 1);
    assert.equal(getTerrainChunkLod(3, 6), 2);
    assert.equal(getTerrainChunkLod(5, 6), 4);
});

test('terrain macro step follows lod buckets', () => {
    assert.equal(getTerrainMacroStep(1), 1);
    assert.equal(getTerrainMacroStep(2), 2);
    assert.equal(getTerrainMacroStep(3), 2);
    assert.equal(getTerrainMacroStep(4), 4);
});
