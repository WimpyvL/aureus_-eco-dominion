
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { BuildingType, BuildingDef, GameState, TechId, TechDefinition, Era, EraDef } from '../../types';

export const COLORS = {
  BG: 0x87CEEB, // Sky Blue
  GRID_BASE: 0x5D9E45, // Grass Green
  GRID_HIGHLIGHT: 0x6EBC53, // lighter green
  HIGHLIGHT_VALID: 0x10b981, // Green
  HIGHLIGHT_INVALID: 0xe11d48, // Red
};

export const BUILDINGS: Record<BuildingType, BuildingDef> = {
  [BuildingType.EMPTY]: {
    type: BuildingType.EMPTY,
    name: 'Empty Lot',
    cost: 0,
    desc: 'An empty plot of Zimbabwean soil.',
    ecoReq: 0,
    stats: '',
    buildTime: 0,
    maintenance: 0,
    pollution: 0,
    era: Era.SETTLEMENT
  },
  [BuildingType.ROAD]: {
    type: BuildingType.ROAD,
    name: 'Road',
    cost: 5,
    desc: 'Connects buildings. Cheap infrastructure.',
    ecoReq: 0,
    stats: 'Infrastructure',
    costs: { agt: 50, stone: 10 },
    buildTime: 1,
    maintenance: 0,
    pollution: 0,
    era: Era.SETTLEMENT,
  },
  [BuildingType.PIPE]: {
    type: BuildingType.PIPE,
    name: 'Water Pipe',
    cost: 15,
    desc: 'Connects water sources to industrial buildings.',
    ecoReq: 0,
    stats: 'Infrastructure',
    buildTime: 5,
    maintenance: 0.5,
    pollution: 0,
    era: Era.SETTLEMENT
  },
  [BuildingType.POWER_LINE]: {
    type: BuildingType.POWER_LINE,
    name: 'Power Line',
    cost: 100,
    desc: 'Conducts electricity from generators to buildings.',
    ecoReq: 0,
    stats: 'Infrastructure',
    costs: { agt: 100, stone: 15 },
    buildTime: 3,
    maintenance: 0.5,
    pollution: 0,
    era: Era.SETTLEMENT
  },
  [BuildingType.FENCE]: {
    type: BuildingType.FENCE,
    name: 'Perimeter Fence',
    cost: 8,
    desc: 'Secure your borders. Prevents illegal entry.',
    ecoReq: 0,
    stats: 'Infrastructure',
    buildTime: 2,
    maintenance: 0.1,
    pollution: 0,
    era: Era.SETTLEMENT,
    upgrades: [
      {
        level: 2,
        name: 'Modern Safety Fence',
        description: 'Metal and glass construction.',
        statsDiff: '+Trust',
        costs: { agt: 50, minerals: 5 },
        era: Era.GROWTH,
        maintenance: 0.2
      },
      {
        level: 3,
        name: 'Security Laser Fence',
        description: 'High-intensity laser boundary.',
        statsDiff: 'Blocks Intrusion, +Trust',
        costs: { agt: 200, minerals: 20 },
        era: Era.INDUSTRY,
        maintenance: 0.5,
        power: { consumes: 0.1 }
      },
      {
        level: 4,
        name: 'Force Field Spire',
        description: 'Advanced solid-light emitter.',
        statsDiff: 'Impentrable, +Trust',
        costs: { agt: 1000, gems: 2 },
        era: Era.SUSTAINABILITY,
        maintenance: 1.0,
        power: { consumes: 0.5 }
      }
    ]
  },
  [BuildingType.POND]: {
    type: BuildingType.POND,
    name: 'Water Pond',
    cost: 150,
    desc: 'A small natural body of water.',
    ecoReq: 0,
    stats: 'Water Source',
    buildTime: 0,
    maintenance: 0,
    pollution: -0.1,
    era: Era.INDUSTRY,
    water: { produces: 5 },
  },
  [BuildingType.RESERVOIR]: {
    type: BuildingType.RESERVOIR,
    name: 'Industrial Reservoir',
    cost: 5000,
    desc: 'Large volume water storage and pump station.',
    ecoReq: 15,
    stats: 'High Output Water',
    width: 3,
    depth: 3,
    buildTime: 90,
    maintenance: 40,
    pollution: 0.2,
    production: 5,
    productionType: 'TRUST',
    era: Era.SUSTAINABILITY,
    power: { consumes: 2 },
    water: { produces: 50 },
  },
  [BuildingType.STAFF_QUARTERS]: {
    type: BuildingType.STAFF_QUARTERS,
    name: 'Staff Quarters',
    cost: 1200,
    desc: 'Dense housing for your workforce. Restores Energy.',
    ecoReq: 0,
    stats: '+Energy Recovery',
    width: 2,
    depth: 2,
    buildTime: 15,
    maintenance: 2,
    pollution: 0.6,
    production: 20,
    productionType: 'AGT',
    costs: { agt: 1000, wood: 150, stone: 80 },
    era: Era.SETTLEMENT,
    power: { consumes: 1 },
    water: { consumes: 1 },
    upgrades: [
      {
        level: 2,
        name: 'Prefab Housing',
        description: 'Container-style modular units with AC.',
        statsDiff: 'Capacity 4 → 8, +Comfort',
        costs: { agt: 2000, wood: 200, stone: 100, minerals: 50 },
        era: Era.GROWTH,
        power: { consumes: 2 },
        water: { consumes: 2 },
        maintenance: 4
      },
      {
        level: 3,
        name: 'Row Housing',
        description: 'Brick apartments with full amenities.',
        statsDiff: 'Capacity 8 → 16, +Privacy',
        costs: { agt: 5000, wood: 300, stone: 400, minerals: 100 },
        era: Era.INDUSTRY,
        power: { consumes: 4 },
        water: { consumes: 3 },
        maintenance: 8
      },
      {
        level: 4,
        name: 'Modern Apartments',
        description: 'High-rise living with solar and recycling.',
        statsDiff: 'Capacity 16 → 32, +Eco Living',
        costs: { agt: 15000, stone: 800, minerals: 300, gems: 20 },
        era: Era.SUSTAINABILITY,
        power: { consumes: 6 },
        water: { consumes: 4 },
        maintenance: 12,
        pollution: -0.5
      }
    ]
  },
  [BuildingType.CANTEEN]: {
    type: BuildingType.CANTEEN,
    name: 'Hydro-Canteen',
    cost: 800,
    desc: 'Vertical farm and dining hall. Restores Hunger.',
    ecoReq: 0,
    stats: '+Hunger Recovery',
    width: 2,
    depth: 2,
    buildTime: 20,
    maintenance: 3,
    pollution: -0.5,
    costs: { agt: 800, wood: 300, stone: 200 },
    era: Era.SETTLEMENT,
    power: { consumes: 2 },
    water: { consumes: 2 },
    upgrades: [
      {
        level: 2,
        name: 'Mess Hall',
        description: 'Covered structure with proper kitchen.',
        statsDiff: 'Faster Hunger Recovery',
        costs: { agt: 1500, wood: 350, stone: 300, minerals: 50 },
        era: Era.GROWTH,
        power: { consumes: 4 },
        water: { consumes: 3 },
        maintenance: 6
      },
      {
        level: 3,
        name: 'Dining Complex',
        description: 'Full kitchen with varied menu options.',
        statsDiff: '+Mood from meals',
        costs: { agt: 4000, stone: 500, minerals: 150 },
        era: Era.INDUSTRY,
        power: { consumes: 6 },
        water: { consumes: 5 },
        maintenance: 10
      },
      {
        level: 4,
        name: 'Gourmet Bistro',
        description: 'Modern restaurant with hydroponic garden.',
        statsDiff: 'Premium meals, +Trust',
        costs: { agt: 12000, stone: 600, minerals: 300, gems: 15 },
        era: Era.SUSTAINABILITY,
        power: { consumes: 8 },
        water: { consumes: 6 },
        maintenance: 15,
        pollution: -2.0,
        production: 5
      }
    ]
  },
  [BuildingType.SOCIAL_HUB]: {
    type: BuildingType.SOCIAL_HUB,
    name: 'Solaris Social Hub',
    cost: 1500,
    desc: 'Community gathering area for relaxation.',
    ecoReq: 10,
    stats: '+Mood Recovery',
    width: 2,
    depth: 2,
    buildTime: 30,
    maintenance: 5,
    pollution: 0,
    era: Era.GROWTH,
    upgrades: [
      {
        level: 2,
        name: 'Social Dome',
        description: 'Glass-enclosed community dome.',
        statsDiff: 'Higher Mood, +Trust',
        costs: { agt: 2500, stone: 400, wood: 200 },
        era: Era.GROWTH,
        maintenance: 8,
        production: 2
      },
      {
        level: 3,
        name: 'Civic Plaza',
        description: 'Advanced dual-dome complex with gardens.',
        statsDiff: 'Rapid Mood recovery',
        costs: { agt: 8000, stone: 800, minerals: 200 },
        era: Era.INDUSTRY,
        maintenance: 15,
        power: { consumes: 4 },
        production: 5
      },
      {
        level: 4,
        name: 'Grand Atrium',
        description: 'Modern high-tech social center with holos.',
        statsDiff: 'Max Mood, +15 Trust/s',
        costs: { agt: 25000, minerals: 800, gems: 30 },
        era: Era.SUSTAINABILITY,
        maintenance: 30,
        power: { consumes: 8 },
        production: 15
      }
    ]
  },
  [BuildingType.SECURITY_POST]: {
    type: BuildingType.SECURITY_POST,
    name: 'Security Post',
    cost: 600,
    desc: 'Tower monitors activity to prevent theft.',
    ecoReq: 0,
    stats: 'Stops Theft',
    buildTime: 25,
    dependency: BuildingType.STAFF_QUARTERS,
    maintenance: 5,
    pollution: 0,
    production: 1,
    productionType: 'TRUST',
    era: Era.GROWTH,
    upgrades: [
      {
        level: 2,
        name: 'Metal Guard Tower',
        description: 'Taller tower with searchlights.',
        statsDiff: '+2 Trust/s, Wider sight',
        costs: { agt: 1500, minerals: 100 },
        era: Era.GROWTH,
        maintenance: 8,
        production: 2
      },
      {
        level: 3,
        name: 'Armored Bunker',
        description: 'Reinforced concrete post with radar.',
        statsDiff: '+5 Trust/s, +Radar',
        costs: { agt: 5000, stone: 600, minerals: 200 },
        era: Era.INDUSTRY,
        maintenance: 15,
        power: { consumes: 2 },
        production: 5
      },
      {
        level: 4,
        name: 'Sensor Spire',
        description: 'Modern high-tech sensor and drone array.',
        statsDiff: '+10 Trust/s, Global Scan',
        costs: { agt: 15000, minerals: 600, gems: 20 },
        era: Era.SUSTAINABILITY,
        maintenance: 25,
        power: { consumes: 5 },
        production: 10
      }
    ]
  },
  [BuildingType.WASH_PLANT]: {
    type: BuildingType.WASH_PLANT,
    name: 'Industrial Wash Plant',
    cost: 1200,
    desc: 'Massive throughput for ore cleaning. Highly polluting.',
    ecoReq: 0,
    stats: '+25 Minerals/s',
    width: 2,
    depth: 2,
    buildTime: 45,
    dependency: BuildingType.STAFF_QUARTERS,
    maintenance: 10,
    pollution: 12.0,
    production: 35,
    productionType: 'MINERALS',
    costs: { agt: 1200, stone: 500 },
    era: Era.SETTLEMENT,
    power: { consumes: 5 },
    water: { consumes: 5 },
    upgrades: [
      {
        level: 2,
        name: 'Trommel Station',
        description: 'Rotating drum for better ore separation.',
        statsDiff: '+50 Min/s',
        costs: { agt: 3000, wood: 500, stone: 400 },
        era: Era.GROWTH,
        power: { consumes: 8 },
        water: { consumes: 8 },
        maintenance: 15,
        production: 50,
        pollution: 10.0
      },
      {
        level: 3,
        name: 'Vibrating Wash Plant',
        description: 'Industrial metal shaking screens.',
        statsDiff: '+80 Min/s',
        costs: { agt: 10000, stone: 800, minerals: 400 },
        era: Era.INDUSTRY,
        power: { consumes: 12 },
        water: { consumes: 12 },
        maintenance: 25,
        production: 80,
        pollution: 8.0
      },
      {
        level: 4,
        name: 'Hydro-Wash Complex',
        description: 'Automated high-pressure cleaning.',
        statsDiff: '+120 Min/s, -Pol',
        costs: { agt: 30000, stone: 1500, minerals: 800, gems: 40 },
        era: Era.SUSTAINABILITY,
        power: { consumes: 20 },
        water: { consumes: 15 },
        maintenance: 40,
        production: 120,
        pollution: 4.0
      }
    ]
  },
  [BuildingType.RECYCLING_PLANT]: {
    type: BuildingType.RECYCLING_PLANT,
    name: 'Recycling Complex',
    cost: 3000,
    desc: 'Clean industrial processing with high efficiency.',
    ecoReq: 30,
    stats: '+20 Min/s, Low Pol',
    width: 2,
    depth: 2,
    buildTime: 60,
    dependency: BuildingType.STAFF_QUARTERS,
    maintenance: 5,
    pollution: 1.0,
    production: 20,
    productionType: 'MINERALS',
    era: Era.INDUSTRY,
    power: { consumes: 8 },
    water: { consumes: 3 },
  },
  [BuildingType.SOLAR_ARRAY]: {
    type: BuildingType.SOLAR_ARRAY,
    name: 'Solar Array',
    cost: 500,
    desc: 'High-density photovoltaic panels.',
    ecoReq: 0,
    stats: 'Regens Eco, +5 Power',
    width: 2,
    depth: 1,
    buildTime: 20,
    maintenance: 2,
    pollution: -2.0,
    era: Era.SETTLEMENT,
    power: { produces: 5 },
    upgrades: [
      {
        level: 2,
        name: 'Industrial Fixed Array',
        description: 'Reinforced metal frames with better cells.',
        statsDiff: '+10 Power',
        costs: { agt: 1200, minerals: 50 },
        era: Era.GROWTH,
        power: { produces: 10 },
        maintenance: 4
      },
      {
        level: 3,
        name: 'Tracking Solar Mast',
        description: 'Sun-tracking dual-axis array.',
        statsDiff: '+20 Power',
        costs: { agt: 4000, minerals: 150, gems: 5 },
        era: Era.INDUSTRY,
        power: { produces: 20 },
        maintenance: 8
      },
      {
        level: 4,
        name: 'Energy Concentrator',
        description: 'Advanced high-efficiency energy tower.',
        statsDiff: '+50 Power',
        costs: { agt: 15000, minerals: 400, gems: 25 },
        era: Era.SUSTAINABILITY,
        power: { produces: 50 },
        maintenance: 15,
        pollution: -5.0
      }
    ]
  },
  [BuildingType.COMMUNITY_GARDEN]: {
    type: BuildingType.COMMUNITY_GARDEN,
    name: 'Urban Garden',
    cost: 600,
    desc: 'Green space that fosters local community trust.',
    ecoReq: 0,
    stats: '+4 Trust/s',
    width: 2,
    depth: 2,
    buildTime: 50,
    maintenance: 3,
    pollution: -1.5,
    production: 4,
    productionType: 'TRUST',
    era: Era.GROWTH,
    upgrades: [
      {
        level: 2,
        name: 'Raised Planter Beds',
        description: 'Organized wooden beds with irrigation.',
        statsDiff: '+8 Trust/s, -2 Pollution',
        costs: { agt: 1200, wood: 400, stone: 200 },
        era: Era.GROWTH,
        maintenance: 5,
        production: 8,
        pollution: -2.0
      },
      {
        level: 3,
        name: 'Stone-Walled Garden',
        description: 'Beautiful stonework with a central fountain.',
        statsDiff: '+15 Trust/s, -4 Pollution',
        costs: { agt: 4000, stone: 800, minerals: 200 },
        era: Era.INDUSTRY,
        maintenance: 10,
        production: 15,
        pollution: -4.0
      },
      {
        level: 4,
        name: 'Hydroponic Biosphere',
        description: 'Full-enclosed modern high-tech garden.',
        statsDiff: '+30 Trust/s, -10 Pollution',
        costs: { agt: 15000, stone: 1000, minerals: 500, gems: 25 },
        era: Era.SUSTAINABILITY,
        maintenance: 20,
        production: 30,
        pollution: -10.0
      }
    ]
  },
  [BuildingType.WATER_WELL]: {
    type: BuildingType.WATER_WELL,
    name: 'Deep-Well Pump',
    cost: 1200,
    desc: 'Draws clean water from aquifers.',
    ecoReq: 5,
    stats: '+2 Trust/s, +10 Water',
    buildTime: 40,
    maintenance: 5,
    pollution: 0,
    production: 2,
    productionType: 'TRUST',
    era: Era.SETTLEMENT,
    water: { produces: 10 },
    upgrades: [
      {
        level: 2,
        name: 'Wind-Powered Pump',
        description: 'Mechanical pump with wind-vane assist.',
        statsDiff: '+20 Water',
        costs: { agt: 2000, wood: 400, stone: 200 },
        era: Era.GROWTH,
        water: { produces: 20 },
        maintenance: 8
      },
      {
        level: 3,
        name: 'Electric Pump Station',
        description: 'Industrial high-pressure electric pump.',
        statsDiff: '+40 Water',
        costs: { agt: 6000, stone: 500, minerals: 200 },
        era: Era.INDUSTRY,
        power: { consumes: 2 },
        water: { produces: 40 },
        maintenance: 12
      },
      {
        level: 4,
        name: 'Purification Tower',
        description: 'Modern water treatment and pumping.',
        statsDiff: '+80 Water, +Trust',
        costs: { agt: 20000, stone: 800, minerals: 500, gems: 30 },
        era: Era.SUSTAINABILITY,
        power: { consumes: 5 },
        water: { produces: 80 },
        maintenance: 20,
        production: 6
      }
    ]
  },
  [BuildingType.WIND_TURBINE]: {
    type: BuildingType.WIND_TURBINE,
    name: 'Wind Turbine',
    cost: 2500,
    desc: 'Tall turbine harnessing renewable wind energy.',
    ecoReq: 10,
    stats: 'Massive Eco Regen, +8 Power',
    buildTime: 90,
    maintenance: 3,
    pollution: -6.0,
    era: Era.GROWTH,
    power: { produces: 8 },
    upgrades: [
      {
        level: 2,
        name: 'Modern Wind Tower',
        description: 'Sleek metal construction with optimized blades.',
        statsDiff: '+15 Power, -8 Poll.',
        costs: { agt: 4000, minerals: 150 },
        era: Era.GROWTH,
        maintenance: 6,
        power: { produces: 15 },
        pollution: -8.0
      },
      {
        level: 3,
        name: 'Dual-Rotor Industrial',
        description: 'Two counter-rotating rotors for maximum torque.',
        statsDiff: '+40 Power, -12 Poll.',
        costs: { agt: 12000, minerals: 500, gems: 10 },
        era: Era.INDUSTRY,
        maintenance: 12,
        power: { produces: 40 },
        pollution: -12.0
      },
      {
        level: 4,
        name: 'Vertical Axis Spiral',
        description: 'Space-saving spiral blades with peak efficiency.',
        statsDiff: '+100 Power, -20 Poll.',
        costs: { agt: 35000, minerals: 1200, gems: 40 },
        era: Era.SUSTAINABILITY,
        maintenance: 25,
        power: { produces: 100 },
        pollution: -20.0
      }
    ]
  },
  [BuildingType.LOCAL_SCHOOL]: {
    type: BuildingType.LOCAL_SCHOOL,
    name: 'Education Center',
    cost: 12000, // Increased for 3x3
    desc: 'Large campus with classrooms, library, and sports facilities.',
    ecoReq: 20,
    stats: '+25 Trust/s',
    width: 3,
    depth: 3,
    buildTime: 300, // Longer build time
    maintenance: 25,
    pollution: 0.3,
    production: 25, // Increased production
    productionType: 'TRUST',
    era: Era.SUSTAINABILITY
  },
  [BuildingType.SAFARI_LODGE]: {
    type: BuildingType.SAFARI_LODGE,
    name: 'Eco-Lodge Resort',
    cost: 35000, // Increased for 3x3
    desc: 'Luxury sustainable tourism resort with multiple lodges.',
    ecoReq: 40,
    stats: '+150 AGT/s',
    width: 3,
    depth: 3,
    buildTime: 500, // Longer build time
    maintenance: 30,
    pollution: 1.5, // Less pollution for eco building
    production: 150, // Better production for cost
    productionType: 'AGT',
    era: Era.PROSPERITY
  },
  [BuildingType.GREEN_TECH_LAB]: {
    type: BuildingType.GREEN_TECH_LAB,
    name: 'Research Biosphere',
    cost: 80000, // Increased for 3x3
    desc: 'Massive research complex for planetary restoration technology.',
    ecoReq: 60,
    stats: 'Extreme Eco Regen',
    width: 3,
    depth: 3,
    buildTime: 1000, // Very long build time
    maintenance: 50,
    pollution: -40.0, // Massive eco benefit
    era: Era.PROSPERITY
  },
  [BuildingType.MINING_HEADFRAME]: {
    type: BuildingType.MINING_HEADFRAME,
    name: 'Mining Headframe',
    cost: 2500,
    desc: 'Massive industrial mining tower with ore extraction wheel. High throughput.',
    ecoReq: 0,
    stats: '+60 Minerals/s',
    width: 4,
    depth: 4,
    buildTime: 300,
    dependency: BuildingType.WASH_PLANT,
    maintenance: 15,
    pollution: 15.0,
    production: 60,
    productionType: 'MINERALS',
    era: Era.SETTLEMENT,
    power: { consumes: 10 },
    water: { consumes: 2 },
    upgrades: [
      {
        level: 2,
        name: 'Steel Derrick',
        description: 'Reinforced steel structure with pulley system.',
        statsDiff: '+90 Minerals/s',
        costs: { agt: 6000, stone: 800, minerals: 300 },
        era: Era.GROWTH,
        power: { consumes: 15 },
        water: { consumes: 3 },
        maintenance: 22,
        production: 90,
        pollution: 12.0
      },
      {
        level: 3,
        name: 'Industrial Derrick',
        description: 'Heavy-duty mine with double-cable hoist.',
        statsDiff: '+120 Minerals/s',
        costs: { agt: 15000, stone: 1200, minerals: 600 },
        era: Era.INDUSTRY,
        power: { consumes: 20 },
        water: { consumes: 4 },
        maintenance: 30,
        production: 120,
        pollution: 10.0
      },
      {
        level: 4,
        name: 'Automated Mine Complex',
        description: 'Modern automated extraction with reduced emissions.',
        statsDiff: '+180 Minerals/s, -Pollution',
        costs: { agt: 40000, stone: 2000, minerals: 1000, gems: 50 },
        era: Era.SUSTAINABILITY,
        power: { consumes: 25 },
        water: { consumes: 5 },
        maintenance: 40,
        production: 180,
        pollution: 6.0
      }
    ]
  },
  [BuildingType.ORE_FOUNDRY]: {
    type: BuildingType.ORE_FOUNDRY,
    name: 'Ore Foundry',
    cost: 25000,
    desc: 'High-temperature smelting facility. Converts raw ore to refined materials.',
    ecoReq: 10,
    stats: '+40 Min/s, +Gems',
    width: 3,
    depth: 3,
    buildTime: 400,
    dependency: BuildingType.WASH_PLANT,
    maintenance: 25,
    pollution: 18.0,
    production: 40,
    productionType: 'MINERALS',
    era: Era.INDUSTRY,
    power: { consumes: 15 },
  },
  [BuildingType.SAWMILL]: {
    type: BuildingType.SAWMILL,
    name: 'Industrial Sawmill',
    cost: 1500,
    desc: 'Efficiently processes timber from the surrounding area.',
    ecoReq: 0,
    stats: '+25 Wood/s',
    width: 2,
    depth: 2,
    buildTime: 40,
    maintenance: 4,
    pollution: 1.5,
    production: 25,
    productionType: 'WOOD',
    costs: { agt: 1500, stone: 100 },
    era: Era.SETTLEMENT,
    power: { consumes: 5 },
    upgrades: [
      {
        level: 2,
        name: 'Steam-Powered Mill',
        description: 'High-power circular saws with steam assist.',
        statsDiff: '+40 Wood/s',
        costs: { agt: 3000, wood: 600, stone: 400 },
        era: Era.GROWTH,
        power: { consumes: 8 },
        maintenance: 8,
        production: 40
      },
      {
        level: 3,
        name: 'Electric Sawmill',
        description: 'Massive electric band saws with conveyors.',
        statsDiff: '+70 Wood/s',
        costs: { agt: 8000, stone: 600, minerals: 200 },
        era: Era.INDUSTRY,
        power: { consumes: 12 },
        maintenance: 15,
        production: 70
      },
      {
        level: 4,
        name: 'Automated Wood Tech',
        description: 'Laser-cutting precision wood processing.',
        statsDiff: '+120 Wood/s',
        costs: { agt: 20000, stone: 1000, minerals: 500, gems: 20 },
        era: Era.SUSTAINABILITY,
        power: { consumes: 18 },
        maintenance: 25,
        production: 120,
        pollution: 0.5
      }
    ]
  },
  [BuildingType.STONE_QUARRY]: {
    type: BuildingType.STONE_QUARRY,
    name: 'Stone Quarry',
    cost: 1200,
    desc: 'Excavates stone and processes rock into usable materials.',
    ecoReq: 0,
    stats: '+25 Stone/s',
    width: 2,
    depth: 2,
    buildTime: 45,
    maintenance: 5,
    pollution: 4.0,
    production: 25,
    productionType: 'STONE',
    costs: { agt: 1200, wood: 200 },
    era: Era.SETTLEMENT,
    power: { consumes: 6 },
    upgrades: [
      {
        level: 2,
        name: 'Mechanized Quarry',
        description: 'Scaffolding and hoists for easier extraction.',
        statsDiff: '+45 Stone/s',
        costs: { agt: 2500, wood: 600, stone: 400 },
        era: Era.GROWTH,
        power: { consumes: 10 },
        maintenance: 10,
        production: 45,
        pollution: 3.0
      },
      {
        level: 3,
        name: 'Industrial Excavation',
        description: 'Heavy machinery and mechanical splitters.',
        statsDiff: '+80 Stone/s',
        costs: { agt: 10000, stone: 1000, minerals: 400 },
        era: Era.INDUSTRY,
        power: { consumes: 16 },
        maintenance: 20,
        production: 80,
        pollution: 2.0
      },
      {
        level: 4,
        name: 'Precision Stone Core',
        description: 'Laser-cutting and automated block logistics.',
        statsDiff: '+140 Stone/s',
        costs: { agt: 25000, stone: 1500, minerals: 800, gems: 30 },
        era: Era.SUSTAINABILITY,
        power: { consumes: 24 },
        maintenance: 35,
        production: 140,
        pollution: 1.0
      }
    ]
  },
  [BuildingType.STORAGE_DEPOT]: {
    type: BuildingType.STORAGE_DEPOT,
    name: 'Storage Depot',
    cost: 600,
    desc: 'Expands mineral storage capacity by 500 units.',
    ecoReq: 0,
    stats: '+500 Storage',
    width: 2,
    depth: 2,
    buildTime: 30,
    maintenance: 1,
    pollution: 0.2,
    era: Era.SETTLEMENT,
    upgrades: [
      {
        level: 2,
        name: 'Covered Warehouse',
        description: 'Weather-protected storage structure.',
        statsDiff: '+1000 Storage',
        costs: { agt: 1200, wood: 400, stone: 200 },
        era: Era.GROWTH,
        maintenance: 2
      },
      {
        level: 3,
        name: 'Metal Warehouse',
        description: 'Industrial warehouse with loading dock.',
        statsDiff: '+2000 Storage',
        costs: { agt: 3500, stone: 600, minerals: 200 },
        era: Era.INDUSTRY,
        power: { consumes: 2 },
        maintenance: 4
      },
      {
        level: 4,
        name: 'Distribution Center',
        description: 'Automated logistics hub with conveyors.',
        statsDiff: '+5000 Storage, +Efficiency',
        costs: { agt: 10000, stone: 800, minerals: 400, gems: 25 },
        era: Era.SUSTAINABILITY,
        power: { consumes: 6 },
        maintenance: 8
      }
    ]
  },
  [BuildingType.STORAGE_EXTENSION]: {
    type: BuildingType.STORAGE_EXTENSION,
    name: 'Storage Extension',
    cost: 300,
    desc: 'Expands adjacent storage capacity.',
    ecoReq: 0,
    stats: '+250 Storage',
    width: 2,
    depth: 1,
    buildTime: 15,
    dependency: BuildingType.STORAGE_DEPOT,
    maintenance: 0.5,
    pollution: 0.1,
    era: Era.SETTLEMENT,
    upgrades: [
      {
        level: 2,
        name: 'Industrial Rack Ext.',
        description: 'Metal racks for vertical storage.',
        statsDiff: '+600 Storage',
        costs: { agt: 500, stone: 100, wood: 100 },
        era: Era.GROWTH,
        maintenance: 1.0
      },
      {
        level: 3,
        name: 'Container Bay Ext.',
        description: 'Enclosed industrial storage containers.',
        statsDiff: '+1500 Storage',
        costs: { agt: 2000, minerals: 200 },
        era: Era.INDUSTRY,
        maintenance: 2.5
      },
      {
        level: 4,
        name: 'Compressed Vault Ext.',
        description: 'High-density nanotech extension.',
        statsDiff: '+4000 Storage',
        costs: { agt: 10000, gems: 10 },
        era: Era.SUSTAINABILITY,
        maintenance: 6.0
      }
    ]
  },
  [BuildingType.STOCKPILE]: {
    type: BuildingType.STOCKPILE,
    name: 'Logistics Stockpile',
    cost: 3500,
    desc: 'Massive resource capacity booster.',
    ecoReq: 0,
    stats: '+2000 Capacity',
    width: 3,
    depth: 3,
    buildTime: 60,
    maintenance: 5,
    pollution: 0.5,
    costs: { agt: 1500, wood: 400, stone: 300 },
    era: Era.GROWTH,
    upgrades: [
      {
        level: 2,
        name: 'Enclosed Stockpile',
        description: 'Weather-proof industrial storage bins.',
        statsDiff: '+5000 Capacity',
        costs: { agt: 6000, stone: 800, minerals: 200 },
        era: Era.GROWTH,
        maintenance: 10
      },
      {
        level: 3,
        name: 'Automated Silos',
        description: 'Computer-controlled vertical storage.',
        statsDiff: '+12000 Capacity',
        costs: { agt: 20000, minerals: 800, gems: 10 },
        era: Era.INDUSTRY,
        maintenance: 25,
        power: { consumes: 5 }
      },
      {
        level: 4,
        name: 'Nanotech Vault',
        description: 'Super-dense nanostructure storage.',
        statsDiff: '+50000 Capacity',
        costs: { agt: 80000, minerals: 2000, gems: 50 },
        era: Era.SUSTAINABILITY,
        maintenance: 60,
        power: { consumes: 15 }
      }
    ]
  },
  [BuildingType.WORKSHOP]: {
    type: BuildingType.WORKSHOP,
    name: 'Workshop',
    cost: 900,
    desc: 'Speeds up construction in nearby buildings by 25%.',
    ecoReq: 0,
    stats: '+25% Build Speed',
    width: 2,
    depth: 2,
    buildTime: 45,
    maintenance: 2,
    pollution: 0.5,
    era: Era.SETTLEMENT
  },
  [BuildingType.GENERATOR]: {
    type: BuildingType.GENERATOR,
    name: 'Fuel Generator',
    cost: 1800,
    desc: 'Provides power but produces pollution.',
    ecoReq: 0,
    stats: '+10 Power',
    buildTime: 40,
    maintenance: 4,
    pollution: 3.0,
    era: Era.GROWTH,
    power: { produces: 10 },
    upgrades: [
      {
        level: 2,
        name: 'Industrial Diesel Unit',
        description: 'More efficient metal-encased motor.',
        statsDiff: '+25 Power',
        costs: { agt: 3000, minerals: 100 },
        era: Era.GROWTH,
        maintenance: 10,
        power: { produces: 25 },
        pollution: 5.0
      },
      {
        level: 3,
        name: 'Dual-Turbine Gen',
        description: 'High-speed industrial twin turbines.',
        statsDiff: '+60 Power',
        costs: { agt: 10000, minerals: 400, gems: 5 },
        era: Era.INDUSTRY,
        maintenance: 20,
        power: { produces: 60 },
        pollution: 8.0
      },
      {
        level: 4,
        name: 'Fusion Mini-Reactor',
        description: 'Next-gen fusion power. Clean and massive.',
        statsDiff: '+200 Power, -Pollution',
        costs: { agt: 40000, stone: 1000, minerals: 1000, gems: 50 },
        era: Era.SUSTAINABILITY,
        maintenance: 50,
        power: { produces: 200 },
        pollution: 0.5
      }
    ]
  },
  // ═══════════════════════════════════════════════════════════════
  // ERA 2: GROWTH - New Buildings
  // ═══════════════════════════════════════════════════════════════
  [BuildingType.MEDICAL_BAY]: {
    type: BuildingType.MEDICAL_BAY,
    name: 'Medical Bay',
    cost: 2000,
    desc: 'Facility boosts max energy and heals agents.',
    ecoReq: 0,
    stats: '+Healing, +10 Max Energy',
    width: 2,
    depth: 2,
    buildTime: 60,
    maintenance: 5,
    pollution: 0.3,
    era: Era.GROWTH,
    power: { consumes: 3 },
    upgrades: [
      {
        level: 2,
        name: 'Modern Clinic',
        description: 'Permanent structure with proper triage.',
        statsDiff: '+20 Max Energy',
        costs: { agt: 4000, stone: 500, minerals: 100 },
        era: Era.GROWTH,
        maintenance: 10,
        power: { consumes: 5 }
      },
      {
        level: 3,
        name: 'Advanced Med-Center',
        description: 'High-tech surgical wing with drones.',
        statsDiff: '+40 Max Energy',
        costs: { agt: 12000, stone: 800, minerals: 300 },
        era: Era.INDUSTRY,
        maintenance: 20,
        power: { consumes: 10 }
      },
      {
        level: 4,
        name: 'Regenerative Biosphere',
        description: 'Modern genetic and bio-reconstruction hub.',
        statsDiff: '+80 Max Energy, -Poll.',
        costs: { agt: 30000, minerals: 600, gems: 40 },
        era: Era.SUSTAINABILITY,
        maintenance: 35,
        power: { consumes: 15 },
        pollution: -1.0
      }
    ]
  },
  [BuildingType.TRAINING_CENTER]: {
    type: BuildingType.TRAINING_CENTER,
    name: 'Training Center',
    cost: 2500,
    desc: 'Skill academy where workers gain abilities faster.',
    ecoReq: 0,
    stats: '+50% Skill Gain',
    width: 2,
    depth: 2,
    buildTime: 80,
    maintenance: 4,
    pollution: 0.2,
    era: Era.GROWTH,
    power: { consumes: 2 },
    upgrades: [
      {
        level: 2,
        name: 'Technical School',
        description: 'Dedicated building with classrooms.',
        statsDiff: '+75% Skill Gain',
        costs: { agt: 5000, minerals: 200 },
        era: Era.GROWTH,
        maintenance: 10,
        power: { consumes: 4 }
      },
      {
        level: 3,
        name: 'Industrial Institute',
        description: 'Advanced laboratories and workshops.',
        statsDiff: '+120% Skill Gain',
        costs: { agt: 15000, minerals: 500, stone: 600 },
        era: Era.INDUSTRY,
        maintenance: 25,
        power: { consumes: 8 }
      },
      {
        level: 4,
        name: 'Holographic Academy',
        description: 'AI-driven training with virtual reality.',
        statsDiff: '+250% Skill Gain',
        costs: { agt: 40000, minerals: 1000, gems: 50 },
        era: Era.SUSTAINABILITY,
        maintenance: 50,
        power: { consumes: 15 }
      }
    ]
  },
  // ═══════════════════════════════════════════════════════════════
  // ERA 3: INDUSTRY - New Buildings
  // ═══════════════════════════════════════════════════════════════
  [BuildingType.GEM_REFINERY]: {
    type: BuildingType.GEM_REFINERY,
    name: 'Gem Refinery',
    cost: 15000,
    desc: 'Precision facility that extracts gems from raw ore.',
    ecoReq: 20,
    stats: '+5 Gems/min',
    width: 2,
    depth: 2,
    buildTime: 200,
    dependency: BuildingType.ORE_FOUNDRY,
    maintenance: 15,
    pollution: 5.0,
    production: 5,
    productionType: 'GEMS',
    era: Era.INDUSTRY,
    power: { consumes: 10 },
    water: { consumes: 3 },
  },
  [BuildingType.RAIL_LINE]: {
    type: BuildingType.RAIL_LINE,
    name: 'Rail Line',
    cost: 50,
    desc: 'Industrial track for fast resource transport.',
    ecoReq: 0,
    stats: '3x Transport Speed',
    buildTime: 5,
    maintenance: 0.2,
    pollution: 0.1,
    era: Era.INDUSTRY,
  },
  [BuildingType.DISTRIBUTION_HUB]: {
    type: BuildingType.DISTRIBUTION_HUB,
    name: 'Distribution Hub',
    cost: 8000,
    desc: 'Logistics center that auto-delivers resources to nearby buildings.',
    ecoReq: 10,
    stats: 'Auto-Distribute',
    width: 2,
    depth: 2,
    buildTime: 120,
    maintenance: 8,
    pollution: 1.0,
    era: Era.INDUSTRY,
    power: { consumes: 5 },
  },
  // ═══════════════════════════════════════════════════════════════
  // ERA 4: SUSTAINABILITY - New Buildings
  // ═══════════════════════════════════════════════════════════════
  [BuildingType.WASTE_TREATMENT]: {
    type: BuildingType.WASTE_TREATMENT,
    name: 'Waste Treatment',
    cost: 10000,
    desc: 'Advanced facility that reduces pollution from all buildings by 20%.',
    ecoReq: 40,
    stats: '-20% Global Pollution',
    width: 2,
    depth: 2,
    buildTime: 150,
    maintenance: 12,
    pollution: -5.0,
    era: Era.SUSTAINABILITY,
    power: { consumes: 8 },
    water: { consumes: 5 },
  },
  [BuildingType.NATURE_RESERVE]: {
    type: BuildingType.NATURE_RESERVE,
    name: 'Nature Reserve',
    cost: 8000,
    desc: 'Protected wilderness area with massive eco regeneration and wildlife.',
    ecoReq: 50,
    stats: 'Extreme Eco Regen',
    width: 4,
    depth: 4,
    buildTime: 200,
    maintenance: 10,
    pollution: -15.0,
    production: 10,
    productionType: 'TRUST',
    era: Era.SUSTAINABILITY,
  },
  [BuildingType.HYDROPONICS]: {
    type: BuildingType.HYDROPONICS,
    name: 'Hydroponics Farm',
    cost: 6000,
    desc: 'Vertical food production with eco benefits.',
    ecoReq: 30,
    stats: '+Food, -2 Pollution',
    width: 2,
    depth: 2,
    buildTime: 100,
    maintenance: 6,
    pollution: -2.0,
    era: Era.SUSTAINABILITY,
    power: { consumes: 4 },
    water: { consumes: 8 },
  },
  [BuildingType.GEOTHERMAL_PLANT]: {
    type: BuildingType.GEOTHERMAL_PLANT,
    name: 'Geothermal Plant',
    cost: 18000,
    desc: 'Deep earth power that works day and night.',
    ecoReq: 35,
    stats: '+50 Power (24/7)',
    width: 2,
    depth: 2,
    buildTime: 180,
    maintenance: 8,
    pollution: 0.5,
    era: Era.SUSTAINABILITY,
    power: { produces: 50 },
  },
  // ═══════════════════════════════════════════════════════════════
  // ERA 5: PROSPERITY - New Buildings
  // ═══════════════════════════════════════════════════════════════
  [BuildingType.MONUMENT]: {
    type: BuildingType.MONUMENT,
    name: 'Victory Monument',
    cost: 50000,
    desc: 'A grand monument celebrating your sustainable success. Victory condition.',
    ecoReq: 90,
    stats: 'Victory Trigger',
    width: 2,
    depth: 2,
    buildTime: 500,
    maintenance: 0,
    pollution: 0,
    production: 50,
    productionType: 'TRUST',
    era: Era.PROSPERITY,
  },
  [BuildingType.SPACEPORT]: {
    type: BuildingType.SPACEPORT,
    name: 'Orbital Spaceport',
    cost: 100000,
    desc: 'Launch facility to export minerals to orbit for 10x price.',
    ecoReq: 80,
    stats: '10x Export Value',
    width: 5,
    depth: 5,
    buildTime: 1000,
    maintenance: 50,
    pollution: 10.0,
    era: Era.PROSPERITY,
    power: { consumes: 100 },
  },
  [BuildingType.SUPPORT_PILLAR]: {
    type: BuildingType.SUPPORT_PILLAR,
    name: 'Support Pillar',
    cost: 150,
    desc: 'Reinforces tunnels.',
    ecoReq: 0,
    stats: 'Structural',
    buildTime: 10,
    maintenance: 0.2,
    pollution: 0,
    era: Era.SETTLEMENT,
  },
  [BuildingType.MINING_DRILL]: {
    type: BuildingType.MINING_DRILL,
    name: 'Auto-Drill',
    cost: 2500,
    desc: 'Automated subterranean extraction.',
    ecoReq: 0,
    stats: '+15 Minerals/s',
    buildTime: 60,
    maintenance: 12,
    pollution: 5.0,
    production: 15,
    productionType: 'MINERALS',
    era: Era.SETTLEMENT,
    power: { consumes: 8 },
    upgrades: [
      {
        level: 2,
        name: 'Industrial Fixed Drill',
        description: 'Heavy metal motor with rotating cutters.',
        statsDiff: '+30 Min/s',
        costs: { agt: 1500, stone: 200, minerals: 50 },
        era: Era.GROWTH,
        power: { consumes: 12 },
        maintenance: 18,
        production: 30
      },
      {
        level: 3,
        name: 'Dual-Head Auto-Drill',
        description: 'Advanced dual-rotor automated extraction.',
        statsDiff: '+60 Min/s',
        costs: { agt: 5000, stone: 600, minerals: 200 },
        era: Era.INDUSTRY,
        power: { consumes: 20 },
        maintenance: 30,
        production: 60
      },
      {
        level: 4,
        name: 'Thermal-Lance Borer',
        description: 'Clean high-energy thermal extraction.',
        statsDiff: '+120 Min/s, -Poll.',
        costs: { agt: 20000, minerals: 600, gems: 40 },
        era: Era.SUSTAINABILITY,
        power: { consumes: 35 },
        maintenance: 50,
        production: 120,
        pollution: 1.0
      }
    ]
  },
  [BuildingType.UNDERGROUND_FANS]: {
    type: BuildingType.UNDERGROUND_FANS,
    name: 'Ventilation Fans',
    cost: 1200,
    desc: 'Improves air quality and agent comfort.',
    ecoReq: 5,
    stats: '+Mood',
    buildTime: 30,
    maintenance: 5,
    pollution: 0.1,
    era: Era.SETTLEMENT,
    power: { consumes: 4 },
    upgrades: [
      {
        level: 2,
        name: 'Industrial Fan Unit',
        description: 'Metal-encased high-flow ventilation.',
        statsDiff: 'Higher Mood boost',
        costs: { agt: 800, wood: 200, stone: 100 },
        era: Era.GROWTH,
        maintenance: 8,
        power: { consumes: 6 }
      },
      {
        level: 3,
        name: 'High-Pressure Rotors',
        description: 'Dual-rotor industrial air handling.',
        statsDiff: 'Rapid health recovery',
        costs: { agt: 3000, stone: 400, minerals: 100 },
        era: Era.INDUSTRY,
        maintenance: 15,
        power: { consumes: 12 }
      },
      {
        level: 4,
        name: 'Atmospheric Scrubber',
        description: 'Modern high-tech air filtration.',
        statsDiff: 'Max Mood, +Eco benefit',
        costs: { agt: 10000, minerals: 400, gems: 20 },
        era: Era.SUSTAINABILITY,
        maintenance: 25,
        power: { consumes: 20 },
        pollution: -1.0
      }
    ]
  },
  [BuildingType.ORE_EXTRACTOR]: {
    type: BuildingType.ORE_EXTRACTOR,
    name: 'Ore Extractor',
    cost: 4500,
    desc: 'Advanced subterranean resource extraction.',
    ecoReq: 0,
    stats: 'High Volume Minerals',
    buildTime: 80,
    maintenance: 25,
    pollution: 8.0,
    production: 30,
    productionType: 'MINERALS',
    era: Era.GROWTH,
    power: { consumes: 20 },
    upgrades: [
      {
        level: 2,
        name: 'Industrial Boring Rig',
        description: 'Reinforced metal extractor cylinder.',
        statsDiff: '+60 Minerals/s',
        costs: { agt: 8000, stone: 800, minerals: 400 },
        era: Era.GROWTH,
        power: { consumes: 30 },
        maintenance: 40,
        production: 60
      },
      {
        level: 3,
        name: 'Dual-Bore Rig',
        description: 'Simultaneous drilling in multiple vectors.',
        statsDiff: '+120 Minerals/s',
        costs: { agt: 20000, stone: 1200, minerals: 800 },
        era: Era.INDUSTRY,
        power: { consumes: 50 },
        maintenance: 70,
        production: 120
      },
      {
        level: 4,
        name: 'Plasma-Bore Complex',
        description: 'Clean plasma extraction with peak yield.',
        statsDiff: '+250 Minerals/s, -Pol.',
        costs: { agt: 60000, minerals: 2000, gems: 80 },
        era: Era.SUSTAINABILITY,
        power: { consumes: 100 },
        maintenance: 120,
        production: 250,
        pollution: 4.0
      }
    ]
  }
};

