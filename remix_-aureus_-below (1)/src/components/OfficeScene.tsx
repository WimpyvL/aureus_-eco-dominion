import React from 'react';
import { GameState } from '../types';
import { ChevronRight, Stamp, MapPin, Building2, User } from 'lucide-react';
import { OfficeExploration } from './OfficeExploration';
import { BUILDINGS } from '../data';

export const OfficeScene = ({ 
  state, 
  onSelectNPC, 
  onSelectPermit,
  onFoundItem,
  onTakePhoto,
  onExplorationComplete,
  onTravelTo,
  onBackToDirectory
}: { 
  state: GameState, 
  onSelectNPC: (id: string) => void,
  onSelectPermit: (id: string) => void,
  onFoundItem: (id: string) => void,
  onTakePhoto: (id: string) => void,
  onExplorationComplete: () => void,
  onTravelTo: (buildingId: string) => void,
  onBackToDirectory: () => void
}) => {
  // If we are in a specific building, show that building's view
  if (state.activeBuildingId) {
    const building = BUILDINGS[state.activeBuildingId];
    
    // If exploration is active, show exploration view
    if (state.explorationActive) {
      return (
        <OfficeExploration 
          state={state} 
          onFoundItem={onFoundItem} 
          onTakePhoto={onTakePhoto}
          onComplete={onExplorationComplete} 
        />
      );
    }

    // Otherwise show Building Dashboard (NPCs, Actions)
    return (
      <div className="flex-1 overflow-auto p-4 flex flex-col gap-6 bg-slate-50">
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={onBackToDirectory}
            className="text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-100 flex items-center gap-1"
          >
            ← Directory
          </button>
          <div className="text-[10px] font-mono uppercase opacity-30">
            {building.name}
          </div>
        </div>

        <section>
          <h2 className="text-[10px] uppercase tracking-[0.2em] font-black mb-3 opacity-40">Personnel</h2>
          {building.npcId !== 'none' && state.npcs[building.npcId] ? (
            <button 
              onClick={() => onSelectNPC(building.npcId)}
              className={`w-full flex items-center gap-3 p-3 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all text-left group relative overflow-hidden
                ${(state.tutorialStep === 2 || state.tutorialStep === 6) && building.npcId === 'licensing' ? 'border-blue-500 ring-4 ring-blue-500/20 z-10' : 'border-black/5'}
              `}
            >
              {(state.tutorialStep === 2 || state.tutorialStep === 6) && building.npcId === 'licensing' && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 animate-bounce font-black text-xs uppercase tracking-widest">
                  Talk to Him!
                </div>
              )}
              <div className="relative">
                <img src={state.npcs[building.npcId].avatar} alt={state.npcs[building.npcId].name} className="w-10 h-10 rounded-full bg-slate-100" referrerPolicy="no-referrer" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full border border-black/10 flex items-center justify-center text-[8px] font-bold">
                  {state.npcs[building.npcId].trustLevel}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm leading-tight">{state.npcs[building.npcId].name}</h3>
                <p className="text-[10px] font-mono opacity-50 uppercase tracking-wider">{state.npcs[building.npcId].role}</p>
              </div>
              <ChevronRight size={14} className="opacity-20 group-hover:opacity-100 transition-opacity" />
            </button>
          ) : (
            <div className="p-4 text-center opacity-30 text-xs italic">No personnel available.</div>
          )}
        </section>

        {/* Only show filings if in Licensing Office */}
        {state.activeBuildingId === 'licensing_office' && (
          <section>
            <h2 className="text-[10px] uppercase tracking-[0.2em] font-black mb-3 opacity-40">Active Filings</h2>
            <div className="grid grid-cols-1 gap-2">
              {Object.values(state.permits).filter(p => p.status !== 'LOCKED').map(permit => (
                <button 
                  key={permit.id}
                  onClick={() => onSelectPermit(permit.id)}
                  className={`flex items-center gap-3 p-3 border rounded-xl shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden
                    ${permit.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-black/5'}
                    ${state.tutorialStep === 3 && permit.id === 'extraction-intent' ? 'border-blue-500 ring-4 ring-blue-500/20 z-10' : ''}
                  `}
                >
                  {state.tutorialStep === 3 && permit.id === 'extraction-intent' && (
                    <div className="absolute right-12 top-1/2 -translate-y-1/2 text-blue-600 animate-bounce font-black text-xs uppercase tracking-widest">
                      Open This
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                    ${permit.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}
                  `}>
                    <Stamp size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm leading-tight">{permit.name}</h3>
                    <p className="text-[10px] font-mono opacity-50 uppercase tracking-wider">{permit.formNumber}</p>
                  </div>
                  <div className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest
                    ${permit.status === 'APPROVED' ? 'bg-emerald-600 text-white' : 
                      permit.status === 'PENDING' ? 'bg-amber-500 text-white animate-pulse' :
                      permit.status === 'REJECTED' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'}
                  `}>
                    {permit.status}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // Directory View (Default when no active building)
  const discoveredBuildings = Object.values(BUILDINGS).filter(b => b.isDiscovered);

  return (
    <div className="flex-1 overflow-auto p-4 flex flex-col gap-6 bg-slate-100">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black italic font-serif">Directory</h2>
        <div className="text-[10px] font-mono uppercase opacity-40">
          {discoveredBuildings.length} Locations Found
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {discoveredBuildings.map(building => (
          <div 
            key={building.id}
            className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{building.name}</h3>
                  <p className="text-[10px] font-mono uppercase opacity-50 tracking-wider">{building.type}</p>
                </div>
              </div>
              {building.npcId !== 'none' && state.npcs[building.npcId] && (
                 <div className="flex -space-x-2">
                   <img 
                    src={state.npcs[building.npcId].avatar} 
                    alt="NPC" 
                    className="w-6 h-6 rounded-full border-2 border-white bg-slate-200"
                    referrerPolicy="no-referrer"
                   />
                 </div>
              )}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => onTravelTo(building.id)}
                className="flex-1 bg-black text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
              >
                <MapPin size={12} /> Travel To
              </button>
            </div>
          </div>
        ))}

        {discoveredBuildings.length === 0 && (
          <div className="p-8 text-center opacity-40">
            <p className="text-xs italic">Explore the world to find locations.</p>
          </div>
        )}
      </div>
    </div>
  );
}
