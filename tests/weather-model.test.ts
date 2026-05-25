import test from 'node:test';
import assert from 'node:assert/strict';

import {
    coerceWeatherType,
    getEventEnvironmentModifiers,
    getWeatherGameplayEffects,
    normalizeWeatherState,
    pickNextWeather,
} from '../engine/weather/weatherModel.ts';

test('normalizeWeatherState migrates legacy weather names into the shared model', () => {
    const weather = normalizeWeatherState({
        current: 'RAINY' as any,
        base: 'CLOUDY' as any,
        intensity: 0.5,
        timeLeft: 30,
    });

    assert.equal(weather.current, 'RAIN');
    assert.equal(weather.base, 'OVERCAST');
    assert.equal(weather.precipitation > 0.3, true);
});

test('storm gameplay effects boost wind output while crushing solar yield', () => {
    const effects = getWeatherGameplayEffects({
        current: 'STORM',
        intensity: 0.9,
    });

    assert.equal(effects.windMult > 1.2, true);
    assert.equal(effects.solarMult < 0.5, true);
    assert.equal(effects.productionMult < 0.8, true);
});

test('event modifiers aggregate multiplicatively for severe weather pressure', () => {
    const modifiers = getEventEnvironmentModifiers([
        { weatherOverride: 'HEATWAVE', modifiers: { energyDecayMult: 1.6, productionMult: 0.92 } },
        { modifiers: { sellPriceMult: 1.5, trustGainMult: 0.8 } },
    ]);

    assert.equal(modifiers.energyDecayMult, 1.6);
    assert.equal(modifiers.sellPriceMult, 1.5);
    assert.equal(modifiers.productionMult, 0.92);
    assert.equal(modifiers.trustGainMult, 0.8);
});

test('pickNextWeather can transition degraded dry conditions into dust storms', () => {
    const next = pickNextWeather('CLEAR', 15, 0.95, 0.99, 0.8, 0.6);

    assert.equal(coerceWeatherType(next.current), 'DUST_STORM');
    assert.equal(next.base, 'DUST_STORM');
    assert.equal(next.windStrength > 0.5, true);
});
