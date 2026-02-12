/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Menu, Layers, Hammer, X, Activity, TrendingUp, Pickaxe, ArrowUp, ArrowDown } from 'lucide-react';
import { BuildingType, Action, GameStep } from '../types';
import { BUILDINGS } from '../engine/data/VoxelConstants';
import '../components/ViewSwitchButton.css';

interface ControlsProps {
    selectedBuilding: BuildingType | null;
    dispatch: React.Dispatch<Action>;
    setSidebarOpen: (mode: 'NONE' | 'OPS' | 'SHOP' | 'TRADE' | 'CREW' | 'TECH') => void;
    playSfx: (type: any) => void;
    step: GameStep;
    debugMode: boolean;
    interactionMode: 'BUILD' | 'BULLDOZE' | 'INSPECT' | 'TEST_DESTRUCT';
    dungeonUnlocked: boolean;
    activeView: 'SURFACE' | 'DUNGEON';
    onToggleView: () => void;
}

export const Controls: React.FC<ControlsProps> = React.memo(({
    selectedBuilding, dispatch, setSidebarOpen, playSfx, step,
    debugMode, interactionMode, dungeonUnlocked, activeView, onToggleView
}) => {
    // ... (keep existing render logic for selectedBuilding)
    if (selectedBuilding) {
        return (
            <div className="absolute bottom-20 sm:bottom-12 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 pointer-events-auto flex flex-col gap-2 max-w-sm mx-auto items-center">
                <div className="px-4 py-2.5 rounded-[4px] border-2 shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] font-bold flex items-center justify-center gap-2 text-xs bg-amber-500 text-amber-950 border-amber-800">
                    <Hammer size={16} className="animate-pulse" />
                    <span className="font-['Rajdhani'] uppercase tracking-wider">
                        {`Deploy: ${BUILDINGS[selectedBuilding!].name}`}
                    </span>
                </div>
                <button
                    onClick={() => {
                        dispatch({ type: 'SELECT_BUILDING_TO_PLACE', payload: null });
                        playSfx('UI_CLICK');
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-[4px] border-2 border-b-4 border-slate-950 font-bold text-xs flex items-center justify-center gap-2 active:border-b-2 active:translate-y-0.5 transition-all shadow-lg"
                >
                    <X size={16} /> CANCEL
                </button>
            </div>
        );
    }

    const highlightOps = step === GameStep.TUTORIAL_SELL;
    const highlightBuild = step === GameStep.TUTORIAL_MINE || step === GameStep.TUTORIAL_BUY;

    return (
        <div className="absolute bottom-16 sm:bottom-6 left-3 right-3 sm:left-6 sm:right-6 z-20 flex justify-between pointer-events-none gap-4">
            {/* Operations Button (Left) */}
            <button
                onClick={() => setSidebarOpen('OPS')}
                className={`
                pointer-events-auto 
                bg-slate-800 hover:bg-slate-750 text-white 
                h-14 px-5
                rounded-[6px] 
                border-2 border-b-[6px] border-slate-950 
                shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]
                flex items-center gap-3 transition-all 
                active:border-b-2 active:translate-y-[4px] active:shadow-none
                ${highlightOps ? 'animate-bounce border-emerald-400 z-50' : ''}
            `}
            >
                <Menu size={24} className="text-slate-300" />
                <span className="hidden sm:inline font-black text-sm uppercase tracking-widest font-['Rajdhani']">Ops</span>
            </button>

            {/* Center Group */}
            <div className="flex gap-3 pointer-events-auto items-end pb-1">
                <button
                    onClick={() => {
                        dispatch({ type: 'TOGGLE_DEBUG' });
                        playSfx('UI_CLICK');
                    }}
                    className={`
                    w-10 h-10 rounded-[4px] flex items-center justify-center transition-all
                    border-2 border-b-[4px] 
                    ${debugMode
                            ? 'bg-emerald-600 border-emerald-900 border-b-2 translate-y-[2px]'
                            : 'bg-slate-800 border-slate-950 hover:-translate-y-0.5'
                        }
                    `}
                >
                    <Activity size={18} className={debugMode ? 'text-white' : 'text-slate-400'} />
                </button>

                <button
                    onClick={() => {
                        setSidebarOpen('TRADE');
                        playSfx('UI_CLICK');
                    }}
                    className={`
                    w-12 h-12 rounded-[4px] flex items-center justify-center transition-all bg-slate-800 border-slate-950 hover:-translate-y-0.5
                    border-2 border-b-[4px]
                    `}
                >
                    <TrendingUp size={20} className="text-blue-400" />
                </button>

                {dungeonUnlocked && (
                    <button
                        onClick={onToggleView}
                        className={`view-switch-button ${activeView === 'DUNGEON' ? 'is-dungeon' : 'is-surface'} w-12 h-12 !p-0`}
                        title={activeView === 'DUNGEON' ? 'Return to Surface (U)' : 'Enter Dungeon (U)'}
                    >
                        {activeView === 'DUNGEON' ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                    </button>
                )}
            </div>

            {/* Build Button (Right) */}
            <button
                onClick={() => setSidebarOpen('SHOP')}
                className={`
                pointer-events-auto
                bg-emerald-600 hover:bg-emerald-500 text-white
                h-14 px-5
                rounded-[6px]
                border-2 border-b-[6px] border-emerald-900
                shadow-[4px_4px_0px_0px_rgba(0, 0, 0, 0.3)]
                flex items-center gap-3 transition-all
                active:border-b-2 active:translate-y-[4px] active:shadow-none
                ${highlightBuild ? 'highlight-pulse z-50 ring-4 ring-emerald-400' : ''}
                `}
            >
                <Hammer size={24} />
                <span className="hidden sm:inline font-black text-sm uppercase tracking-widest font-['Rajdhani']">Build</span>
            </button>
        </div>
    );
});
