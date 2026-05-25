import React, { useEffect, useState } from 'react';
import { WeatherState } from '../types';
import { getWeatherDisplayName, normalizeWeatherState } from '../engine/weather/weatherModel';

type OverlayParticle = {
    id: number;
    left: number;
    top: number;
    delay: number;
    duration: number;
    scale: number;
};

export const WeatherOverlay: React.FC<{ weather: WeatherState }> = ({ weather }) => {
    const currentWeather = normalizeWeatherState(weather);
    const [particles, setParticles] = useState<OverlayParticle[]>([]);

    useEffect(() => {
        if (currentWeather.current === 'CLEAR' || currentWeather.current === 'OVERCAST') {
            setParticles([]);
            return;
        }

        const particleCount = currentWeather.current === 'STORM'
            ? 90
            : currentWeather.current === 'RAIN'
                ? 60
                : currentWeather.current === 'DUST_STORM'
                    ? 42
                    : 18;

        const nextParticles = Array.from({ length: particleCount }).map((_, index) => ({
            id: index,
            left: Math.random() * 100,
            top: Math.random() * 100,
            delay: Math.random() * 3,
            duration: 0.6 + Math.random() * 1.6,
            scale: 0.4 + Math.random() * 1.2,
        }));

        setParticles(nextParticles);
    }, [currentWeather.current]);

    if (currentWeather.current === 'CLEAR') return null;

    const showWarning = currentWeather.current === 'STORM'
        || currentWeather.current === 'DUST_STORM'
        || currentWeather.current === 'HEATWAVE';

    return (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            <div
                className={`absolute inset-0 transition-all duration-1000 ${currentWeather.current === 'OVERCAST' ? 'bg-slate-500/8' :
                    currentWeather.current === 'RAIN' ? 'bg-slate-700/10 backdrop-saturate-75' :
                        currentWeather.current === 'STORM' ? 'bg-slate-950/25 backdrop-saturate-50' :
                            currentWeather.current === 'HEATWAVE' ? 'bg-orange-500/10 mix-blend-screen' :
                                'bg-amber-700/18 mix-blend-multiply'
                    }`}
            />

            {currentWeather.current === 'HEATWAVE' && (
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        background: 'linear-gradient(180deg, rgba(255,193,120,0.12), rgba(255,129,58,0.06))',
                        filter: 'blur(8px)',
                    }}
                />
            )}

            {currentWeather.current === 'DUST_STORM' && (
                <div
                    className="absolute inset-0 opacity-50"
                    style={{
                        background: 'radial-gradient(circle at 20% 40%, rgba(255,208,140,0.28), transparent 30%), radial-gradient(circle at 80% 30%, rgba(160,96,38,0.25), transparent 32%)',
                    }}
                />
            )}

            {(currentWeather.current === 'RAIN' || currentWeather.current === 'STORM') && particles.map((particle) => (
                <div
                    key={particle.id}
                    className={`absolute top-0 rounded-full ${currentWeather.current === 'STORM' ? 'bg-cyan-100/70' : 'bg-sky-200/60'}`}
                    style={{
                        left: `${particle.left}%`,
                        width: '2px',
                        height: `${90 + currentWeather.intensity * 60}px`,
                        transform: `translateX(${(currentWeather.windStrength - 0.2) * -26}px) scaleY(${particle.scale})`,
                        animation: `weather-fall ${particle.duration}s linear infinite`,
                        animationDelay: `-${particle.delay}s`,
                        opacity: 0.35 + currentWeather.precipitation * 0.45,
                    }}
                />
            ))}

            {currentWeather.current === 'DUST_STORM' && particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute rounded-full bg-orange-200/35 blur-md"
                    style={{
                        left: `${particle.left}%`,
                        top: `${particle.top}%`,
                        width: `${60 + particle.scale * 60}px`,
                        height: `${30 + particle.scale * 40}px`,
                        animation: `weather-drift ${2.4 + particle.duration}s linear infinite`,
                        animationDelay: `-${particle.delay}s`,
                    }}
                />
            ))}

            {showWarning && (
                <div className="absolute top-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                    <div className={`px-4 py-1 rounded border text-xs font-bold uppercase tracking-[0.2em] shadow-lg ${currentWeather.current === 'STORM' ? 'bg-slate-950/80 border-cyan-300/70 text-cyan-100' :
                        currentWeather.current === 'HEATWAVE' ? 'bg-orange-950/80 border-orange-400 text-orange-200' :
                            'bg-amber-950/80 border-amber-300 text-amber-100'
                        }`}>
                        {getWeatherDisplayName(currentWeather.current)}
                    </div>
                    <div className="text-[10px] text-white/75 font-mono bg-black/45 px-2 py-1 rounded">
                        {currentWeather.current === 'STORM' ? 'Wind turbines surge, crews slow, maintenance climbs.' :
                            currentWeather.current === 'HEATWAVE' ? 'Solar output rises, water capture drops, crews fatigue faster.' :
                                'Visibility drops, dust abrasion rises, field output falls.'}
                    </div>
                </div>
            )}

            {currentWeather.current === 'STORM' && (
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(180deg, rgba(240,247,255,0.08), transparent 35%)',
                        opacity: currentWeather.lightning * 0.25,
                    }}
                />
            )}

            <style>{`
                @keyframes weather-fall {
                    0% { transform: translateY(-120px) translateX(0); opacity: 0; }
                    18% { opacity: 1; }
                    100% { transform: translateY(115vh) translateX(-18px); opacity: 0; }
                }

                @keyframes weather-drift {
                    0% { transform: translateX(-10vw) translateY(-2vh) scale(0.85); opacity: 0; }
                    18% { opacity: 0.45; }
                    100% { transform: translateX(115vw) translateY(3vh) scale(1.15); opacity: 0; }
                }
            `}</style>
        </div>
    );
};
