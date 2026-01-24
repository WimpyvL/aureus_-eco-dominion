
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { Coins, Pickaxe, Leaf, Heart, Gem, Users, Target } from 'lucide-react';
import { GameState, Era } from '../types';
import { ERAS } from '../engine/data/VoxelConstants';

const ResourceBlock = React.memo(({ icon: Icon, val, label, borderClass, iconBgClass, sub, textColor = "text-white" }: any) => {
  const [popup, setPopup] = useState<{ id: number; text: string; isPositive: boolean } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const prevValRef = useRef(Math.floor(val));
  const counterRef = useRef(0);

  useEffect(() => {
    const currentInt = Math.floor(val);
    const diff = currentInt - prevValRef.current;

    // Only trigger popup on integer changes to save performance
    if (Math.abs(diff) >= 1) {
      const id = ++counterRef.current;
      const text = `${diff > 0 ? '+' : ''}${diff}`;
      setPopup({ id, text, isPositive: diff > 0 });

      // If collapsed, mark as having new items (only for positive changes)
      if (!isExpanded && diff > 0) {
        setHasNew(true);
      }

      const timer = setTimeout(() => {
        setPopup(current => current?.id === id ? null : current);
      }, 600);
      prevValRef.current = currentInt;
      return () => clearTimeout(timer);
    } else {
      // Just update ref without trigger
      prevValRef.current = currentInt;
    }
  }, [val, isExpanded]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
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
        onClick={toggleExpand}
        className={`
          flex items-center gap-1.5 sm:gap-2.5 
          bg-slate-900 
          border-2 ${borderClass} 
          rounded-[4px] px-2 py-1 sm:px-3 sm:py-2
          ${isExpanded ? 'min-w-[65px] sm:min-w-[80px]' : 'w-10 h-10 sm:w-12 sm:h-12 justify-center'}
          shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]
          transition-all duration-200
          hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,0.3)]
          relative
        `}
      >
        {/* New item indicator */}
        {!isExpanded && hasNew && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse z-10" />
        )}

        {/* Icon Block */}
        <div className={`
          w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-[3px] 
          ${iconBgClass} text-slate-900 border border-black/20 shadow-inner shrink-0
        `}>
          <Icon size={12} className="sm:hidden" strokeWidth={2.5} />
          <Icon size={16} className="hidden sm:block" strokeWidth={2.5} />
        </div>

        {/* Text Stack (Only visible when expanded) */}
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
}

const EraBlock = ({ currentEra, state }: { currentEra: Era; state: GameState }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const prevProgressRef = useRef(0);
  const eraDef = ERAS[currentEra];
  const eras = Object.values(Era);
  const nextEraIndex = eras.indexOf(currentEra) + 1;
  const nextEra = nextEraIndex < eras.length ? eras[nextEraIndex] : null;
  const nextDef = nextEra ? ERAS[nextEra] : null;

  // Calculate progress % for next era if applicable
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
      const count = state.grid.filter(t => t.buildingType !== 'EMPTY' && !t.isUnderConstruction).length;
      if (count >= c.minBuildings) metReqs++;
      progress += Math.min(1, count / c.minBuildings);
    }

    if (totalReqs > 0) progress = (progress / totalReqs) * 100;

    // Trigger "new" indicator if progress increased while collapsed
    if (!isExpanded && progress > prevProgressRef.current + 0.1) {
      setHasNew(true);
    }
    prevProgressRef.current = progress;
  }

  const handleToggle = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    if (nextState) {
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

        {/* Simple Progress Mini-Bar - Always visible at bottom if expanded */}
        {nextDef && isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-950/50 rounded-b-[2px] overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: eraDef.color }}
            />
          </div>
        )}

        {/* Progress ring or indicator for collapsed state */}
        {!isExpanded && nextDef && (
          <div className="absolute bottom-1 left-1.5 right-1.5 h-0.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: eraDef.color }}
            />
          </div>
        )}
      </button>

      {/* Requirements Tooltip */}
      {nextDef && isExpanded && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900 border-2 border-slate-700 p-2 shadow-2xl z-50 rounded pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
          <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Next: {nextDef.name}</h4>
          <p className="text-[8px] text-slate-400 mb-2 italic">{nextDef.description}</p>
          <div className="space-y-1">
            {nextDef.unlockConditions.minColonists && (
              <div className="flex justify-between items-center text-[9px] font-mono">
                <span className="text-slate-500">Colonists:</span>
                <span className={state.agents.filter(a => a.type !== 'ILLEGAL_MINER').length >= nextDef.unlockConditions.minColonists ? 'text-emerald-400' : 'text-rose-400'}>
                  {state.agents.filter(a => a.type !== 'ILLEGAL_MINER').length}/{nextDef.unlockConditions.minColonists}
                </span>
              </div>
            )}
            {nextDef.unlockConditions.minAgt && (
              <div className="flex justify-between items-center text-[9px] font-mono">
                <span className="text-slate-500">Capital:</span>
                <span className={state.resources.agt >= nextDef.unlockConditions.minAgt ? 'text-emerald-400' : 'text-rose-400'}>
                  {Math.floor(state.resources.agt)}/{nextDef.unlockConditions.minAgt}
                </span>
              </div>
            )}
            {nextDef.unlockConditions.minEco && (
              <div className="flex justify-between items-center text-[9px] font-mono">
                <span className="text-slate-500">Eco Score:</span>
                <span className={state.resources.eco >= nextDef.unlockConditions.minEco ? 'text-emerald-400' : 'text-rose-400'}>
                  {Math.floor(state.resources.eco)}/{nextDef.unlockConditions.minEco}
                </span>
              </div>
            )}
            {nextDef.unlockConditions.minTrust && (
              <div className="flex justify-between items-center text-[9px] font-mono">
                <span className="text-slate-500">Trust:</span>
                <span className={state.resources.trust >= nextDef.unlockConditions.minTrust ? 'text-emerald-400' : 'text-rose-400'}>
                  {Math.floor(state.resources.trust)}/{nextDef.unlockConditions.minTrust}
                </span>
              </div>
            )}
            {nextDef.unlockConditions.minBuildings && (
              <div className="flex justify-between items-center text-[9px] font-mono">
                <span className="text-slate-500">Units:</span>
                <span className={state.grid.filter(t => t.buildingType !== 'EMPTY' && !t.isUnderConstruction).length >= nextDef.unlockConditions.minBuildings ? 'text-emerald-400' : 'text-rose-400'}>
                  {state.grid.filter(t => t.buildingType !== 'EMPTY' && !t.isUnderConstruction).length}/{nextDef.unlockConditions.minBuildings}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const HUD: React.FC<HUDProps> = React.memo(({ resources, financials, population, currentEra, state }) => {
  return (
    <div className="absolute top-0 left-0 right-0 p-2 sm:p-3 pt-3 sm:pt-4 z-10 flex flex-wrap gap-2 sm:gap-3 pointer-events-none items-start justify-start sm:justify-center px-3 sm:px-4">
      <EraBlock currentEra={currentEra} state={state} />
      <ResourceBlock
        icon={Coins}
        val={resources.agt}
        label="AGT"
        borderClass="border-amber-600/80"
        iconBgClass="bg-amber-500"
        sub={financials.net}
      />
      <ResourceBlock
        icon={Pickaxe}
        val={resources.minerals}
        label="Ore"
        borderClass="border-slate-500/80"
        iconBgClass="bg-slate-400"
      />
      <ResourceBlock
        icon={Leaf}
        val={resources.eco}
        label="Eco"
        borderClass="border-emerald-600/80"
        iconBgClass="bg-emerald-500"
      />
      <ResourceBlock
        icon={Heart}
        val={resources.trust}
        label="Trust"
        borderClass="border-rose-600/80"
        iconBgClass="bg-rose-500"
      />
      <ResourceBlock
        icon={Users}
        val={population}
        label="Pop"
        borderClass="border-blue-600/80"
        iconBgClass="bg-blue-500"
      />
      <ResourceBlock
        icon={Gem}
        val={resources.gems}
        label="Gems"
        borderClass="border-purple-600/80"
        iconBgClass="bg-purple-500"
        textColor="text-purple-300"
      />
    </div>
  );
});
