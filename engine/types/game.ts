
import { BuildingType } from './buildings';
import { Agent, AgentRequest, Job } from './agents';
import { GridTile, WeatherState } from './world';
import { GameResources, MarketState, Contract } from './economy';

export enum Era {
    SETTLEMENT = 'SETTLEMENT',
    GROWTH = 'GROWTH',
    INDUSTRY = 'INDUSTRY',
    SUSTAINABILITY = 'SUSTAINABILITY',
    PROSPERITY = 'PROSPERITY'
}

export interface EraDef {
    id: Era;
    name: string;
    description: string;
    unlockConditions: {
        minColonists?: number;
        minAgt?: number;
        minEco?: number;
        minTrust?: number;
        minBuildings?: number;
        tutorialComplete?: boolean;
    };
    color: string;
    milestones?: { id: string; name: string; target: number }[];
}

export interface Goal {
    id: string;
    title: string;
    description: string;
    type: 'BUILD' | 'RESOURCE' | 'STAT';
    targetType: BuildingType | 'AGT' | 'MINERALS' | 'ECO' | 'TRUST' | 'GEMS';
    targetValue: number;
    currentValue: number;
    reward: { type: 'AGT' | 'GEMS', amount: number };
    completed: boolean;
}

export interface NewsItem {
    id: string;
    headline: string;
    type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'CRITICAL';
    timestamp: number;
}

export interface GlobalEvent {
    id: string;
    name: string;
    type: 'WEATHER' | 'ECONOMIC' | 'GEOLOGICAL' | 'SOCIAL' | 'INCURSION';
    duration: number; // in ticks
    description: string;
    visualTheme?: 'NORMAL' | 'TOXIC' | 'HEAT' | 'GOLDEN';
    modifiers?: {
        productionMult?: number;
        sellPriceMult?: number;
        ecoRegenMult?: number;
        trustGainMult?: number;
        energyDecayMult?: number;
    };
}

export type TechId =
    | 'ADVANCED_DRILLING' | 'MARKET_ANALYTICS' | 'AUTOMATION'
    | 'PHOTOVOLTAICS' | 'WATER_RECYCLING' | 'CARBON_CAPTURE'
    | 'COMMUNITY_OUTREACH' | 'NEIGHBORHOOD_WATCH' | 'EDUCATION_REFORM';

export interface TechDefinition {
    id: TechId;
    name: string;
    description: string;
    cost: number;
    category: 'INDUSTRIAL' | 'ECOLOGICAL' | 'SOCIAL';
    prereq: TechId | null;
    effectDesc: string;
}

export interface ResearchState {
    unlocked: TechId[];
}

export enum GameStep {
    INTRO = 'INTRO',
    TUTORIAL_NAV = 'TUTORIAL_NAV',
    TUTORIAL_MINE = 'TUTORIAL_MINE',
    TUTORIAL_SELL = 'TUTORIAL_SELL',
    TUTORIAL_BUY = 'TUTORIAL_BUY',
    TUTORIAL_PLACE = 'TUTORIAL_PLACE',
    TUTORIAL_NEEDS = 'TUTORIAL_NEEDS',
    TUTORIAL_POWER = 'TUTORIAL_POWER',
    TUTORIAL_UNDERGROUND = 'TUTORIAL_UNDERGROUND',
    TUTORIAL_RESEARCH = 'TUTORIAL_RESEARCH',
    TUTORIAL_ERA = 'TUTORIAL_ERA',
    DEMO = 'DEMO',
    PLAYING = 'PLAYING',
    GAME_OVER = 'GAME_OVER',
    VICTORY = 'VICTORY'
}

export enum SfxType {
    BUILD = 'BUILD',
    BUILD_START = 'BUILD_START',
    BULLDOZE = 'BULLDOZE',
    SELL = 'SELL',
    COMPLETE = 'COMPLETE',
    ERROR = 'ERROR',
    UI_CLICK = 'UI_CLICK',
    UI_OPEN = 'UI_OPEN',
    UI_COIN = 'UI_COIN',
    CONSTRUCT_SPEEDUP = 'CONSTRUCT_SPEEDUP',
    MINING_HIT = 'MINING_HIT',
    CAMP_BUILD = 'CAMP_BUILD',
    CAMP_RUSTLE = 'CAMP_RUSTLE',
    DEATH = 'DEATH',
    ALARM = 'ALARM'
}

export type GameDiff =
    | { type: 'GRID_UPDATE', updates: GridTile[] }
    | { type: 'FX', fxType: 'MINING' | 'THEFT' | 'ECO_REHAB' | 'DEATH' | 'SMOKE' | 'DUST' | 'FARM', index: number };

export type SimulationEffect =
    | GameDiff
    | { type: 'AUDIO', sfx: SfxType };

export interface GameCommand {
    id: string; // Unique ID to prevent double execution
    type: 'PLACE_BUILDING' | 'PLACE_SUB_BUILDING' | 'BULLDOZE' | 'BULLDOZE_SUB' | 'SPEED_UP' | 'REHABILITATE' | 'UPGRADE_BUILDING' | 'EXPLODE_TILE';
    payload: any;
}

