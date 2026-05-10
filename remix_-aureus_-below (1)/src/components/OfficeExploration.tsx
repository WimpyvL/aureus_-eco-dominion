import React from 'react';
import { motion } from 'motion/react';
import { Search, BookOpen, Trash2, Map, Box } from 'lucide-react';
import { GameState, OfficeItem } from '../types';
import { OFFICE_ITEMS, BUILDINGS } from '../data';

const ICON_MAP: Record<string, any> = {
  BookOpen,
  Trash2,
  Map,
  Box
};

export const OfficeExploration = ({
  state,
  onFoundItem,
  onTakePhoto,
  onComplete
}: {
  state: GameState,
  onFoundItem: (itemId: string) => void,
  onTakePhoto: (itemId: string) => void,
  onComplete: () => void
}) => {
  const building = state.activeBuildingId ? BUILDINGS[state.activeBuildingId] : null;
  const items = building?.explorationItems?.map(id => OFFICE_ITEMS[id]) || [];
  const [selectedItem, setSelectedItem] = React.useState<OfficeItem | null>(null);

  if (!building) return null;

  return (
    <div className="flex-1 flex flex-col bg-slate-100 relative overflow-hidden">
      {/* Office Header */}
      <div className="p-4 bg-white border-b-2 border-black flex justify-between items-center z-10">
        <div>
          <h2 className="font-serif italic font-black text-xl">{building.name}</h2>
          <p className="text-[10px] font-mono uppercase tracking-widest opacity-50">Exploration Phase</p>
        </div>
        <button 
          onClick={onComplete}
          className="bg-black text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 shadow-lg"
        >
          Go to Desk
        </button>
      </div>

      {/* Exploration Area */}
      <div className="flex-1 relative bg-slate-200 p-8">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="w-full h-full grid grid-cols-12 grid-rows-12 border border-black/20" />
        </div>

        {items.map(item => {
          const isFound = state.foundOfficeItemIds.includes(item.id);
          const Icon = ICON_MAP[item.icon] || Search;

          return (
            <motion.button
              key={item.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => setSelectedItem(item)}
              className={`absolute p-3 rounded-2xl border-2 border-black shadow-xl transition-all
                ${isFound ? 'bg-white text-slate-400 opacity-50' : 'bg-amber-400 text-black hover:bg-amber-300'}
              `}
              style={{ left: `${item.position.x}%`, top: `${item.position.y}%` }}
            >
              <Icon size={24} />
              {!isFound && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border border-white animate-pulse" />
              )}
            </motion.button>
          );
        })}

        {items.length === 0 && (
          <div className="h-full flex flex-center justify-center items-center text-center opacity-30">
            <p className="font-serif italic text-lg">Nothing of interest here...</p>
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border-4 border-black"
          >
            <div className="p-6 bg-slate-50 border-b-4 border-black flex items-center gap-4">
              <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center">
                {React.createElement(ICON_MAP[selectedItem.icon] || Search, { size: 24 })}
              </div>
              <div>
                <h3 className="font-black text-lg leading-none">{selectedItem.name}</h3>
                <p className="text-[10px] font-mono uppercase tracking-widest opacity-50 mt-1">{selectedItem.type}</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm font-medium leading-relaxed italic text-slate-700">
                "{selectedItem.description}"
              </p>
              
              <div className="flex flex-col gap-2 mt-6">
                {!state.foundOfficeItemIds.includes(selectedItem.id) ? (
                  <button 
                    onClick={() => {
                      onFoundItem(selectedItem.id);
                      setSelectedItem(null);
                    }}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl"
                  >
                    Collect Clue
                  </button>
                ) : (
                  <button 
                    disabled
                    className="w-full bg-slate-200 text-slate-600 py-4 rounded-2xl font-black uppercase tracking-widest text-xs opacity-50 cursor-not-allowed"
                  >
                    Already Collected
                  </button>
                )}

                {/* Take Photo Button */}
                <button 
                  onClick={() => {
                    onTakePhoto(selectedItem.id);
                    setSelectedItem(null);
                  }}
                  disabled={state.dirtItems.some(d => d.id === `photo-${selectedItem.id}`)}
                  className="w-full bg-white border-2 border-black text-black py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Box size={16} />
                  {state.dirtItems.some(d => d.id === `photo-${selectedItem.id}`) ? 'Photo Taken' : 'Take Photo (2 Energy)'}
                </button>
              </div>

              <button 
                onClick={() => setSelectedItem(null)}
                className="w-full mt-2 py-2 text-[10px] font-black uppercase tracking-widest opacity-30 hover:opacity-100"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
