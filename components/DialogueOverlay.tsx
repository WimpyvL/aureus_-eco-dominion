
import React from 'react';
import { MessageSquare, User, ArrowRight } from 'lucide-react';
import { GameState, Action } from '../types';

interface DialogueOverlayProps {
    state: GameState;
    dispatch: React.Dispatch<Action>;
    playSfx: (type: any) => void;
}

export const DialogueOverlay: React.FC<DialogueOverlayProps> = ({ state, dispatch, playSfx }) => {
    const bureaucracy = state.bureaucracy;

    if (!bureaucracy || !bureaucracy.activeDialogue) return null;

    const node = state.bureaucracy.activeDialogue;
    const activeNPCId = state.bureaucracy.activeNPCId;
    const npc = activeNPCId ? state.bureaucracy.npcs[activeNPCId] : null;

    if (!npc || !node) return null;

    const handleChoice = (optionIndex: number) => {
        dispatch({ type: 'CHOOSE_DIALOGUE', payload: optionIndex } as any);
        playSfx('UI_CLICK');
    };

    return (
        <div
            className="absolute inset-0 z-[100] flex flex-col justify-end pointer-events-auto p-4 sm:p-20 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-500"
            onClick={() => dispatch({ type: 'CLOSE_DIALOGUE' })}
        >
            <div
                className="max-w-3xl mx-auto w-full pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-slate-950 border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] rounded-[4px] overflow-hidden flex flex-col md:flex-row">
                    {/* Portrait Area */}
                    <div className="w-full md:w-48 bg-slate-900 border-b-2 md:border-b-0 md:border-r-2 border-slate-800 flex flex-col items-center justify-center p-6 gap-4">
                        <div className="w-24 h-24 bg-blue-950 border-2 border-blue-400/50 rounded-[4px] flex items-center justify-center text-4xl text-blue-100 font-black shadow-inner">
                            {npc.name[0]}
                        </div>
                        <div className="text-center">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest font-['Rajdhani']">{npc.name}</h3>
                            <p className="text-[9px] text-blue-400 font-bold uppercase tracking-tighter opacity-70">{npc.role}</p>
                        </div>
                    </div>

                    {/* Dialogue Text Area */}
                    <div className="flex-1 p-6 flex flex-col justify-between gap-6 min-h-[160px]">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 opacity-30">
                                <MessageSquare size={12} className="text-blue-400" />
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400">Incoming Transmission</span>
                            </div>
                            <p className="text-sm sm:text-base text-slate-100 font-['Rajdhani'] leading-relaxed">
                                {node.text}
                            </p>
                        </div>

                        {/* Choices */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {node.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleChoice(idx)}
                                    className="group flex items-center justify-between bg-slate-900 hover:bg-blue-900/40 border-2 border-slate-800 hover:border-blue-500/50 p-3 rounded-[4px] transition-all text-left"
                                >
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-300 group-hover:text-white uppercase tracking-wide">
                                        {option.text}
                                    </span>
                                    <ArrowRight size={14} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">Waiting for Response...</span>
                </div>
            </div>
        </div>
    );
};
