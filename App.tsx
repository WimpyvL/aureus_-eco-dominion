/**
 * Aureus App (v2 - Engine Owned State)
 * 
 * React is now a pure view layer. All game state is owned by the engine.
 * UI components read from engine state and call engine methods for actions.
 * 
 * (|/) Klaasvaakie
 */

import { AudioEngine, SfxType } from './services/AudioEngine';
import { useAureusEngine } from './game';

import { BuildingType, GameStep, Agent, GameState } from './types';
import { BUILDINGS } from './engine/data/VoxelConstants';
import { getEcoMultiplier } from './engine/utils/GameUtils';
import {
    Zap, Utensils, Smile, Briefcase, X,
    Hammer, Pickaxe, Bed, Move, Eye, Wrench, FlaskConical,
    Check, MapPin
} from 'lucide-react';

// Components
import { HUD } from './components/HUD';
import { OpsDrawer } from './components/OpsDrawer';
import { SupplySidebar } from './components/SupplySidebar';
import { TutorialOverlay, GameOverScreen, ConstructionModal, BuildingInspectorModal, UndergroundOverlay } from './components/Modals';
import { Controls } from './components/Controls';
import { NewsTicker } from './components/NewsTicker';
import { GoalWidget } from './components/GoalWidget';
import { InventoryHUD } from './components/InventoryHUD';
import { DebugMenu } from './components/DebugMenu';
import { AgentDebugOverlay } from './components/AgentDebugOverlay';
import { Minimap } from './components/Minimap';
import { WorldMap } from './components/WorldMap';
import { HomePage } from './components/HomePage';
import { TradeTerminal } from './components/TradeTerminal';
import { WeatherOverlay } from './components/WeatherOverlay';
import { MobileBuildingConfirmation } from './components/MobileBuildingConfirmation';
import { DigConfirmPopup } from './components/DigConfirmPopup';
import { LayerNavigator } from './components/LayerNavigator';
import React, { useEffect, useRef, useState, useCallback } from 'react';

