/**
 * Environment System
 * Handles day/night cycle, weather, and light synchronization.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState } from '../../../types';
import { buildDayNightCycle, DAY_NIGHT } from '../dayNightCycle';

export class EnvironmentSystem extends BaseSimSystem {
    readonly id = 'environment';
    readonly priority = 50;

    // Cycle duration: 180 seconds for a full day (slower pace)
    private readonly DAY_DURATION = DAY_NIGHT.REAL_SECONDS_PER_DAY;
    private readonly WEATHER_CHECK_INTERVAL = 60; // Check weather every 60 seconds
    private lastWeatherCheck = 0;

    tick(ctx: FixedContext, state: GameState): void {
        const totalTime = ctx.time;

        state.dayNightCycle = buildDayNightCycle(totalTime);

        // Weather Logic (Random shifts every 60 seconds)
        if (totalTime - this.lastWeatherCheck >= this.WEATHER_CHECK_INTERVAL) {
            this.lastWeatherCheck = totalTime;

            // 5% chance of weather change
            const random = ctx.random ? ctx.random.next() : Math.random();
            if (random < 0.05) {
                const weathers: ('CLEAR' | 'CLOUDY' | 'RAINY' | 'STORM')[] = ['CLEAR', 'CLOUDY', 'RAINY', 'STORM'];
                const nextWeather = weathers[Math.floor((ctx.random ? ctx.random.next() : Math.random()) * weathers.length)];

                if (state.weather.current !== nextWeather) {
                    state.weather.current = nextWeather;
                    state.newsFeed.push({
                        id: ctx.getNextId?.('weather') || `weather_${Date.now()}`,
                        headline: `Weather update: Skies are now ${nextWeather.toLowerCase()}.`,
                        type: 'NEUTRAL',
                        timestamp: state.tickCount
                    });
                }
            }
        }
    }
}
