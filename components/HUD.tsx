
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { Coins, Pickaxe, Leaf, Heart, Gem, Users, Target, Trees, Database, Truck, Package } from 'lucide-react';
import { GameState, Era } from '../types';
import { ERAS } from '../engine/data/VoxelConstants';

const ResourceBlock = React.memo(({ icon: Icon, val, label, borderClass, iconBgClass, sub, meta, textColor = "text-white", isExpanded, onToggle }: any) => {
  const [popup, setPopup] = useState<{ id: number; text: string; isPositive: boolean } | null>(null);
  const [hasNew, setHasNew] = useState(false);
  const prevValRef = useRef(Math.floor(val));
  const counterRef = useRef(0);

  useEffect(() => {
    const currentInt = Math.floor(val);
    const diff = currentInt - prevValRef.current;

    if (Math.abs(diff) >= 1) {
      const id = ++counterRef.current;
      const text = `${diff > 0 ? '+' : ''}${diff}`;
      setPopup({ id, text, isPositive: diff > 0 });

      if (!isExpanded && diff > 0) {
        setHasNew(true);
      }

      const timer = setTimeout(() => {
        setPopup(current => current?.id === id ? null : current);
      }, 600);
      prevValRef.current = currentInt;
      return () => clearTimeout(timer);
    } else {
      prevValRef.current = currentInt;
    }
  }, [val, isExpanded]);

  const handleToggle = () => {
    onToggle(!isExpanded);
    if (!isExpanded) {
      setHasNew(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center pointer-events-auto">
      {popup && isExpanded && (
        <div
          key={popup.id}
          className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black z-50 pointer-events-none resource-popup ${popup.isPositive ? 'text-emerald-400 drop-shadow-[0_2px_0_rgba(0,0,0,0.8)]' : 'text-rose-400 drop-shadow-[0_2px_0_rgba(0,0,0,0.8)]'}`}
        >
          {popup.text}
        </div>
      )}

      <button
        onClick={handleToggle}
        className={`
          flex items-center gap-1.5 sm:gap-2.5 
          bg-slate-900 
          border-2 ${borderClass} 
          rounded-[4px] px-2 py-1 sm:px-3 sm:py-2
          ${isExpanded ? 'min-w-[92px] sm:min-w-[112px]' : 'w-10 h-10 sm:w-12 sm:h-12 justify-center'}
          shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]
          transition-all duration-200
          hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,0.3)]
          relative
        `}
      >
        {!isExpanded && hasNew && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse z-10" />
        )}

        <div className={`
          w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-[3px] 
          ${iconBgClass} text-slate-900 border border-black/20 shadow-inner shrink-0
        `}>
          <Icon size={12} className="sm:hidden" strokeWidth={2.5} />
          <Icon size={16} className="hidden sm:block" strokeWidth={2.5} />
        </div>

        {isExpanded && (
          <div className="flex flex-col items-start leading-none gap-0.5 animate-in fade-in slide-in-from-left-1 duration-200">
            <span className="text-[7px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider">{label}</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-xs sm:text-sm font-['Rajdhani'] font-bold ${textColor} tracking-wide leading-none`}>{Math.floor(val).toLocaleString()}</span>
              {sub !== undefined && (
                <span className={`text-[7px] sm:text-[9px] font-mono font-bold ${sub < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {sub > 0 ? '▲' : sub < 0 ? '▼' : ''}
                </span>
              )}
            </div>
            {meta && (
              <span className="text-[7px] sm:text-[8px] text-slate-500 font-mono uppercase tracking-tight">
                {meta}
              </span>
            )}
          </div>
        )}
      </button>
    </div>
  );
});

interface HUDProps {
  resources: GameState['resources'];
  financials: { net: number };
  population: number;
  currentEra: Era;
  state: GameState;
  activeBlock: string | null;
  onToggleBlock: (id: string | null) => void;
}

const EraBlock = ({ currentEra, state, isExpanded, onToggle }: { currentEra: Era; state: GameState, isExpanded: boolean, onToggle: (open: boolean) => void }) => {
  const [hasNew, setHasNew] = useState(false);
  const prevProgressRef = useRef(0);
  const eraDef = ERAS[currentEra];
  const eras = Object.values(Era);
  const nextEraIndex = eras.indexOf(currentEra) + 1;
  const nextEra = nextEraIndex < eras.length ? eras[nextEraIndex] : null;
  const nextDef = nextEra ? ERAS[nextEra] : null;

  let progress = 0;
  let totalReqs = 0;
  let metReqs = 0;

  if (nextDef) {
    const c = nextDef.unlockConditions;
    if (c.minColonists) {
      totalReqs++;
      const count = state.agents.filter(a => a.type !== 'ILLEGAL_MINER').length;
      if (count >= c.minColonists) metReqs++;
      progress += Math.min(1, count / c.minColonists);
    }
    if (c.minAgt) {
      totalReqs++;
      if (state.resources.agt >= c.minAgt) metReqs++;
      progress += Math.min(1, state.resources.agt / c.minAgt);
    }
    if (c.minEco) {
      totalReqs++;
      if (state.resources.eco >= c.minEco) metReqs++;
      progress += Math.min(1, state.resources.eco / c.minEco);
    }
    if (c.minTrust) {
      totalReqs++;
      if (state.resources.trust >= c.minTrust) metReqs++;
      progress += Math.min(1, state.resources.trust / c.minTrust);
    }
    if (c.minBuildings) {
      totalReqs++;
      const count = Object.values(state.chunks).flatMap(c => c.tiles).filter(t => t.buildingType !== 'EMPTY' && !t.isUnderConstruction).length;
      if (count >= c.minBuildings) metReqs++;
      progress += Math.min(1, count / c.minBuildings);
    }

    if (totalReqs > 0) progress = (progress / totalReqs) * 100;

    if (!isExpanded && progress > prevProgressRef.current + 0.1) {
      setHasNew(true);
    }
    prevProgressRef.current = progress;
  }

  const handleToggle = () => {
    onToggle(!isExpanded);
    if (!isExpanded) {
      setHasNew(false);
    }
  };

  return (
    <div className="relative group pointer-events-auto">
      <button
        onClick={handleToggle}
        className={`
          flex items-center gap-1.5 sm:gap-2.5 
          bg-slate-900 
          border-2 border-slate-700
          rounded-[4px] px-2 py-1 sm:px-3 sm:py-2
          ${isExpanded ? 'min-w-[120px]' : 'w-10 h-10 sm:w-12 sm:h-12 justify-center'}
          shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]
          transition-all duration-200
          hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,0.3)]
          cursor-help
          relative
        `}
      >
        <div className={`
          w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-[3px] bg-slate-700 text-white shrink-0 shadow-inner
          ${!isExpanded && hasNew ? 'animate-pulse ring-2 ring-emerald-500' : ''}
        `} style={!isExpanded ? { backgroundColor: eraDef.color } : {}}>
          <Target size={14} strokeWidth={2.5} />
          {!isExpanded && hasNew && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse z-10" />
          )}
        </div>

        {isExpanded && (
          <div className="flex flex-col items-start leading-none gap-0.5 pr-2 animate-in fade-in slide-in-from-left-1 duration-200">
            <span className="text-[7px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-wider">Evolution</span>
            <span className="text-xs sm:text-sm font-['Rajdhani'] font-bold text-white tracking-wide truncate max-w-[100px]">{eraDef.name.replace('Era ', 'E')}</span>
          </div>
        )}

        {nextDef && isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-950/50 rounded-b-[2px] overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: eraDef.color }}
            />
            {nextDef.milestones?.map((m: any, i: number) => (
              <div
                key={m.id}
                className={`absolute top-0 bottom-0 w-0.5 z-10 ${progress >= ((i + 1) / (nextDef.milestones!.length + 1)) * 100 ? 'bg-white/40' : 'bg-black/40'}`}
                style={{ left: `${((i + 1) / (nextDef.milestones!.length + 1)) * 100}%` }}
              />
            ))}
          </div>
        )}

        {!isExpanded && nextDef && (
          <div className="absolute bottom-1 left-1.5 right-1.5 h-0.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: eraDef.color }}
            />
          </div>
        )}
      </button>

      {nextDef && isExpanded && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border-2 border-slate-700 p-3 shadow-2xl z-50 rounded pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Next: {nextDef.name}</h4>
              <p className="text-[8px] text-slate-400 italic leading-tight">{nextDef.description}</p>
            </div>
            <div className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-[8px] font-mono font-bold text-amber-400">
              {Math.floor(progress)}%
            </div>
          </div>

          <div className="space-y-2">
            <div className="space-y-1">
              <span className="text-[7px] text-slate-500 uppercase font-black tracking-widest">Core Requirements</span>
              {nextDef.unlockConditions.minColonists && (
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-slate-400">Population:</span>
                  <span className={state.agents.filter(a => a.type !== 'ILLEGAL_MINER').length >= nextDef.unlockConditions.minColonists ? 'text-emerald-400' : 'text-slate-500'}>
                    {state.agents.filter(a => a.type !== 'ILLEGAL_MINER').length}/{nextDef.unlockConditions.minColonists}
                  </span>
                </div>
              )}
              {nextDef.unlockConditions.minAgt && (
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-slate-400">Capital:</span>
                  <span className={state.resources.agt >= nextDef.unlockConditions.minAgt ? 'text-emerald-400' : 'text-slate-500'}>
                    {Math.floor(state.resources.agt).toLocaleString()}/{nextDef.unlockConditions.minAgt.toLocaleString()}
                  </span>
                </div>
              )}
              {nextDef.unlockConditions.minEco && (
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-slate-400">Eco Score:</span>
                  <span className={state.resources.eco >= nextDef.unlockConditions.minEco ? 'text-emerald-400' : 'text-slate-500'}>
                    {Math.floor(state.resources.eco)}/{nextDef.unlockConditions.minEco}
                  </span>
                </div>
              )}
              {nextDef.unlockConditions.minTrust && (
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-slate-400">Trust:</span>
                  <span className={state.resources.trust >= nextDef.unlockConditions.minTrust ? 'text-emerald-400' : 'text-slate-500'}>
                    {Math.floor(state.resources.trust)}/{nextDef.unlockConditions.minTrust}
                  </span>
                </div>
              )}
            </div>

            {nextDef.milestones && nextDef.milestones.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-slate-800">
                <span className="text-[7px] text-slate-500 uppercase font-black tracking-widest">Era Markers</span>
                {nextDef.milestones.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <div className={`w-1 h-1 rounded-full ${progress >= 100 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                    <span className="text-[9px] text-slate-400 flex-1">{m.name}</span>
                    <div className="w-8 h-1 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-700" style={{ width: `${Math.min(100, progress)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const HUD: React.FC<HUDProps> = React.memo(({ resources, financials, population, currentEra, state, activeBlock, onToggleBlock }) => {
  const toggleBlock = (id: string, isOpen: boolean) => {
    onToggleBlock(isOpen ? id : null);
  };

  return (
    <div className="absolute top-0 left-0 right-0 p-2 sm:p-3 pt-3 sm:pt-4 z-10 flex flex-wrap gap-2 sm:gap-3 pointer-events-none items-start justify-start sm:justify-center px-3 sm:px-4">
      <EraBlock
        currentEra={currentEra}
        state={state}
        isExpanded={activeBlock === 'era'}
        onToggle={(open) => toggleBlock('era', open)}
      />
      <ResourceBlock
        icon={Coins}
        val={resources.agt}
        label="AGT"
        borderClass="border-amber-600/80"
        iconBgClass="bg-amber-500"
        sub={financials.net}
        isExpanded={activeBlock === 'agt'}
        onToggle={(open: boolean) => toggleBlock('agt', open)}
      />
      <ResourceBlock
        icon={Pickaxe}
        val={resources.minerals}
        label="Minerals"
        borderClass="border-slate-500/80"
        iconBgClass="bg-slate-400"
        isExpanded={activeBlock === 'minerals'}
        onToggle={(open: boolean) => toggleBlock('minerals', open)}
      />
      <ResourceBlock
        icon={Leaf}
        val={resources.eco}
        label="Eco"
        borderClass="border-emerald-600/80"
        iconBgClass="bg-emerald-500"
        isExpanded={activeBlock === 'eco'}
        onToggle={(open: boolean) => toggleBlock('eco', open)}
      />
      <ResourceBlock
        icon={Heart}
        val={resources.trust}
        label="Trust"
        borderClass="border-rose-600/80"
        iconBgClass="bg-rose-500"
        isExpanded={activeBlock === 'trust'}
        onToggle={(open: boolean) => toggleBlock('trust', open)}
      />
      <ResourceBlock
        icon={Users}
        val={population}
        label="Pop"
        borderClass="border-blue-600/80"
        iconBgClass="bg-blue-500"
        isExpanded={activeBlock === 'pop'}
        onToggle={(open: boolean) => toggleBlock('pop', open)}
      />
      <ResourceBlock
        icon={Trees}
        val={resources.wood}
        label="Wood"
        borderClass="border-amber-700/80"
        iconBgClass="bg-amber-900"
        isExpanded={activeBlock === 'wood'}
        onToggle={(open: boolean) => toggleBlock('wood', open)}
      />
      <ResourceBlock
        icon={Database}
        val={resources.stone}
        label="Stone"
        borderClass="border-slate-400/80"
        iconBgClass="bg-slate-600"
        isExpanded={activeBlock === 'stone'}
        onToggle={(open: boolean) => toggleBlock('stone', open)}
      />
      <ResourceBlock
        icon={Gem}
        val={resources.gems}
        label="Thundergems"
        borderClass="border-purple-600/80"
        iconBgClass="bg-purple-500"
        textColor="text-purple-300"
        isExpanded={activeBlock === 'gems'}
        onToggle={(open: boolean) => toggleBlock('gems', open)}
      />
      <ResourceBlock
        icon={Truck}
        val={state.factory?.throughput || 0}
        label="Flow"
        borderClass="border-cyan-600/80"
        iconBgClass="bg-cyan-500"
        textColor="text-cyan-200"
        meta={`${state.factory?.stalledNodes || 0} stalled`}
        isExpanded={activeBlock === 'flow'}
        onToggle={(open: boolean) => toggleBlock('flow', open)}
      />
      <ResourceBlock
        icon={Package}
        val={state.factory?.backlog || 0}
        label="Backlog"
        borderClass="border-orange-600/80"
        iconBgClass="bg-orange-500"
        textColor="text-orange-200"
        meta="queued cargo"
        isExpanded={activeBlock === 'backlog'}
        onToggle={(open: boolean) => toggleBlock('backlog', open)}
      />
    </div>
  );
});