export const ERAS: Record<Era, EraDef> = {
  [Era.SETTLEMENT]: {
    id: Era.SETTLEMENT,
    name: 'Era 1: Settlement',
    description: 'Establish your colony basics',
    unlockConditions: { tutorialComplete: true },
    color: '#94a3b8',
    milestones: [
      { id: 'founding', name: 'Colony Established', target: 1 },
      { id: 'first_resources', name: 'Resource Chain', target: 1 }
    ]
  },
  [Era.GROWTH]: {
    id: Era.GROWTH,
    name: 'Era 2: Growth',
    description: 'Expand your workforce and capital',
    unlockConditions: { minColonists: 5, minAgt: 5000, minBuildings: 5 },
    color: '#22c55e',
    milestones: [
      { id: 'pioneer_crew', name: 'Pioneer Crew', target: 5 },
      { id: 'capital_seed', name: 'Seed Capital', target: 5000 },
      { id: 'base_expansion', name: 'Base Expansion', target: 5 }
    ]
  },
  [Era.INDUSTRY]: {
    id: Era.INDUSTRY,
    name: 'Era 3: Industry',
    description: 'Heavy production and resource scaling',
    unlockConditions: { minColonists: 12, minEco: 40, minAgt: 20000 },
    color: '#eab308',
    milestones: [
      { id: 'industrial_core', name: 'Industrial Core', target: 12 },
      { id: 'eco_balance', name: 'Eco Awareness', target: 40 },
      { id: 'massive_capital', name: 'Industrial Fund', target: 20000 }
    ]
  },
  [Era.SUSTAINABILITY]: {
    id: Era.SUSTAINABILITY,
    name: 'Era 4: Sustainability',
    description: 'Balance restoration and advanced tech',
    unlockConditions: { minEco: 70, minTrust: 60, minAgt: 50000 },
    color: '#3b82f6',
    milestones: [
      { id: 'green_future', name: 'Green Haven', target: 70 },
      { id: 'social_harmony', name: 'Social Glue', target: 60 }
    ]
  },
  [Era.PROSPERITY]: {
    id: Era.PROSPERITY,
    name: 'Era 5: Prosperity',
    description: 'The height of development',
    unlockConditions: { minEco: 90, minTrust: 90, minColonists: 25 },
    color: '#a855f7',
    milestones: [
      { id: 'utopia_eco', name: 'Eco Utopia', target: 90 },
      { id: 'utopia_social', name: 'Social Utopia', target: 90 },
      { id: 'galactic_hub', name: 'Galactic Hub', target: 25 }
    ]
  }
};