// Colonist Inspector Component
const ColonistInspector: React.FC<{ agent: Agent; onClose: () => void; playSfx: (t: any) => void }> = ({ agent, onClose, playSfx }) => {
    const [isCollapsed, setIsCollapsed] = useState(true);

    const NeedsBar = ({ icon: Icon, value, baseColor, label }: any) => {
        const isLow = value < 30;
        return (
            <div className="flex flex-col gap-0.5 flex-1">
                <div className="flex justify-between items-center px-0.5">
                    <div className="flex items-center gap-1 text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                        <Icon size={8} /> {label}
                    </div>
                    <span className={`text-[8px] font-mono font-bold ${isLow ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
                        {Math.floor(value)}%
                    </span>
                </div>
                <div className="h-2 bg-slate-950 border border-slate-700 p-[1px]">
                    <div
                        className={`h-full ${isLow ? 'bg-rose-500' : baseColor} transition-all duration-700`}
                        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                    />
                </div>
            </div>
        );
    };

    const getTaskIcon = (jobId: string | null, state: string) => {
        if (state === 'SLEEPING' || (jobId && jobId.includes('sleep'))) return <Bed size={12} />;
        if (state === 'MOVING' || (jobId && (jobId.includes('move') || jobId.includes('wander')))) return <Move size={12} />;

        if (jobId) {
            const type = jobId.split('_')[1]?.toLowerCase() || '';
            if (type === 'mine' || jobId.includes('mine')) return <Pickaxe size={12} />;
            if (type === 'build' || jobId.includes('j_b_')) return <Hammer size={12} />;
            if (type === 'repair') return <Wrench size={12} />;
            if (type === 'research') return <FlaskConical size={12} />;
        }

        return state === 'WORKING' ? <Briefcase size={12} /> : <Eye size={12} />;
    };

    if (isCollapsed) {
        return (
            <div className="pointer-events-auto animate-in slide-in-from-left-4 duration-300">
                <button
                    onClick={() => { setIsCollapsed(false); playSfx('UI_CLICK'); }}
                    className="w-10 h-10 bg-slate-900 border-2 border-slate-600 flex items-center justify-center hover:bg-slate-800 transition-colors shadow-lg group relative"
                >
                    <div className={`w-6 h-6 ${agent.type === 'ILLEGAL_MINER' ? 'bg-slate-700' : 'bg-amber-600'} flex items-center justify-center text-slate-900 font-black text-[10px] shadow-sm`}>
                        {agent.name[0]}
                    </div>
                    {agent.energy < 30 && (
                        <div className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border border-slate-900 animate-pulse" />
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="pointer-events-auto w-56 sm:w-64 animate-in slide-in-from-left-4 duration-300">
            <div className="bg-slate-900 border-2 border-slate-600 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
                <div
                    className="p-2 flex justify-between items-center cursor-pointer bg-slate-800 border-b-2 border-slate-700 hover:bg-slate-750 transition-colors"
                    onClick={() => { setIsCollapsed(true); playSfx('UI_CLICK'); }}
                >
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-amber-600 border border-amber-400 flex items-center justify-center text-slate-900 font-black text-[10px] shadow-sm">
                            {agent.name[0]}
                        </div>
                        <div className="flex flex-col">
                            <h3 className="font-bold text-white text-[10px] uppercase font-['Rajdhani'] tracking-wider leading-none mb-0.5">{agent.name}</h3>
                            <div className="flex items-center gap-1">
                                <span className="text-slate-400">{getTaskIcon(null, agent.state)}</span>
                                <span className="text-[8px] text-amber-400 font-bold font-mono">{agent.type}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); playSfx('UI_CLICK'); }}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                    >
                        <X size={12} />
                    </button>
                </div>
                <div className="p-2 space-y-3 bg-slate-900">
                    <div className="flex items-center justify-between bg-slate-950 p-2 border border-slate-800 font-mono">
                        <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 uppercase font-bold tracking-widest">Current Protocol</span>
                            <span className="text-[9px] text-emerald-400 font-bold truncate max-w-[120px]">
                                {agent.currentJobId ? agent.currentJobId.split('_')[1]?.toUpperCase() : "IDLE_ROUTINE"}
                            </span>
                        </div>
                        <div className="text-slate-900 bg-emerald-500 px-1.5 py-0.5 text-[8px] font-bold uppercase">
                            {agent.state}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <NeedsBar icon={Zap} value={agent.energy} baseColor="bg-blue-500" label="PWR" />
                        <NeedsBar icon={Utensils} value={agent.hunger} baseColor="bg-amber-500" label="HGR" />
                        <NeedsBar icon={Smile} value={agent.mood} baseColor="bg-emerald-500" label="MOR" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<AudioEngine>(new AudioEngine());
    const lastSfxTime = useRef<number>(0);

    // UI-only state (not game logic)
    const [sidebarOpen, setSidebarOpen] = useState<'NONE' | 'OPS' | 'SHOP' | 'TRADE' | 'CREW' | 'TECH'>('NONE');
    const [selectedTileForAction, setSelectedTileForAction] = useState<number | null>(null);
    const [isIntroAnim, setIsIntroAnim] = useState(false);
    const [pendingPlacementIndex, setPendingPlacementIndex] = useState<number | null>(null);
    const [pinnedTileIndex, setPinnedTileIndex] = useState<number | null>(null); // Track pinned tile for two-tap system
    const [showWorldMap, setShowWorldMap] = useState(false);
    const [showHomePage, setShowHomePage] = useState(true);
    const [hasSave, setHasSave] = useState(false);
    const [hoverTile, setHoverTile] = useState<number | null>(null);
    const [digPromptIndex, setDigPromptIndex] = useState<number | null>(null);

    // Container state - set after mount so engine hook can initialize
    const [container, setContainer] = useState<HTMLElement | null>(null);
    useEffect(() => {
        if (containerRef.current) {
            setContainer(containerRef.current);
        }
    }, []);

    // Engine integration - state is owned by engine
    const { world, ready, state, loading, getDebugStats } = useAureusEngine({
        container,
        onTileClick: (index, isTouch) => {
            // Context-aware building placement system
            if (state?.interactionMode === 'BUILD' && state?.selectedBuilding) {
                // If it's a mouse click (PC), show confirmation immediately
                // On mobile (touch), we keep the two-tap system to prevent accidents
                if (!isTouch || pinnedTileIndex === index) {
                    // PC Click OR second tap on mobile → Show confirmation modal
                    setPendingPlacementIndex(index);
                    playSfx(SfxType.UI_CLICK);
                } else {
                    // First tap on mobile → Pin ghost building
                    if (world) {
                        world.pinBuildingForConfirmation(index);
                    }
                    setPinnedTileIndex(index);
                    playSfx(SfxType.UI_CLICK);
                }
            }
            // Dungeon Keeper: Click to dig
            else if (state?.interactionMode === 'DIG') {
                // Trigger dig prompt for the selected tile
                setDigPromptIndex(index);
                playSfx(SfxType.UI_CLICK);
            }
            // INSPECT or Neutral BUILD Mode: Check for buildings to show info
            else if (state?.interactionMode === 'INSPECT' || (state?.interactionMode === 'BUILD' && !state?.selectedBuilding)) {
                const tile = state.grid[index];
                if (tile && (tile.buildingType !== BuildingType.EMPTY || tile.foliage === 'MINE_HOLE')) {
                    setSelectedTileForAction(index);
                    playSfx(SfxType.UI_CLICK);
                } else if (selectedTileForAction !== null) {
                    setSelectedTileForAction(null);
                }
            }
        },
        onTileHover: (index) => setHoverTile(index),
        onSfx: (type) => playSfx(type),
        paused: showHomePage,
    });

    // SFX helper
    const playSfx = useCallback((type: SfxType) => {
        audioRef.current.play(type);
    }, []);

    // Check for existing save
    useEffect(() => {
        const saved = localStorage.getItem('aureus_save_v2');
        if (saved) setHasSave(true);
    }, []);

    // Clear pinned tile when selected building or interaction mode changes
    useEffect(() => {
        if (world && pinnedTileIndex !== null) {
            // If user changed building or mode, clear the pin
            if (!state?.selectedBuilding || state?.interactionMode !== 'BUILD') {
                world.clearPinnedBuilding();
                setPinnedTileIndex(null);
            }
        }
    }, [world, state?.selectedBuilding, state?.interactionMode, pinnedTileIndex]);


    // Intro animation (Disabled)
    useEffect(() => {
        // if (ready && world) {
        //     world.playIntroAnimation(() => setIsIntroAnim(false));
        // }
    }, [ready, world]);

    // Keyboard for starting game
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (showHomePage && e.code === 'Space') {
                e.preventDefault();
                setShowHomePage(false);
                audioRef.current.init();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showHomePage]);

    // Sidebar handler
    const handleSidebarOpen = useCallback((mode: 'NONE' | 'OPS' | 'SHOP') => {
        if (mode !== 'NONE') playSfx(SfxType.UI_OPEN);
        setSidebarOpen(mode);
    }, [playSfx]);

    // Start game handlers
    const handleStartGame = useCallback(() => {
        setShowHomePage(false);
        audioRef.current.init();
    }, []);

    const handleContinueGame = useCallback(() => {
        const saved = localStorage.getItem('aureus_save_v2');
        if (saved && world) {
            world.loadGame(saved);
            setShowHomePage(false);
            audioRef.current.init();
        }
    }, [world]);

    const handleStartDemo = useCallback(() => {
        if (world) {
            world.startDemo();
            setShowHomePage(false);
            audioRef.current.init();
        }
    }, [world]);

    // Calculate financials from state (Optimized: engine provides target sums)
    const calculateFinancials = (gameState: GameState) => {
        const income = gameState.resources.income || 0;
        const cost = gameState.resources.maintenance || 0;
        const ecoMult = getEcoMultiplier(gameState.resources.eco);
        const trustMult = 1 + (gameState.resources.trust / 200);
        return { income, cost, net: income - cost, ecoMult, trustMult };
    };

    // ──────────────────────────────────────────────────────────────────
    // ENGINE READY - Internal logic
    // ──────────────────────────────────────────────────────────────────

    const selectedAgent = state?.agents.find(a => a.id === state.selectedAgentId);
    const financials = state ? calculateFinancials(state) : { income: 0, cost: 0, net: 0, ecoMult: 1, trustMult: 1 };

    // Engine action wrappers
    const dispatch = (action: { type: string; payload?: any }) => {
        if (!world) return;

        switch (action.type) {
            case 'PLACE_BUILDING':
                world.placeBuilding(action.payload.index);
                playSfx(SfxType.BUILD_START);
                break;
            case 'BUY_BUILDING':
                if (world) world.buyBuilding(action.payload.type, action.payload.cost);
                break;
            case 'BULLDOZE_TILE':
                world.bulldozeTile(action.payload.index);
                playSfx(SfxType.BULLDOZE);
                break;
            case 'SELECT_BUILDING_TO_PLACE':
                world.selectBuilding(action.payload);
                break;
            case 'SELECT_AGENT':
                world.selectAgent(action.payload);
                break;
            case 'SET_INTERACTION_MODE':
                world.setInteractionMode(action.payload);
                break;
            case 'TOGGLE_DEBUG':
                world.toggleDebug();
                break;
            case 'TOGGLE_CHEATS':
                world.toggleCheats();
                break;
            case 'SELL_MINERALS':
                world.sellMinerals();
                break;
            case 'SET_AUTO_SELL':
                world.setAutoSell(action.payload.enabled, action.payload.threshold);
                break;
            case 'RESEARCH_TECH':
                world.researchTech(action.payload);
                break;
            case 'SPEED_UP_BUILDING':
                world.speedUpConstruction(action.payload.index);
                break;
            case 'ACCEPT_CONTRACT':
                world.acceptContract(action.payload);
                break;
            case 'DELIVER_CONTRACT':
                world.deliverContract(action.payload);
                break;
            case 'CHANGE_LAYER':
                world.changeUndergroundLayer(action.payload.delta);
                break;
            case 'ADVANCE_TUTORIAL':
                world.advanceTutorial();
                break;
            case 'TOGGLE_VIEW':
                world.toggleViewMode();
                break;
            case 'QUEUE_DIG':
                if (world['queueDig']) {
                    world['queueDig'](action.payload.index, action.payload.layer);
                }
                playSfx(SfxType.UI_CLICK);
                break;
            default:
                console.warn(`Unhandled action: ${action.type}`);
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-slate-900 select-none">
            {/* Engine Canvas Container - PERSISTENT */}
            <div
                ref={containerRef}
                className={`absolute inset-0 z-0 transition-opacity duration-1000 ${(showHomePage || !state) ? 'brightness-[0.9]' : 'brightness-100'} ${(!state) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            />

            {/* Loading Screen Overlay */}
            {!state && (
                <div className="fixed inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
                    {/* Logo/Title */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent mb-2">AUREUS</h1>
                        <p className="text-slate-500 text-sm tracking-widest uppercase">Eco Dominion</p>
                    </div>

                    {/* Loading Container */}
                    <div className="w-80 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-lg shadow-black/20">
                        <div className="text-center mb-4">
                            <p className="text-white text-lg font-medium">{loading.stage}</p>
                            {loading.error && (
                                <p className="text-red-400 text-sm mt-2 break-words">{loading.error}</p>
                            )}
                        </div>

                        <div className="relative h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                            <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500 ease-out rounded-full"
                                style={{ width: `${loading.percent}%` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                        </div>

                        <div className="text-center mt-3">
                            <span className="text-2xl font-bold text-amber-400">{loading.percent}%</span>
                        </div>

                        <div className="mt-6 space-y-2 text-xs text-slate-500">
                            <div className={`flex items-center gap-2 ${loading.percent >= 10 ? 'text-emerald-400' : ''}`}>
                                <span>●</span> Renderer
                            </div>
                            <div className={`flex items-center gap-2 ${loading.percent >= 30 ? 'text-emerald-400' : ''}`}>
                                <span>●</span> World & Input
                            </div>
                            <div className={`flex items-center gap-2 ${loading.percent >= 50 ? 'text-emerald-400' : ''}`}>
                                <span>●</span> Runtime & Tools
                            </div>
                            <div className={`flex items-center gap-2 ${loading.percent >= 80 ? 'text-emerald-400' : ''}`}>
                                <span>●</span> Simulation
                            </div>
                            <div className={`flex items-center gap-2 ${loading.percent >= 100 ? 'text-emerald-400' : ''}`}>
                                <span>●</span> Game Engine Running
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex gap-1">
                        {loading.percent < 100 ? (
                            <>
                                <div className="w-2 h-2 bg-amber-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-amber-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-amber-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </>
                        ) : (
                            <div className="text-emerald-400 text-2xl animate-pulse">✓</div>
                        )}
                    </div>
                </div>
            )}

            {/* Home Page Overlay */}
            {state && showHomePage && (
                <div className="absolute inset-0 z-50 bg-gradient-to-b from-black/30 via-transparent to-black/50">
                    <HomePage
                        onStartGame={handleStartGame}
                        onStartDemo={handleStartDemo}
                        onContinueGame={handleContinueGame}
                        hasSave={hasSave}
                    />
                </div>
            )}

            {/* Game UI */}
            {state && !showHomePage && !isIntroAnim && (
                <>
                    <WeatherOverlay weather={state.weather} />
                    <HUD
                        resources={state.resources}
                        financials={{ net: financials.net }}
                        population={state.agents.filter(a => a.type !== 'ILLEGAL_MINER').length}
                        currentEra={state.currentEra}
                        state={state}
                    />
                    <Minimap
                        grid={state.grid}
                        agents={state.agents}
                        viewMode={state.viewMode}
                        onOpenMap={() => { setShowWorldMap(true); playSfx(SfxType.UI_OPEN); }}
                    />

                    <WorldMap
                        isOpen={showWorldMap}
                        onClose={() => setShowWorldMap(false)}
                        grid={state.grid}
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

                        {selectedAgent && (
                            <ColonistInspector
                                agent={selectedAgent}
                                onClose={() => dispatch({ type: 'SELECT_AGENT', payload: null })}
                                playSfx={playSfx}
                            />
                        )}

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
                        viewMode={state.viewMode}
                        playSfx={playSfx}
                        step={state.step}
                        debugMode={state.debugMode}
                        interactionMode={state.interactionMode}
                    />

                    {state.viewMode === 'UNDERGROUND' && (
                        <LayerNavigator
                            currentLayer={state.currentUndergroundLayer}
                            dispatch={dispatch}
                            playSfx={playSfx}
                        />
                    )}

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

                    <UndergroundOverlay
                        viewMode={state.viewMode}
                        trust={state.resources.trust}
                        cheatsEnabled={state.cheatsEnabled}
                        dispatch={dispatch}
                        playSfx={playSfx}
                    />

                    <ConstructionModal
                        selectedTile={selectedTileForAction}
                        grid={state.grid}
                        gems={state.resources.gems}
                        dispatch={dispatch}
                        onClose={() => setSelectedTileForAction(null)}
                        playSfx={playSfx}
                    />

                    <BuildingInspectorModal
                        selectedTile={selectedTileForAction}
                        grid={state.grid}
                        dispatch={dispatch}
                        onClose={() => setSelectedTileForAction(null)}
                        playSfx={playSfx}
                    />

                    <MobileBuildingConfirmation
                        buildingType={state.selectedBuilding}
                        tileIndex={pendingPlacementIndex}
                        onConfirm={() => {
                            if (world && pendingPlacementIndex !== null) {
                                world.placeBuilding(pendingPlacementIndex);
                                world.clearPinnedBuilding();
                                setPendingPlacementIndex(null);
                                setPinnedTileIndex(null); // Reset two-tap flow
                            }
                        }}
                        onCancel={() => {
                            if (world) {
                                world.clearPinnedBuilding();
                            }
                            setPendingPlacementIndex(null);
                            setPinnedTileIndex(null); // Reset two-tap flow
                        }}
                        playSfx={playSfx}
                    />

                    {digPromptIndex !== null && (
                        <DigConfirmPopup
                            tileIndex={digPromptIndex}
                            grid={state.grid}
                            viewMode={state.viewMode}
                            currentUndergroundLayer={state.currentUndergroundLayer}
                            onConfirm={(layer) => {
                                dispatch({ type: 'QUEUE_DIG', payload: { index: digPromptIndex, layer } });
                                setDigPromptIndex(null);
                            }}
                            onCancel={() => setDigPromptIndex(null)}
                        />
                    )}

                    {state.debugMode && (
                        <>
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
                        </>
                    )}
                </>
            )}

            {state && <GameOverScreen step={state.step} resources={state.resources} dispatch={dispatch} />}
        </div>
    );
};

export default App;
