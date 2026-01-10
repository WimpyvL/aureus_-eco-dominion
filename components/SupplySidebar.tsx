
import React, { useState, useMemo } from 'react';
import {
    Home, Factory, Recycle, Sun, Wind,
    Flower2, Droplet, GraduationCap, Tent,
    FlaskConical, ShieldAlert, GitCommit, Waves,
    Footprints, X, Eraser, Lock, Square, Plus, ShoppingCart,
    Coffee, PartyPopper, Container, Pickaxe, Flame,
    Search, LayoutGrid, Zap, Sprout, Hammer, Archive, Wrench
} from 'lucide-react';
import { GameState, BuildingType, Action } from '../types';
import { BUILDINGS } from '../engine/data/VoxelConstants';
import { calculateBuildingCost } from '../engine/utils/GameUtils';

interface SupplySidebarProps {
    isOpen: boolean;
    state: GameState;
    dispatch: React.Dispatch<Action>;
    onClose: () => void;
    playSfx: (type: any) => void;
}

type CategoryType = 'ALL' | 'BASICS' | 'PRODUCTION' | 'UTILITIES' | 'ADVANCED';

export const getBuildingIcon = (type: BuildingType) => {
    switch (type) {
        case BuildingType.STAFF_QUARTERS: return <Home size={18} />;
        case BuildingType.CANTEEN: return <Coffee size={18} />;
        case BuildingType.SOCIAL_HUB: return <PartyPopper size={18} />;
        case BuildingType.WASH_PLANT: return <Factory size={18} />;
        case BuildingType.RECYCLING_PLANT: return <Recycle size={18} />;
        case BuildingType.SOLAR_ARRAY: return <Sun size={18} />;
        case BuildingType.WIND_TURBINE: return <Wind size={18} />;
        case BuildingType.COMMUNITY_GARDEN: return <Flower2 size={18} />;
        case BuildingType.WATER_WELL: return <Droplet size={18} />;
        case BuildingType.LOCAL_SCHOOL: return <GraduationCap size={18} />;
        case BuildingType.SAFARI_LODGE: return <Tent size={18} />;
        case BuildingType.GREEN_TECH_LAB: return <FlaskConical size={18} />;
        case BuildingType.SECURITY_POST: return <ShieldAlert size={18} />;
        case BuildingType.PIPE: return <GitCommit size={18} className="rotate-90" />;
        case BuildingType.POND: return <Waves size={18} />;
        case BuildingType.RESERVOIR: return <Container size={18} />;
        case BuildingType.MINING_HEADFRAME: return <Pickaxe size={18} />;
        case BuildingType.ORE_FOUNDRY: return <Flame size={18} />;
        case BuildingType.ROAD: return <Footprints size={18} />;
        case BuildingType.FENCE: return <Square size={18} />;
        case BuildingType.STORAGE_DEPOT: return <Archive size={18} />;
        case BuildingType.WORKSHOP: return <Wrench size={18} />;
        case BuildingType.GENERATOR: return <Zap size={18} />;
        default: return <X size={18} />;
    }
};

const getCategoryColor = (type: BuildingType): string => {
    const def = BUILDINGS[type];
    if (def.productionType === 'MINERALS') return 'from-slate-600 to-slate-800 border-slate-900 shadow-slate-900/40';
    if (def.productionType === 'ECO' || type === BuildingType.SOLAR_ARRAY || type === BuildingType.WIND_TURBINE) return 'from-emerald-600 to-emerald-800 border-emerald-900 shadow-emerald-900/40';
    if (def.stats.includes('Infrastructure') || type === BuildingType.ROAD || type === BuildingType.PIPE || type === BuildingType.FENCE) return 'from-sky-700 to-sky-900 border-sky-950 shadow-sky-950/40';
    if (type === BuildingType.SECURITY_POST) return 'from-rose-600 to-rose-800 border-rose-950 shadow-rose-950/40';
    if (type === BuildingType.CANTEEN || type === BuildingType.SOCIAL_HUB || type === BuildingType.STAFF_QUARTERS) return 'from-indigo-600 to-indigo-800 border-indigo-950 shadow-indigo-950/40';
    if (type === BuildingType.RESERVOIR || type === BuildingType.WATER_WELL || type === BuildingType.GENERATOR) return 'from-blue-600 to-blue-800 border-blue-950 shadow-blue-950/40';
    return 'from-slate-700 to-slate-900 border-slate-950 shadow-slate-950/40';
};