export const INITIAL_RESOURCES = {
  agt: 0,
  minerals: 0,
  gems: 10,
  wood: 200,
  stone: 200,
  eco: 75,
  trust: 20,
  maxCapacity: 500
};

export const TECHNOLOGIES: Record<TechId, TechDefinition> = {
  // Industrial
  'ADVANCED_DRILLING': {
    id: 'ADVANCED_DRILLING',
    name: 'Diamond-Tipped Drills',
    description: 'Harder drill bits increase mineral extraction yield.',
    cost: 2000,
    category: 'INDUSTRIAL',
    prereq: null,
    effectDesc: '+15% Mineral Production'
  },
  'MARKET_ANALYTICS': {
    id: 'MARKET_ANALYTICS',
    name: 'Market Analytics AI',
    description: 'Predict global demand to sell at peak prices.',
    cost: 4500,
    category: 'INDUSTRIAL',
    prereq: 'ADVANCED_DRILLING',
    effectDesc: '+20% Sell Value'
  },
  'AUTOMATION': {
    id: 'AUTOMATION',
    name: 'Drone Automation',
    description: 'Automated hauling drones reduce operational waste.',
    cost: 12000,
    category: 'INDUSTRIAL',
    prereq: 'MARKET_ANALYTICS',
    effectDesc: '+25% Production, -10% Upkeep'
  },

  // Ecological
  'PHOTOVOLTAICS': {
    id: 'PHOTOVOLTAICS',
    name: 'Adv. Photovoltaics',
    description: 'Next-gen solar cells with higher energy density.',
    cost: 2500,
    category: 'ECOLOGICAL',
    prereq: null,
    effectDesc: '+20% Solar Efficiency'
  },
  'WATER_RECYCLING': {
    id: 'WATER_RECYCLING',
    name: 'Closed-Loop Water',
    description: 'Recycle 90% of industrial wastewater.',
    cost: 5000,
    category: 'ECOLOGICAL',
    prereq: 'PHOTOVOLTAICS',
    effectDesc: '-30% Pollution Generation'
  },
  'CARBON_CAPTURE': {
    id: 'CARBON_CAPTURE',
    name: 'Direct Air Capture',
    description: 'Experimental towers that suck CO2 from the sky.',
    cost: 15000,
    category: 'ECOLOGICAL',
    prereq: 'WATER_RECYCLING',
    effectDesc: '-50% Pollution Generation'
  },

  // Social
  'COMMUNITY_OUTREACH': {
    id: 'COMMUNITY_OUTREACH',
    name: 'Community Outreach',
    description: 'Sponsor local events and festivals.',
    cost: 1500,
    category: 'SOCIAL',
    prereq: null,
    effectDesc: '+20% Trust Gain'
  },
  'NEIGHBORHOOD_WATCH': {
    id: 'NEIGHBORHOOD_WATCH',
    name: 'Neighborhood Watch',
    description: 'Organized locals helping secure the perimeter.',
    cost: 4000,
    category: 'SOCIAL',
    prereq: 'COMMUNITY_OUTREACH',
    effectDesc: 'Reduces Theft Chance'
  },
  'EDUCATION_REFORM': {
    id: 'EDUCATION_REFORM',
    name: 'Stem Scholarship',
    description: 'Fund local students to become engineers.',
    cost: 10000,
    category: 'SOCIAL',
    prereq: 'NEIGHBORHOOD_WATCH',
    effectDesc: '+50% Trust Gain, +10% Production'
  }
};
