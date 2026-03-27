import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAureusEngine } from './game/useAureusEngine';
import { useEngineState } from './game/useEngineState';
import { SfxType, BuildingType } from './types';
import { HUD } from './components/HUD';
import { Controls } from './components/Controls';
import { SupplySidebar } from './components/SupplySidebar';
import { OpsDrawer } from './components/OpsDrawer';
import { TradeTerminal } from './components/TradeTerminal';
import { InventoryHUD } from './components/InventoryHUD';
import { NewsTicker } from './components/NewsTicker';
import { GoalWidget } from './components/GoalWidget';
import {
    TutorialOverlay,
    ConstructionModal,
    BuildingInspectorModal,
    GameOverScreen
} from './components/Modals';
import { EraUnlockedModal } from './components/EraUnlockedModal';
import { HomePage } from './components/HomePage';
import { WorldMap } from './components/WorldMap';
import { Minimap } from './components/Minimap';
import { WeatherOverlay } from './components/WeatherOverlay';
import { DungeonHUD } from './components/DungeonHUD';
import { DialogueOverlay } from './components/DialogueOverlay';
import { MobileBuildingConfirmation } from './components/MobileBuildingConfirmation';
import { DebugMenu } from './components/DebugMenu';
import { AgentDebugOverlay } from './components/AgentDebugOverlay';
import { LoadingOverlay } from './components/LoadingOverlay';

export type SidebarOpen = 'NONE' | 'OPS' | 'SHOP' | 'TRADE' | 'CREW' | 'TECH';