const CATEGORIES: { id: CategoryType, icon: any, label: string }[] = [
    { id: 'ALL', icon: <LayoutGrid size={16} />, label: 'All Units' },
    { id: 'BASICS', icon: <Hammer size={16} />, label: 'Basics' },
    { id: 'PRODUCTION', icon: <Zap size={16} />, label: 'Industry' },
    { id: 'UTILITIES', icon: <Droplet size={16} />, label: 'Resources' },
    { id: 'ADVANCED', icon: <Sprout size={16} />, label: 'Advanced' }
];

const ITEM_CATEGORIES: Record<BuildingType, CategoryType> = {
    [BuildingType.ROAD]: 'BASICS',
    [BuildingType.PIPE]: 'BASICS',
    [BuildingType.FENCE]: 'BASICS',
    [BuildingType.STAFF_QUARTERS]: 'BASICS',
    [BuildingType.CANTEEN]: 'BASICS',
    [BuildingType.WASH_PLANT]: 'PRODUCTION',
    [BuildingType.RECYCLING_PLANT]: 'PRODUCTION',
    [BuildingType.MINING_HEADFRAME]: 'PRODUCTION',
    [BuildingType.ORE_FOUNDRY]: 'PRODUCTION',
    [BuildingType.WATER_WELL]: 'UTILITIES',
    [BuildingType.POND]: 'UTILITIES',
    [BuildingType.RESERVOIR]: 'UTILITIES',
    [BuildingType.SOLAR_ARRAY]: 'UTILITIES',
    [BuildingType.WIND_TURBINE]: 'UTILITIES',
    [BuildingType.SOCIAL_HUB]: 'ADVANCED',
    [BuildingType.SECURITY_POST]: 'ADVANCED',
    [BuildingType.COMMUNITY_GARDEN]: 'ADVANCED',
    [BuildingType.LOCAL_SCHOOL]: 'ADVANCED',
    [BuildingType.SAFARI_LODGE]: 'ADVANCED',
    [BuildingType.GREEN_TECH_LAB]: 'ADVANCED',
    [BuildingType.STORAGE_DEPOT]: 'UTILITIES',
    [BuildingType.WORKSHOP]: 'BASICS',
    [BuildingType.GENERATOR]: 'UTILITIES',
    [BuildingType.EMPTY]: 'ALL'
};

