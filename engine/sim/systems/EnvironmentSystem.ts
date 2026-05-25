/**
 * Environment System
 * Handles day/night cycle, weather, and light synchronization.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState } from '../../../types';
import { buildDayNightCycle, DAY_NIGHT, getDaylightFactor } from '../dayNightCycle';
import {
    getWeatherHeadline,
    getWeatherOverride,
    isSevereWeather,
    normalizeWeatherState,
    pickNextWeather,
    withWeatherCurrent,
} from '../../weather/weatherModel';

export class EnvironmentSystem extends BaseSimSystem {
    readonly id = 'environment';
    readonly priority = 50;

    // Cycle duration: 180 seconds for a full day (slower pace)
    private readonly DAY_DURATION = DAY_NIGHT.REAL_SECONDS_PER_DAY;
    tick(ctx: FixedContext, state: GameState): void {
        const totalTime = ctx.time;

        state.dayNightCycle = buildDayNightCycle(totalTime);

        const previousWeather = normalizeWeatherState(state.weather);
        let climateWeather = normalizeWeatherState(state.weather);
        climateWeather.timeLeft = Math.max(0, climateWeather.timeLeft - ctx.fixedDt);

        if (climateWeather.timeLeft <= 0) {
            climateWeather = pickNextWeather(
                climateWeather.base,
                state.resources.eco,
                getDaylightFactor(state.dayNightCycle.timeOfDay),
                ctx.random ? ctx.random.next() : Math.random(),
                ctx.random ? ctx.random.next() : Math.random(),
                ctx.random ? ctx.random.next() : Math.random(),
            );
        }

        const weatherOverride = getWeatherOverride(state.activeEvents);
        const nextWeather = weatherOverride
            ? withWeatherCurrent(
                climateWeather,
                weatherOverride,
                'EVENT',
                Math.max(climateWeather.intensity, isSevereWeather(weatherOverride) ? 0.8 : 0.6),
            )
            : withWeatherCurrent(climateWeather, climateWeather.base, 'CLIMATE', climateWeather.intensity);

        state.weather = nextWeather;

        if (
            nextWeather.source === 'CLIMATE'
            && nextWeather.current !== previousWeather.current
        ) {
            state.newsFeed.push({
                id: ctx.getNextId?.('weather') || `weather_${Date.now()}`,
                headline: getWeatherHeadline(nextWeather.current),
                type: isSevereWeather(nextWeather.current) ? 'NEGATIVE' : 'NEUTRAL',
                timestamp: state.tickCount,
            });
        }
    }
}
