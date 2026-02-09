
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { GameState, BuildingType, Chunk } from '../types';
import { X, Map as MapIcon, Crosshair, ZoomIn, ZoomOut } from 'lucide-react';

interface WorldMapProps {
    isOpen: boolean;
    onClose: () => void;
    chunks: Record<string, Chunk>;
    agents: GameState['agents'];
    playSfx: (type: any) => void;
}

const TILE_SIZE = 10;
const WORLD_MAP_BOUNDARY = 200; // Visible boundary for the interactive map (radius in tiles)
const MAP_SIZE = WORLD_MAP_BOUNDARY * 2 * TILE_SIZE;

export const WorldMap: React.FC<WorldMapProps> = ({ isOpen, onClose, chunks, agents, playSfx }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const lastMouse = useRef({ x: 0, y: 0 });

    // Calculate Exploration Percentage
    const allTiles = Object.values(chunks).flatMap(c => c.tiles);
    const exploredCount = allTiles.filter(t => t.explored).length;
    const totalCount = allTiles.length || 1;
    const exploredPercent = Math.floor((exploredCount / totalCount) * 100);

    // Initial center
    useEffect(() => {
        if (isOpen) {
            // Center map on viewport
            const viewportW = window.innerWidth;
            const viewportH = window.innerHeight;
            const centerX = (viewportW - MAP_SIZE) / 2;
            const centerY = (viewportH - MAP_SIZE) / 2;
            setOffset({ x: centerX, y: centerY });
            setZoom(viewportW < 600 ? 0.8 : 1.2);
        }
    }, [isOpen]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.fillStyle = '#0f172a'; // Deep space background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(offset.x, offset.y);
        ctx.scale(zoom, zoom);

        // Draw Map Background (Grid limit)
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, MAP_SIZE, MAP_SIZE);

        // Draw Tiles from chunks
        Object.values(chunks).forEach(chunk => {
            chunk.tiles.forEach(tile => {
                const x = tile.x * TILE_SIZE;
                const y = tile.z * TILE_SIZE;

                if (!tile.explored) {
                    // FOG OF WAR
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                    return;
                }

                let color = '#334155';

                // Terrain Base
                if (tile.biome === 'GRASS') color = '#15803d'; // distinct green
                else if (tile.biome === 'SAND') color = '#ca8a04';
                else if (tile.biome === 'STONE') color = '#475569';
                else if (tile.biome === 'DIRT') color = '#713f12';
                else if (tile.biome === 'SNOW') color = '#e2e8f0';

                const isWater = tile.buildingType === BuildingType.POND || tile.buildingType === BuildingType.WATER_WELL;

                // Water
                if (isWater) {
                    color = '#0891b2';
                }

                // Buildings (Override terrain)
                if (tile.buildingType !== BuildingType.EMPTY && !isWater) {
                    if (tile.buildingType === BuildingType.ROAD) color = '#334155';
                    else if (tile.buildingType === BuildingType.PIPE) color = '#0f172a';
                    else if (tile.isUnderConstruction) color = '#d97706';
                    else color = '#f8fafc';
                }

                // Hazards
                if (tile.foliage === 'ILLEGAL_CAMP') color = '#be123c';
                if (tile.foliage === 'MINE_HOLE') color = '#000000';

                ctx.fillStyle = color;
                // Draw slightly larger for water to remove grid gaps (seamless)
                const drawSize = isWater ? TILE_SIZE + 0.5 : TILE_SIZE;
                ctx.fillRect(x, y, drawSize, drawSize);

                // Grid lines overlay for visible tiles
                if (!isWater) {
                    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
                }
            });
        });

        // Draw Agents
        agents.forEach(agent => {
            const ax = agent.x * TILE_SIZE;
            const ay = agent.z * TILE_SIZE;

            // Only draw agent if explored area? Yes, usually logic implies vision
            // Assuming agent itself provides vision, so always visible if tracking exploration

            ctx.fillStyle = agent.type === 'ILLEGAL_MINER' ? '#ef4444' : '#fbbf24';
            ctx.beginPath();
            ctx.arc(ax + TILE_SIZE / 2, ay + TILE_SIZE / 2, TILE_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        // Draw Sector Labels (Optional)
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.font = '20px monospace';
        ctx.fillText("SECTOR 42", 20, 40);

        ctx.restore();

    }, [isOpen, chunks, agents, zoom, offset]);

    const handleWheel = (e: React.WheelEvent) => {
        const newZoom = Math.max(0.5, Math.min(4, zoom - e.deltaY * 0.001));
        setZoom(newZoom);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
        setIsDragging(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                <div className="bg-slate-900 border-2 border-emerald-500 p-2 flex items-center gap-3 shadow-lg">
                    <MapIcon size={20} className="text-emerald-400" />
                    <div>
                        <h2 className="text-white font-black text-sm uppercase tracking-widest font-['Rajdhani']">Sector Map</h2>
                        <div className="text-[10px] text-emerald-400 font-mono font-bold">Explored: {exploredPercent}%</div>
                    </div>
                </div>
            </div>

            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button onClick={() => setZoom(z => Math.min(4, z + 0.5))} className="bg-slate-800 p-2 border border-slate-600 text-white hover:bg-slate-700 rounded"><ZoomIn size={20} /></button>
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.5))} className="bg-slate-800 p-2 border border-slate-600 text-white hover:bg-slate-700 rounded"><ZoomOut size={20} /></button>
                <button onClick={() => { setOffset({ x: (window.innerWidth - MAP_SIZE * zoom) / 2, y: (window.innerHeight - MAP_SIZE * zoom) / 2 }); }} className="bg-slate-800 p-2 border border-slate-600 text-white hover:bg-slate-700 rounded"><Crosshair size={20} /></button>
                <button onClick={() => { onClose(); playSfx('UI_CLICK'); }} className="bg-rose-600 p-2 border border-rose-800 text-white hover:bg-rose-500 rounded shadow-lg"><X size={20} /></button>
            </div>

            <canvas
                ref={canvasRef}
                width={window.innerWidth}
                height={window.innerHeight}
                className="cursor-move touch-none"
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            />

            {/* Legend */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md border border-slate-700 p-2 rounded flex gap-4 pointer-events-none">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-600 border border-black"></div><span className="text-[10px] text-slate-300 font-bold uppercase">Flora</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-200 border border-black"></div><span className="text-[10px] text-slate-300 font-bold uppercase">Building</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-500 rounded-full border border-black"></div><span className="text-[10px] text-slate-300 font-bold uppercase">Unit</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-black border border-slate-700"></div><span className="text-[10px] text-slate-500 font-bold uppercase">Unexplored</span></div>
            </div>
        </div>
    );
};
