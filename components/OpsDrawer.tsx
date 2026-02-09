
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { Menu, ArrowLeft, TrendingUp, FlaskConical, BarChart3, Users, Zap, Utensils, Smile, Briefcase, Shield, Leaf, Wrench, Pickaxe } from 'lucide-react';
import { GameState, Action, Agent, AgentRole } from '../types';
import { ResearchTree } from './ResearchTree';
import { MAX_AGENTS, CAPACITY_PER_QUARTERS } from '../engine/sim/logic/SimulationLogic';
import { BuildingType } from '../types';

const NeedsBar: React.FC<{ icon: any, value: number, color: string }> = ({ icon, value, color }) => (
    <div className="flex items-center gap-1.5 w-full">
        <div className="text-slate-500 w-3">{icon}</div>
        <div className="flex-1 h-2 bg-slate-950 border border-slate-800 p-[1px]">
            <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
        </div>
    </div>
);

const RoleIcon = ({ role, size = 14 }: { role: AgentRole, size?: number }) => {
    switch (role) {
        case 'MINER': return <Pickaxe size={size} className="text-rose-400" />;
        case 'BOTANIST': return <Leaf size={size} className="text-emerald-400" />;
        case 'ENGINEER': return <Zap size={size} className="text-blue-400" />;
        case 'SECURITY': return <Shield size={size} className="text-rose-500" />;
        case 'ILLEGAL_MINER': return <Briefcase size={size} className="text-slate-700" />;
        default: return <Briefcase size={size} className="text-amber-400" />;
    }
};

