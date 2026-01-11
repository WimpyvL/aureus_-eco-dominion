/**
 * Environment System
 * Handles day/night cycle, weather, and light synchronization.
 */

import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState } from '../../../types';

export class EnvironmentSystem extends BaseSimSystem {
    readonly id = 'environment';
    readonly priority = 50;

    // Cycle duration: 180 seconds for a full day (slower pace)
    private readonly DAY_DURATION = 180;
    private readonly WEATHER_CHECK_INTERVAL = 60; // Check weather every 60 seconds
    private lastWeatherCheck = 0;

    tick(ctx: FixedContext, state: GameState): void {
        const totalTime = ctx.time;
        state.tickCount++;

        // Match dayNightCycle from state (0 - 24000)
        // normalized 0-1 mapped to 0-24000
        const normalizedTime = (totalTime % this.DAY_DURATION) / this.DAY_DURATION;
        const timeOfDayValue = normalizedTime * 24000;

        state.dayNightCycle = {
            ...state.dayNightCycle,
            timeOfDay: timeOfDayValue,
            dayCount: Math.floor(totalTime / this.DAY_DURATION) + 1,
            isDaytime: normalizedTime > 0.21 && normalizedTime < 0.88 // 5 AM to ~9 PM (longer day)
        };

        // Weather Logic (Random shifts every 60 seconds)
        if (totalTime - this.lastWeatherCheck >= this.WEATHER_CHECK_INTERVAL) {
            this.lastWeatherCheck = totalTime;

            // 5% chance of weather change
            if (Math.random() < 0.05) {
                const weathers: ('CLEAR' | 'CLOUDY' | 'RAINY' | 'STORM')[] = ['CLEAR', 'CLOUDY', 'RAINY', 'STORM'];
                const nextWeather = weathers[Math.floor(Math.random() * weathers.length)];

                if (state.weather.current !== nextWeather) {
                    state.weather.current = nextWeather;
                    state.newsFeed.push({
                        id: `weather_${Date.now()}`,
                        headline: `Weather update: Skies are now ${nextWeather.toLowerCase()}.`,
                        type: 'NEUTRAL',
                        timestamp: Date.now()
                    });
                }
            }
        }
    }
}