export const SupplySidebar: React.FC<SupplySidebarProps> = ({ isOpen, state, dispatch, onClose, playSfx }) => {
    const [inspecting, setInspecting] = useState<{ type: BuildingType, y: number } | null>(null);
    const [activeCategory, setActiveCategory] = useState<CategoryType>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const shopItems = useMemo(() => {
        const all = [
            BuildingType.ROAD, BuildingType.PIPE, BuildingType.FENCE,
            BuildingType.STAFF_QUARTERS, BuildingType.CANTEEN, BuildingType.WORKSHOP,
            BuildingType.WASH_PLANT, BuildingType.RECYCLING_PLANT, BuildingType.MINING_HEADFRAME, BuildingType.ORE_FOUNDRY,
            BuildingType.WATER_WELL, BuildingType.POND, BuildingType.RESERVOIR, BuildingType.STORAGE_DEPOT, BuildingType.GENERATOR,
            BuildingType.SOLAR_ARRAY, BuildingType.WIND_TURBINE,
            BuildingType.SOCIAL_HUB, BuildingType.SECURITY_POST, BuildingType.COMMUNITY_GARDEN,
            BuildingType.LOCAL_SCHOOL, BuildingType.SAFARI_LODGE, BuildingType.GREEN_TECH_LAB
        ];

        return all.filter(type => {
            const matchesCategory = activeCategory === 'ALL' || ITEM_CATEGORIES[type] === activeCategory;
            const matchesSearch = BUILDINGS[type].name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchQuery]);

    if (!isOpen) return null;

    const handlePurchase = (type: BuildingType) => {
        const scaledCost = calculateBuildingCost(type, state.grid);
        if (state.cheatsEnabled || state.resources.agt >= scaledCost) {
            dispatch({ type: 'BUY_BUILDING', payload: { type, cost: state.cheatsEnabled ? 0 : scaledCost } });
            playSfx('SELL');
        } else {
            playSfx('ERROR');
        }
    };

    const handleBulldozer = () => {
        dispatch({ type: 'ACTIVATE_BULLDOZER' });
        playSfx('UI_CLICK');
        onClose();
    }

    return (
        <div className="absolute right-0 top-14 bottom-40 sm:bottom-28 w-80 z-40 flex pointer-events-none">
            {/* Category Tabs (Vertical) */}
            <div className="w-14 bg-slate-900/95 border-r border-slate-800 flex flex-col items-center py-4 gap-4 pointer-events-auto shadow-xl">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => { setActiveCategory(cat.id); playSfx('UI_CLICK'); }}
                        title={cat.label}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${activeCategory === cat.id
                            ? 'bg-amber-500 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                            }`}
                    >
                        {cat.icon}
                    </button>
                ))}
                <div className="mt-auto mb-2 w-8 h-px bg-slate-800" />
                <button
                    onClick={handleBulldozer}
                    title="Bulldozer (Clear/Demolish)"
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-rose-900/30 text-rose-500 hover:bg-rose-900/50 transition-all border border-rose-900/50"
                >
                    <Eraser size={18} />
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-slate-900/95 backdrop-blur-md border-r-0 border-slate-700 rounded-bl-[4px] shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex flex-col pointer-events-auto overflow-hidden">
                {/* Header */}
                <div className="px-4 pt-4 pb-3 border-b border-slate-800">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-white font-black uppercase tracking-tighter text-lg font-['Rajdhani'] leading-none">Supply Depot</h2>
                        <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                            <span className="text-emerald-400 font-mono text-xs font-bold">{Math.floor(state.resources.agt).toLocaleString()} AGT</span>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Find units..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-md py-1.5 pl-9 pr-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div
                    className="flex-1 overflow-y-auto custom-scrollbar p-2 grid grid-cols-4 gap-2 content-start"
                    onMouseLeave={() => setInspecting(null)}
                >
                    {shopItems.length === 0 ? (
                        <div className="col-span-4 py-8 text-center text-slate-600 text-xs font-mono italic">
                            No units found in this category.
                        </div>
                    ) : (
                        shopItems.map((type) => {
                            const b = BUILDINGS[type];
                            const isEcoLocked = state.resources.eco < b.ecoReq;
                            let dependencyMet = true;
                            if (b.dependency) {
                                dependencyMet = state.grid.some(t => t.buildingType === b.dependency && !t.isUnderConstruction);
                            }
                            const isEraLocked = !state.unlockedEras.includes(b.era);
                            const isLocked = !state.cheatsEnabled && (isEcoLocked || !dependencyMet || isEraLocked);
                            const cost = calculateBuildingCost(type, state.grid);
                            const canAfford = state.cheatsEnabled || state.resources.agt >= cost;
                            const isInspecting = inspecting?.type === type;

                            return (
                                <button
                                    key={type}
                                    onMouseEnter={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setInspecting({ type, y: rect.top + (rect.height / 2) });
                                    }}
                                    onClick={() => handlePurchase(type)}
                                    className={`
                                        relative aspect-square rounded-[4px] flex items-center justify-center transition-all bg-gradient-to-br border-b-[3px] shadow-sm
                                        ${getCategoryColor(type)}
                                        ${isInspecting ? 'ring-2 ring-white z-10 scale-105' : 'scale-100'}
                                        ${isLocked
                                            ? 'opacity-30 grayscale saturate-0 contrast-50 border-slate-900 pointer-events-none'
                                            : canAfford
                                                ? 'hover:brightness-125 cursor-pointer active:translate-y-[2px] active:border-b-0'
                                                : 'opacity-60 cursor-pointer border-slate-800 saturate-50 brightness-75'}
                                    `}
                                >
                                    <div className="text-white/80 drop-shadow-md">
                                        {getBuildingIcon(type)}
                                    </div>

                                    {isLocked && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[4px]">
                                            <Lock size={12} className="text-white/60" />
                                        </div>
                                    )}

                                    {!isLocked && canAfford && (
                                        <div className="absolute top-0 right-0 p-0.5">
                                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                                        </div>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer / Helper */}
                <div className="p-3 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        <span>Ready</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-600 hover:text-slate-400 p-1 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Inspect Tooltip (Floating Left) */}
            {inspecting && (
                <div
                    className="fixed right-80 w-64 bg-slate-900 border-2 border-slate-700 p-0 pointer-events-auto rounded-l-lg shadow-[10px_0_30px_rgba(0,0,0,0.8)] z-50 transform -translate-y-1/2 overflow-hidden animate-in slide-in-from-right-4 fade-in duration-200"
                    style={{ top: Math.max(120, Math.min(window.innerHeight - 150, inspecting.y)) }}
                >
                    {(() => {
                        const type = inspecting.type;
                        const b = BUILDINGS[type];
                        const scaledCost = calculateBuildingCost(type, state.grid);
                        const canAfford = state.cheatsEnabled || state.resources.agt >= scaledCost;
                        const isEcoLocked = state.resources.eco < b.ecoReq;
                        let dependencyMet = true;
                        if (b.dependency) {
                            dependencyMet = state.grid.some(t => t.buildingType === b.dependency && !t.isUnderConstruction);
                        }
                        const isEraLocked = !state.unlockedEras.includes(b.era);
                        const isLocked = !state.cheatsEnabled && (isEcoLocked || !dependencyMet || isEraLocked);

                        return (
                            <div className="flex flex-col">
                                {/* Header */}
                                <div className={`p-3 bg-gradient-to-r ${getCategoryColor(type)} border-b border-black/20 text-white flex justify-between items-center`}>
                                    <div className="flex items-center gap-2">
                                        {getBuildingIcon(type)}
                                        <h3 className="font-black text-sm uppercase font-['Rajdhani'] tracking-wider">{b.name}</h3>
                                    </div>
                                    <div className="text-[10px] font-mono opacity-60">U-{type.substring(0, 4)}</div>
                                </div>

                                {/* Body */}
                                <div className="p-3 bg-slate-900">
                                    <p className="text-[10px] text-slate-400 leading-normal font-medium mb-3 min-h-[30px]">{b.desc}</p>

                                    <div className="space-y-2 mb-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] text-slate-500 uppercase font-bold">Base Effect</span>
                                            <span className="text-emerald-400 font-mono text-[10px] font-bold uppercase">{b.stats}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] text-slate-500 uppercase font-bold">Energy Cost</span>
                                            <span className="text-slate-300 font-mono text-[10px] font-bold">{b.maintenance} AGT/t</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-950 p-1.5 rounded border border-slate-800">
                                            <span className="text-[9px] text-slate-500 uppercase font-bold">Acquisition</span>
                                            <span className={`${canAfford ? "text-amber-400" : "text-rose-500"} font-mono text-xs font-black tracking-tighter`}>
                                                {state.cheatsEnabled ? "FREE" : `${scaledCost.toLocaleString()} AGT`}
                                            </span>
                                        </div>
                                    </div>

                                    {isLocked ? (
                                        <div className="bg-rose-950/40 border border-rose-500/30 rounded p-2 text-[9px] text-rose-300 font-bold flex items-center justify-center gap-2 uppercase">
                                            <Lock size={10} />
                                            {isEraLocked ? `Requires ${b.era}` : isEcoLocked ? `Eco Lv.${b.ecoReq} required` : `Requires ${BUILDINGS[b.dependency!].name}`}
                                        </div>
                                    ) : (
                                        <div className="text-[9px] text-slate-500 font-mono text-center mb-1">
                                            {canAfford ? "Click unit to purchase" : "Insufficient AGT Capital"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};
