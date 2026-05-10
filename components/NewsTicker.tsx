
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { NewsItem } from '../types';

interface NewsTickerProps {
    news: NewsItem[];
    onDismiss: (id: string) => void;
    playSfx: (type: any) => void;
}

export const NewsTicker: React.FC<NewsTickerProps> = ({ news, playSfx }) => {
    // Start collapsed for cleaner HUD - expand on click/tap
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [hasNew, setHasNew] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const lastCountRef = useRef(news.length);

    const logItems = [...news].reverse();

    useEffect(() => {
        // If news items increased while collapsed, mark as new
        if (isCollapsed && news.length > lastCountRef.current) {
            setHasNew(true);
        }
        lastCountRef.current = news.length;
    }, [news.length, isCollapsed]);

    useEffect(() => {
        if (scrollRef.current && !isCollapsed) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [news, isCollapsed]);

    const formatTime = (ts: number) => {
        return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const getItemStyles = (type: string) => {
        switch (type) {
            case 'POSITIVE': return 'border-emerald-500 text-emerald-400 bg-emerald-950/30';
            case 'CRITICAL': return 'border-rose-500 text-rose-400 bg-rose-950/30';
            case 'NEGATIVE': return 'border-amber-500 text-amber-400 bg-amber-950/30';
            default: return 'border-slate-700 text-slate-300 bg-slate-800/50';
        }
    };

    if (isCollapsed) {
        return (
            <div className="pointer-events-auto animate-in slide-in-from-left-4">
                <button
                    onClick={() => {
                        setIsCollapsed(false);
                        setHasNew(false);
                        playSfx('UI_CLICK');
                    }}
                    className="w-10 h-10 bg-slate-900 border-2 border-slate-600 flex items-center justify-center hover:bg-slate-800 transition-colors shadow-lg relative"
                >
                    {hasNew && <span className="w-1.5 h-1.5 bg-amber-500 inline-block animate-pulse absolute top-1.5 right-1.5"></span>}
                    <FileText size={18} className="text-slate-400" />
                </button>
            </div>
        );
    }

    return (
        <div className={`transition-all duration-300 ease-in-out font-mono pointer-events-auto w-56 sm:w-64 h-32 sm:h-40`}>
            <div className="bg-slate-900 border-2 border-slate-600 rounded-[4px] shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] flex flex-col h-full overflow-hidden">
                <div
                    onClick={() => {
                        setIsCollapsed(true);
                        playSfx('UI_CLICK');
                    }}
                    className="bg-slate-800 p-1.5 flex items-center justify-between cursor-pointer hover:bg-slate-750 transition-colors border-b-2 border-slate-700"
                >
                    <h3 className="text-amber-500 font-bold tracking-widest text-[10px] uppercase font-['Rajdhani'] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-500 inline-block animate-pulse"></span>
                        Uplink Log
                    </h3>
                    <div className="flex items-center gap-1.5">
                        <ChevronUp size={12} className="text-slate-400" />
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-1.5 space-y-1 custom-scrollbar bg-slate-950"
                >
                    {logItems.length === 0 && (
                        <div className="text-slate-600 text-[10px] italic text-center mt-2 uppercase font-['Rajdhani']">No Signal</div>
                    )}
                    {logItems.map((item) => {
                        const styleClass = getItemStyles(item.type);
                        return (
                            <div key={item.id} className={`flex flex-col border-l-2 pl-2 py-1 ${styleClass}`}>
                                <span className="text-[7px] text-slate-500 font-bold mb-0 opacity-80 font-mono">
                                    [{formatTime(item.timestamp)}]
                                </span>
                                <span className={`text-[10px] leading-tight font-bold font-['Rajdhani'] uppercase tracking-wide`}>
                                    {item.headline}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
