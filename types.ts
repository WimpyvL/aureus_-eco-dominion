
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export enum BuildingType {
  EMPTY = 'EMPTY',
  WASH_PLANT = 'WASH_PLANT',
  RECYCLING_PLANT = 'RECYCLING_PLANT',
  SOLAR_ARRAY = 'SOLAR_ARRAY',
  COMMUNITY_GARDEN = 'COMMUNITY_GARDEN',
  WATER_WELL = 'WATER_WELL',
  WIND_TURBINE = 'WIND_TURBINE',
  LOCAL_SCHOOL = 'LOCAL_SCHOOL',
  SAFARI_LODGE = 'SAFARI_LODGE',
  GREEN_TECH_LAB = 'GREEN_TECH_LAB',
  STAFF_QUARTERS = 'STAFF_QUARTERS',
  SECURITY_POST = 'SECURITY_POST',
  CANTEEN = 'CANTEEN',
  SOCIAL_HUB = 'SOCIAL_HUB',
  MINING_HEADFRAME = 'MINING_HEADFRAME',
  ORE_FOUNDRY = 'ORE_FOUNDRY',
  // Infrastructure
  POND = 'POND',
  RESERVOIR = 'RESERVOIR',
  PIPE = 'PIPE',
  POWER_LINE = 'POWER_LINE',
  ROAD = 'ROAD',
  FENCE = 'FENCE',
  STORAGE_DEPOT = 'STORAGE_DEPOT',
  WORKSHOP = 'WORKSHOP',
  GENERATOR = 'GENERATOR',
  // Era 2: Growth
  MEDICAL_BAY = 'MEDICAL_BAY',
  TRAINING_CENTER = 'TRAINING_CENTER',
  // Era 3: Industry
  GEM_REFINERY = 'GEM_REFINERY',
  RAIL_LINE = 'RAIL_LINE',
  DISTRIBUTION_HUB = 'DISTRIBUTION_HUB',
  // Era 4: Sustainability
  WASTE_TREATMENT = 'WASTE_TREATMENT',
  NATURE_RESERVE = 'NATURE_RESERVE',
  HYDROPONICS = 'HYDROPONICS',
  GEOTHERMAL_PLANT = 'GEOTHERMAL_PLANT',
  // Era 5: Prosperity
  MONUMENT = 'MONUMENT',
  SPACEPORT = 'SPACEPORT',
  // Underground Specific
  SUPPORT_PILLAR = 'SUPPORT_PILLAR',
  MINING_DRILL = 'MINING_DRILL',
  ORE_EXTRACTOR = 'ORE_EXTRACTOR',
  UNDERGROUND_FANS = 'UNDERGROUND_FANS',
}

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
}

export type AgentRole = 'WORKER' | 'MINER' | 'BOTANIST' | 'ENGINEER' | 'SECURITY' | 'ILLEGAL_MINER';

export type JobType = 'BUILD' | 'MINE' | 'DIG' | 'REINFORCE' | 'RESCUE' | 'FARM' | 'REPAIR' | 'RESEARCH' | 'SLEEP' | 'IDLE' | 'MOVE' | 'REHABILITATE' | 'EAT' | 'SOCIALIZE' | 'PATROL';

export interface Job {
  id: string;
  type: JobType;
  targetTileId: number;
  priority: number; // 1-5
  assignedAgentId: string | null;
  progress?: number;
  layer?: number; // 0 for surface, -1 to -10 for underground
}

export interface ColonistStats {
  mining: number;
  construction: number;
  plants: number;
  intelligence: number;
}

// Personality traits affect decision-making
export interface AgentPersonality {
  diligence: number;     // 0-1: How likely to work vs slack off
  sociability: number;   // 0-1: How much they seek social interaction
  bravery: number;       // 0-1: Willingness to do dangerous tasks
  patience: number;      // 0-1: How long they stick to a task
}

// Memory for smarter navigation and decisions
export interface AgentMemory {
  knownBuildings: Map<string, number[]>; // BuildingType -> tile IDs (cached locations)
  favoriteSpots: number[];               // Tiles they like to visit
  recentlyVisited: number[];             // Last 5 tiles (avoid revisiting)
  friendIds: string[];                   // Agents they like
  lastMealTile: number | null;           // Where they last ate
  lastSleepTile: number | null;          // Where they last slept
}

