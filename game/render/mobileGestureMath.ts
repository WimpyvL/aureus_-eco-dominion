export interface GestureSnapshot {
    distance: number;
    angle: number;
    midpoint: {
        x: number;
        y: number;
    };
}

export interface GestureConfig {
    zoomFactor: number;
    rotationFactor: number;
    midpointPanThreshold: number;
}

export interface GestureDelta {
    zoomDelta: number;
    rotationDelta: number;
    midpointPan: {
        x: number;
        y: number;
    };
}

export function normalizeAngleDelta(previousAngle: number, currentAngle: number): number {
    let delta = currentAngle - previousAngle;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    return delta;
}

export function computeTwoFingerGesture(
    previous: GestureSnapshot,
    current: GestureSnapshot,
    config: GestureConfig
): GestureDelta {
    const distanceDelta = current.distance - previous.distance;
    const midpointDx = current.midpoint.x - previous.midpoint.x;
    const midpointDy = current.midpoint.y - previous.midpoint.y;
    const midpointDistance = Math.hypot(midpointDx, midpointDy);

    return {
        zoomDelta: -distanceDelta * config.zoomFactor,
        rotationDelta: normalizeAngleDelta(previous.angle, current.angle) * config.rotationFactor,
        midpointPan: midpointDistance >= config.midpointPanThreshold
            ? { x: midpointDx, y: midpointDy }
            : { x: 0, y: 0 },
    };
}
