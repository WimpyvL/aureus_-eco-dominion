import React from 'react';
import { Pickaxe, ArrowDownCircle, X } from 'lucide-react';
import { Chunk } from '../types';
import { ChunkStore } from '../engine/space/ChunkStore';

interface DigConfirmPopupProps {
    tilePos: { x: number, z: number };
    chunks: Record<string, Chunk>;
    viewMode: 'SURFACE' | 'UNDERGROUND' | 'FIRST_PERSON';
    currentUndergroundLayer: number;
    onConfirm: (layer: number) => void;
    onCancel: () => void;
}

export const DigConfirmPopup: React.FC<DigConfirmPopupProps> = ({
    tilePos, chunks, viewMode, currentUndergroundLayer, onConfirm, onCancel
}) => {
    const tile = ChunkStore.getTile(chunks, tilePos.x, tilePos.z);
    if (!tile) return null;

    const layerToDig = viewMode === 'UNDERGROUND'
        ? currentUndergroundLayer
        : -1;

    const isCurrentLayerExcavated = tile.underground && tile.underground[layerToDig]?.excavated;

    // If current layer is excavated, offer to dig deeper (Shaft)
    const targetLayer = isCurrentLayerExcavated ? layerToDig - 1 : layerToDig;
    const isShaft = targetLayer < layerToDig;

    // Bedrock check
    if (targetLayer < -10) {
        return (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border-2 border-rose-900/50 p-6 rounded shadow-2xl z-50 min-w-[320px] text-center">
                <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
                    <X className="text-rose-500" size={24} />
                </div>
                <h3 className="text-xl font-black font-['Rajdhani'] uppercase tracking-tight text-rose-500 mb-1">Unbreakable Mantle</h3>
                <p className="text-slate-400 text-xs uppercase font-mono tracking-tighter mb-6">Bedrock threshold reached at -100m. Advanced thermal drills required.</p>
                <button
                    onClick={onCancel}
                    className="w-full py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 font-bold uppercase text-xs tracking-widest transition-all"
                >
                    Acknowledge
                </button>
            </div>
        );
    }

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 min-w-[340px]">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-amber-500/5 blur-2xl rounded-full" />

            <div className="relative bg-slate-950 border-2 border-amber-900/60 p-6 rounded-none shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden">
                {/* Decorative Slanted Corner */}
                <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 border-l border-b border-amber-500/20 transform rotate-45 translate-x-8 -translate-y-8" />

                <h3 className="text-2xl font-black font-['Rajdhani'] uppercase tracking-tight text-amber-500 mb-1 flex items-center gap-2">
                    {isShaft ? <ArrowDownCircle size={24} /> : <Pickaxe size={24} />}
                    {isShaft ? 'Vertical Excavation' : 'Sector Expansion'}
                </h3>
                <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em] mb-6 border-b border-slate-900 pb-2">
                    Authorization Required: ({tilePos.x}, {tilePos.z})
                </p>

                <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-end border-b border-slate-900 pb-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black font-['Rajdhani']">Operation</span>
                        <span className="text-xs font-bold text-amber-200 uppercase">{isShaft ? 'Digging Shaft' : 'Digging Tunnel'}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-slate-900 pb-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black font-['Rajdhani']">Target Depth</span>
                        <span className="text-xs font-mono font-bold text-white">{targetLayer * 10} Meters</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-slate-900 pb-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black font-['Rajdhani']">Geological Risk</span>
                        <span className="text-xs font-bold text-emerald-500">LOW</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-500 font-black uppercase text-xs tracking-widest transition-all"
                    >
                        Abort
                    </button>
                    <button
                        onClick={() => onConfirm(targetLayer)}
                        className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black uppercase text-xs tracking-widest transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] group relative"
                    >
                        <span className="relative z-10">Authorize Dig</span>
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>
            </div>
        </div>
    );
};
