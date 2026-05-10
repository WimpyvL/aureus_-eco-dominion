
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { Target, CheckCircle, ChevronDown, ChevronUp, Gem, Coins } from 'lucide-react';
import { Goal, Action } from '../types';

interface GoalWidgetProps {
    goal: Goal | null;
    dispatch: React.Dispatch<Action>;
    playSfx: (type: any) => void;
}

export const GoalWidget: React.FC<GoalWidgetProps> = ({ goal, dispatch, playSfx }) => {
    // Start collapsed for cleaner HUD - expand on click/tap
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [hasNew, setHasNew] = useState(false);
    const prevProgressRef = useRef(0);

    // Only auto-expand when goal is completed (to show claim button)
    useEffect(() => {
        if (goal?.completed) {
            if (isCollapsed) setHasNew(true);
            else setIsCollapsed(false);
        }
    }, [goal?.completed]);

    useEffect(() => {
        if (goal && isCollapsed) {
            const progress = goal.currentValue / goal.targetValue;
            if (progress > prevProgressRef.current + 0.01) {
                setHasNew(true);
            }
            prevProgressRef.current = progress;
        } else if (goal) {
            prevProgressRef.current = goal.currentValue / goal.targetValue;
        }
    }, [goal?.currentValue, isCollapsed]);

    if (!goal) return null;

    if (isCollapsed) {
        return (
            <div className="pointer-events-auto animate-in slide-in-from-left-4">
                <button
                    onClick={() => {
                        setIsCollapsed(false);
                        setHasNew(false);
                        playSfx('UI_CLICK');
                    }}
                    className={`w-10 h-10 bg-slate-900 border-2 ${goal.completed ? 'border-emerald-500' : 'border-amber-600'} flex items-center justify-center hover:bg-slate-800 transition-colors shadow-lg relative`}
                >
                    {hasNew && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse z-10" />
                    )}
                    {goal.completed ? <CheckCircle size={18} className="text-emerald-500" /> : <Target size={18} className="text-amber-500" />}
                </button>
            </div>
        );
    }

    const borderColor = goal.completed ? 'border-emerald-500' : 'border-amber-600';
    const headerColor = goal.completed ? 'bg-emerald-900/40' : 'bg-slate-800';

    return (
        <div className="pointer-events-auto w-56 sm:w-64 animate-in slide-in-from-left-4">
            <div className={`bg-slate-900 border-2 ${borderColor} rounded-[4px] shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] transition-all`}>
                <div
                    className={`p-2 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors border-b-2 border-slate-700 ${headerColor}`}
                    onClick={() => {
                        setIsCollapsed(true);
                        playSfx('UI_CLICK');
                    }}
                >
                    <div className="flex items-center gap-2">
                        <div className={`p-1 border-2 border-black/20 shadow-inner ${goal.completed ? 'bg-emerald-500 text-slate-900' : 'bg-amber-500 text-slate-900'}`}>
                            {goal.completed ? <CheckCircle size={10} strokeWidth={3} /> : <Target size={10} strokeWidth={3} />}
                        </div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest font-['Rajdhani']">
                            {goal.completed ? "MISSION COMPLETE" : "CURRENT OBJECTIVE"}
                        </span>
                    </div>
                    <ChevronUp size={12} className="text-slate-500" />
                </div>

                <div className="p-2 animate-in fade-in slide-in-from-top-1 bg-slate-900">
                    <h4 className="text-[11px] font-bold text-amber-500 leading-tight mb-1 font-['Rajdhani'] uppercase tracking-wide">{goal.title}</h4>
                    <p className="text-[9px] text-slate-400 leading-tight mb-3 font-mono border-l-2 border-slate-700 pl-2">{goal.description}</p>

                    {!goal.completed ? (
                        <div className="w-full bg-slate-950 border border-slate-700 h-3 mb-1 relative">
                            <div
                                className="bg-amber-500 h-full transition-all duration-1000 border-r-2 border-amber-300"
                                style={{ width: `${Math.min(100, (goal.currentValue / goal.targetValue) * 100)}%` }}
                            />
                        </div>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                dispatch({ type: 'CLAIM_GOAL' });
                                playSfx('COMPLETE');
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 text-white text-[10px] font-black py-2 px-2 rounded-[2px] flex items-center justify-center gap-2 animate-pulse uppercase tracking-wider font-['Rajdhani']"
                        >
                            CLAIM REWARD: {goal.reward.amount} {goal.reward.type === 'GEMS' ? <Gem size={10} /> : <Coins size={10} />}
                        </button>
                    )}

                    {!goal.completed && (
                        <div className="flex justify-between text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                            <span>Progress</span>
                            <span className="text-amber-500">{Math.floor(goal.currentValue)} / {goal.targetValue}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
