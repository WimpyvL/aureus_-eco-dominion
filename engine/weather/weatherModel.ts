/**
 * Shared weather model for the Zimbabwe mining sim.
 * Author: Klaasvaakie (|/)
 */

export type WeatherType =
    | 'CLEAR'
    | 'OVERCAST'
    | 'RAIN'
    | 'STORM'
    | 'HEATWAVE'
    | 'DUST_STORM';

export type WeatherSource = 'CLIMATE' | 'EVENT';

export interface WeatherState {
    current: WeatherType;
    base: WeatherType;
    source: WeatherSource;
    timeLeft: number; // Seconds remaining in the underlying climate pattern
    intensity: number; // 0-1
    cloudCover: number; // 0-1
    precipitation: number; // 0-1
    windStrength: number; // 0-1
    lightning: number; // 0-1
}

export interface GlobalEnvironmentModifiers {
    productionMult: number;
    sellPriceMult: number;
    upkeepMult: number;
    ecoRegenMult: number;
    trustGainMult: number;
    energyDecayMult: number;
}

export interface WeatherEventLike {
    weatherOverride?: WeatherType;
    visualTheme?: string;
    modifiers?: Partial<GlobalEnvironmentModifiers>;
}

interface WeatherProfile {
    label: string;
    headline: string;
    defaultIntensity: number;
    duration: readonly [number, number];
    cloudCover: number;
    precipitation: number;
    windStrength: number;
    lightning: number;
    gameplay: Omit<GlobalEnvironmentModifiers, 'sellPriceMult'> & {
        solarMult: number;
        windMult: number;
        waterCollectionMult: number;
    };
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const blendFromNeutral = (target: number, intensity: number) => 1 + (target - 1) * clamp01(intensity);

export const WEATHER_PROFILES: Record<WeatherType, WeatherProfile> = {
    CLEAR: {
        label: 'Clear Skies',
        headline: 'Clear skies over the concession.',
        defaultIntensity: 0.2,
        duration: [90, 220],
        cloudCover: 0.12,
        precipitation: 0,
        windStrength: 0.2,
        lightning: 0,
        gameplay: {
            productionMult: 1,
            upkeepMult: 1,
            ecoRegenMult: 1,
            trustGainMult: 1,
            energyDecayMult: 1,
            solarMult: 1.15,
            windMult: 0.7,
            waterCollectionMult: 0.9,
        },
    },
    OVERCAST: {
        label: 'Overcast',
        headline: 'Cloud cover is building over the mine.',
        defaultIntensity: 0.45,
        duration: [70, 160],
        cloudCover: 0.68,
        precipitation: 0.08,
        windStrength: 0.35,
        lightning: 0,
        gameplay: {
            productionMult: 0.97,
            upkeepMult: 1.02,
            ecoRegenMult: 1,
            trustGainMult: 0.98,
            energyDecayMult: 1.02,
            solarMult: 0.82,
            windMult: 0.95,
            waterCollectionMult: 1,
        },
    },
    RAIN: {
        label: 'Rain',
        headline: 'Rain is moving across the site.',
        defaultIntensity: 0.62,
        duration: [60, 130],
        cloudCover: 0.82,
        precipitation: 0.72,
        windStrength: 0.55,
        lightning: 0.08,
        gameplay: {
            productionMult: 0.88,
            upkeepMult: 1.1,
            ecoRegenMult: 1.08,
            trustGainMult: 0.96,
            energyDecayMult: 1.05,
            solarMult: 0.6,
            windMult: 1.15,
            waterCollectionMult: 1.35,
        },
    },
    STORM: {
        label: 'Thunderstorm',
        headline: 'Thunderstorm warning: high winds and lightning over the pit.',
        defaultIntensity: 0.88,
        duration: [35, 80],
        cloudCover: 0.96,
        precipitation: 0.95,
        windStrength: 0.95,
        lightning: 0.9,
        gameplay: {
            productionMult: 0.72,
            upkeepMult: 1.35,
            ecoRegenMult: 0.92,
            trustGainMult: 0.85,
            energyDecayMult: 1.18,
            solarMult: 0.35,
            windMult: 1.45,
            waterCollectionMult: 1.55,
        },
    },
    HEATWAVE: {
        label: 'Heatwave',
        headline: 'Heatwave conditions are stressing crews and equipment.',
        defaultIntensity: 0.78,
        duration: [70, 150],
        cloudCover: 0.14,
        precipitation: 0,
        windStrength: 0.24,
        lightning: 0,
        gameplay: {
            productionMult: 0.9,
            upkeepMult: 1.12,
            ecoRegenMult: 0.86,
            trustGainMult: 0.92,
            energyDecayMult: 1.4,
            solarMult: 1.25,
            windMult: 0.75,
            waterCollectionMult: 0.75,
        },
    },
    DUST_STORM: {
        label: 'Dust Storm',
        headline: 'Dust storm conditions are cutting visibility across the lease.',
        defaultIntensity: 0.82,
        duration: [45, 100],
        cloudCover: 0.76,
        precipitation: 0,
        windStrength: 0.92,
        lightning: 0,
        gameplay: {
            productionMult: 0.7,
            upkeepMult: 1.28,
            ecoRegenMult: 0.82,
            trustGainMult: 0.84,
            energyDecayMult: 1.16,
            solarMult: 0.5,
            windMult: 1.3,
            waterCollectionMult: 0.65,
        },
    },
};

export function coerceWeatherType(value?: string | null): WeatherType {
    switch (value) {
        case 'CLEAR':
            return 'CLEAR';
        case 'CLOUDY':
        case 'OVERCAST':
            return 'OVERCAST';
        case 'RAINY':
        case 'RAIN':
            return 'RAIN';
        case 'STORM':
            return 'STORM';
        case 'HEAT':
        case 'HEATWAVE':
            return 'HEATWAVE';
        case 'ACID_RAIN':
        case 'TOXIC':
        case 'DUST_STORM':
            return 'DUST_STORM';
        default:
            return 'CLEAR';
    }
}

function rollBetween([min, max]: readonly [number, number], roll: number): number {
    return Math.round(min + (max - min) * clamp01(roll));
}

function buildWeatherState(
    current: WeatherType,
    base: WeatherType,
    source: WeatherSource,
    intensity: number,
    timeLeft: number,
): WeatherState {
    const profile = WEATHER_PROFILES[current];
    const scaledIntensity = clamp01(intensity);

    return {
        current,
        base,
        source,
        timeLeft: Math.max(0, timeLeft),
        intensity: scaledIntensity,
        cloudCover: clamp01(profile.cloudCover * (0.65 + scaledIntensity * 0.45)),
        precipitation: clamp01(profile.precipitation * (0.5 + scaledIntensity * 0.65)),
        windStrength: clamp01(profile.windStrength * (0.55 + scaledIntensity * 0.55)),
        lightning: clamp01(profile.lightning * (0.5 + scaledIntensity * 0.6)),
    };
}

export function normalizeWeatherState(weather?: Partial<WeatherState> | null): WeatherState {
    const current = coerceWeatherType(weather?.current);
    const base = coerceWeatherType(weather?.base ?? weather?.current);
    const source = weather?.source ?? 'CLIMATE';
    const profile = WEATHER_PROFILES[current];
    const intensity = weather?.intensity ?? profile.defaultIntensity;
    const timeLeft = weather?.timeLeft ?? 120;

    return buildWeatherState(current, base, source, intensity, timeLeft);
}

export function createWeatherState(
    current: WeatherType = 'CLEAR',
    intensity = WEATHER_PROFILES[current].defaultIntensity,
    timeLeft = 120,
): WeatherState {
    return buildWeatherState(current, current, 'CLIMATE', intensity, timeLeft);
}

export function withWeatherCurrent(
    weather: Partial<WeatherState> | null | undefined,
    current: WeatherType,
    source: WeatherSource,
    intensity = WEATHER_PROFILES[current].defaultIntensity,
): WeatherState {
    const normalized = normalizeWeatherState(weather);
    return buildWeatherState(
        current,
        normalized.base,
        source,
        intensity,
        normalized.timeLeft,
    );
}

export function getWeatherDisplayName(weatherType: WeatherType): string {
    return WEATHER_PROFILES[weatherType].label;
}

export function getWeatherHeadline(weatherType: WeatherType): string {
    return WEATHER_PROFILES[weatherType].headline;
}

export function isRainWeather(weatherType: WeatherType): boolean {
    return weatherType === 'RAIN' || weatherType === 'STORM';
}

export function isStormWeather(weatherType: WeatherType): boolean {
    return weatherType === 'STORM';
}

export function isSevereWeather(weatherType: WeatherType): boolean {
    return weatherType === 'STORM' || weatherType === 'DUST_STORM' || weatherType === 'HEATWAVE';
}

export function pickNextWeather(
    current: WeatherType,
    eco: number,
    daylightFactor: number,
    roll: number,
    intensityRoll: number,
    durationRoll: number,
): WeatherState {
    const weights: Record<WeatherType, number> = {
        CLEAR: 24,
        OVERCAST: 14,
        RAIN: 8,
        STORM: 3,
        HEATWAVE: 6,
        DUST_STORM: 4,
    };

    switch (current) {
        case 'CLEAR':
            weights.CLEAR += 10;
            weights.OVERCAST += 6;
            weights.HEATWAVE += 4;
            break;
        case 'OVERCAST':
            weights.OVERCAST += 10;
            weights.RAIN += 7;
            weights.STORM += 3;
            break;
        case 'RAIN':
            weights.RAIN += 10;
            weights.OVERCAST += 6;
            weights.STORM += 5;
            break;
        case 'STORM':
            weights.RAIN += 10;
            weights.OVERCAST += 8;
            weights.CLEAR += 2;
            break;
        case 'HEATWAVE':
            weights.HEATWAVE += 8;
            weights.CLEAR += 7;
            weights.DUST_STORM += 4;
            break;
        case 'DUST_STORM':
            weights.DUST_STORM += 8;
            weights.CLEAR += 7;
            weights.HEATWAVE += 4;
            break;
    }

    if (eco < 45) {
        weights.DUST_STORM += Math.round((45 - eco) / 6);
    }

    if (daylightFactor > 0.8) {
        weights.HEATWAVE += 5;
        weights.CLEAR += 2;
    }

    if (daylightFactor < 0.35) {
        weights.OVERCAST += 4;
        weights.RAIN += 2;
        weights.HEATWAVE = Math.max(1, weights.HEATWAVE - 4);
    }

    const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
    let cursor = clamp01(roll) * total;
    let next: WeatherType = current;

    for (const weatherType of Object.keys(weights) as WeatherType[]) {
        cursor -= weights[weatherType];
        if (cursor <= 0) {
            next = weatherType;
            break;
        }
    }

    const profile = WEATHER_PROFILES[next];
    const intensity = clamp01(profile.defaultIntensity * 0.65 + intensityRoll * 0.45);
    const timeLeft = rollBetween(profile.duration, durationRoll);

    return buildWeatherState(next, next, 'CLIMATE', intensity, timeLeft);
}

export function getWeatherGameplayEffects(weather?: Partial<WeatherState> | null) {
    const normalized = normalizeWeatherState(weather);
    const { current, intensity } = normalized;
    const gameplay = WEATHER_PROFILES[current].gameplay;

    return {
        productionMult: blendFromNeutral(gameplay.productionMult, intensity),
        upkeepMult: blendFromNeutral(gameplay.upkeepMult, intensity),
        ecoRegenMult: blendFromNeutral(gameplay.ecoRegenMult, intensity),
        trustGainMult: blendFromNeutral(gameplay.trustGainMult, intensity),
        energyDecayMult: blendFromNeutral(gameplay.energyDecayMult, intensity),
        solarMult: blendFromNeutral(gameplay.solarMult, intensity),
        windMult: blendFromNeutral(gameplay.windMult, intensity),
        waterCollectionMult: blendFromNeutral(gameplay.waterCollectionMult, intensity),
    };
}

export function getEventEnvironmentModifiers(events: WeatherEventLike[] = []): GlobalEnvironmentModifiers {
    const modifiers: GlobalEnvironmentModifiers = {
        productionMult: 1,
        sellPriceMult: 1,
        upkeepMult: 1,
        ecoRegenMult: 1,
        trustGainMult: 1,
        energyDecayMult: 1,
    };

    for (const event of events) {
        if (!event.modifiers) continue;
        if (event.modifiers.productionMult) modifiers.productionMult *= event.modifiers.productionMult;
        if (event.modifiers.sellPriceMult) modifiers.sellPriceMult *= event.modifiers.sellPriceMult;
        if (event.modifiers.upkeepMult) modifiers.upkeepMult *= event.modifiers.upkeepMult;
        if (event.modifiers.ecoRegenMult) modifiers.ecoRegenMult *= event.modifiers.ecoRegenMult;
        if (event.modifiers.trustGainMult) modifiers.trustGainMult *= event.modifiers.trustGainMult;
        if (event.modifiers.energyDecayMult) modifiers.energyDecayMult *= event.modifiers.energyDecayMult;
    }

    return modifiers;
}

export function getWeatherOverride(events: WeatherEventLike[] = []): WeatherType | null {
    for (const event of events) {
        if (event.weatherOverride) return coerceWeatherType(event.weatherOverride);
        if (event.visualTheme === 'HEAT' || event.visualTheme === 'TOXIC') {
            return coerceWeatherType(event.visualTheme);
        }
    }
    return null;
}
