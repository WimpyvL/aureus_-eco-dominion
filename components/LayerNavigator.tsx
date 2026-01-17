import React from 'react';
import { ChevronUp, ChevronDown, Layers, Diamond } from 'lucide-react';
import { Action } from '../types';

interface LayerNavigatorProps {
    currentLayer: number;
    dispatch: React.Dispatch<Action>;
    playSfx: (type: any) => void;
}

export const LayerNavigator: React.FC<LayerNavigatorProps> = ({ currentLayer, dispatch, playSfx }) => {
    const layers = Array.from({ length: 10 }, (_, i) => -(i + 1));

    const handleLayerChange = (delta: number) => {
        const nextLayer = currentLayer + delta;
        if (nextLayer >= -10 && nextLayer <= -1) {
            dispatch({ type: 'CHANGE_LAYER', payload: { delta } });
            playSfx('UI_CLICK');
        }
    };

    const handleJumpToLayer = (layer: number) => {
        const delta = layer - currentLayer;
        if (delta !== 0) {
            dispatch({ type: 'CHANGE_LAYER', payload: { delta } });
            playSfx('UI_CLICK');
        }
    };

    return (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-right-8 duration-500">
            {/* Header */}
            <div className="flex flex-col items-center gap-1 mb-2">
                <div className="w-8 h-8 rounded bg-slate-900/80 border border-slate-700 flex items-center justify-center text-amber-500 shadow-lg">
                    <Layers size={18} />
                </div>
                <span className="text-[10px] font-black font-['Rajdhani'] uppercase tracking-tighter text-slate-400">Depth</span>
            </div>

            {/* Navigation Stack */}
            <div className="flex flex-col items-center bg-slate-950/40 backdrop-blur-md rounded-full border border-slate-800/50 p-1.5 shadow-2xl relative">
                {/* Scroll track glow */}
                <div className="absolute inset-y-4 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-amber-500/20 to-transparent" />

                <button
                    onClick={() => handleLayerChange(1)}
                    disabled={currentLayer >= -1}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-amber-400 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                >
                    <ChevronUp size={20} />
                </button>

                <div className="flex flex-col-reverse gap-2 my-2">
                    {layers.map((l) => {
                        const isActive = currentLayer === l;
                        return (
                            <button
                                key={l}
                                onClick={() => handleJumpToLayer(l)}
                                className={`
                                    relative w-6 h-6 flex items-center justify-center transition-all group
                                    ${isActive ? 'scale-125' : 'hover:scale-110'}
                                `}
                            >
                                {/* Connector line */}
                                {l < -1 && (
                                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-2 ${isActive ? 'bg-amber-500/50' : 'bg-slate-700/30'}`} />
                                )}

                                {/* Layer Dot */}
                                <div className={`
                                    w-2 h-2 rounded-sm rotate-45 transition-all
                                    ${isActive
                                        ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                                        : 'bg-slate-700 group-hover:bg-slate-500'}
                                `} />

                                {/* Label (Visible on hover or if active) */}
                                <div className={`
                                    absolute right-8 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono font-bold whitespace-nowrap tracking-tighter
                                    transition-all duration-200 pointer-events-none
                                    ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 text-slate-400'}
                                `}>
                                    LAYER {l}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => handleLayerChange(-1)}
                    disabled={currentLayer <= -10}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-amber-400 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                >
                    <ChevronDown size={20} />
                </button>
            </div>

            {/* Current Indicator */}
            <div className="flex flex-col items-center mt-2 group bg-slate-900/90 border border-amber-500/50 p-2 rounded transform rotate-3 shadow-amber-900/20 shadow-xl">
                <span className="text-[10px] font-bold text-amber-500 font-mono">-Level-</span>
                <span className="text-xl font-black text-white font-['Rajdhani'] leading-none">{Math.abs(currentLayer)}</span>
            </div>
        </div>
    );
};
