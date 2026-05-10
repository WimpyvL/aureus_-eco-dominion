
import { TechId, TechDefinition } from '../../types';

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
