import test from 'node:test';
import assert from 'node:assert/strict';

import { confirmMobilePlacement } from '../game/mobilePlacement.ts';

test('confirmMobileBuildingPlacement clears the pinned ghost after a successful placement', () => {
    const calls: string[] = [];
    const fakeWorld = {
        placeBuilding: (index: number) => {
            calls.push(`place:${index}`);
            return true;
        },
        clearPinnedBuilding: () => {
            calls.push('clear');
        },
    };

    const result = confirmMobilePlacement(fakeWorld.placeBuilding, fakeWorld.clearPinnedBuilding, 42);

    assert.equal(result, true);
    assert.deepEqual(calls, ['place:42', 'clear']);
});

test('confirmMobileBuildingPlacement preserves the pinned ghost when placement fails', () => {
    const calls: string[] = [];
    const fakeWorld = {
        placeBuilding: (index: number) => {
            calls.push(`place:${index}`);
            return false;
        },
        clearPinnedBuilding: () => {
            calls.push('clear');
        },
    };

    const result = confirmMobilePlacement(fakeWorld.placeBuilding, fakeWorld.clearPinnedBuilding, 7);

    assert.equal(result, false);
    assert.deepEqual(calls, ['place:7']);
});
