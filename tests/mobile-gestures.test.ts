import test from 'node:test';
import assert from 'node:assert/strict';

import { computeTwoFingerGesture } from '../game/render/mobileGestureMath.ts';

test('computeTwoFingerGesture normalizes rotation across the -pi/pi boundary', () => {
    const result = computeTwoFingerGesture(
        {
            distance: 100,
            angle: Math.PI - 0.05,
            midpoint: { x: 0, y: 0 },
        },
        {
            distance: 100,
            angle: -Math.PI + 0.05,
            midpoint: { x: 0, y: 0 },
        },
        {
            zoomFactor: 0.02,
            rotationFactor: 1,
            midpointPanThreshold: 3,
        }
    );

    assert.ok(Math.abs(result.rotationDelta - 0.1) < 0.0001);
});

test('computeTwoFingerGesture scales zoom from pinch distance delta', () => {
    const result = computeTwoFingerGesture(
        {
            distance: 120,
            angle: 0,
            midpoint: { x: 0, y: 0 },
        },
        {
            distance: 150,
            angle: 0,
            midpoint: { x: 0, y: 0 },
        },
        {
            zoomFactor: 0.02,
            rotationFactor: 1,
            midpointPanThreshold: 3,
        }
    );

    assert.equal(result.zoomDelta, -0.6);
});

test('computeTwoFingerGesture ignores midpoint pan below the configured threshold', () => {
    const result = computeTwoFingerGesture(
        {
            distance: 100,
            angle: 0,
            midpoint: { x: 10, y: 10 },
        },
        {
            distance: 100,
            angle: 0,
            midpoint: { x: 12, y: 11 },
        },
        {
            zoomFactor: 0.02,
            rotationFactor: 1,
            midpointPanThreshold: 3,
        }
    );

    assert.deepEqual(result.midpointPan, { x: 0, y: 0 });
});
