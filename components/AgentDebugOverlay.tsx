/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Agent, Job } from '../types';
import {
    Users, MapPin, Briefcase, Zap, Utensils, Smile,
    Navigation, Clock, ChevronDown, ChevronUp, Target,
    Hammer, Pickaxe, TreeDeciduous, Brain, AlertTriangle
} from 'lucide-react';

interface AgentDebugOverlayProps {
    agents: Agent[];
    jobs: Job[];
    tickCount: number;
}

const STATE_COLORS: Record<string, string> = {
    'IDLE': 'text-slate-400',
    'MOVING': 'text-blue-400',
    'WORKING': 'text-amber-400',
    'SLEEPING': 'text-purple-400',
    'EATING': 'text-green-400',
    'RELAXING': 'text-cyan-400',
    'SOCIALIZING': 'text-pink-400',
    'PATROLLING': 'text-red-400',
    'OFF_DUTY': 'text-slate-500'
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
    'WORKER': <Hammer size={10} />,
    'MINER': <Pickaxe size={10} />,
    'BOTANIST': <TreeDeciduous size={10} />,
    'ENGINEER': <Briefcase size={10} />,
    'SECURITY': <Target size={10} />,
    'ILLEGAL_MINER': <AlertTriangle size={10} />
};

export const AgentDebugOverlay: React.FC<AgentDebugOverlayProps> = ({ agents, jobs, tickCount }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'ALL' | 'WORKING' | 'IDLE' | 'MOVING'>('ALL');

    const filteredAgents = useMemo(() => {
        return agents.filter(a => {
            if (filter === 'ALL') return true;
            if (filter === 'WORKING') return a.state === 'WORKING';
            if (filter === 'IDLE') return a.state === 'IDLE';
            if (filter === 'MOVING') return a.state === 'MOVING';
            return true;
        });
    }, [agents, filter]);

    const buildJobsCount = jobs.filter(j => j.type === 'BUILD').length;
    const activeWorkers = agents.filter(a => a.state === 'WORKING').length;

    const selectedAgent = selectedAgentId ? agents.find(a => a.id === selectedAgentId) : null;

    return (
        <div className="fixed bottom-20 left-4 z-[55] pointer-events-auto animate-in slide-in-from-left-4 duration-300">
            <div className="bg-slate-900/95 border-2 border-cyan-600/50 rounded shadow-xl max-w-xs">
                {/* Header */}
                <div
                    className="flex items-center justify-between p-2 bg-slate-800 border-b border-slate-700 cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-cyan-900/50 border border-cyan-500/30 flex items-center justify-center rounded">
                            <Users size={12} className="text-cyan-400" />
                        </div>
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider font-['Rajdhani']">
                            Agent Debug
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-slate-400">
                            {activeWorkers}/{agents.length} active
                        </span>
                        {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                    </div>
                </div>

                {isExpanded && (
                    <div className="p-2 space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-4 gap-1 text-center">
                            <div className="bg-slate-800 p-1 rounded">
                                <div className="text-[8px] text-slate-500 uppercase">Idle</div>
                                <div className="text-sm font-bold text-slate-300">{agents.filter(a => a.state === 'IDLE').length}</div>
                            </div>
                            <div className="bg-slate-800 p-1 rounded">
                                <div className="text-[8px] text-slate-500 uppercase">Moving</div>
                                <div className="text-sm font-bold text-blue-400">{agents.filter(a => a.state === 'MOVING').length}</div>
                            </div>
                            <div className="bg-slate-800 p-1 rounded">
                                <div className="text-[8px] text-slate-500 uppercase">Working</div>
                                <div className="text-sm font-bold text-amber-400">{activeWorkers}</div>
                            </div>
                            <div className="bg-slate-800 p-1 rounded">
                                <div className="text-[8px] text-slate-500 uppercase">Jobs</div>
                                <div className="text-sm font-bold text-emerald-400">{buildJobsCount}</div>
                            </div>
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex gap-1">
                            {(['ALL', 'WORKING', 'IDLE', 'MOVING'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`flex-1 py-1 text-[8px] font-bold uppercase rounded transition-colors ${filter === f
                                        ? 'bg-cyan-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        {/* Agent List */}
                        <div className="space-y-1">
                            {filteredAgents.map(agent => (
                                <div
                                    key={agent.id}
                                    onClick={() => setSelectedAgentId(agent.id === selectedAgentId ? null : agent.id)}
                                    className={`p-1.5 rounded cursor-pointer transition-all ${selectedAgentId === agent.id
                                        ? 'bg-cyan-900/50 border border-cyan-500/50'
                                        : 'bg-slate-800/50 hover:bg-slate-800 border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <div className="text-slate-500">{ROLE_ICONS[agent.type]}</div>
                                            <span className="text-[9px] font-bold text-white truncate max-w-[80px]">
                                                {agent.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className={`text-[8px] font-mono font-bold ${STATE_COLORS[agent.state] || 'text-slate-400'}`}>
                                                {agent.state}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Expanded Agent Details */}
                                    {selectedAgentId === agent.id && (
                                        <div className="mt-2 pt-2 border-t border-slate-700 space-y-1.5">
                                            {/* Position */}
                                            <div className="flex items-center gap-1 text-[8px]">
                                                <MapPin size={10} className="text-slate-500" />
                                                <span className="text-slate-400">Pos:</span>
                                                <span className="font-mono text-cyan-400">
                                                    ({agent.x.toFixed(1)}, {agent.z.toFixed(1)})
                                                </span>
                                            </div>

                                            {/* Target */}
                                            {agent.targetX !== undefined && agent.targetZ !== undefined && (
                                                <div className="flex items-center gap-1 text-[8px]">
                                                    <Target size={10} className="text-slate-500" />
                                                    <span className="text-slate-400">Target:</span>
                                                    <span className="font-mono text-amber-400">
                                                        ({agent.targetX}, {agent.targetZ})
                                                    </span>
                                                </div>
                                            )}

                                            {/* Current Job */}
                                            {agent.currentJobId && (
                                                <div className="flex items-center gap-1 text-[8px]">
                                                    <Briefcase size={10} className="text-slate-500" />
                                                    <span className="text-slate-400">Job:</span>
                                                    <span className="font-mono text-emerald-400 truncate max-w-[120px]">
                                                        {agent.currentJobId}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Path Info */}
                                            {agent.path && agent.path.length > 0 && (
                                                <div className="flex items-center gap-1 text-[8px]">
                                                    <Navigation size={10} className="text-slate-500" />
                                                    <span className="text-slate-400">Path:</span>
                                                    <span className="font-mono text-blue-400">
                                                        {agent.path.length} steps
                                                    </span>
                                                </div>
                                            )}

                                            {/* Needs Bars */}
                                            <div className="grid grid-cols-3 gap-1 mt-1">
                                                <div>
                                                    <div className="flex items-center gap-0.5 text-[7px] text-slate-500">
                                                        <Zap size={8} /> PWR
                                                    </div>
                                                    <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all ${agent.energy < 30 ? 'bg-rose-500' : 'bg-blue-500'}`}
                                                            style={{ width: `${agent.energy}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-0.5 text-[7px] text-slate-500">
                                                        <Utensils size={8} /> HGR
                                                    </div>
                                                    <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all ${agent.hunger < 30 ? 'bg-rose-500' : 'bg-amber-500'}`}
                                                            style={{ width: `${agent.hunger}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-0.5 text-[7px] text-slate-500">
                                                        <Smile size={8} /> MOR
                                                    </div>
                                                    <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all ${agent.mood < 30 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                            style={{ width: `${agent.mood}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Skills */}
                                            <div className="text-[7px] text-slate-500 flex gap-2 mt-1">
                                                <span>⛏️ {agent.skills.mining}</span>
                                                <span>🔨 {agent.skills.construction}</span>
                                                <span>🌱 {agent.skills.plants}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Tick Counter */}
                        <div className="flex items-center justify-center gap-1 pt-1 border-t border-slate-800">
                            <Clock size={10} className="text-slate-600" />
                            <span className="text-[8px] font-mono text-slate-500">
                                Tick: {tickCount}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