const ColonistRow: React.FC<{ agent: Agent }> = ({ agent }) => (
    <div className="bg-slate-900 border-2 border-slate-700 p-2 rounded-[4px] shadow-[2px_2px_0_0_rgba(0,0,0,0.3)] space-y-2">
        <div className="flex justify-between items-center border-b border-slate-800 pb-1">
            <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-[2px] flex items-center justify-center font-black border-2 text-xs ${agent.type === 'ILLEGAL_MINER' ? 'bg-slate-950 text-slate-500 border-slate-800' : 'bg-amber-950 text-amber-500 border-amber-700'}`}>
                    {agent.type === 'ILLEGAL_MINER' ? '?' : agent.name[0]}
                </div>
                <div>
                    <h4 className="text-xs font-black text-white flex items-center gap-2 font-['Rajdhani'] uppercase tracking-wide">
                        {agent.name} <RoleIcon role={agent.type} size={10} />
                    </h4>
                    <span className={`text-[9px] uppercase font-bold font-mono ${agent.state === 'WORKING' ? 'text-emerald-400' : agent.state === 'SLEEPING' ? 'text-blue-400' : 'text-slate-500'}`}>
                        {agent.type} • {agent.state}
                    </span>
                </div>
            </div>
            <div className="text-right">
                <div className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Mood</div>
                <div className="text-[10px] font-mono font-bold text-emerald-400">{Math.floor(agent.mood)}%</div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
                <NeedsBar icon={<Zap size={8} />} value={agent.energy} color="bg-blue-500" />
                <NeedsBar icon={<Utensils size={8} />} value={agent.hunger} color="bg-amber-500" />
            </div>
            <div className="flex flex-wrap content-start gap-1">
                {Object.entries(agent.skills).map(([skill, val]) => (
                    <div key={skill} className="text-[7px] bg-slate-950 border border-slate-800 px-1 py-0.5 rounded-[2px] text-slate-400 uppercase font-bold tracking-tighter">
                        {skill.substring(0, 3)}:{val}
                    </div>
                ))}
            </div>
        </div>
    </div>
);

interface OpsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    state: GameState;
    dispatch: React.Dispatch<Action>;
    financials: { income: number; cost: number; net: number };
    ecoMult: number;
    trustMult: number;
    playSfx: (type: any) => void;

}

const TabButton = ({ id, label, icon: Icon, activeTab, setActiveTab, playSfx }: { id: string, label: string, icon: any, activeTab: string, setActiveTab: (id: any) => void, playSfx: (t: any) => void }) => {
    const isActive = activeTab === id;
    return (
        <button
            onClick={() => {
                setActiveTab(id);
                try { playSfx('UI_CLICK'); } catch (e) { console.error('SFX Error:', e); }
            }}
            className={`
            flex-1 py-2 px-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all
            border-b-4 rounded-t-[4px]
            ${isActive
                    ? 'bg-slate-800 text-amber-500 border-amber-500'
                    : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800 hover:text-slate-300'}
        `}
        >
            <Icon size={12} /> <span className="hidden sm:inline">{label}</span>
        </button>
    );
};

export const OpsDrawer: React.FC<OpsDrawerProps> = ({ isOpen, onClose, state, dispatch, financials, ecoMult, trustMult, playSfx }) => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'RESEARCH' | 'COLONISTS'>('OVERVIEW');

    // Reset tab when drawer opens
    React.useEffect(() => {
        if (isOpen) setActiveTab('OVERVIEW');
    }, [isOpen]);

    const quartersCount = Object.values(state.chunks).flatMap(c => c.tiles).filter(t => t.buildingType === BuildingType.STAFF_QUARTERS && !t.isUnderConstruction).length;
    const currentCapacity = (quartersCount * CAPACITY_PER_QUARTERS) + 4;
    const colonistCount = state.agents.filter(a => a.type !== 'ILLEGAL_MINER').length;

    return (
        <div
            className={`absolute inset-y-0 left-0 w-full sm:w-[500px] max-w-[100vw] bg-slate-950 border-r-2 border-slate-700 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
            {/* Header */}
            <div className="p-3 border-b-2 border-slate-700 bg-slate-800 flex justify-between items-center shadow-md z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-900 border-2 border-slate-600 flex items-center justify-center rounded-[4px] text-white shadow-inner">
                        <Menu size={16} />
                    </div>
                    <h2 className="text-lg font-black text-white uppercase tracking-widest font-['Rajdhani']">Operations</h2>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 bg-rose-600 hover:bg-rose-500 border-b-4 border-rose-900 active:border-b-0 active:translate-y-1 rounded-[4px] flex items-center justify-center text-white transition-all"
                >
                    <ArrowLeft size={16} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b-2 border-slate-700 px-3 pt-3 bg-slate-900 gap-1">
                <TabButton id="OVERVIEW" label="Stats" icon={BarChart3} activeTab={activeTab} setActiveTab={setActiveTab} playSfx={playSfx} />
                <TabButton id="COLONISTS" label="Crew" icon={Users} activeTab={activeTab} setActiveTab={setActiveTab} playSfx={playSfx} />
                <TabButton id="RESEARCH" label="Tech" icon={FlaskConical} activeTab={activeTab} setActiveTab={setActiveTab} playSfx={playSfx} />
            </div>

            <div className="p-3 sm:p-4 flex-1 overflow-y-auto no-scrollbar bg-slate-950">
                {activeTab === 'OVERVIEW' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                        {/* Market Terminal */}
                        <div className="bg-slate-900 border-2 border-blue-600/50 rounded-[4px] shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] overflow-hidden">
                            <div className="bg-blue-950/30 p-2 border-b-2 border-blue-600/30 flex items-center gap-2">
                                <TrendingUp size={14} className="text-blue-400" />
                                <h3 className="text-blue-400 text-xs font-black uppercase tracking-widest font-['Rajdhani']">Market Terminal</h3>
                            </div>
                            <div className="p-3">
                                <div className="flex justify-between items-end mb-3">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Ore Stockpile</span>
                                        <span className="text-2xl font-mono font-bold text-white leading-none">{Math.floor(state.resources.minerals)} <span className="text-xs text-slate-600">tons</span></span>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Market Value</span>
                                        <span className="text-xs font-mono text-emerald-400 font-bold">~{Math.floor(state.resources.minerals * 15 * ecoMult * trustMult)} AGT</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { if (state.resources.minerals > 0) { dispatch({ type: 'SELL_MINERALS' }); playSfx('SELL'); } else { playSfx('ERROR'); } }}
                                    disabled={state.resources.minerals < 1}
                                    className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-900 disabled:cursor-not-allowed text-amber-950 py-3 rounded-[4px] font-black border-b-4 border-amber-800 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                >
                                    <TrendingUp size={14} /> Export Minerals
                                </button>
                            </div>
                        </div>

                        {/* Colony Vitals */}
                        <div className="bg-slate-900 border-2 border-slate-700 rounded-[4px] shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
                            <div className="bg-slate-800 p-2 border-b-2 border-slate-700">
                                <h3 className="text-slate-300 text-xs font-black uppercase tracking-widest font-['Rajdhani']">Colony Vitals</h3>
                            </div>
                            <div className="p-3 space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-mono border-b border-slate-800 pb-1">
                                    <span className="text-slate-500 font-bold uppercase">Housing</span>
                                    <span className={colonistCount >= currentCapacity ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{colonistCount} / {currentCapacity}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-mono border-b border-slate-800 pb-1">
                                    <span className="text-slate-500 font-bold uppercase">Eco Status</span>
                                    <span className={state.resources.eco > 50 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{state.resources.eco > 80 ? 'PRISTINE' : state.resources.eco > 50 ? 'STABLE' : 'CRITICAL'}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-mono border-b border-slate-800 pb-1">
                                    <span className="text-slate-500 font-bold uppercase">Global Yield</span>
                                    <span className="text-amber-400 font-bold">x{ecoMult.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-mono pb-1">
                                    <span className="text-slate-500 font-bold uppercase">Public Trust</span>
                                    <span className="text-blue-400 font-bold">{Math.floor(state.resources.trust)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'COLONISTS' && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-center mb-1 px-1">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-['Rajdhani']">Manifest ({colonistCount}/{currentCapacity})</h3>
                            <div className="text-[9px] text-emerald-400 bg-emerald-950/50 px-2 py-1 rounded-[2px] border border-emerald-500/30 font-bold tracking-wide uppercase">{state.jobs.filter(j => !j.assignedAgentId).length} Pending Jobs</div>
                        </div>
                        {state.agents.map(agent => (
                            <ColonistRow key={agent.id} agent={agent} />
                        ))}
                    </div>
                )}
                {activeTab === 'RESEARCH' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <ResearchTree research={state.research} resources={state.resources} dispatch={dispatch} playSfx={playSfx} />
                    </div>
                )}
            </div>
        </div>
    );
};
