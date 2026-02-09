
export type AgentRole = 'WORKER' | 'MINER' | 'BOTANIST' | 'ENGINEER' | 'SECURITY' | 'ILLEGAL_MINER';

export type JobType = 'BUILD' | 'MINE' | 'DIG' | 'REINFORCE' | 'RESCUE' | 'FARM' | 'REPAIR' | 'RESEARCH' | 'SLEEP' | 'IDLE' | 'MOVE' | 'REHABILITATE' | 'EAT' | 'SOCIALIZE' | 'PATROL' | 'DEPOSIT_RESOURCES';

export interface Job {
    id: string;
    type: JobType;
    targetX: number;
    targetZ: number;
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
    x: number;
    z: number;
    layer: number;
}

export interface AgentInventory {
    type: 'minerals' | 'gems' | 'wood' | 'stone' | null;
    amount: number;
    capacity: number;
}

export interface Agent {
    id: string;
    name: string;
    type: AgentRole;
    x: number;
    z: number;
    targetX: number | null;
    targetZ: number | null;
    path: PathStep[] | null;
    layer: number; // Current vertical layer
    // Visual position for smooth rendering
    visualX?: number;
    visualZ?: number;

    state: 'MOVING' | 'WORKING' | 'IDLE' | 'SLEEPING' | 'EATING' | 'RELAXING' | 'SOCIALIZING' | 'PATROLLING' | 'OFF_DUTY' | 'PLANNING' | 'DEPOSITING';

    // Needs (0-100)
    energy: number;
    hunger: number;
    mood: number;

    // Skills & Stats
    skills: ColonistStats;
    currentJobId: string | null;

    inventory: AgentInventory;

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
