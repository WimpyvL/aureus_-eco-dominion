import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, Database, Megaphone, Users, Pickaxe, MapPin, Clock, Zap, ArrowLeft, TreePine, Landmark, Home, Factory, Target, CheckCircle2 } from 'lucide-react';
import { GameState, WorldPosition, Mine } from '../types';
import { BUILDINGS } from '../data';

export const WorldScene = ({ 
  state, 
  onMove, 
  onInteract,
  onEnterHome,
  onEnterMine,
  onRecenter,
  onTravel
}: { 
  state: GameState, 
  onMove: (pos: WorldPosition) => void,
  onInteract: (npcId: string, buildingId: string) => void,
  onEnterHome: () => void,
  onEnterMine: () => void,
  onRecenter: () => void,
  onTravel: (mineId: string) => void
}) => {
  const [showTravelMenu, setShowTravelMenu] = React.useState(false);
  const GRID_SIZE = 32;
  const TILE_WIDTH = 60;
  const TILE_HEIGHT = 30;

  const toIso = (x: number, y: number) => ({
    x: (x - y) * (TILE_WIDTH / 2),
    y: (x + y) * (TILE_HEIGHT / 2)
  });

  const handleTileClick = (e: React.MouseEvent, x: number, y: number) => {
    e.stopPropagation();
    onMove({ x, y });
  };

  const isNight = state.time >= 20 || state.time < 6;
  const playerIso = toIso(state.playerPos.x, state.playerPos.y);
  const cullingRange = Math.ceil(10 / state.camera.zoom);

  return (
    <div className={`flex-1 relative overflow-hidden transition-colors duration-1000 ${isNight ? 'bg-slate-950' : 'bg-slate-200'} grid-pattern cursor-crosshair`}>
      <motion.div 
        className="absolute left-1/2 top-1/2"
        animate={{ 
          x: state.camera.x,
          y: state.camera.y,
          scale: state.camera.zoom
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Grid - Render only visible tiles for performance */}
        {Array.from({ length: GRID_SIZE }).map((_, x) => (
          Array.from({ length: GRID_SIZE }).map((_, y) => {
            // Dynamic culling
            if (Math.abs(x - state.playerPos.x) > cullingRange || Math.abs(y - state.playerPos.y) > cullingRange) return null;
            
            const pos = toIso(x, y);
            const isTarget = state.targetPos?.x === x && state.targetPos?.y === y;
            
            return (
              <div
                key={`${x}-${y}`}
                onClick={(e) => handleTileClick(e, x, y)}
                className={`absolute transition-all duration-300 ${isNight ? 'hover:bg-white/10' : 'hover:bg-black/10'} ${isTarget ? 'bg-amber-400/50' : 'bg-emerald-600'} border-t-2 border-l-2 border-emerald-500 shadow-lg`}
                style={{
                  width: TILE_WIDTH,
                  height: TILE_HEIGHT,
                  left: pos.x,
                  top: pos.y,
                  transform: 'skewX(-20deg) scaleY(0.8)',
                  transformOrigin: 'center'
                }}
              >
                <div className="absolute inset-0 bg-black/20" />
                {isTarget && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-full h-full border-4 border-amber-400"
                  />
                )}
              </div>
            );
          })
        ))}

        {/* Buildings */}
        {Object.values(BUILDINGS).map((b) => {
          if (!b.isDiscovered) return null;
          
          const pos = toIso(b.pos.x, b.pos.y);
          const isNear = Math.abs(state.playerPos.x - b.pos.x) <= 1 && Math.abs(state.playerPos.y - b.pos.y) <= 1;
          const npc = b.npcId !== 'none' ? state.npcs[b.npcId] : null;
          
          // Check availability
          let isClosed = false;
          if (npc) {
            const { start, end } = npc.workHours;
            if (start < end) {
              isClosed = state.time < start || state.time >= end;
            } else {
              // Overnight shift (e.g., 18 to 4)
              isClosed = state.time < start && state.time >= end;
            }
          }

          return (
            <motion.div
              key={b.id}
              initial={false}
              animate={{ scale: isNear ? 1.1 : 1 }}
              className="absolute z-10 pointer-events-none"
              style={{ left: pos.x + TILE_WIDTH/2, top: pos.y }}
            >
              <div className="relative -translate-x-1/2 -translate-y-full flex flex-col items-center">
                <div 
                  className={`w-12 h-16 border-2 border-black shadow-lg rounded-t-lg flex items-center justify-center pointer-events-auto cursor-pointer transition-colors
                    ${isNear ? 'ring-4 ring-amber-400' : ''}
                    ${isNight ? 'bg-slate-800 text-amber-200' : 'bg-white text-black'}
                    ${isClosed ? 'grayscale opacity-80' : ''}
                  `}
                  onClick={() => {
                    if (!isNear) return;
                    if (b.id === 'player_home') onEnterHome();
                    else if (b.id === 'mine_entrance') setShowTravelMenu(true);
                    else onInteract(b.npcId, b.id);
                  }}
                >
                  {b.type === 'OFFICE' && <Briefcase size={20} />}
                  {b.type === 'PUB' && <Database size={20} />}
                  {b.type === 'HOTLINE' && <Megaphone size={20} />}
                  {b.type === 'HOME' && <Users size={20} />}
                  {b.type === 'MINE_ENTRANCE' && <Pickaxe size={20} />}
                  {b.type === 'PARK' && <TreePine size={20} />}
                  {b.type === 'LANDMARK' && <Landmark size={20} />}
                  {b.type === 'RESIDENTIAL' && <Home size={20} />}
                  {b.type === 'INDUSTRIAL' && <Factory size={20} />}
                  
                  {isClosed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-t-lg">
                      <Clock size={16} className="text-white" />
                    </div>
                  )}
                </div>
                <div className={`text-[8px] px-1 py-0.5 mt-1 uppercase font-black whitespace-nowrap border border-black ${isNight ? 'bg-amber-400 text-black' : 'bg-black text-white'}`}>
                  {b.name}
                </div>
                {isClosed && (
                  <div className="text-[6px] font-mono uppercase bg-red-600 text-white px-1 mt-0.5">Closed</div>
                )}
                {isNear && !isClosed && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-10 bg-amber-400 text-black font-black text-[10px] px-2 py-1 rounded shadow-lg animate-bounce"
                  >
                    TAP TO ENTER
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Player */}
        <motion.div
          className="absolute z-20 pointer-events-none"
          animate={{ 
            left: playerIso.x + TILE_WIDTH/2,
            top: playerIso.y
          }}
          transition={{ type: 'tween', ease: 'linear', duration: 0.2 }}
        >
          <div className="relative -translate-x-1/2 -translate-y-full">
            <div className="w-6 h-10 bg-red-600 border-2 border-black rounded-full shadow-xl" />
            <div className="w-4 h-4 bg-white border-2 border-black rounded-full absolute -top-2 left-1" />
          </div>
        </motion.div>
      </motion.div>

      {/* Tutorial Hint Arrow */}
      {state.tutorialStep === 0 && (
        <div className="absolute top-1/2 right-10 -translate-y-1/2 animate-pulse pointer-events-none z-50">
          <div className="flex items-center gap-2">
            <span className="text-white font-black uppercase tracking-widest text-xs bg-blue-600 px-2 py-1 rounded-md shadow-lg">Bureau This Way</span>
            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[15px] border-l-blue-600 border-b-[10px] border-b-transparent" />
          </div>
        </div>
      )}

      {/* Night Overlay */}
      {isNight && (
        <div className="absolute inset-0 bg-blue-900/20 pointer-events-none z-30 mix-blend-multiply" />
      )}

      <div className={`absolute bottom-4 left-4 right-4 backdrop-blur-md p-3 border border-black/10 rounded-xl shadow-lg transition-colors ${isNight ? 'bg-slate-900/80 text-white' : 'bg-white/80 text-black'}`}>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <p className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-1 flex items-center gap-1">
              <Target size={10} /> Active Objectives
            </p>
            <div className="space-y-1 max-h-20 overflow-y-auto pr-2 custom-scrollbar">
              {state.objectives.filter(o => !o.isCompleted).map(obj => (
                <div key={obj.id} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0" />
                  <p className="text-[10px] font-bold leading-tight">{obj.text}</p>
                </div>
              ))}
              {state.objectives.filter(o => !o.isCompleted).length === 0 && (
                <p className="text-[10px] opacity-50 italic">No active objectives. Explore the town.</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onRecenter();
              }}
              className="bg-black text-white p-2 rounded-full active:scale-95 transition-all flex items-center justify-center shadow-lg"
              title="Recenter"
            >
              <MapPin size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Travel Menu Overlay */}
      <AnimatePresence>
        {showTravelMenu && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowTravelMenu(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border-2 border-black"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-black text-white p-4 flex justify-between items-center">
                <h3 className="font-serif italic font-black text-xl">Transit Hub</h3>
                <button onClick={() => setShowTravelMenu(false)} className="opacity-50 hover:opacity-100">
                  <Pickaxe size={20} />
                </button>
              </div>
              
              <div className="p-4 space-y-3">
                <p className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">Available Destinations</p>
                {state.mines.map(mine => {
                  const hasProspecting = state.permits['prospecting-license'].status === 'APPROVED';
                  const energyCost = mine.travelTime * 5;
                  
                  return (
                    <button
                      key={mine.id}
                      disabled={!hasProspecting}
                      onClick={() => {
                        onTravel(mine.id);
                        setShowTravelMenu(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl border-2 border-black flex items-center gap-4 transition-all
                        ${hasProspecting ? 'hover:bg-slate-50 active:scale-95' : 'opacity-50 grayscale cursor-not-allowed'}
                      `}
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center border border-black/10">
                        <MapPin size={20} className="text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm">{mine.name}</h4>
                        <div className="flex gap-3 mt-1">
                          <div className="flex items-center gap-1 text-[8px] font-mono uppercase opacity-60">
                            <Clock size={10} /> {mine.travelTime}h
                          </div>
                          <div className="flex items-center gap-1 text-[8px] font-mono uppercase opacity-60">
                            <Zap size={10} /> {energyCost} Energy
                          </div>
                        </div>
                      </div>
                      {!hasProspecting && (
                        <div className="text-[8px] font-black uppercase text-red-600 border border-red-600 px-1">Locked</div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              <div className="bg-slate-50 p-3 border-t border-black/5">
                <p className="text-[9px] text-center opacity-50 italic">
                  "The wastes are unforgiving. Ensure you have the proper stamps."
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
