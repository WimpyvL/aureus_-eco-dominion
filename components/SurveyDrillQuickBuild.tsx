import React from 'react';
import { Pickaxe } from 'lucide-react';
import { BuildingType, GameState } from '../types';
import { BUILDINGS } from '../engine/data/VoxelConstants';

interface SurveyDrillQuickBuildProps {
    state: GameState;
    dispatch: React.Dispatch<any>;
    playSfx: (type: any) => void;
}

export const SurveyDrillQuickBuild: React.FC<SurveyDrillQuickBuildProps> = ({ state, dispatch, playSfx }) => {
    const drill = BUILDINGS[BuildingType.SURVEY_DRILL];
    if (!drill) return null;

    const trustReq = drill.trustReq ?? 50;
    const hasTrust = state.resources.trust >= trustReq || state.underground.unlocked || state.dungeon.unlocked;
    const canAfford = state.cheatsEnabled || state.resources.agt >= drill.cost;
    const isSelected = state.selectedBuilding === BuildingType.SURVEY_DRILL;

    const handleClick = () => {
        if (!hasTrust || !canAfford) {
            playSfx('ERROR');
            return;
        }

        dispatch({
            type: 'BUY_BUILDING',
            payload: {
                type: BuildingType.SURVEY_DRILL,
                cost: state.cheatsEnabled ? 0 : drill.cost
            }
        });
        playSfx('UI_CLICK');
    };

    return (
        <div className="absolute bottom-32 sm:bottom-24 right-3 sm:right-6 z-30 pointer-events-auto">
            <button
                onClick={handleClick}
                title={hasTrust ? 'Build Survey Drill' : `Reach Trust ${trustReq} to authorize subsurface survey operations`}
                className={`
                    flex items-center gap-2 px-4 py-3 rounded-[6px]
                    border-2 border-b-[5px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.35)]
                    font-black uppercase tracking-widest text-xs font-['Rajdhani'] transition-all
                    active:border-b-2 active:translate-y-[3px] active:shadow-none
                    ${isSelected
                        ? 'bg-amber-500 text-amber-950 border-amber-800'
                        : 'bg-slate-900/90 text-amber-300 border-amber-900 hover:bg-amber-500 hover:text-amber-950'
                    }
                    ${(!hasTrust || !canAfford) ? 'opacity-50 grayscale' : ''}
                `}
            >
                <Pickaxe size={18} />
                <span>Survey Drill</span>
                <span className="font-mono text-[10px] opacity-70">{drill.cost} AGT</span>
            </button>
        </div>
    );
};
