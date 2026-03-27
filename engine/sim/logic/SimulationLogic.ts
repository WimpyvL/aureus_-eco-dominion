
import { GameState, Agent, BuildingType, GridTile, SimulationEffect, NewsItem, AgentRole } from '../../../types';
import { BUILDINGS } from '../../data/VoxelConstants';
import { FixedContext } from '../../kernel';

// --- CONFIGURATION ---
export const MAX_AGENTS = 30;
export const CAPACITY_PER_QUARTERS = 4;
export const BASE_STORAGE_CAPACITY = 1000;
export const DEPOT_CAPACITY_BONUS = 500;
export const STOCKPILE_CAPACITY_BONUS = 2000;


const NAMES = ["Cass", "Jax", "Val", "Rya", "Kael", "Nyx", "Zane", "Mira", "Leo", "Sora", "Elara", "Teron", "Muna", "Vael", "Koda", "Orin", "Tali", "Vex"];

// --- TYPES & INTERFACES ---

interface Point { x: number; y: number; }

// --- BEHAVIOR TREE / UTILITY AI ---

// Generate random personality with role-based tendencies
function generatePersonality(ctx: FixedContext | undefined, role: AgentRole): { diligence: number; sociability: number; bravery: number; patience: number } {
    const random = ctx?.random;
    const base = () => 0.3 + (random ? random.next() : Math.random()) * 0.4; // 0.3-0.7 base

    let personality = {
        diligence: base(),
        sociability: base(),
        bravery: base(),
        patience: base()
    };

    // Role-based personality modifiers
    switch (role) {
        case 'ENGINEER':
            personality.patience += 0.2;
            personality.diligence += 0.15;
            break;
        case 'MINER':
            personality.bravery += 0.2;
            personality.patience -= 0.1;
            break;
        case 'BOTANIST':
            personality.patience += 0.25;
            personality.sociability += 0.1;
            break;
        case 'SECURITY':
            personality.bravery += 0.3;
            personality.diligence += 0.1;
            break;
        case 'ILLEGAL_MINER':
            personality.bravery += 0.4;
            personality.diligence = 0.9;
            personality.sociability = 0.1;
            break;
        case 'LUMBERJACK':
        case 'QUARRYMAN':
            personality.diligence += 0.2;
            personality.patience += 0.1;
            break;
        case 'CITIZEN':
            personality.sociability += 0.3;
            personality.diligence -= 0.1;
            break;
    }

    // Clamp all values
    return {
        diligence: Math.max(0, Math.min(1, personality.diligence)),
        sociability: Math.max(0, Math.min(1, personality.sociability)),
        bravery: Math.max(0, Math.min(1, personality.bravery)),
        patience: Math.max(0, Math.min(1, personality.patience))
    };
}

// Generate role-appropriate skills
function generateSkills(ctx: FixedContext | undefined, role: AgentRole): { mining: number; construction: number; plants: number; intelligence: number } {
    const random = ctx?.random;
    const base = () => Math.floor((random ? random.next() : Math.random()) * 3) + 1; // 1-3 base
    const bonus = () => Math.floor((random ? random.next() : Math.random()) * 3) + 2; // 2-4 bonus

    let skills = {
        mining: base(),
        construction: base(),
        plants: base(),
        intelligence: base()
    };

    // Role specialization
    switch (role) {
        case 'ENGINEER':
            skills.construction = bonus() + 2;
            skills.intelligence = bonus();
            break;
        case 'MINER':
            skills.mining = bonus() + 2;
            break;
        case 'BOTANIST':
            skills.plants = bonus() + 2;
            skills.intelligence = bonus();
            break;
        case 'SECURITY':
            skills.mining = bonus(); // Combat/strength
            break;
        case 'WORKER':
            const skillKey = ['mining', 'construction', 'plants'][Math.floor((random ? random.next() : Math.random()) * 3)] as keyof typeof skills;
            skills[skillKey] = bonus();
            break;
        case 'LUMBERJACK':
            skills.mining = bonus() + 1; // Strength
            break;
        case 'QUARRYMAN':
            skills.mining = bonus() + 1;
            break;
        case 'CITIZEN':
            skills.intelligence = bonus();
            break;
    }

    return skills;
}

export function createColonist(x: number, z: number, role: AgentRole = 'WORKER', ctx?: FixedContext): Agent {
    const isIllegal = role === 'ILLEGAL_MINER';
    const random = ctx?.random;

    // Assign shift based on role
    let shift: 'DAY' | 'NIGHT' | 'FLEXIBLE' = 'FLEXIBLE';
    if (role === 'BOTANIST') {
        shift = 'DAY'; // Plants need sunlight
    } else if (role === 'SECURITY') {
        shift = 'NIGHT'; // Security patrols at night
    } else if (role === 'MINER' || role === 'ENGINEER') {
        // Mix of shifts for essential workers
        shift = (random ? random.next() : Math.random()) > 0.5 ? 'DAY' : 'NIGHT';
    }

    return {
        id: ctx?.getNextId?.('col') || `col_${Math.random().toString(36).substr(2, 9)}`,
        name: isIllegal ? "Infiltrator" : NAMES[Math.floor((random ? random.next() : Math.random()) * NAMES.length)],
        type: role,
        x, z,
        visualX: x,
        visualZ: z,
        targetX: null,
        targetZ: null,
        path: null,
        state: 'IDLE',
        energy: isIllegal ? 800 : 100,
        hunger: 100,
        mood: 80 + (random ? random.next() : Math.random()) * 20, // Start with good mood (80-100)
        skills: generateSkills(ctx, role),
        currentJobId: null,
        layer: 0,

        // New intelligence features
        personality: generatePersonality(ctx, role),
        memory: {
            knownBuildings: new Map(),
            favoriteSpots: [],
            recentlyVisited: [],
            friendIds: [],
            lastMealTile: null,
            lastSleepTile: null
        },
        experience: {
            buildingsConstructed: 0,
            resourcesMined: 0,
            plantsGrown: 0,
            totalWorkTicks: 0,
            // Skill progress (0-100)
            miningProgress: 0,
            constructionProgress: 0,
            plantsProgress: 0
        },
        workEfficiency: 1.0,
        moveSpeed: 0.9 + (random ? random.next() : Math.random()) * 0.2, // 0.9-1.1 individual variation

        // Shift system
        shift: isIllegal ? 'FLEXIBLE' : shift,
        consecutiveWorkTicks: 0,
        lastBreakTick: 0,

        // No active request initially
        activeRequest: undefined,
        lastAbandonedJobId: null,

        // Inventory
        inventory: {
            type: null,
            amount: 0,
            capacity: 20 // Small capacity as requested
        },

        // Employment System
        profession: role === 'WORKER' ? 'UNEMPLOYED' : role,
        workPlaceX: null,
        workPlaceZ: null
    };
}