// Experience system
export interface AgentExperience {
  buildingsConstructed: number;
  resourcesMined: number;
  plantsGrown: number;
  totalWorkTicks: number;
  // Skill level progress (0-100 for each skill, when reaches 100 skill increases)
  miningProgress: number;
  constructionProgress: number;
  plantsProgress: number;
}

// Shift system
export type ShiftType = 'DAY' | 'NIGHT' | 'FLEXIBLE';

// Agent requests - things agents ask for
export type AgentRequestType =
  | 'NEED_BREAK'           // Agent is tired, needs rest
  | 'WANT_FRIEND'          // Agent is lonely, wants social interaction
  | 'WANT_BETTER_FOOD'     // Agent wants a canteen nearby
  | 'WANT_BETTER_BED'      // Agent wants quarters nearby
  | 'LOW_MORALE'           // Agent is unhappy
  | 'OVERWORKED';          // Agent has been working too long

export interface AgentRequest {
  id: string;
  type: AgentRequestType;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: number;
  resolved: boolean;
}

export interface PathStep {
  index: number;
  layer: number;
}

export interface Agent {
  id: string;
  name: string;
  type: AgentRole;
  x: number;
  z: number;
  targetTileId: number | null;
  path: PathStep[] | null;
  layer: number; // Current vertical layer
  // Visual position for smooth rendering
  visualX?: number;
  visualZ?: number;

  state: 'MOVING' | 'WORKING' | 'IDLE' | 'SLEEPING' | 'EATING' | 'RELAXING' | 'SOCIALIZING' | 'PATROLLING' | 'OFF_DUTY' | 'PLANNING';

  // Needs (0-100)
  energy: number;
  hunger: number;
  mood: number;

  // Skills & Stats
  skills: ColonistStats;
  currentJobId: string | null;

  // Intelligence features (optional for backward compatibility)
  personality?: AgentPersonality;
  memory?: AgentMemory;
  experience?: AgentExperience;

  // Behavior modifiers
  workEfficiency?: number;  // Multiplier based on mood/energy (0.5-1.5)
  moveSpeed?: number;       // Individual speed modifier
  socialTarget?: string;    // ID of agent they're interacting with

  // Shift system
  shift?: ShiftType;              // Agent's assigned shift
  consecutiveWorkTicks?: number;  // How long they've been working
  lastBreakTick?: number;         // When they last took a break

  // Request system
  activeRequest?: AgentRequest;   // Current request from this agent

  // Pathfinding failsafe
  lastAbandonedJobId?: string | null;
}

export type BiomeType = 'GRASS' | 'DIRT' | 'SAND' | 'STONE' | 'SNOW';

export type FoliageType =
  | 'NONE'
  // Functional
  | 'GOLD_VEIN'
  | 'MINE_HOLE'
  | 'ILLEGAL_CAMP'
  // Grass Biome
  | 'TREE_OAK'
  | 'TREE_BIRCH'
  | 'TREE_WILLOW'
  | 'TREE_APPLE'
  | 'BUSH_OAK'
  | 'FLOWER_YELLOW'
  // Snow Biome
  | 'TREE_PINE'
  | 'TREE_FROSTED_PINE'
  | 'TREE_TALL_PINE'
  | 'SHRUB_WINTER'
  | 'ROCK_ICY'
  // Sand Biome
  | 'CACTUS_SAGUARO'
  | 'CACTUS_BARREL'
  | 'TREE_PALM'
  | 'SHRUB_DRY'
  | 'ROCK_SANDSTONE'
  // Dirt Biome
  | 'TREE_DEAD'
  | 'TREE_STUMP'
  | 'BUSH_THORN'
  | 'MUSHROOM_GIANT'
  | 'BONE_RIB'
  // Stone Biome
  | 'ROCK_BOULDER'
  | 'ROCK_PEBBLE'
  | 'ROCK_MOSSY'
  | 'FLOWER_ALPINE'
  | 'CRYSTAL_SPIKE';

export interface UndergroundTile {
  excavated: boolean;
  oreType?: 'GOLD' | 'IRON' | 'GEM' | 'COAL';
  oreVisible: boolean;  // Fog-of-war: true when adjacent is excavated
  supportType?: 'PILLAR' | 'WOOD_BEAM' | 'STEEL_BEAM';
  collapseRisk: number; // 0-100
  collapsed?: boolean;
  trappedAgentIds?: string[];
  rescueDeadline?: number; // Tick when agents die
}

