
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { Gem, AlertTriangle, RefreshCw, Lock, ArrowRight, Radio, XCircle, CheckCircle2, ArrowUp, ChevronDown, ChevronUp, Leaf, Hammer, X, Zap, Droplets, Trash2, Info } from 'lucide-react';
import { GameStep, Action, GameState, BuildingType, Chunk, Agent } from '../types';
import { BUILDINGS } from '../engine/data/VoxelConstants';

interface TutorialOverlayProps {
    step: GameStep;
    dispatch: React.Dispatch<Action>;
    setSidebarOpen: (mode: 'NONE' | 'OPS' | 'SHOP') => void;
    playSfx: (type: any) => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ step, dispatch, setSidebarOpen, playSfx }) => {
    // Start collapsed for cleaner HUD (except INTRO which should be visible)
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [hasNew, setHasNew] = useState(false);
    const prevStepRef = useRef(step);

    useEffect(() => {
        if (isCollapsed && step !== prevStepRef.current) {
            setHasNew(true);
        }
        prevStepRef.current = step;
    }, [step, isCollapsed]);

    if (step === GameStep.PLAYING || step === GameStep.GAME_OVER) return null;

    const content = {
        [GameStep.INTRO]: {
            title: "DIRECTIVE: ESTABLISH COLONY",
            subtitle: "Mission Briefing",
            text: "Director, operational status confirmed. Objective: Harmonize industry with the ecosystem. Establish a sustainable foothold on this frontier.",
            buttonText: "INITIATE PROTOCOLS",
            action: () => dispatch({ type: 'ADVANCE_TUTORIAL' })
        },
        [GameStep.TUTORIAL_NAV]: {
            title: "SYSTEM: NAVIGATION",
            subtitle: "Situational Awareness",
            text: "Master your view of the terminal. Use Mouse to Pan, Scroll to Zoom, and Right-Click to Rotate. On mobile, use standard touch gestures.",
            tasks: ["Observe the environment", "Locate starting agents"],
            buttonText: "CONFIRM CONTROLS",
            action: () => dispatch({ type: 'ADVANCE_TUTORIAL' })
        },
        [GameStep.TUTORIAL_MINE]: {
            title: "PHASE 1: PRODUCTION",
            subtitle: "Resource Extraction",
            text: "Gathering resources is vital. Your Miners will automatically seek out Gold Veins and Rock outcrops. Ensure they have clear paths.",
            tasks: ["Watch Miners gather Gold", "Identify Mineral deposits"],
            buttonText: "PROCEED",
            action: () => dispatch({ type: 'ADVANCE_TUTORIAL' })
        },
        [GameStep.TUTORIAL_SELL]: {
            title: "PHASE 2: REVENUE",
            subtitle: "Market Operations",
            text: "Minerals must be converted to AGT (Aureus Global Tender). Access the Operations Menu to liquidate your gathered stocks.",
            tasks: ["Open Operations", "Sell Minerals for AGT"],
            buttonText: "OPEN OPS",
            action: () => setSidebarOpen('OPS')
        },
        [GameStep.TUTORIAL_BUY]: {
            title: "PHASE 3: ACQUISITION",
            subtitle: "Supply Procurement",
            text: "Expansion requires infrastructure. Use the Supply Shop to purchase prefabricated modules like Staff Quarters and Wash Plants.",
            tasks: ["Open Supply Shop", "Purchase basic buildings"],
            buttonText: "OPEN SHOP",
            action: () => setSidebarOpen('SHOP')
        },
        [GameStep.TUTORIAL_PLACE]: {
            title: "PHASE 4: CONSTRUCTION",
            subtitle: "Structural Deployment",
            text: "Select items from your Inventory Dock (bottom of screen) to deploy them. Construction takes time, but ensures your colony's growth.",
            tasks: ["Select a building", "Place on valid terrain"],
            buttonText: "CONTINUE",
            action: () => dispatch({ type: 'ADVANCE_TUTORIAL' })
        },
        [GameStep.TUTORIAL_NEEDS]: {
            title: "PHASE 5: SUSTAINANCE",
            subtitle: "Colonist Welfare",
            text: "Workers have needs: Energy, Hunger, and Mood. Staff Quarters provide rest, while Canteens provide nutrition. Keep them happy!",
            tasks: ["Deploy Staff Quarters", "Deploy Canteen modules"],
            buttonText: "I UNDERSTAND",
            action: () => dispatch({ type: 'ADVANCE_TUTORIAL' })
        },
        [GameStep.TUTORIAL_POWER]: {
            title: "PHASE 6: NETWORKS",
            subtitle: "Utilities",
            text: "Advanced buildings require Power and Water. Deploy Solar Arrays for energy and Water Wells for hydration. Minimize deficit.",
            tasks: ["Monitor Power consumption", "Check Water availability"],
            buttonText: "MASTER UTILITIES",
            action: () => dispatch({ type: 'ADVANCE_TUTORIAL' })
        },
        [GameStep.TUTORIAL_RESEARCH]: {
            title: "PHASE 8: INNOVATION",
            subtitle: "Tech R&D",
            text: "Invest AGT into Research. Unlock advanced drilling, solar tech, and social reforms to solve complex colony problems.",
            tasks: ["Access Research panel", "Select a technology upgrade"],
            buttonText: "EVOLVE TECH",
            action: () => dispatch({ type: 'ADVANCE_TUTORIAL' })
        },
        [GameStep.TUTORIAL_ERA]: {
            title: "COMMAND: ASCENSION",
            subtitle: "Progression",
            text: "Achieve specific population and wealth milestones to ascend Eras. Each era unlocks superior technologies and global influence.",
            tasks: ["Check Era requirements", "Prepair for the Growth Era"],
            buttonText: "START MISSION",
            action: () => dispatch({ type: 'ADVANCE_TUTORIAL' })
        },
        [GameStep.DEMO]: {
            title: "SYSTEM: DEMO MODE",
            subtitle: "Automated Overview",
            text: "Demonstrating core functionality. Observe the automated deployment of infrastructure and production facilities. This sequence highlights the process of building and era progression.",
            tasks: ["Observe road & power placement", "Watch automated Wash Plant setup", "Witness Era ascension"],
            buttonText: "SKIP TO PLAY",
            action: () => dispatch({ type: 'ADVANCE_TUTORIAL' })
        }
    }[step];

    if (!content) return null;

    if (isCollapsed) {
        return (
            <div className="pointer-events-auto animate-in slide-in-from-left-8 duration-500">
                <button
                    onClick={() => { setIsCollapsed(false); setHasNew(false); playSfx('UI_CLICK'); }}
                    className="w-10 h-10 bg-slate-900 border-2 border-emerald-600 flex items-center justify-center hover:bg-slate-800 transition-colors shadow-lg group"
                >
                    <div className="w-6 h-6 bg-emerald-950 border border-emerald-500 flex items-center justify-center relative">
                        <Radio size={12} className="text-emerald-400 animate-pulse" />
                        {hasNew && (
                            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse z-10" />
                        )}
                    </div>
                </button>
            </div>
        );
    }

    return (
        <div className="pointer-events-auto w-56 sm:w-64 animate-in slide-in-from-left-8 duration-500 font-sans">
            <div className="bg-slate-900 border-2 border-emerald-600 rounded-[4px] shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] overflow-hidden relative group">

                <div
                    className="p-2 flex items-center justify-between cursor-pointer bg-slate-800 border-b-2 border-slate-700 hover:bg-slate-750 transition-colors"
                    onClick={() => {
                        setIsCollapsed(true);
                        setHasNew(false);
                        playSfx('UI_CLICK');
                    }}
                >
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-emerald-950 border border-emerald-500 flex items-center justify-center shrink-0">
                            <Radio size={12} className="text-emerald-400 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest leading-none mb-0.5">{content.subtitle}</h2>
                            <h1 className="font-black text-white leading-none font-['Rajdhani'] text-[12px] uppercase">{content.title}</h1>
                        </div>
                    </div>
                    <ChevronUp size={12} className="text-slate-500" />
                </div>

                <div className="p-3 bg-slate-900">
                    <p className="text-[10px] text-slate-300 leading-tight border-l-2 border-emerald-500/30 pl-2 mb-3 font-mono">
                        {content.text}
                    </p>

                    {content.tasks && (
                        <div className="space-y-1 bg-slate-950 border border-slate-800 p-2 mb-3">
                            {content.tasks.map((task, i) => (
                                <div key={i} className="flex items-center gap-2 text-[9px] text-slate-400 uppercase font-bold tracking-wide">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 shrink-0" />
                                    <span>{task}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        {content.buttonText && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    playSfx('UI_CLICK');
                                    if (content.action) content.action();
                                }}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black py-2 px-2 rounded-[2px] border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-1 uppercase tracking-wider font-['Rajdhani']"
                            >
                                {content.buttonText} <ArrowRight size={10} />
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                playSfx('UI_CLICK');
                                dispatch({ type: 'SKIP_TUTORIAL' });
                            }}
                            className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-[2px] border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all border-2 border-slate-700"
                        >
                            <XCircle size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const GameOverScreen: React.FC<{ step: GameStep; resources: GameState['resources']; dispatch: React.Dispatch<Action> }> = ({ step, resources, dispatch }) => {
    if (step !== GameStep.GAME_OVER) return null;
    return (
        <div className="absolute inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4 animate-in fade-in duration-1000 backdrop-blur-sm">
            <div className="bg-slate-900 border-2 border-rose-500 shadow-[8px_8px_0_0_rgba(225,29,72,0.3)] p-8 w-[90vw] max-w-sm text-center relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>
                <div className="w-16 h-16 bg-rose-950 border-2 border-rose-500 mx-auto mb-6 flex items-center justify-center">
                    <AlertTriangle size={32} className="text-rose-500 animate-pulse" />
                </div>

                <h2 className="text-3xl font-black text-white mb-2 font-['Rajdhani'] tracking-widest text-rose-500 uppercase">System Failure</h2>
                <p className="text-slate-400 mb-8 text-xs font-mono leading-relaxed border-t border-b border-rose-900/30 py-4">
                    Environmental toxicity limits exceeded. Colony viability dropped below 0%. Evacuation protocols initiated.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-950 p-3 border border-slate-800">
                        <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Final Wealth</div>
                        <div className="text-xl font-mono text-amber-500">{Math.floor(resources.agt).toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-950 p-3 border border-slate-800">
                        <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Trust Score</div>
                        <div className="text-xl font-mono text-blue-500">{Math.floor(resources.trust)}</div>
                    </div>
                </div>

                <button
                    onClick={() => dispatch({ type: 'RESET_GAME' })}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-4 px-4 border-b-[6px] border-rose-900 active:border-b-2 active:translate-y-1 transition-all flex items-center justify-center gap-3 uppercase tracking-widest font-['Rajdhani'] text-lg"
                >
                    <RefreshCw size={18} /> REBOOT SYSTEM
                </button>
            </div>
        </div>
    );
};

import { ChunkStore } from '../engine/space/ChunkStore';

export const ConstructionModal: React.FC<{
    selectedTile: { x: number, z: number } | null;
    chunks: Record<string, Chunk>;
    gems: number;
    dispatch: React.Dispatch<Action>;
    onClose: () => void;
    playSfx: (type: any) => void;
}> = ({ selectedTile, chunks, gems, dispatch, onClose, playSfx }) => {
    if (selectedTile === null) return null;
    const tile = ChunkStore.getTile(chunks, selectedTile.x, selectedTile.z);
    if (!tile) return null;

    // Position helper
    const containerClass = "absolute bottom-32 sm:bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in zoom-in-95 duration-200 w-56";
    const cardClass = "bg-slate-900 text-white p-0 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] border-2";

    if (tile.foliage === 'MINE_HOLE') {
        const isAlreadyJob = tile.rehabProgress !== undefined && tile.rehabProgress > 0;
        return (
            <div className={`${containerClass} pointer-events-auto`} onClick={(e) => e.stopPropagation()}>
                <div className={`${cardClass} border-emerald-500 rounded-[4px]`}>
                    <div className="bg-emerald-900/30 p-2 border-b-2 border-emerald-500/50 flex items-center justify-between">
                        <h3 className="font-black text-emerald-400 text-[10px] uppercase tracking-widest font-['Rajdhani']">Eco-Damage</h3>
                        <AlertTriangle size={12} className="text-emerald-500" />
                    </div>

                    <div className="p-3 text-center">
                        <p className="text-sm font-bold mb-3 text-white">Mine Shaft Hole</p>

                        {isAlreadyJob ? (
                            <div className="space-y-2">
                                <div className="relative h-2 bg-slate-950 w-full border border-slate-700 mb-1">
                                    <div className="absolute inset-y-0 left-0 bg-emerald-500 transition-all duration-300" style={{ width: `${tile.rehabProgress}%` }}></div>
                                </div>
                                <p className="text-[9px] text-slate-400 font-mono uppercase">Rehabilitation in progress...</p>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    dispatch({ type: 'REHABILITATE_TILE', payload: { x: selectedTile.x, z: selectedTile.z } });
                                    playSfx('UI_CLICK');
                                    onClose();
                                }}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-2 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all font-black text-[10px] flex items-center justify-center gap-1.5 uppercase tracking-wider"
                            >
                                <Leaf size={12} /> Rehab (100 AGT)
                            </button>
                        )}
                    </div>
                    <button onClick={onClose} className="w-full py-1 bg-slate-800 text-[9px] text-slate-500 hover:text-white uppercase font-bold tracking-widest hover:bg-slate-700 transition-colors">Dismiss</button>
                </div>
            </div>
        );
    }

    if (tile.isUnderConstruction) {
        const bDef = BUILDINGS[tile.buildingType as BuildingType];
        return (
            <div className={`${containerClass} pointer-events-auto`} onClick={(e) => e.stopPropagation()}>
                <div className={`${cardClass} border-amber-500 rounded-[4px]`}>
                    <div className="bg-amber-900/30 p-2 border-b-2 border-amber-500/50 flex items-center justify-between">
                        <h3 className="font-black text-amber-500 text-[10px] uppercase tracking-widest font-['Rajdhani']">Under Construction</h3>
                        <Hammer size={12} className="text-amber-500 animate-pulse" />
                    </div>

                    <div className="p-3 text-center">
                        <p className="text-xs font-bold mb-2 text-slate-300 uppercase">{bDef?.name || 'Building'}</p>

                        <div className="relative h-3 bg-slate-950 w-full border border-slate-700 mb-2">
                            {/* Dynamic Progress Bar */}
                            <div
                                className="absolute inset-y-0 left-0 bg-amber-500 h-full transition-all duration-300 overflow-hidden"
                                style={{ width: `${Math.max(0, 100 - ((tile.constructionTimeLeft || 0) / (bDef?.buildTime || 1) * 100))}%` }}
                            >
                                <div className="w-full h-full opacity-50 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#000_5px,#000_10px)]" />
                            </div>
                        </div>

                        <div className="text-xl font-mono text-white mb-3 font-bold">{Math.ceil(tile.constructionTimeLeft || 0)}s</div>

                        <button
                            onClick={() => {
                                if (gems >= 1) {
                                    dispatch({ type: 'SPEED_UP_BUILDING', payload: { x: selectedTile.x, z: selectedTile.z } });
                                    playSfx('CONSTRUCT_SPEEDUP');
                                    onClose();
                                } else {
                                    playSfx('ERROR');
                                }
                            }}
                            disabled={gems < 1}
                            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:border-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-2 px-2 border-b-4 border-purple-800 active:border-b-0 active:translate-y-1 transition-all font-black text-[10px] flex items-center justify-center gap-1.5 uppercase tracking-wider"
                        >
                            <Gem size={12} /> Rush (1 Gem)
                        </button>
                    </div>
                    <button onClick={onClose} className="w-full py-1 bg-slate-800 text-[9px] text-slate-500 hover:text-white uppercase font-bold tracking-widest hover:bg-slate-700 transition-colors">Hide</button>
                </div>
            </div>
        );
    }

    return null;
};


export const BuildingInspectorModal: React.FC<{
    selectedTile: { x: number, z: number } | null;
    chunks: Record<string, Chunk>;
    unlockedEras: GameState['unlockedEras'];
    resources: GameState['resources'];
    cheatsEnabled: boolean;
    dispatch: React.Dispatch<Action>;
    onClose: () => void;
    playSfx: (type: any) => void;
}> = ({ selectedTile, chunks, unlockedEras, resources, cheatsEnabled, dispatch, onClose, playSfx }) => {
    if (selectedTile === null) return null;
    const tile = ChunkStore.getTile(chunks, selectedTile.x, selectedTile.z);
    if (!tile) return null;

    // Only show if it's a building and NOT under construction (ConstructionModal handles that)
    if (tile.buildingType === BuildingType.EMPTY || tile.isUnderConstruction) return null;

    const def = BUILDINGS[tile.buildingType as BuildingType];
    if (!def) return null;

    // Resolve current stats based on level
    let currentDef: any = def;
    if (def.upgrades && (tile.level || 1) > 1) {
        const upgrade = def.upgrades.find(u => u.level === tile.level);
        if (upgrade) {
            currentDef = { ...def, ...upgrade };
        }
    }

    // Check for next upgrade
    const nextLevel = (tile.level || 1) + 1;
    const nextUpgrade = def.upgrades?.find(u => u.level === nextLevel);
    let canUpgrade = false;
    let upgradeLocked = false;
    let missingUpgradeResources: string[] = [];

    if (nextUpgrade) {
        const eraUnlocked = cheatsEnabled || unlockedEras.includes(nextUpgrade.era);
        if (!eraUnlocked) upgradeLocked = true;

        canUpgrade = true; // Assume true, check costs
        if (!cheatsEnabled && nextUpgrade.costs) {
            Object.entries(nextUpgrade.costs).forEach(([res, amt]) => {
                const resourceKey = res as keyof typeof resources;
                if (amt && (resources[resourceKey] as number) < amt) {
                    canUpgrade = false;
                    missingUpgradeResources.push(`${amt} ${res.toUpperCase()}`);
                }
            });
        }
        if (upgradeLocked) canUpgrade = false;
    }

    const containerClass = "absolute bottom-32 sm:bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in zoom-in-95 duration-200 w-64";
    const cardClass = "bg-slate-900 border-2 border-blue-500 rounded-[4px] shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] overflow-hidden";

    return (
        <div className={`${containerClass} pointer-events-auto`} onClick={(e) => e.stopPropagation()}>
            <div className={cardClass}>
                <div className="bg-blue-900/30 p-2 border-b-2 border-blue-500/50 flex items-center justify-between">
                    <h3 className="font-black text-blue-400 text-[10px] uppercase tracking-widest font-['Rajdhani']">System Inspector</h3>
                    {/* Level Indicator */}
                    <div className="flex items-center gap-1 bg-blue-950 border border-blue-700 px-1.5 rounded-[2px]">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-[9px] font-mono text-blue-200 font-bold">LVL {tile.level || 1}</span>
                    </div>
                </div>

                <div className="p-3">
                    <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-slate-800 border-2 border-slate-700 flex items-center justify-center shrink-0 relative">
                            <div className="text-blue-400 font-bold text-xs">{currentDef.name[0]}</div>
                            {(tile.level || 1) > 1 && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-900 flex items-center justify-center text-[9px] font-black border border-slate-900 rounded-full shadow-md z-10">
                                    {tile.level}
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white uppercase leading-none mb-1 font-['Rajdhani']">{currentDef.name}</h2>
                            <p className="text-[9px] text-slate-400 leading-tight font-mono uppercase">{currentDef.description || maxDesc(currentDef.desc)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-slate-950 p-1.5 border border-slate-800">
                            <div className="flex items-center gap-1 text-[8px] text-slate-500 uppercase font-bold mb-1">
                                <Zap size={8} /> Power
                            </div>
                            <div className="text-[10px] text-white font-mono">
                                {currentDef.power?.consumes ? `-${currentDef.power.consumes}` : currentDef.power?.produces ? `+${currentDef.power.produces}` : '0'} /s
                            </div>
                        </div>
                        <div className="bg-slate-950 p-1.5 border border-slate-800">
                            <div className="flex items-center gap-1 text-[8px] text-slate-500 uppercase font-bold mb-1">
                                <Droplets size={8} /> Water
                            </div>
                            <div className="text-[10px] text-white font-mono">
                                {currentDef.water?.consumes ? `-${currentDef.water.consumes}` : currentDef.water?.produces ? `+${currentDef.water.produces}` : '0'} /s
                            </div>
                        </div>
                        <div className="bg-slate-950 p-1.5 border border-slate-800">
                            <div className="flex items-center gap-1 text-[8px] text-slate-500 uppercase font-bold mb-1">
                                <Leaf size={8} /> Eco
                            </div>
                            <div className="text-[10px] text-white font-mono">
                                {(currentDef.pollution || 0) > 0 ? `-${currentDef.pollution}` : (currentDef.pollution || 0) < 0 ? `+${Math.abs(currentDef.pollution || 0)}` : '0'} /s
                            </div>
                        </div>
                        <div className="bg-slate-950 p-1.5 border border-slate-800">
                            <div className="flex items-center gap-1 text-[8px] text-slate-500 uppercase font-bold mb-1">
                                <RefreshCw size={8} /> Maint.
                            </div>
                            <div className="text-[10px] text-white font-mono">
                                {currentDef.maintenance || 0} AGT
                            </div>
                        </div>
                    </div>

                    {currentDef.production && (
                        <div className="bg-emerald-950/20 border border-emerald-900/50 p-2 mb-3 rounded-sm">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-emerald-500 font-bold uppercase tracking-widest">Yield</span>
                                <span className="text-white font-mono font-bold">+{currentDef.production} {currentDef.productionType}/s</span>
                            </div>
                        </div>
                    )}

                    {/* UPGRADE BUTTON */}
                    {nextUpgrade ? (
                        <button
                            onClick={() => {
                                if (canUpgrade) {
                                    dispatch({ type: 'UPGRADE_BUILDING', payload: { x: selectedTile.x, z: selectedTile.z } });
                                } else {
                                    playSfx('ERROR');
                                }
                            }}
                            disabled={!canUpgrade}
                            className={`w-full mb-3 py-2 px-2 border-b-4 active:border-b-0 active:translate-y-1 transition-all font-black text-[10px] flex flex-col items-center justify-center gap-0.5 uppercase tracking-wider relative group ${canUpgrade ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-800' : 'bg-slate-800 text-slate-500 border-slate-900 cursor-not-allowed'}`}
                        >
                            <div className="flex items-center gap-1">
                                <ArrowUp size={10} />
                                <span>Upgrade to LVL {nextLevel}</span>
                            </div>
                            {upgradeLocked && <span className="text-[8px] text-rose-500 font-bold">LOCKED: Requires {nextUpgrade.era} Era</span>}
                            {!upgradeLocked && !canUpgrade && missingUpgradeResources.length > 0 && (
                                <span className="text-[8px] text-rose-300 font-bold">Missing: {missingUpgradeResources.join(', ')}</span>
                            )}
                            <span className="text-[8px] opacity-70 font-mono mt-1">{nextUpgrade.statsDiff}</span>
                        </button>
                    ) : (
                        <div className="w-full mb-3 py-1.5 bg-slate-950 border border-slate-800 text-center">
                            <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Max Level Reached</span>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            dispatch({ type: 'BULLDOZE_TILE', payload: { x: selectedTile.x, z: selectedTile.z } });
                            playSfx('BULLDOZE');
                            onClose();
                        }}
                        className="w-full bg-rose-900/50 hover:bg-rose-600 text-rose-500 hover:text-white py-2 px-2 border-2 border-rose-900/50 hover:border-rose-400 transition-all font-black text-[10px] flex items-center justify-center gap-1.5 uppercase tracking-wider mb-2"
                    >
                        <Trash2 size={12} /> Decommission
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-[9px] text-slate-400 hover:text-white uppercase font-bold tracking-widest transition-colors border border-slate-700"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper to truncate desc
function maxDesc(str: string) {
    if (str.length > 50) return str.substring(0, 48) + '...';
    return str;
}
