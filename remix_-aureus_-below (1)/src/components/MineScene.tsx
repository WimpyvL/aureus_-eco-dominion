import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Pickaxe, Database, Users, ArrowLeft, Search, Lock } from 'lucide-react';
import { GameState, Tile } from '../types';

export const MineScene = ({ 
  state, 
  onMine, 
  onInteract, 
  onReturn 
}: { 
  state: GameState, 
  onMine: (tileId: string) => void,
  onInteract: (npcId: string) => void,
  onReturn: () => void
}) => {
  const currentMine = state.mines.find(m => m.id === state.activeMineId);
  const [swipeStart, setSwipeStart] = useState<{id: string, y: number} | null>(null);

  if (!currentMine) return null;

  const handlePointerDown = (e: React.PointerEvent, tileId: string) => {
    setSwipeStart({ id: tileId, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent, tileId: string) => {
    if (!swipeStart || swipeStart.id !== tileId) return;
    
    const diff = swipeStart.y - e.clientY; // Positive if swiped up
    if (diff > 30) { // Threshold for swipe
      onMine(tileId);
    }
    setSwipeStart(null);
  };

  const isProspecting = currentMine.status === 'PROSPECTING';

  return (
    <div className="flex-1 overflow-auto p-4 grid-pattern flex flex-col">
      <div className="mb-6 flex justify-between items-start">
        <button 
          onClick={onReturn}
          className="p-2 bg-white border-2 border-black rounded-xl shadow-sm active:scale-90 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-right">
          <h2 className="font-serif italic font-black text-xl leading-tight">{currentMine.name}</h2>
          <p className="text-[10px] font-mono uppercase tracking-widest opacity-50">
            {currentMine.location} • {currentMine.status}
          </p>
        </div>
      </div>

      {isProspecting && (
        <div className="mb-4 bg-blue-50 border-2 border-blue-200 p-3 rounded-xl flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-800">
            <Search size={16} />
            <span className="text-xs font-black uppercase tracking-wider">Prospecting Mode</span>
          </div>
          <div className="text-xs font-mono font-bold">
            Samples: {currentMine.prospectingCount}/10
          </div>
        </div>
      )}

      <div 
        className="grid gap-1 mx-auto w-full select-none touch-none"
        style={{ 
          gridTemplateColumns: `repeat(${currentMine.gridWidth}, 1fr)`,
          maxWidth: `${currentMine.gridWidth * 50}px`
        }}
      >
        {currentMine.grid.map((tile) => (
          <motion.div
            key={tile.id}
            onPointerDown={(e) => !tile.mined && !tile.revealed && handlePointerDown(e, tile.id)}
            onPointerUp={(e) => !tile.mined && !tile.revealed && handlePointerUp(e, tile.id)}
            className={`aspect-square rounded-sm border flex items-center justify-center transition-colors relative overflow-hidden
              ${tile.mined ? 'bg-black/5 border-black/5' : 
                tile.revealed ? 'bg-amber-100 border-amber-200' :
                'bg-stone-700 border-stone-800 shadow-inner'}
            `}
          >
            {tile.revealed ? (
              tile.type === 'ORE' ? (
                <div className="flex flex-col items-center animate-pulse">
                  <Database size={16} className="text-amber-600" />
                  <span className="text-[8px] font-black text-amber-800">GOLD</span>
                </div>
              ) : tile.type === 'ROCK' ? (
                <div className="w-full h-full bg-stone-500 opacity-50" />
              ) : (
                <span className="text-[8px] opacity-30">DIRT</span>
              )
            ) : tile.mined ? (
              <div className="opacity-10">
                <div className="w-2 h-2 rounded-full bg-black" />
              </div>
            ) : (
              <div className="flex flex-col items-center opacity-30 pointer-events-none">
                <Pickaxe size={12} className="mb-1" />
                <span className="text-[6px] uppercase tracking-widest">Swipe Up</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {currentMine.hasLocals && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => currentMine.chiefId && onInteract(currentMine.chiefId)}
            className="w-full p-4 bg-amber-50 border-2 border-black rounded-2xl flex items-center gap-4 shadow-md hover:bg-amber-100 active:scale-95 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-white border border-black/10 flex items-center justify-center">
              <Users size={24} className="text-amber-600" />
            </div>
            <div className="text-left">
              <h4 className="font-black text-sm uppercase tracking-tight">Talk to Local Chief</h4>
              <p className="text-[10px] opacity-60">"This land has been ours since the first dust fell."</p>
            </div>
          </motion.button>
        )}

        <div className="p-4 border border-dashed border-black/20 rounded-lg bg-white/30 text-center">
          <p className="text-xs font-mono opacity-50 uppercase tracking-widest">
            {currentMine.id}: Active Claim
          </p>
        </div>
      </div>
    </div>
  );
};
