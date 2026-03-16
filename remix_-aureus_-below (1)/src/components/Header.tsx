import React from 'react';
import { DollarSign, AlertTriangle, Megaphone, Database, Briefcase } from 'lucide-react';
import { GameState } from '../types';
import { Meter } from './Meter';

export const Header = ({ state }: { state: GameState }) => {
  const formatTime = (t: number) => {
    const hours = Math.floor(t);
    const minutes = Math.floor((t % 1) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const isNight = state.time >= 20 || state.time < 6;

  return (
    <header className={`p-4 border-b border-black/10 backdrop-blur-md flex flex-col gap-3 transition-colors duration-1000 ${isNight ? 'bg-slate-900 text-white' : 'bg-white/50 text-black'}`}>
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="font-serif italic font-black text-xl tracking-tighter text-current flex items-center gap-2">
            {state.currentScene === 'OFFICE' && <Briefcase size={20} className="text-blue-600" />}
            Aureus: Below
          </h1>
          <div className="flex gap-2 items-center text-[10px] font-mono font-black uppercase tracking-widest opacity-60">
            <span>Day {state.day}</span>
            <span className="w-1 h-1 bg-current rounded-full" />
            <span className={isNight ? "text-amber-400" : "text-blue-600"}>{formatTime(state.time)}</span>
            {isNight && <span className="ml-1 text-[8px] text-red-500 animate-pulse">Curfew Active</span>}
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1 font-mono text-sm font-bold" title="Funds">
            <DollarSign size={14} className="text-emerald-600" />
            {state.money.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 font-mono text-sm font-bold" title="Energy">
            <AlertTriangle size={14} className={state.energy < 20 ? "text-red-600 animate-pulse" : isNight ? "text-blue-400" : "text-blue-600"} />
            {Math.floor(state.energy)}%
          </div>
          <div className="flex items-center gap-1 font-mono text-sm font-bold" title="Incriminating Evidence">
            <Megaphone size={14} className="text-red-600" />
            {state.evidence}
          </div>
          <div className="flex items-center gap-1 font-mono text-sm font-bold" title="Ore">
            <Database size={14} className="text-amber-600" />
            {state.ore}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Meter label="Trust" value={state.meters.trust} color="bg-blue-500" />
        <Meter label="Influence" value={state.meters.influence} color="bg-purple-500" />
        <Meter label="Exposure" value={state.meters.exposure} color="bg-red-500" />
      </div>
    </header>
  );
};
