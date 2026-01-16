
import React, { useState, useMemo } from 'react';
import {
    Home, Factory, Recycle, Sun, Wind,
    Flower2, Droplet, GraduationCap, Tent,
    FlaskConical, ShieldAlert, GitCommit, Waves,
    Footprints, X, Eraser, Lock, Square, Plus, ShoppingCart,
    Coffee, PartyPopper, Container, Pickaxe, Flame,
    Search, LayoutGrid, Zap, Sprout, Hammer, Archive, Wrench,
    HeartPulse, Dumbbell, Gem, TrainFront, Truck,
    Trash2, TreeDeciduous, Salad, Thermometer, Trophy, Rocket
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
        // Era 2: Growth
        case BuildingType.MEDICAL_BAY: return <HeartPulse size={18} />;
        case BuildingType.TRAINING_CENTER: return <Dumbbell size={18} />;
        // Era 3: Industry
        case BuildingType.GEM_REFINERY: return <Gem size={18} />;
        case BuildingType.RAIL_LINE: return <TrainFront size={18} />;
        case BuildingType.DISTRIBUTION_HUB: return <Truck size={18} />;
        // Era 4: Sustainability
        case BuildingType.WASTE_TREATMENT: return <Trash2 size={18} />;
        case BuildingType.NATURE_RESERVE: return <TreeDeciduous size={18} />;
        case BuildingType.HYDROPONICS: return <Salad size={18} />;
        case BuildingType.GEOTHERMAL_PLANT: return <Thermometer size={18} />;
        // Era 5: Prosperity
        case BuildingType.MONUMENT: return <Trophy size={18} />;
        case BuildingType.SPACEPORT: return <Rocket size={18} />;
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
    // Era 2: Growth
    [BuildingType.MEDICAL_BAY]: 'BASICS',
    [BuildingType.TRAINING_CENTER]: 'BASICS',
    // Era 3: Industry
    [BuildingType.GEM_REFINERY]: 'PRODUCTION',
    [BuildingType.RAIL_LINE]: 'BASICS',
    [BuildingType.DISTRIBUTION_HUB]: 'PRODUCTION',
    // Era 4: Sustainability
    [BuildingType.WASTE_TREATMENT]: 'UTILITIES',
    [BuildingType.NATURE_RESERVE]: 'ADVANCED',
    [BuildingType.HYDROPONICS]: 'UTILITIES',
    [BuildingType.GEOTHERMAL_PLANT]: 'UTILITIES',
    // Era 5: Prosperity
    [BuildingType.MONUMENT]: 'ADVANCED',
    [BuildingType.SPACEPORT]: 'ADVANCED',
    [BuildingType.EMPTY]: 'ALL'
};