const App: React.FC = () => {
    // 1. Initialize Engine (Container-driven)
    const [container, setContainer] = useState<HTMLElement | null>(null);
    const [pendingPlacementPos, setPendingPlacementPos] = useState<{ x: number, z: number } | null>(null);
    const [selectedTilePos, setSelectedTilePos] = useState<{ x: number, z: number } | null>(null);
    const [pinnedTilePos, setPinnedTilePos] = useState<{ x: number, z: number } | null>(null);

    // Subscribed state (needed for callbacks)
    const [worldInstance, setWorldInstance] = useState<any>(null);
    const engineState = useEngineState(worldInstance);
    const state = engineState.state;

    const handleTileClick = useCallback((x: number, z: number, isTouch?: boolean) => {
        if (!state) return;

        if (state.interactionMode === 'BUILD' && state.selectedBuilding) {
            setPendingPlacementPos({ x, z });
            worldInstance?.pinBuildingForConfirmation(x, z);
            console.log(`[App] Pinned building at ${x}, ${z}`);
        } else if (state.interactionMode === 'INSPECT' || (state.interactionMode === 'BUILD' && !state.selectedBuilding)) {
            setSelectedTilePos({ x, z });
        }
    }, [state, worldInstance]);

    const { world, dispatch, getDebugStats, loading } = useAureusEngine({
        container,
        onTileClick: handleTileClick,
        onAgentClick: (id) => dispatch({ type: 'SELECT_AGENT', payload: id }),
        onSfx: (type) => console.log(`[Engine SFX] ${type}`)
    });

    // Sync world instance for useEngineState
    useEffect(() => {
        if (world) setWorldInstance(world);
    }, [world]);

    // Derived Financials
    const financials = useMemo(() => {
        if (!state) return { income: 0, cost: 0, net: 0, ecoMult: 1, trustMult: 1 };
        return {
            income: state.resources.income,
            cost: state.resources.maintenance,
            net: state.resources.income - state.resources.maintenance,
            ecoMult: 1, // Default or pre-calculated in state
            trustMult: 1
        };
    }, [state?.resources.income, state?.resources.maintenance]);

    // SFX helper
    const playSfx = useCallback((type: SfxType) => {
        // world has built-in sfx handled by pendingEffects, 
        // but UI might want to play its own.
        // For now, mapping to console or world effect.
        console.log(`[SFX] ${type}`);
    }, []);

    const [sidebarOpen, setSidebarOpen] = useState<SidebarOpen>('NONE');
    const [showHomePage, setShowHomePage] = useState(true);
    const [isIntroAnim, setIsIntroAnim] = useState(false);
    const [showWorldMap, setShowWorldMap] = useState(false);
    const [activeHUDBlock, setActiveHUDBlock] = useState<string | null>(null);
    const [hasSave, setHasSave] = useState(false);

    useEffect(() => {
        if (world) {
            setHasSave(world.hasSave());
        }
    }, [world]);

    const handleNewGame = () => {
        setShowHomePage(false);
        setIsIntroAnim(true);
        setTimeout(() => setIsIntroAnim(false), 2000);
    };

    const onContinue = () => {
        if (world.hasSave()) {
            setShowHomePage(false);
            playSfx(SfxType.UI_CLICK);
        }
    };

    const handleHUDToggle = (id: string | null) => {
        setActiveHUDBlock(id);
    };

    const handleSidebarOpen = (mode: SidebarOpen) => {
        setSidebarOpen(mode);
    };

    const selectedAgent = useMemo(() => {
        if (!state?.selectedAgentId) return null;
        return state.agents.find(a => a.id === state.selectedAgentId) || null;
    }, [state?.selectedAgentId, state?.agents]);
    // 3. Final conditional check for rendering UI
    // We render the container IMMEDIATELY to prevent a deadlock where the engine
    // is waiting for a container that only renders after the engine is ready.
    return (
        <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none font-['Inter']">
            {/* World View - MUST BE PRESENT FOR ENGINE INIT */}
            <div
                ref={setContainer}
                className="absolute inset-0 z-0"
            />

            {/* Loading Overlay */}
            {(!world || !state) && (
                <div className="absolute inset-0 z-[1000] bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                    <div className="text-blue-400 text-2xl font-bold mb-4 tracking-tighter">AUREUS ENGINE</div>
                    <div className="relative w-64 h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                        <div
                            className="absolute h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${loading.percent}%` }}
                        />
                    </div>
                    <div className="text-white/70 text-sm font-mono mb-2">
                        {loading.stage}
                    </div>
                    {loading.error ? (
                        <div className="mt-4 p-4 bg-red-900/40 border border-red-500/50 rounded-lg max-w-md text-red-200 text-sm">
                            <div className="font-bold mb-1">Initialization Failed</div>
                            {loading.error}
                        </div>
                    ) : (
                        <div className="text-white/20 text-xs animate-pulse">
                            Bootstrapping systems...
                        </div>
                    )}
                </div>
            )}

            {/* Real UI */}
            {world && state && (
                <Routes>
                    <Route path="/" element={
                        <div className="absolute inset-0 pointer-events-none">
                            {/* Main Menu / Intro */}
                            {showHomePage && (
                                <div className="absolute inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
                                    <HomePage
                                        onStartGame={handleNewGame}
                                        onStartDemo={() => {
                                            dispatch({ type: 'START_DEMO' });
                                            setShowHomePage(false);
                                        }}
                                        onContinueGame={onContinue}
                                        hasSave={world.hasSave()}
                                    />
                                </div>
                            )}

                            {/* Era Unlocked Popup */}
                            {state?.eraUnlockedPopup && (
                                <EraUnlockedModal
                                    era={state.eraUnlockedPopup}
                                    onClose={() => world?.dismissEraPopup()}
                                    playSfx={playSfx}
                                />
                            )}

                            {/* Game UI */}
                            {!showHomePage && !isIntroAnim && (
                                <div className="absolute inset-0">
                                    <WeatherOverlay weather={state.weather} />
                                    {/* Main Game Interface Overlay */}
                                    {!state.isFPS ? (
                                        <>
                                            <HUD
                                                resources={state.resources}
                                                financials={{ net: financials.net }}
                                                population={state.agents.filter(a => a.type !== 'ILLEGAL_MINER').length}
                                                currentEra={state.currentEra}
                                                state={state}
                                                activeBlock={activeHUDBlock}
                                                onToggleBlock={handleHUDToggle}
                                            />
                                            <Minimap
                                                chunks={state.chunks}
                                                agents={state.agents}
                                                onOpenMap={() => { setShowWorldMap(true); playSfx(SfxType.UI_OPEN); }}
                                            />


                                            <WorldMap
                                                isOpen={showWorldMap}
                                                onClose={() => setShowWorldMap(false)}
                                                chunks={state.chunks}
                                                agents={state.agents}
                                                playSfx={playSfx}
                                            />

                                            <div className="absolute top-14 left-2 sm:left-4 z-40 flex flex-col gap-2 items-start pointer-events-none">
                                                <TutorialOverlay
                                                    step={state.step}
                                                    dispatch={dispatch}
                                                    setSidebarOpen={handleSidebarOpen}
                                                    playSfx={playSfx}
                                                />

                                                <GoalWidget
                                                    goal={state.activeGoal}
                                                    dispatch={dispatch}
                                                    playSfx={playSfx}
                                                />

                                                <NewsTicker
                                                    news={state.newsFeed}
                                                    onDismiss={(id) => dispatch({ type: 'DISMISS_NEWS', payload: id })}
                                                    playSfx={playSfx}
                                                />
                                            </div>

                                            <InventoryHUD
                                                inventory={state.inventory}
                                                selectedBuilding={state.selectedBuilding}
                                                dispatch={dispatch}
                                                playSfx={playSfx}
                                                step={state.step}
                                            />

                                            <Controls
                                                selectedBuilding={state.selectedBuilding}
                                                dispatch={dispatch}
                                                setSidebarOpen={handleSidebarOpen}
                                                playSfx={playSfx}
                                                step={state.step}
                                                debugMode={state.debugMode}
                                                interactionMode={state.interactionMode}
                                                dungeonUnlocked={state.dungeon.unlocked}
                                                activeView={state.activeView}
                                                selectedAgentId={state.selectedAgentId}
                                                onToggleView={() => {
                                                    world?.toggleView();
                                                    playSfx(SfxType.UI_CLICK);
                                                }}
                                            />

                                            <OpsDrawer
                                                isOpen={sidebarOpen === 'OPS'}
                                                onClose={() => setSidebarOpen('NONE')}
                                                state={state}
                                                dispatch={dispatch}
                                                financials={{ income: financials.income, cost: financials.cost, net: financials.net }}
                                                ecoMult={financials.ecoMult}
                                                trustMult={financials.trustMult}
                                                playSfx={playSfx}
                                            />

                                            <SupplySidebar
                                                isOpen={sidebarOpen === 'SHOP'}
                                                onClose={() => setSidebarOpen('NONE')}
                                                state={state}
                                                world={worldInstance}
                                                dispatch={dispatch}
                                                playSfx={playSfx}
                                            />

                                            <TradeTerminal
                                                isOpen={sidebarOpen === 'TRADE'}
                                                onClose={() => setSidebarOpen('NONE')}
                                                state={state}
                                                dispatch={dispatch}
                                                playSfx={playSfx}
                                            />

                                            <ConstructionModal
                                                selectedTile={selectedTilePos}
                                                chunks={state.chunks}
                                                gems={state.resources.gems}
                                                dispatch={dispatch}
                                                onClose={() => setSelectedTilePos(null)}
                                                playSfx={playSfx}
                                            />

                                            <BuildingInspectorModal
                                                selectedTile={selectedTilePos}
                                                chunks={state.chunks}
                                                unlockedEras={state.unlockedEras}
                                                resources={state.resources}
                                                cheatsEnabled={state.cheatsEnabled}
                                                dispatch={dispatch}
                                                onClose={() => setSelectedTilePos(null)}
                                                playSfx={playSfx}
                                            />

                                            <DialogueOverlay
                                                state={state}
                                                dispatch={dispatch}
                                                playSfx={playSfx}
                                            />
                                        </>
                                    ) : (
                                        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto">
                                            <button
                                                onClick={() => dispatch({ type: 'EXIT_FPS' })}
                                                className="bg-slate-900/80 backdrop-blur-md hover:bg-red-600 text-white px-8 py-4 rounded-[4px] border-2 border-slate-700 hover:border-red-900 shadow-2xl font-black text-sm tracking-widest uppercase flex items-center gap-3 transition-all active:scale-95 group font-['Rajdhani']"
                                            >
                                                <X size={20} className="group-hover:rotate-90 transition-transform" />
                                                <span>Exit First Person</span>
                                                <span className="text-[10px] opacity-50 ml-2 font-mono">[ESC]</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Era Unlocked Popup */}
                                    {state?.eraUnlockedPopup && (
                                        <EraUnlockedModal
                                            era={state.eraUnlockedPopup}
                                            onClose={() => world?.dismissEraPopup()}
                                            playSfx={playSfx}
                                        />
                                    )}

                                    <MobileBuildingConfirmation
                                        buildingType={state.selectedBuilding}
                                        tilePos={pendingPlacementPos}
                                        onConfirm={() => {
                                            console.log("[App] onConfirm triggered", { hasWorld: !!worldInstance, pos: pendingPlacementPos });
                                            if (worldInstance && pendingPlacementPos !== null) {
                                                worldInstance.placeBuilding(pendingPlacementPos.x, pendingPlacementPos.z);
                                                worldInstance.selectBuilding(null); // Clear ghost after placement
                                                worldInstance.clearPinnedBuilding();
                                                setPendingPlacementPos(null);
                                                setPinnedTilePos(null); // Reset two-tap flow
                                            }
                                        }}
                                        onCancel={() => {
                                            console.log("[App] onCancel triggered");
                                            if (worldInstance) {
                                                worldInstance.clearPinnedBuilding();
                                            }
                                            setPendingPlacementPos(null);
                                            setPinnedTilePos(null); // Reset two-tap flow
                                        }}
                                        playSfx={playSfx}
                                    />

                                    <LoadingOverlay
                                        isVisible={state.isLoading}
                                        message={state.loadingMessage || 'Preparing systems...'}
                                    />

                                    {state.debugMode && (
                                        <div className="pointer-events-auto">
                                            <DebugMenu
                                                getDebugStats={getDebugStats}
                                                state={state}
                                                onClose={() => dispatch({ type: 'TOGGLE_DEBUG' })}
                                                dispatch={dispatch}
                                            />
                                            <AgentDebugOverlay
                                                agents={state.agents}
                                                jobs={state.jobs}
                                                tickCount={state.tickCount}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {state && <GameOverScreen step={state.step} resources={state.resources} dispatch={dispatch} />}
                        </div>
                    } />
                </Routes>
            )}
        </div>
    );
};

export default App;
