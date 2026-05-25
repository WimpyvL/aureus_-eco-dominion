
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GameState, Goal, GlobalEvent, NewsItem, GridTile, Agent, BuildingType, Chunk } from '../../../types';
import { createColonist } from './SimulationLogic';
import { FixedContext } from '../../kernel';
import { ChunkStore } from '../../space/ChunkStore';
import { toChunkKey, worldToChunk } from '../../utils/coords';
import { CHUNK_SIZE } from '../../space/ChunkStore';




const getBuildingCount = (state: GameState, type: BuildingType) =>
    Object.values(state.chunks).flatMap(c => c.tiles).filter(t => t.buildingType === type && !t.isUnderConstruction).length;


export function generateGoal(ctx: FixedContext, state: GameState): Goal {
    const r = ctx.random?.next() || Math.random();

    // Basic progression goals
    if (state.resources.agt < 1000) {
        return {
            id: ctx.getNextId?.('goal') || `goal_${Date.now()}`,
            title: 'Initial Capital',
            description: 'Accumulate wealth to fund expansion.',
            type: 'RESOURCE',
            targetType: 'AGT',
            targetValue: state.resources.agt + 500,
            currentValue: 0,
            reward: { type: 'GEMS', amount: 2 },
            completed: false
        };
    }

    if (r > 0.6) {
        return {
            id: ctx.getNextId?.('goal') || `goal_${Date.now()}`,
            title: 'Expansion Protocol',
            description: 'Construct more housing for workforce.',
            type: 'BUILD',
            targetType: BuildingType.STAFF_QUARTERS,
            targetValue: getBuildingCount(state, BuildingType.STAFF_QUARTERS) + 1,
            currentValue: 0,
            reward: { type: 'AGT', amount: 500 },
            completed: false
        };
    } else if (r > 0.3) {
        return {
            id: ctx.getNextId?.('goal') || `goal_${Date.now()}`,
            title: 'Stockpile Ore',
            description: 'Gather raw minerals for export.',
            type: 'RESOURCE',
            targetType: 'MINERALS',
            targetValue: state.resources.minerals + 100,
            currentValue: 0,
            reward: { type: 'GEMS', amount: 2 },
            completed: false
        };
    } else {
        return {
            id: ctx.getNextId?.('goal') || `goal_${Date.now()}`,
            title: 'Public Trust',
            description: 'Improve colony reputation.',
            type: 'RESOURCE',
            targetType: 'TRUST',
            targetValue: Math.min(100, state.resources.trust + 15),
            currentValue: 0,
            reward: { type: 'AGT', amount: 1000 },
            completed: false
        };
    }
}

