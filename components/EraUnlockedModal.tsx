/**
 * Era Unlocked Modal
 * Celebratory popup shown when the player achieves a new era.
 */

import React, { useEffect, useState } from 'react';
import { Era, EraDef, BuildingType } from '../types';
import { ERAS, BUILDINGS } from '../engine/data/VoxelConstants';
import { X, Trophy, Unlock, ChevronRight } from 'lucide-react';

interface EraUnlockedModalProps {
    era: Era;
    onClose: () => void;
    playSfx: (type: any) => void;
}

export const EraUnlockedModal: React.FC<EraUnlockedModalProps> = ({ era, onClose, playSfx }) => {
    const [showContent, setShowContent] = useState(false);
    const eraDef = ERAS[era];

    // Get buildings unlocked in this era
    const unlockedBuildings = Object.values(BUILDINGS).filter(b => b.era === era && b.type !== BuildingType.EMPTY);

    useEffect(() => {
        // Animate in
        const timer = setTimeout(() => setShowContent(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        playSfx('UI_CLICK');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop with particles */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Celebration rays */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-1/2 left-1/2 w-[200vw] h-[200vh] -translate-x-1/2 -translate-y-1/2"
                    style={{
                        background: `conic-gradient(from 0deg, transparent, ${eraDef.color}20, transparent, ${eraDef.color}10, transparent)`,
                        animation: 'spin 20s linear infinite'
                    }}
                />
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                            background: eraDef.color,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 2}s`,
                            opacity: 0.6
                        }}
                    />
                ))}
            </div>

            {/* Modal Content */}
            <div
                className={`relative w-[90vw] max-w-lg bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 
                           border-2 rounded-xl shadow-2xl transform transition-all duration-500
                           ${showContent ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
                style={{ borderColor: eraDef.color }}
            >
                {/* Glow effect */}
                <div
                    className="absolute -inset-1 rounded-xl blur-xl opacity-30"
                    style={{ background: eraDef.color }}
                />

                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 z-10 p-2 text-slate-400 hover:text-white 
                               bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="relative p-6 pb-4 text-center">
                    {/* Trophy icon */}
                    <div
                        className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                        style={{
                            background: `linear-gradient(135deg, ${eraDef.color}40, ${eraDef.color}20)`,
                            boxShadow: `0 0 40px ${eraDef.color}40`
                        }}
                    >
                        <Trophy size={40} style={{ color: eraDef.color }} className="animate-pulse" />
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <p className="text-sm font-bold uppercase tracking-[0.3em] text-slate-400">
                            New Era Unlocked
                        </p>
                        <h1
                            className="text-3xl sm:text-4xl font-black uppercase tracking-wide"
                            style={{ color: eraDef.color }}
                        >
                            {eraDef.name}
                        </h1>
                        <p className="text-slate-300 text-sm max-w-sm mx-auto">
                            {eraDef.description}
                        </p>
                    </div>
                </div>

                {/* Divider */}
                <div className="relative h-px mx-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
                </div>

                {/* Unlocked Buildings */}
                {unlockedBuildings.length > 0 && (
                    <div className="p-6 pt-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Unlock size={16} className="text-emerald-400" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                                New Buildings Available
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                            {unlockedBuildings.slice(0, 8).map((building) => (
                                <div
                                    key={building.type}
                                    className="flex items-center gap-2 p-2 bg-slate-800/50 border border-slate-700 rounded-lg"
                                >
                                    <div
                                        className="w-8 h-8 rounded flex items-center justify-center text-lg"
                                        style={{ background: `${eraDef.color}30` }}
                                    >
                                        🏗️
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-white truncate">{building.name}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{building.stats || 'Building'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {unlockedBuildings.length > 8 && (
                            <p className="text-xs text-slate-500 mt-2 text-center">
                                +{unlockedBuildings.length - 8} more buildings
                            </p>
                        )}
                    </div>
                )}

                {/* Continue Button */}
                <div className="p-6 pt-2">
                    <button
                        onClick={handleClose}
                        className="w-full py-3 px-6 font-bold uppercase tracking-wider text-white 
                                   rounded-lg flex items-center justify-center gap-2 group
                                   transition-all duration-300 hover:scale-[1.02]"
                        style={{
                            background: `linear-gradient(135deg, ${eraDef.color}, ${eraDef.color}cc)`,
                            boxShadow: `0 4px 20px ${eraDef.color}40`
                        }}
                    >
                        Continue Building
                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes spin {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
                    50% { transform: translateY(-20px) scale(1.2); opacity: 1; }
                }
            `}</style>
        </div>
    );
};
