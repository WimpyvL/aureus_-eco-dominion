export const DAY_NIGHT = {
    TICKS_PER_DAY: 24000,
    REAL_SECONDS_PER_DAY: 180,
    SUNRISE_TICK: 5000,
    NOON_TICK: 12000,
    SUNSET_TICK: 21000,
    INITIAL_TIME_OF_DAY: 6000,
} as const;

export interface DayNightCycleState {
    timeOfDay: number;
    dayCount: number;
    isDaytime: boolean;
}

export interface CelestialPosition {
    x: number;
    y: number;
    z: number;
    isNight: boolean;
}

export function normalizeTimeOfDay(timeOfDay: number): number {
    const dayLength = DAY_NIGHT.TICKS_PER_DAY;
    return ((timeOfDay % dayLength) + dayLength) % dayLength;
}

export function isDaytime(timeOfDay: number): boolean {
    const normalized = normalizeTimeOfDay(timeOfDay);
    return normalized >= DAY_NIGHT.SUNRISE_TICK && normalized <= DAY_NIGHT.SUNSET_TICK;
}

export function getDaylightFactor(timeOfDay: number): number {
    const normalized = normalizeTimeOfDay(timeOfDay);

    if (!isDaytime(normalized)) {
        return 0;
    }

    const daylightSpan = DAY_NIGHT.SUNSET_TICK - DAY_NIGHT.SUNRISE_TICK;
    const daylightProgress = (normalized - DAY_NIGHT.SUNRISE_TICK) / daylightSpan;
    return Math.sin(daylightProgress * Math.PI);
}

export function getSolarEfficiency(timeOfDay: number): number {
    const daylightFactor = getDaylightFactor(timeOfDay);
    if (daylightFactor <= 0) {
        return 0;
    }

    // Keep sunrise and sunset slightly productive so solar doesn't feel binary.
    return Math.max(0.3, 0.3 + daylightFactor * 0.7);
}

export function buildDayNightCycle(totalTimeSeconds: number): DayNightCycleState {
    const dayProgress = (totalTimeSeconds % DAY_NIGHT.REAL_SECONDS_PER_DAY) / DAY_NIGHT.REAL_SECONDS_PER_DAY;
    const timeOfDay = dayProgress * DAY_NIGHT.TICKS_PER_DAY;

    return {
        timeOfDay,
        dayCount: Math.floor(totalTimeSeconds / DAY_NIGHT.REAL_SECONDS_PER_DAY) + 1,
        isDaytime: isDaytime(timeOfDay),
    };
}

export function getCelestialPosition(timeOfDay: number, distance: number): CelestialPosition {
    const normalized = normalizeTimeOfDay(timeOfDay) / DAY_NIGHT.TICKS_PER_DAY;
    const orbitAngle = (normalized - 0.25) * Math.PI * 2;
    const daylightFactor = getDaylightFactor(timeOfDay);
    const night = daylightFactor <= 0;

    if (night) {
        const moonAngle = orbitAngle + Math.PI;
        return {
            x: Math.cos(moonAngle) * distance * 0.8,
            y: 40 + Math.abs(Math.sin(moonAngle)) * 60,
            z: Math.sin(moonAngle) * distance * 0.5,
            isNight: true,
        };
    }

    return {
        x: Math.cos(orbitAngle) * distance,
        y: 30 + daylightFactor * 100,
        z: Math.sin(orbitAngle) * distance * 0.5,
        isNight: false,
    };
}