export interface GameState {
    resources: GameResources;
    grid: GridTile[];
    agents: Agent[];
    jobs: Job[];
    inventory: Partial<Record<BuildingType, number>>;
    selectedBuilding: BuildingType | null;
    selectedAgentId: string | null;
    interactionMode: 'BUILD' | 'BULLDOZE' | 'INSPECT' | 'DIG' | 'TEST_DESTRUCT';
    step: GameStep;
    tickCount: number;
    viewMode: 'SURFACE' | 'UNDERGROUND' | 'FIRST_PERSON';
    logistics: LogisticsState;
    activeGoal: Goal | null;
    newsFeed: NewsItem[];
    activeEvents: GlobalEvent[];
    currentUndergroundLayer: number; // Current subterranean depth being viewed (-1 to -10)
    research: ResearchState;
    debugMode: boolean;
    cheatsEnabled: boolean;
    pendingEffects: SimulationEffect[];
    // Galactic Trade System
    market: MarketState;
    contracts: Contract[];

    // Environmental System
    weather: WeatherState;

    // Day/Night Cycle (1 game day = 24000 ticks = ~80 real minutes at 200ms/tick)
    dayNightCycle: {
        timeOfDay: number;      // 0-24000 (0 = midnight, 12000 = noon)
        dayCount: number;       // How many days have passed
        isDaytime: boolean;     // true if between 6000-18000 (6 AM - 6 PM)
    };

    // Era System
    currentEra: Era;
    unlockedEras: Era[];
    eraUnlockedPopup: Era | null; // Set when a new era is unlocked to show popup

    // Power Grid System
    powerGrid: {
        totalProduced: number;
        totalConsumed: number;
        deficit: number;
    };

    // Water Network System
    waterNetwork: {
        totalProduced: number;
        totalConsumed: number;
        deficit: number;
    };

    // Agent requests system
    agentRequests: AgentRequest[];

    experiments: {
        BIOLUMINESCENCE: boolean;
        GREEDY_MESHING_V2: boolean;
        HIERARCHICAL_PATHFINDING: boolean;
        SHARED_BUFFER_TRANSFER: boolean;
    };
    commandQueue: GameCommand[];

    // View Transition Loading Screen
    isLoading: boolean;
    loadingMessage: string;
}

export interface LogisticsState {
    autoSell: boolean;
    sellThreshold: number;
}

export type Action =
    | { type: 'TICK' }
    | { type: 'SELL_MINERALS' }
    | { type: 'SELL_GEMS'; payload: { address: string } }
    | { type: 'SELL_WOOD' }
    | { type: 'SELL_STONE' }
    | { type: 'BUY_RESOURCE', payload: { resource: 'minerals' | 'gems' | 'wood' | 'stone', amount: number } }
    | { type: 'UPDATE_LOGISTICS', payload: Partial<LogisticsState> }
    | { type: 'BUY_BUILDING', payload: { type: BuildingType, cost: number } }
    | { type: 'SELECT_BUILDING_TO_PLACE', payload: BuildingType | null }
    | { type: 'SELECT_AGENT', payload: string | null }
    | { type: 'COMMAND_AGENT', payload: { agentId: string, tileId: number } }
    | { type: 'ACTIVATE_BULLDOZER' }
    | { type: 'PLACE_BUILDING', payload: { index: number } }
    | { type: 'PLACE_BATCH_BUILDING', payload: { indices: number[], cost: number } }
    | { type: 'BULLDOZE_TILE', payload: { index: number } }
    | { type: 'SPEED_UP_BUILDING', payload: { index: number } }
    | { type: 'REHABILITATE_TILE', payload: { index: number } }
    | { type: 'UPGRADE_BUILDING', payload: { index: number } }
    | { type: 'ADVANCE_TUTORIAL' }
    | { type: 'SKIP_TUTORIAL' }
    | { type: 'RESET_GAME' }
    | { type: 'TOGGLE_VIEW' }
    | { type: 'TOGGLE_DEBUG' }
    | { type: 'TOGGLE_CHEATS' }
    | { type: 'ENTER_FPS' }
    | { type: 'EXIT_FPS' }
    | { type: 'CLAIM_GOAL' }
    | { type: 'DISMISS_NEWS', payload: string }
    | { type: 'UNLOCK_TECH', payload: TechId }
    | { type: 'MINE_CLICK', payload: { index: number } }
    | { type: 'CLEAR_EFFECTS' }
    | { type: 'ACCEPT_CONTRACT', payload: string }
    | { type: 'DELIVER_CONTRACT', payload: string }
    | { type: 'SET_INTERACTION_MODE', payload: 'BUILD' | 'BULLDOZE' | 'INSPECT' | 'DIG' | 'TEST_DESTRUCT' }
    | { type: 'CHANGE_LAYER', payload: { delta: number } }
    | { type: 'EXPLODE_TILE', payload: { index: number, radius: number, damage: number } }
    | { type: 'SAVE_GAME' }
    | { type: 'LOAD_GAME', payload: GameState };