export function checkAndGenerateEvent(ctx: FixedContext, state: GameState): { event: GlobalEvent | null, news: NewsItem | null, newChunks: Record<string, Chunk> | null, newAgents: Agent[] | null } {

    let event: GlobalEvent | null = null;
    let news: NewsItem | null = null;
    let newChunks: Record<string, Chunk> | null = null;

    let newAgents: Agent[] | null = null;

    // Do not overlap events if possible, or very rare
    if (state.activeEvents.length > 0) return { event, news, newChunks, newAgents };


    const r = ctx.random?.next() || Math.random();
    const eco = state.resources.eco;

    // 1. DUST STORM FRONT (More likely after ecological abuse)
    const dustStormChance = eco < 50 ? 0.22 + ((50 - eco) / 120) : 0;

    if (r < dustStormChance) {
        newChunks = { ...state.chunks };
        let affected = 0;
        Object.keys(newChunks).forEach(chunkKey => {
            const chunk = { ...newChunks![chunkKey], tiles: [...newChunks![chunkKey].tiles] };
            chunk.tiles.forEach((t, i) => {
                // Strip vegetation and topsoil under prolonged dust exposure.
                if (t.foliage && t.foliage.startsWith('TREE_') && (ctx.random?.next() || Math.random()) > 0.8) {
                    chunk.tiles[i] = { ...t, foliage: 'TREE_DEAD', biome: 'DIRT' };
                    affected++;
                }
                else if (t.biome === 'GRASS' && t.buildingType === BuildingType.EMPTY && (ctx.random?.next() || Math.random()) > 0.9) {
                    chunk.tiles[i] = { ...t, biome: 'DIRT', foliage: 'NONE' };
                    affected++;
                }
            });
            if (chunk.simDirty) newChunks![chunkKey] = chunk;
        });

        event = {
            id: ctx.getNextId?.('evt_dust') || `evt_dust_${Date.now()}`,
            name: "Dust Storm Front",
            type: 'WEATHER',
            description: "Dry, degraded ground has kicked a dust front across the concession. Visibility and field efficiency are down.",
            duration: 480,
            weatherOverride: 'DUST_STORM',
            visualTheme: 'NORMAL',
            modifiers: { ecoRegenMult: 0.4, productionMult: 0.78, trustGainMult: 0.85 }
        };
        news = {
            id: ctx.getNextId?.('news_dust') || `news_dust_${Date.now()}`,
            headline: `WEATHER: Dust storm front rolling over the mine. ${affected > 0 ? `${affected} terrain patches were scoured.` : 'Visibility is collapsing.'}`,
            type: 'NEGATIVE',
            timestamp: state.tickCount
        };
        return { event, news, newChunks, newAgents };
    }


    // 2. HEATWAVE
    if (r < 0.45) {
        event = {
            id: ctx.getNextId?.('evt_heat') || `evt_heat_${Date.now()}`,
            name: "Heatwave",
            type: 'WEATHER',
            description: "Dry-season heat is pushing crews, pumps, and surface equipment hard.",
            duration: 450,
            weatherOverride: 'HEATWAVE',
            visualTheme: 'NORMAL',
            modifiers: { energyDecayMult: 1.6, productionMult: 0.92 }
        };
        news = { id: ctx.getNextId?.('news_heat') || `news_heat_${Date.now()}`, headline: "WEATHER: Heatwave warning. Water demand and crew fatigue are spiking.", type: 'NEGATIVE', timestamp: state.tickCount };
        return { event, news, newChunks: null, newAgents: null };
    }


    // 3. ECONOMIC BOOM (Random)
    if (r < 0.6) {
        event = {
            id: ctx.getNextId?.('evt_boom') || `evt_boom_${Date.now()}`,
            name: "Global Market Boom",
            type: 'ECONOMIC',
            description: "Off-world demand for resources has skyrocketed.",
            duration: 600,
            visualTheme: 'GOLDEN',
            modifiers: { sellPriceMult: 2.5 }
        };
        news = { id: ctx.getNextId?.('news_boom') || `news_boom_${Date.now()}`, headline: "ECONOMY: Market Surge! Mineral prices at all-time high.", type: 'POSITIVE', timestamp: state.tickCount };
        return { event, news, newChunks: null, newAgents: null };
    }


    // 4. GEOLOGICAL SHIFT (Spawns resources)
    if (r < 0.75) {
        const allTiles = Object.values(state.chunks).flatMap(c => c.tiles);
        const candidates = allTiles.filter(t => t.biome === 'STONE' && t.buildingType === BuildingType.EMPTY && t.foliage === 'NONE');
        if (candidates.length > 0) {
            newChunks = { ...state.chunks };
            const num = Math.min(candidates.length, Math.ceil((ctx.random?.next() || Math.random()) * 5) + 2);
            for (let k = 0; k < num; k++) {
                const c = candidates[Math.floor((ctx.random?.next() || Math.random()) * candidates.length)];
                // Find chunk for this candidate
                const { cx, cz } = worldToChunk(c.x, c.z, CHUNK_SIZE);
                const chunkId = toChunkKey(cx, cz);
                const chunk = { ...newChunks[chunkId], tiles: [...newChunks[chunkId].tiles] };
                const tIdx = chunk.tiles.findIndex(t => t.x === c.x && t.z === c.z);
                if (tIdx !== -1) {
                    chunk.tiles[tIdx] = { ...chunk.tiles[tIdx], foliage: (ctx.random?.next() || Math.random()) > 0.6 ? 'GOLD_VEIN' : 'CRYSTAL_SPIKE' };
                    newChunks[chunkId] = chunk;
                }
            }
            // Just an event notification, no duration effects
            event = { id: ctx.getNextId?.('evt_quake') || `evt_quake_${Date.now()}`, name: "Seismic Shift", type: 'GEOLOGICAL', description: "Tremors reveal new deposits.", duration: 100, visualTheme: 'NORMAL' };
            news = { id: ctx.getNextId?.('news_quake') || `news_quake_${Date.now()}`, headline: "GEOLOGY: Seismic shift revealed new veins in the mountains.", type: 'NEUTRAL', timestamp: state.tickCount };
            return { event, news, newChunks, newAgents: null };
        }
    }



    // 5. INCURSION (Rare)
    if (r > 0.95) {
        const allTiles = Object.values(state.chunks).flatMap(c => c.tiles);
        const borderTiles = allTiles.filter(t => t.locked && t.foliage === 'NONE');
        if (borderTiles.length > 3) {
            newChunks = { ...state.chunks };
            newAgents = [...state.agents];
            for (let i = 0; i < 3; i++) {
                const tile = borderTiles[Math.floor((ctx.random?.next() || Math.random()) * borderTiles.length)];
                const { cx, cz } = worldToChunk(tile.x, tile.z, CHUNK_SIZE);
                const chunkId = toChunkKey(cx, cz);
                const chunk = { ...newChunks[chunkId], tiles: [...newChunks[chunkId].tiles] };
                const tIdx = chunk.tiles.findIndex(t => t.x === tile.x && t.z === tile.z);
                if (tIdx !== -1) {
                    chunk.tiles[tIdx] = { ...chunk.tiles[tIdx], foliage: 'ILLEGAL_CAMP' };
                    newChunks[chunkId] = chunk;
                }
                newAgents.push(createColonist(tile.x, tile.z, 'ILLEGAL_MINER'));
            }
            event = {
                id: ctx.getNextId?.('evt_inc') || `evt_inc_${Date.now()}`,
                name: "Resource Incursion",
                type: 'INCURSION',
                description: "Unauthorized miners are harvesting your claims.",
                duration: 300,
                visualTheme: 'NORMAL'
            };
            news = { id: ctx.getNextId?.('news_inc') || `news_inc_${Date.now()}`, headline: "SECURITY ALERT: Illegal mining operation detected.", type: 'CRITICAL', timestamp: state.tickCount };
            return { event, news, newChunks, newAgents };
        }
    }

    return { event, news, newChunks, newAgents };
}


