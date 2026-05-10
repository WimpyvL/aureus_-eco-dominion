import React from 'react';
import { UndergroundState, UndergroundTile } from '../types';

interface UndergroundHUDProps {
    underground?: UndergroundState;
}

export const UndergroundHUD: React.FC<UndergroundHUDProps> = ({ underground }) => {
    if (!underground) return null;

    const visibleTiles = (Object.values(underground.tiles) as UndergroundTile[]).filter(tile => tile.status !== 'HIDDEN');
    const hazardCount = visibleTiles.filter(tile => tile.hazard !== 'NONE').length;
    const resourceCount = visibleTiles.filter(tile => tile.resourceType !== 'NONE').length;

    return (
        <div className="absolute top-24 right-4 z-50 pointer-events-none">
            <div className="bg-slate-950/90 border border-amber-500/40 rounded-lg p-4 shadow-xl min-w-[250px] backdrop-blur-md">
                <div className="text-amber-400 text-xs font-black tracking-widest uppercase mb-3 font-['Rajdhani']">
                    Deep Ledger // Sector B{underground.depthLevel}
                </div>

                <div className="space-y-2 text-xs text-slate-200 font-mono">
                    <div className="flex justify-between gap-6">
                        <span className="text-slate-500 uppercase">Stability</span>
                        <span>{underground.globalStability}%</span>
                    </div>
                    <div className="flex justify-between gap-6">
                        <span className="text-slate-500 uppercase">Oxygen</span>
                        <span>{underground.oxygen}%</span>
                    </div>
                    <div className="flex justify-between gap-6">
                        <span className="text-slate-500 uppercase">Exposure</span>
                        <span>{underground.exposureRisk}%</span>
                    </div>
                    <div className="h-px bg-slate-800 my-2" />
                    <div className="flex justify-between gap-6">
                        <span className="text-slate-500 uppercase">Surveyed</span>
                        <span>{visibleTiles.length}</span>
                    </div>
                    <div className="flex justify-between gap-6">
                        <span className="text-slate-500 uppercase">Deposits</span>
                        <span>{resourceCount}</span>
                    </div>
                    <div className="flex justify-between gap-6">
                        <span className="text-slate-500 uppercase">Hazards</span>
                        <span className={hazardCount > 0 ? 'text-amber-400' : ''}>{hazardCount}</span>
                    </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 text-[10px] leading-snug text-slate-500">
                    The surface tells the public story. The Deep Ledger records what happens beneath it.
                </div>
            </div>
        </div>
    );
};
