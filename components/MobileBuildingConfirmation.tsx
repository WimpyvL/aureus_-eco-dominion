
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { BuildingType } from '../types';
import { BUILDINGS } from '../engine/data/VoxelConstants';

export const MobileBuildingConfirmation: React.FC<{
    buildingType: BuildingType | null;
    tilePos: { x: number, z: number } | null;
    onConfirm: () => void;
    onCancel: () => void;
    playSfx: (type: any) => void;
}> = ({ buildingType, tilePos, onConfirm, onCancel, playSfx }) => {
    if (!buildingType || tilePos === null) return null;

    const building = BUILDINGS[buildingType];
    if (!building) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border-2 border-amber-500 rounded-lg shadow-2xl w-80 max-w-[90vw] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-amber-900/30 p-3 border-b-2 border-amber-500/50">
                    <h3 className="font-black text-amber-400 text-sm uppercase tracking-widest text-center font-['Rajdhani']">
                        Confirm Placement
                    </h3>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    <div className="text-center">
                        <p className="text-white font-bold text-lg mb-1">{building.name}</p>
                        <p className="text-slate-400 text-xs">{building.desc}</p>
                    </div>

                    {/* Cost */}
                    <div className="bg-slate-950 border border-slate-800 p-3 rounded">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-xs uppercase font-bold">Cost:</span>
                            <span className="text-amber-400 font-mono font-bold">{building.cost} AGT</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => {
                                playSfx('UI_CLICK');
                                onCancel();
                            }}
                            className="bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all font-black text-xs flex items-center justify-center gap-2 uppercase tracking-wider rounded"
                        >
                            <XCircle size={14} /> Cancel
                        </button>
                        <button
                            onClick={() => {
                                playSfx('BUILD_START');
                                onConfirm();
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all font-black text-xs flex items-center justify-center gap-2 uppercase tracking-wider rounded"
                        >
                            <CheckCircle2 size={14} /> Build
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
