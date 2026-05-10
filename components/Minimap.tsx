
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { GameState, BuildingType, Chunk } from '../types';
import { ChunkStore } from '../engine/space/ChunkStore';
import { Map, Maximize, ChevronUp } from 'lucide-react';

interface MinimapProps {
    chunks: Record<string, Chunk>;
    agents: GameState['agents'];
    onOpenMap: () => void;
}

const TILE_SIZE = 3;
const MAP_DISPLAY_SIZE = 48; // Fixed display size in tiles for the minimap preview
const MAP_CANVAS_SIZE = MAP_DISPLAY_SIZE * TILE_SIZE;

export const Minimap: React.FC<MinimapProps> = React.memo(({ chunks, agents, onOpenMap }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCollapsed, setIsCollapsed] = useState(true);
    const lastDrawTime = useRef<number>(0);
    const frameId = useRef<number>(0);

    // Loop for throttling draw calls
    useEffect(() => {
        if (isCollapsed) return;

        const draw = () => {
            const now = performance.now();
            // Throttle to ~10 FPS (100ms) to save massive CPU overhead
            if (now - lastDrawTime.current < 100) {
                frameId.current = requestAnimationFrame(draw);
                return;
            }
            lastDrawTime.current = now;

            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Clear
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, MAP_CANVAS_SIZE, MAP_CANVAS_SIZE);

            // Center minimap on origin (0,0) for now, or could follow player
            // Let's center on 0,0 with MAP_DISPLAY_SIZE padding
            const halfSize = Math.floor(MAP_DISPLAY_SIZE / 2);

            // Draw Grid from chunks
            Object.values(chunks).forEach((chunk: Chunk) => {
                chunk.tiles.forEach(tile => {
                    // Only draw if within minimap bounds relative to origin
                    if (Math.abs(tile.x) > halfSize || Math.abs(tile.z) > halfSize) return;

                    const lx = (tile.x + halfSize) * TILE_SIZE;
                    const ly = (tile.z + halfSize) * TILE_SIZE;

                    // Fog of War Check
                    if (!tile.explored) {
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(lx, ly, TILE_SIZE, TILE_SIZE);
                        return;
                    }

                    let color = '#334155'; // Default dark

                    // Terrain Base
                    if (tile.biome === 'GRASS') color = '#5D9E45';
                    else if (tile.biome === 'SAND') color = '#eab308';
                    else if (tile.biome === 'STONE') color = '#64748b';
                    else if (tile.biome === 'DIRT') color = '#78350f';
                    else if (tile.biome === 'SNOW') color = '#f1f5f9';

                    // Water
                    if (tile.buildingType === BuildingType.POND || tile.buildingType === BuildingType.WATER_WELL) {
                        color = '#06b6d4';
                    }

                    // Buildings (Override terrain)
                    if (tile.buildingType !== BuildingType.EMPTY && tile.buildingType !== BuildingType.POND) {
                        // Simple color coding for buildings
                        if (tile.buildingType === BuildingType.ROAD) color = '#334155';
                        else if (tile.buildingType === BuildingType.PIPE) color = '#1e293b';
                        else if (tile.isUnderConstruction) color = '#fbbf24'; // Amber construction
                        else color = '#f8fafc'; // White buildings
                    }

                    // Hazards
                    if (tile.foliage === 'ILLEGAL_CAMP') color = '#e11d48';
                    if (tile.foliage === 'MINE_HOLE') color = '#000000';

                    ctx.fillStyle = color;
                    ctx.fillRect(lx, ly, TILE_SIZE, TILE_SIZE);
                });
            });

            // Draw Agents
            agents.forEach(agent => {
                if (Math.abs(agent.x) > halfSize || Math.abs(agent.z) > halfSize) return;

                const ax = (agent.x + halfSize) * TILE_SIZE;
                const ay = (agent.z + halfSize) * TILE_SIZE;

                ctx.fillStyle = agent.type === 'ILLEGAL_MINER' ? '#ef4444' : '#fbbf24';
                ctx.beginPath();
                ctx.arc(ax + TILE_SIZE / 2, ay + TILE_SIZE / 2, 2, 0, Math.PI * 2);
                ctx.fill();
            });

            frameId.current = requestAnimationFrame(draw);
        };

        frameId.current = requestAnimationFrame(draw);

        return () => cancelAnimationFrame(frameId.current);
    }, [chunks, agents, isCollapsed]);

    if (isCollapsed) {
        return (
            <div className="absolute z-30 top-20 right-2 sm:top-4 sm:right-4 pointer-events-auto animate-in slide-in-from-right-4">
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="w-10 h-10 bg-slate-900 border-2 border-slate-600 flex items-center justify-center hover:bg-slate-800 transition-colors shadow-lg group"
                    title="Open Minimap"
                >
                    <Map size={20} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
                </button>
            </div>
        );
    }

    return (
        <div className="absolute z-30 top-20 right-2 sm:top-4 sm:right-4 pointer-events-auto group animate-in slide-in-from-right-4">
            <div className="bg-slate-900 border-2 border-slate-700 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] rounded-sm overflow-hidden transition-all">

                {/* Header */}
                <div
                    className="flex items-center justify-between p-1.5 bg-slate-800 border-b border-slate-700 cursor-pointer hover:bg-slate-750"
                    onClick={() => setIsCollapsed(true)}
                >
                    <div className="flex items-center gap-2">
                        <Map size={10} className="text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest font-['Rajdhani']">Sector</span>
                    </div>
                    <ChevronUp size={12} className="text-slate-500 hover:text-white" />
                </div>

                {/* Canvas Container */}
                <div
                    className="relative cursor-pointer group/canvas p-1"
                    onClick={onOpenMap}
                    title="Click to Open World Map"
                >
                    <canvas
                        ref={canvasRef}
                        width={MAP_CANVAS_SIZE}
                        height={MAP_CANVAS_SIZE}
                        className="bg-slate-950 image-pixelated display-block border border-slate-800"
                        style={{ width: '135px', height: '135px' }}
                    />

                    {/* Overlay Hint */}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/canvas:opacity-100 transition-opacity flex items-center justify-center pointer-events-none backdrop-blur-[1px]">
                        <div className="bg-slate-900/90 px-2 py-1 rounded border border-emerald-500/50 flex items-center gap-1 shadow-xl">
                            <Maximize size={10} className="text-emerald-400" />
                            <span className="text-[8px] font-black uppercase tracking-wide text-white">Full Map</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
