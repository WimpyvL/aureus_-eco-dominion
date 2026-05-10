
import React from 'react';
import { FileText, CheckCircle2, XCircle, Clock, Send, User } from 'lucide-react';
import { GameState, Action } from '../types';
import { NPC, Permit, PermitStatus } from '../engine/types/bureaucracy';

interface BureaucracyOfficeProps {
    state: GameState;
    dispatch: React.Dispatch<Action>;
    playSfx: (type: any) => void;
}

export const BureaucracyOffice: React.FC<BureaucracyOfficeProps> = ({ state, dispatch, playSfx }) => {
    const bureaucracy = state.bureaucracy;

    if (!bureaucracy) return <div>Bureaucracy system offline.</div>;

    const handleSubmitPermit = (permitId: string) => {
        dispatch({ type: 'SUBMIT_PERMIT', payload: permitId } as any);
        playSfx('UI_CLICK');
    };

    const handleTalkToNPC = (npcId: string) => {
        dispatch({ type: 'TALK_TO_NPC', payload: npcId } as any);
        playSfx('UI_CLICK');
    };

    const getStatusIcon = (status: PermitStatus) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle2 className="text-emerald-400" size={16} />;
            case 'REJECTED': return <XCircle className="text-rose-400" size={16} />;
            case 'PENDING': return <Clock className="text-amber-400 animate-pulse" size={16} />;
            case 'AVAILABLE': return <Send className="text-blue-400" size={16} />;
            default: return <Clock className="text-slate-600" size={16} />;
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* NPCs / Staff Section */}
            <div className="bg-slate-900 border-2 border-slate-700 rounded-[4px] overflow-hidden shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
                <div className="bg-slate-800 p-2 border-b-2 border-slate-700 flex justify-between items-center">
                    <h3 className="text-slate-300 text-xs font-black uppercase tracking-widest font-['Rajdhani'] flex items-center gap-2">
                        <User size={14} /> Licensing Staff
                    </h3>
                </div>
                <div className="p-3 grid grid-cols-1 gap-2">
                    {Object.values(bureaucracy.npcs).map((npc: NPC) => (
                        <div key={npc.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 p-2 rounded-[2px]">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-900/30 border border-blue-500/50 rounded-[2px] flex items-center justify-center text-blue-400 font-bold">
                                    {npc.name[0]}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-white font-bold uppercase">{npc.name}</span>
                                    <span className="text-[8px] text-slate-500 font-bold uppercase">{npc.role}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleTalkToNPC(npc.id)}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black px-3 py-1 rounded-[2px] border-b-2 border-blue-800 active:border-b-0 active:translate-y-0.5 transition-all uppercase"
                            >
                                Interview
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Permits Section */}
            <div className="bg-slate-900 border-2 border-slate-700 rounded-[4px] overflow-hidden shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
                <div className="bg-slate-800 p-2 border-b-2 border-slate-700 flex justify-between items-center">
                    <h3 className="text-slate-300 text-xs font-black uppercase tracking-widest font-['Rajdhani'] flex items-center gap-2">
                        <FileText size={14} /> Permitting Ledger
                    </h3>
                </div>
                <div className="p-3 space-y-3">
                    {Object.values(bureaucracy.permits).map((permit: Permit) => (
                        <div key={permit.id} className="bg-slate-950 border border-slate-800 p-3 rounded-[2px] space-y-2">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-amber-500 font-black uppercase tracking-wide">Form {permit.formNumber}</span>
                                    <h4 className="text-xs font-bold text-white uppercase">{permit.name}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-[1px] ${permit.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                                        permit.status === 'REJECTED' ? 'bg-rose-950 text-rose-400 border border-rose-500/30' :
                                            permit.status === 'PENDING' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
                                                'bg-slate-900 text-slate-500 border border-slate-800'
                                        }`}>
                                        {permit.status}
                                    </span>
                                    {getStatusIcon(permit.status)}
                                </div>
                            </div>

                            <p className="text-[9px] text-slate-400 leading-tight">{permit.description}</p>

                            {permit.rejectionReason && permit.status === 'REJECTED' && (
                                <div className="bg-rose-950/20 border border-rose-500/20 p-2 text-[8px] text-rose-300 italic">
                                    Officer Note: {permit.rejectionReason}
                                </div>
                            )}

                            {permit.status === 'AVAILABLE' && (
                                <button
                                    onClick={() => handleSubmitPermit(permit.id)}
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white text-[9px] font-black py-2 rounded-[2px] border-b-2 border-slate-950 active:border-b-0 active:translate-y-0.5 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <Send size={12} /> Submit for Review (100 AGT)
                                </button>
                            )}

                            {permit.status === 'PENDING' && (
                                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 animate-[shimmer_2s_infinite]" style={{ width: '40%' }}></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};
