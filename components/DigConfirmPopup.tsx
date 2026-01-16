import React from 'react';
import { GridTile } from '../types';

interface DigConfirmPopupProps {
    tileIndex: number;
    grid: GridTile[];
    viewMode: 'SURFACE' | 'UNDERGROUND' | 'FIRST_PERSON';
    onConfirm: (layer: number) => void;
    onCancel: () => void;
}

export const DigConfirmPopup: React.FC<DigConfirmPopupProps> = ({ tileIndex, grid, viewMode, onConfirm, onCancel }) => {
    const tile = grid[tileIndex];

    if (!tile) return null;

    // Determine top-most excavatable layer
    let targetLayer = -1;
    // If layer -1 is already excavated, go deeper?
    // Current design: User digs exposed layers.
    // For v1 simplicity: Always dig layer -1 for now unless we implement layer selection.
    // Actually, let's scan.
    for (let l = -1; l >= -10; l--) {
        if (tile.underground && tile.underground[l] && !tile.underground[l].excavated) {
            targetLayer = l;
            break;
        }
    }

    // If all excavated, nothing to dig
    if (targetLayer === -1 && tile.underground && tile.underground[-10].excavated) {
        return (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-600 text-white z-50">
                <h3 className="text-xl font-bold mb-2 text-red-400">Bedrock Reached</h3>
                <p className="mb-4 text-slate-300">Cannot dig any deeper here.</p>
                <button onClick={onCancel} className="px-4 py-2 bg-slate-600 rounded hover:bg-slate-500">Close</button>
            </div>
        );
    }

    return (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900/90 backdrop-blur p-6 rounded-xl shadow-2xl border border-amber-900/50 text-white z-50 min-w-[300px]">
            <h3 className="text-xl font-bold mb-2 text-amber-500">Excavate Sector?</h3>

            <div className="mb-6 space-y-2">
                <div className="flex justify-between text-slate-300">
                    <span>Target Depth:</span>
                    <span className="font-mono text-amber-200">Layer {targetLayer}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                    <span>Rock Type:</span>
                    <span className="text-slate-400">Sedimentary</span>
                </div>
            </div>

            <div className="flex space-x-3">
                <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-3 bg-slate-800 rounded-lg hover:bg-slate-700 font-medium transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={() => onConfirm(targetLayer)}
                    className="flex-1 px-4 py-3 bg-amber-600 rounded-lg hover:bg-amber-500 font-bold text-white transition-colors shadow-lg shadow-amber-900/20"
                >
                    Dig Here
                </button>
            </div>
        </div>
    );
};