export interface GridTile {
  id: number;
  x: number;
  y: number;
  buildingType: BuildingType;
  level: number;
  terrainHeight: number;
  biome: BiomeType;
  foliage?: FoliageType;
  locked?: boolean;
  integrity?: number;
  isUnderConstruction?: boolean;
  constructionTimeLeft?: number;
  structureHeadIndex?: number;
  waterStatus?: 'CONNECTED' | 'DISCONNECTED';
  powerStatus?: 'CONNECTED' | 'DISCONNECTED';
  rehabProgress?: number; // 0-100
  explored?: boolean;

  // Dungeon Keeper System
  underground: Record<number, UndergroundTile>; // Layer -1 to -10
  hasEntrance?: boolean; // MINE_ENTRANCE on surface

  // Legacy compatibility (to be deprecated or mapped to layer -1)
  subBuildings?: Record<number, BuildingType>;
  digState?: Record<number, number>;
}

export interface GameResources {
  agt: number;
  minerals: number;
  gems: number;
  eco: number;
  trust: number;
  income: number;      // New: Pre-calculated income/s
  maintenance: number; // New: Pre-calculated maintenance/s
}

export interface PowerConfig {
  produces?: number;  // Power units produced (solar, generator, etc.)
  consumes?: number;  // Power units required to operate
}

export interface WaterConfig {
  produces?: number;  // Water units produced (well, reservoir)
  consumes?: number;  // Water units required
}

export interface BuildingDef {
  type: BuildingType;
  name: string;
  cost: number;
  desc: string;
  ecoReq: number;
  stats: string;
  width?: number;
  depth?: number;
  buildTime: number;
  dependency?: BuildingType;
  maintenance: number;
  pollution: number;
  production?: number;
  productionType?: 'MINERALS' | 'AGT' | 'ECO' | 'TRUST' | 'GEMS';
  era: Era;
  power?: PowerConfig;
  water?: WaterConfig;
}

export interface LogisticsState {
  autoSell: boolean;
  sellThreshold: number;
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
  | { type: 'FX', fxType: 'MINING' | 'THEFT' | 'ECO_REHAB' | 'DEATH' | 'SMOKE' | 'DUST', index: number };

export type SimulationEffect =
  | GameDiff
  | { type: 'AUDIO', sfx: SfxType };

export interface GameState {
  resources: GameResources;
  grid: GridTile[];
  agents: Agent[];
  jobs: Job[];
  inventory: Partial<Record<BuildingType, number>>;
  selectedBuilding: BuildingType | null;
  selectedAgentId: string | null;
  interactionMode: 'BUILD' | 'BULLDOZE' | 'INSPECT' | 'DIG';
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
}

export interface GameCommand {
  id: string; // Unique ID to prevent double execution
  type: 'PLACE_BUILDING' | 'PLACE_SUB_BUILDING' | 'BULLDOZE' | 'BULLDOZE_SUB' | 'SPEED_UP' | 'REHABILITATE';
  payload: any;
}

export type WeatherType = 'CLEAR' | 'CLOUDY' | 'RAINY' | 'STORM' | 'DUST_STORM' | 'ACID_RAIN';

export interface WeatherState {
  current: WeatherType;
  timeLeft: number; // Ticks remaining
  intensity: number; // 0-1
}

export interface MarketState {
  minerals: ResourceMarket;
  gems: ResourceMarket;
  lastEvent?: string; // e.g. "War in Sector 4"
  eventDuration: number;
}

export interface ResourceMarket {
  basePrice: number;
  currentPrice: number;
  trend: 'STABLE' | 'RISING' | 'FALLING' | 'SPIKE_UP' | 'CRASH_DOWN';
  history: number[]; // For sparkline graph (last 20 ticks)
  volatility: number;
}

export interface Contract {
  id: string;
  description: string;
  resource: 'MINERALS' | 'GEMS';
  amount: number;
  reward: number; // AGT payout
  timeLeft: number; // Seconds
  penalty: number; // Reputation/Trust hit if failed
}

export type Action =
  | { type: 'TICK' }
  | { type: 'SELL_MINERALS' }
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
  | { type: 'COMPLETE_CONTRACT', payload: string }
  | { type: 'SET_INTERACTION_MODE', payload: 'BUILD' | 'BULLDOZE' | 'INSPECT' | 'DIG' }
  | { type: 'CHANGE_LAYER', payload: { delta: number } }
  | { type: 'LOAD_GAME', payload: GameState };
