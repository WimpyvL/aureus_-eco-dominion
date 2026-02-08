
import { Era } from './game';
import { GameResources } from './economy';

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
    SAWMILL = 'SAWMILL',
    STONE_QUARRY = 'STONE_QUARRY',
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
    STOCKPILE = 'STOCKPILE',
    STORAGE_EXTENSION = 'STORAGE_EXTENSION',
}

export interface PowerConfig {
    produces?: number;  // Power units produced (solar, generator, etc.)
    consumes?: number;  // Power units required to operate
}

export interface WaterConfig {
    produces?: number;  // Water units produced (well, reservoir)
    consumes?: number;  // Water units required
}

export interface BuildingUpgrade {
    level: number;
    name: string;
    description: string;
    statsDiff: string; // Text description of changes
    costs?: Partial<Record<keyof GameResources, number>>; // Upgrade cost
    // Overrides if defined
    production?: number;
    maintenance?: number;
    pollution?: number;
    power?: PowerConfig;
    water?: WaterConfig;
    era: Era; // Required Era
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
    productionType?: 'MINERALS' | 'AGT' | 'ECO' | 'TRUST' | 'GEMS' | 'WOOD' | 'STONE';
    costs?: Partial<Record<keyof GameResources, number>>;
    era: Era;
    power?: PowerConfig;
    water?: WaterConfig;
    upgrades?: BuildingUpgrade[];
}