export const SupplySidebar: React.FC<SupplySidebarProps> = ({ isOpen, state, dispatch, onClose, playSfx }) => {
    // New interaction: Select item first, then buy.
    const [selectedItem, setSelectedItem] = useState<BuildingType | null>(null);
    const [activeCategory, setActiveCategory] = useState<CategoryType>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const shopItems = useMemo(() => {
        const all = [
            // Era 1: Settlement
            BuildingType.ROAD, BuildingType.PIPE, BuildingType.FENCE,
            BuildingType.STAFF_QUARTERS, BuildingType.CANTEEN, BuildingType.WORKSHOP,
            BuildingType.WASH_PLANT, BuildingType.SOLAR_ARRAY, BuildingType.WATER_WELL, BuildingType.STORAGE_DEPOT,
            BuildingType.MINING_HEADFRAME,
            // Era 2: Growth
            BuildingType.MEDICAL_BAY, BuildingType.TRAINING_CENTER, BuildingType.GENERATOR,
            BuildingType.SOCIAL_HUB, BuildingType.SECURITY_POST, BuildingType.COMMUNITY_GARDEN, BuildingType.WIND_TURBINE,
            // Era 3: Industry
            BuildingType.RECYCLING_PLANT, BuildingType.ORE_FOUNDRY, BuildingType.GEM_REFINERY,
            BuildingType.RAIL_LINE, BuildingType.DISTRIBUTION_HUB, BuildingType.POND,
            // Era 4: Sustainability
            BuildingType.RESERVOIR, BuildingType.LOCAL_SCHOOL, BuildingType.WASTE_TREATMENT,
            BuildingType.NATURE_RESERVE, BuildingType.HYDROPONICS, BuildingType.GEOTHERMAL_PLANT,
            // Era 5: Prosperity
            BuildingType.SAFARI_LODGE, BuildingType.GREEN_TECH_LAB,
            BuildingType.MONUMENT, BuildingType.SPACEPORT
        ];

        return all.filter(type => {
            const matchesCategory = activeCategory === 'ALL' || ITEM_CATEGORIES[type] === activeCategory;
            const matchesSearch = BUILDINGS[type].name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchQuery]);

    const sidebarRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // If modal is open, don't close sidebar on outside click (let modal handle its own close if needed)
            // Actually, if we click completely outside everything, close sidebar.
            // But if we click outside the detail modal but inside sidebar, keep sidebar.
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                // Check if we are interacting with the detail modal (which might be portaled or fixed z-index)
                // For now, simpler check:
                const target = event.target as HTMLElement;
                if (!target.closest('.detail-modal')) {
                    onClose();
                }
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSelect = (type: BuildingType) => {
        setSelectedItem(type);
        playSfx('UI_CLICK');
    };

    const handlePurchase = () => {
        if (!selectedItem) return;
        const scaledCost = calculateBuildingCost(selectedItem, state.grid);
        if (state.cheatsEnabled || state.resources.agt >= scaledCost) {
            dispatch({ type: 'BUY_BUILDING', payload: { type: selectedItem, cost: state.cheatsEnabled ? 0 : scaledCost } });
            playSfx('SELL');
            setSelectedItem(null); // Close detail view on buy to allow placement
            // Optional: Close sidebar too?
            // onClose(); 
            // Better to keep sidebar open if they want to buy multiple? 
            // Usually "Buy" enters placement mode which might want full screen. 
            // In Age of Empires etc, sidebar stays. But here placement mode might need view.
            // Let's close sidebar to give view space for placement.
            onClose();
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
        <>
            {/* Sidebar Container */}
            <div
                ref={sidebarRef}
                className="absolute right-0 top-14 bottom-20 sm:bottom-24 w-[75vw] sm:w-80 z-40 flex pointer-events-none transition-all"
            >
                {/* Category Tabs (Vertical) - Reduced size for mobile */}
                <div className="w-10 sm:w-14 bg-slate-900/95 border-r border-slate-800 flex flex-col items-center py-2 sm:py-4 gap-2 sm:gap-3 pointer-events-auto shadow-xl">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => { setActiveCategory(cat.id); playSfx('UI_CLICK'); }}
                            title={cat.label}
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all ${activeCategory === cat.id
                                ? 'bg-amber-500 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                                }`}
                        >
                            {cat.icon}
                        </button>
                    ))}
                    <div className="mt-auto mb-2 w-6 sm:w-8 h-px bg-slate-800" />
                    <button
                        onClick={handleBulldozer}
                        title="Bulldozer"
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-rose-900/30 text-rose-500 hover:bg-rose-900/50 transition-all border border-rose-900/50"
                    >
                        <Eraser size={16} />
                    </button>
                    <button
                        onClick={onClose}
                        className="mt-2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-slate-800 text-slate-400 hover:bg-slate-700 transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Main Grid Area */}
                <div className="flex-1 bg-slate-900/95 backdrop-blur-md border-r-0 border-slate-700 rounded-bl-[4px] shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex flex-col pointer-events-auto overflow-hidden">
                    {/* Header */}
                    <div className="px-2 sm:px-4 pt-2 sm:pt-4 pb-2 border-b border-slate-800">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-white font-black uppercase tracking-tighter text-sm sm:text-lg font-['Rajdhani'] leading-none">Supply</h2>
                            <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                                <span className="text-emerald-400 font-mono text-[10px] sm:text-xs font-bold">{Math.floor(state.resources.agt).toLocaleString()} AGT</span>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-md py-1 pl-8 pr-2 text-[10px] sm:text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 grid grid-cols-4 gap-1.5 sm:gap-2 content-start">
                        {shopItems.length === 0 ? (
                            <div className="col-span-4 py-8 text-center text-slate-600 text-[10px] font-mono italic">
                                No units found.
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
                                const isSelected = selectedItem === type;

                                return (
                                    <button
                                        key={type}
                                        onClick={() => handleSelect(type)}
                                        className={`
                                            relative aspect-square rounded-[3px] flex items-center justify-center transition-all bg-gradient-to-br border-b-[2px] shadow-sm
                                            ${getCategoryColor(type)}
                                            ${isSelected ? 'ring-2 ring-white z-10 scale-95 brightness-125' : 'scale-100'}
                                            ${isLocked
                                                ? 'opacity-30 grayscale saturate-0 contrast-50 border-slate-900'
                                                : canAfford
                                                    ? 'hover:brightness-110 cursor-pointer active:scale-95'
                                                    : 'opacity-60 cursor-pointer border-slate-800 saturate-50 brightness-75'}
                                        `}
                                    >
                                        <div className="text-white/80 drop-shadow-md">
                                            {getBuildingIcon(type)}
                                        </div>

                                        {isLocked && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[3px]">
                                                <Lock size={10} className="text-white/60" />
                                            </div>
                                        )}

                                        {/* Cost Badge (Tiny) */}
                                        {!isLocked && (
                                            <div className="absolute bottom-0.5 right-0.5 text-[6px] font-mono font-bold text-white/50 bg-black/30 px-0.5 rounded">
                                                {cost >= 1000 ? (cost / 1000).toFixed(0) + 'k' : cost}
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Detail Overlay / Modal (Centered on Mobile, Side on Desktop) */}
            {selectedItem && (
                <div
                    className="detail-modal fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 pointer-events-auto animate-in fade-in duration-150"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setSelectedItem(null);
                    }}
                >
                    <div className="bg-slate-900 border-2 border-amber-500/50 rounded-lg shadow-2xl w-full max-w-[320px] overflow-hidden animate-in zoom-in-95 duration-150">
                        {(() => {
                            const b = BUILDINGS[selectedItem];
                            const scaledCost = calculateBuildingCost(selectedItem, state.grid);
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
                                    {/* Modal Header */}
                                    <div className={`p-4 bg-gradient-to-r ${getCategoryColor(selectedItem)} text-white flex justify-between items-start`}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-black/20 rounded-md backdrop-blur-sm">
                                                {getBuildingIcon(selectedItem)}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg uppercase font-['Rajdhani'] tracking-wide leading-none">{b.name}</h3>
                                                <div className="text-[10px] sm:text-xs font-mono opacity-80 mt-0.5">{b.stats}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedItem(null)}
                                            className="text-white/60 hover:text-white bg-black/20 hover:bg-black/40 rounded p-1 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    {/* Modal Body */}
                                    <div className="p-4 bg-slate-900 space-y-4">
                                        <p className="text-sm text-slate-300 font-medium leading-relaxed">{b.desc}</p>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 gap-2 bg-slate-950/50 p-2 rounded-md border border-slate-800">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-slate-500 uppercase font-bold">Maintenance</span>
                                                <div className="text-slate-200 font-mono text-xs">{b.maintenance} AGT/t</div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-slate-500 uppercase font-bold">Build Time</span>
                                                <div className="text-slate-200 font-mono text-xs">{b.buildTime}s</div>
                                            </div>
                                            {b.power && (
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-500 uppercase font-bold">Power</span>
                                                    <div className={`font-mono text-xs ${b.power.consumes ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                        {b.power.consumes ? `-${b.power.consumes}` : `+${b.power.produces}`}
                                                    </div>
                                                </div>
                                            )}
                                            {b.pollution !== 0 && (
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-500 uppercase font-bold">Eco Impact</span>
                                                    <div className={`font-mono text-xs ${b.pollution > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                        {b.pollution > 0 ? `-${b.pollution}` : `+${Math.abs(b.pollution)}`}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Requirements if locked */}
                                        {isLocked && (
                                            <div className="bg-rose-950/40 border-l-2 border-rose-500 rounded-r p-3 flex items-start gap-2">
                                                <Lock size={14} className="text-rose-400 shrink-0 mt-0.5" />
                                                <span className="text-xs text-rose-200 font-bold">
                                                    {isEraLocked ? `Unavailable until ${b.era}` : isEcoLocked ? `Requires Ecological Score ${b.ecoReq}` : `Requires ${BUILDINGS[b.dependency!].name}`}
                                                </span>
                                            </div>
                                        )}

                                        {/* Buy Action */}
                                        <button
                                            onClick={handlePurchase}
                                            disabled={isLocked || (!canAfford && !state.cheatsEnabled)}
                                            className={`
                                                w-full py-3.5 px-4 rounded font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all
                                                ${isLocked
                                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                    : canAfford
                                                        ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-[0_4px_0_rgb(180,83,9)] hover:shadow-[0_4px_0_rgb(217,119,6)] active:shadow-none active:translate-y-[4px]'
                                                        : 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600'}
                                            `}
                                        >
                                            {isLocked ? 'LOCKED' : canAfford ? (
                                                <>
                                                    <span>Purchase</span>
                                                    <span className="bg-black/20 px-1.5 py-0.5 rounded text-xs ml-1 font-mono">{scaledCost.toLocaleString()}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Insufficient Funds</span>
                                                    <span className="text-xs ml-1 font-mono">({scaledCost.toLocaleString()})</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </>
    );
};
