
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Lock, CheckCircle, Zap, Shield, FlaskConical } from 'lucide-react';
import { TechDefinition, TechId, Action, ResearchState, GameResources } from '../types';
import { TECHNOLOGIES } from '../engine/data/VoxelConstants';

interface ResearchTreeProps {
    research: ResearchState;
    resources: GameResources;
    dispatch: React.Dispatch<Action>;
    playSfx: (type: any) => void;
}

const TechCard: React.FC<{
    tech: TechDefinition;
    unlocked: boolean;
    locked: boolean;
    canAfford: boolean;
    prereqName?: string;
    dispatch: React.Dispatch<Action>;
    playSfx: (type: any) => void;
}> = ({ tech, unlocked, locked, canAfford, prereqName, dispatch, playSfx }) => {

    // Condensed Voxel Button Styles
    let baseClass = "relative p-1.5 rounded-[3px] border-2 border-b-[4px] transition-all flex items-center gap-2 w-full group";
    let stateClass = "";

    if (unlocked) {
        stateClass = "bg-slate-800 border-amber-600 border-b-amber-800 shadow-none";
    } else if (locked) {
        stateClass = "bg-slate-900 border-slate-700 border-b-slate-800 opacity-60";
    } else {
        // Available
        stateClass = canAfford
            ? "bg-slate-800 border-emerald-600 border-b-emerald-900 hover:bg-emerald-900/20 cursor-pointer active:border-b-2 active:translate-y-[2px]"
            : "bg-slate-800 border-slate-600 border-b-slate-800 cursor-not-allowed";
    }

    const handleClick = () => {
        if (!unlocked && !locked && canAfford) {
            dispatch({ type: 'UNLOCK_TECH', payload: tech.id });
            playSfx('COMPLETE');
        } else if (!unlocked && !locked && !canAfford) {
            playSfx('ERROR');
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`${baseClass} ${stateClass}`}
        >
            {/* Icon Block */}
            <div className={`w-8 h-8 flex items-center justify-center rounded-[2px] bg-slate-950 border border-white/10 shrink-0 ${unlocked ? 'text-amber-500' : 'text-slate-500'}`}>
                {tech.category === 'INDUSTRIAL' && <Zap size={14} />}
                {tech.category === 'ECOLOGICAL' && <FlaskConical size={14} />}
                {tech.category === 'SOCIAL' && <Shield size={14} />}
            </div>

            {/* Info Block */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-0.5">
                    <h4 className={`text-[9px] font-black uppercase tracking-wide leading-none truncate font-['Rajdhani'] ${unlocked ? 'text-amber-500' : 'text-slate-200'}`}>
                        {tech.name}
                    </h4>
                    {unlocked && <CheckCircle size={10} className="text-amber-500" />}
                    {!unlocked && locked && <Lock size={10} className="text-slate-600" />}
                </div>

                <div className="flex items-center justify-between">
                    {!unlocked && locked && prereqName ? (
                        <span className="text-[7px] font-bold text-rose-400 uppercase truncate max-w-[80px]">Req: {prereqName}</span>
                    ) : !unlocked ? (
                        <span className={`font-mono text-[8px] font-bold ${canAfford ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {tech.cost.toLocaleString()} AGT
                        </span>
                    ) : (
                        <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider">ACTIVE</span>
                    )}

                    <div className={`text-[7px] font-bold uppercase tracking-tighter px-1 py-0.5 rounded-[1px] border ml-2 truncate max-w-[90px] ${unlocked ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                        {tech.effectDesc}
                    </div>
                </div>
            </div>
        </div>
    );
}

export const ResearchTree: React.FC<ResearchTreeProps> = ({ research, resources, dispatch, playSfx }) => {

    const sortTechs = (items: TechDefinition[]) => {
        return [...items].sort((a, b) => {
            if (!a.prereq && b.prereq) return -1;
            if (a.prereq && !b.prereq) return 1;
            if (a.prereq === b.id) return 1;
            if (b.prereq === a.id) return -1;
            return 0;
        });
    };

    const techs = Object.values(TECHNOLOGIES);
    const industrial = sortTechs(techs.filter(t => t.category === 'INDUSTRIAL'));
    const ecological = sortTechs(techs.filter(t => t.category === 'ECOLOGICAL'));
    const social = sortTechs(techs.filter(t => t.category === 'SOCIAL'));

    const renderColumn = (title: string, items: TechDefinition[], colorClass: string) => (
        <div className="flex-1 min-w-[140px] flex flex-col items-center">
            <div className="w-full border-b-2 border-slate-700 mb-2 pb-1">
                <h3 className={`text-[9px] font-black ${colorClass} uppercase tracking-[0.2em] text-center font-['Rajdhani']`}>{title}</h3>
            </div>

            <div className="flex flex-col gap-2 w-full relative">
                {items.map((tech, index) => {
                    const isUnlocked = research.unlocked.includes(tech.id);
                    const isPrereqMet = !tech.prereq || research.unlocked.includes(tech.prereq);
                    const isLocked = !isPrereqMet;
                    const canAfford = resources.agt >= tech.cost;

                    const prereqName = tech.prereq ? TECHNOLOGIES[tech.prereq].name : undefined;
                    const hasPrev = index > 0;
                    const prevTechUnlocked = hasPrev && items[index - 1] && research.unlocked.includes(items[index - 1].id);

                    return (
                        <div key={tech.id} className="w-full flex flex-col items-center relative">
                            {/* Connector Line */}
                            {hasPrev && (
                                <div className={`h-2 w-0.5 -mt-2 mb-0 ${prevTechUnlocked ? 'bg-amber-500' : 'bg-slate-700'}`}></div>
                            )}

                            {/* Card */}
                            <TechCard
                                tech={tech}
                                unlocked={isUnlocked}
                                locked={isLocked}
                                canAfford={canAfford}
                                prereqName={prereqName}
                                dispatch={dispatch}
                                playSfx={playSfx}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 pb-6 px-1">
            {renderColumn("Industrial", industrial, "text-amber-400")}
            {renderColumn("Ecological", ecological, "text-emerald-400")}
            {renderColumn("Social", social, "text-blue-400")}
        </div>
    );
};
