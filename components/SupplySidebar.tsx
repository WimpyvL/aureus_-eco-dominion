
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
        case BuildingType.SUPPORT_PILLAR: return <GitCommit size={18} />;
        case BuildingType.MINING_DRILL: return <Pickaxe size={18} />;
        case BuildingType.UNDERGROUND_FANS: return <Wind size={18} />;
        case BuildingType.ORE_EXTRACTOR: return <Container size={18} />;
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
    [BuildingType.SPACEPORT]: 'ADVANCED',
    [BuildingType.MONUMENT]: 'ADVANCED',
    [BuildingType.SUPPORT_PILLAR]: 'BASICS',
    [BuildingType.MINING_DRILL]: 'PRODUCTION',
    [BuildingType.UNDERGROUND_FANS]: 'UTILITIES',
    [BuildingType.ORE_EXTRACTOR]: 'PRODUCTION',
    [BuildingType.POWER_LINE]: 'BASICS',
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
            BuildingType.MONUMENT, BuildingType.SPACEPORT,
            // Underground
            BuildingType.SUPPORT_PILLAR, BuildingType.MINING_DRILL, BuildingType.UNDERGROUND_FANS, BuildingType.ORE_EXTRACTOR
        ];

        return all.filter(type => {
            const matchesCategory = activeCategory === 'ALL' || ITEM_CATEGORIES[type] === activeCategory;
            const matchesSearch = BUILDINGS[type].name.toLowerCase().includes(searchQuery.toLowerCase());

            // View Mode Filter
            const isUndergroundItem = [
                BuildingType.PIPE,
                BuildingType.SUPPORT_PILLAR,
                BuildingType.MINING_DRILL,
                BuildingType.ORE_EXTRACTOR,
                BuildingType.UNDERGROUND_FANS
            ].includes(type);

            if (state.viewMode === 'UNDERGROUND') {
                return matchesCategory && matchesSearch && isUndergroundItem;
            } else {
                return matchesCategory && matchesSearch && !([
                    BuildingType.SUPPORT_PILLAR,
                    BuildingType.MINING_DRILL,
                    BuildingType.ORE_EXTRACTOR,
                    BuildingType.UNDERGROUND_FANS
                ].includes(type));
            }
        });
    }, [activeCategory, searchQuery, state.viewMode]);

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
                className={`fixed right-0 top-14 bottom-22 w-[85vw] sm:w-[500px] z-40 flex pointer-events-none transition-all duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Main Panel */}
                <div className="flex-1 flex flex-col pointer-events-auto bg-slate-950/90 backdrop-blur-xl border-l border-slate-800 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] overflow-hidden">


                    {/* Top Bar: Era & Category Selection */}
                    <div className="p-4 border-b border-white/5 bg-slate-900/50">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h2 className="text-white font-black uppercase tracking-widest text-xl font-['Rajdhani'] leading-none">Supply Command</h2>
                                <p className="text-slate-500 text-[10px] uppercase font-mono mt-1 tracking-tighter">Authorized Assets & Infrastructure</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-amber-500 font-mono text-lg font-black leading-none">{Math.floor(state.resources.agt).toLocaleString()}</span>
                                <span className="text-[9px] text-slate-600 font-mono uppercase">Credits Available</span>
                            </div>
                        </div>

                        {/* Search & Category Tabs */}
                        <div className="flex gap-2 mb-3">
                            <div className="relative flex-1">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="SEARCH ASSETS..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-black/40 border border-slate-800 rounded py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-700 focus:outline-none focus:border-amber-500/50 font-mono transition-all"
                                />
                            </div>
                            <button
                                onClick={handleBulldozer}
                                title="Bulldozer Mode"
                                className={`px-3 rounded flex items-center justify-center transition-all border ${state.interactionMode === 'BULLDOZE' ? 'bg-rose-500 text-rose-950 border-rose-400' : 'bg-slate-900 text-rose-500 border-rose-900/30'}`}
                            >
                                <Eraser size={16} />
                            </button>
                            <button
                                onClick={onClose}
                                className="w-10 bg-slate-800 text-slate-400 hover:bg-slate-700 rounded flex items-center justify-center transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => { setActiveCategory(cat.id); playSfx('UI_CLICK'); }}
                                    className={`px-3 py-1.5 rounded-full whitespace-nowrap text-[10px] font-black uppercase tracking-wider transition-all border ${activeCategory === cat.id
                                        ? 'bg-amber-500 text-amber-950 border-amber-400 shadow-lg shadow-amber-500/20'
                                        : 'bg-slate-800/50 text-slate-500 border-transparent hover:bg-slate-800 hover:text-slate-300'
                                        }`}
                                >
                                    <span className="flex items-center gap-1.5">
                                        {cat.icon}
                                        {cat.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>


                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                        {/* Grouping Items by Era or Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 content-start">
                            {
                                shopItems.length === 0 ? (
                                    <div className="col-span-full py-12 text-center">
                                        <Search size={32} className="mx-auto text-slate-800 mb-2 opacity-20" />
                                        <p className="text-slate-600 text-xs font-mono uppercase tracking-widest italic">No assets matching criteria found</p>
                                    </div>
                                ) : (
                                    shopItems.map((type) => {
                                        const b = BUILDINGS[type];
                                        const cost = calculateBuildingCost(type, state.grid);
                                        const isEcoLocked = state.resources.eco < b.ecoReq;
                                        let dependencyMet = true;
                                        if (b.dependency) {
                                            dependencyMet = state.grid.some(t => t.buildingType === b.dependency && !t.isUnderConstruction);
                                        }
                                        const isEraLocked = !state.unlockedEras.includes(b.era);
                                        const isLocked = !state.cheatsEnabled && (isEcoLocked || !dependencyMet || isEraLocked);
                                        const canAfford = state.cheatsEnabled || state.resources.agt >= cost;
                                        const isSelected = selectedItem === type;

                                        return (
                                            <div
                                                key={type}
                                                onClick={() => handleSelect(type)}
                                                className={`
                                                group relative p-3 border border-slate-800/50 rounded-lg transition-all cursor-pointer flex gap-4
                                                ${isSelected ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/20' : 'bg-slate-900/30 hover:bg-slate-800/40 hover:border-slate-700'}
                                                ${isLocked ? 'opacity-40 grayscale pointer-events-none' : ''}
                                            `}
                                            >
                                                {/* Icon Section */}
                                                <div className={`
                                                w-12 h-12 shrink-0 rounded flex items-center justify-center text-white transition-all
                                                ${isSelected ? 'scale-110 shadow-lg' : ''}
                                                ${isLocked ? 'bg-slate-800' : getCategoryColor(type).replace('border-', 'border-opacity-0 border-')}
                                            `} style={{ background: isLocked ? undefined : 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)' }}>
                                                    {getBuildingIcon(type)}
                                                </div>

                                                {/* Info Section */}
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h3 className={`font-black uppercase tracking-tight truncate text-xs font-['Rajdhani'] ${isSelected ? 'text-amber-400' : 'text-slate-200'}`}>
                                                            {b.name}
                                                        </h3>
                                                        {isLocked && <Lock size={10} className="text-slate-600 mt-0.5" />}
                                                    </div>

                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`font-mono text-[10px] font-bold ${canAfford ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            {cost.toLocaleString()} <span className="text-[8px] opacity-70">AGT</span>
                                                        </span>
                                                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                                                        <span className="text-slate-500 text-[8px] uppercase font-mono tracking-tighter truncate">
                                                            {b.era}
                                                        </span>
                                                    </div>

                                                    {/* Mini Availability Bar */}
                                                    <div className="w-full h-[2px] bg-slate-800 mt-2 overflow-hidden rounded-full">
                                                        <div className={`h-full transition-all duration-700 ${canAfford ? 'bg-emerald-500 w-full' : 'bg-rose-500 w-1/3 shadow-[0_0_5px_rgba(239,68,68,0.5)]'}`} />
                                                    </div>
                                                </div>

                                                {/* Selection Gloss */}
                                                {isSelected && (
                                                    <div className="absolute inset-0 border border-amber-500 opacity-20 rounded-lg pointer-events-none animate-pulse" />
                                                )}
                                            </div>
                                        );
                                    })
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* Detail Overlay */}
            {
                selectedItem && (
                    <div
                        className="detail-modal fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto animate-in fade-in duration-300"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setSelectedItem(null);
                        }}
                    >
                        <div className="bg-slate-900 border-t-4 border-amber-500 rounded-lg shadow-2xl w-full max-w-[400px] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
                            {(() => {
                                const b = BUILDINGS[selectedItem];
                                const scaledCost = calculateBuildingCost(selectedItem, state.grid);

                                // NEW: Multi-resource affordance check
                                let canAfford = state.cheatsEnabled || state.resources.agt >= scaledCost;
                                const missingResources: string[] = [];

                                if (!state.cheatsEnabled && b.costs) {
                                    Object.entries(b.costs).forEach(([res, amt]) => {
                                        if (amt && (state.resources as any)[res] < amt) {
                                            canAfford = false;
                                            missingResources.push(`${amt} ${res.toUpperCase()}`);
                                        }
                                    });
                                } else if (!state.cheatsEnabled && state.resources.agt < scaledCost) {
                                    missingResources.push(`${Math.ceil(scaledCost - state.resources.agt)} AGT`);
                                }

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
                                        <div className="p-6 bg-slate-950 flex flex-col gap-4 relative overflow-hidden">
                                            {/* Background Decoration */}
                                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                                {getBuildingIcon(selectedItem)}
                                            </div>

                                            <div className="flex justify-between items-start z-10">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-4 rounded-xl border border-white/5 shadow-2xl ${getCategoryColor(selectedItem)}`}>
                                                        {getBuildingIcon(selectedItem)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-2xl uppercase font-['Rajdhani'] tracking-tighter text-white leading-none">{b.name}</h3>
                                                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black tracking-widest px-2 py-0.5 mt-2 rounded-sm inline-block">{b.era} ASSET</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedItem(null)}
                                                    className="text-slate-500 hover:text-white transition-colors"
                                                >
                                                    <X size={24} />
                                                </button>
                                            </div>

                                            <p className="text-sm text-slate-400 font-medium leading-relaxed z-10">
                                                {b.desc}
                                            </p>
                                        </div>

                                        {/* Modal Stats Area */}
                                        <div className="px-6 py-4 bg-slate-900 gap-4 flex flex-col">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 bg-black/30 border border-white/5 rounded-lg">
                                                    <span className="text-[9px] text-slate-500 uppercase font-black block mb-1">Upkeep Cost</span>
                                                    <div className="text-white font-mono text-sm">{b.maintenance} <span className="text-[10px] opacity-50 uppercase">AGT / Tick</span></div>
                                                </div>
                                                <div className="p-3 bg-black/30 border border-white/5 rounded-lg">
                                                    <span className="text-[9px] text-slate-500 uppercase font-black block mb-1">Production</span>
                                                    <div className="text-emerald-400 font-mono text-sm">+{b.production || 0} <span className="text-[10px] opacity-50 uppercase">{b.productionType}</span></div>
                                                </div>
                                            </div>

                                            {/* Error/Requirement Alerts */}
                                            {isLocked && (
                                                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded flex items-center gap-3">
                                                    <ShieldAlert className="text-rose-500 animate-pulse shrink-0" size={18} />
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-black text-rose-500 uppercase">Requirement Failed</p>
                                                        <p className="text-xs text-rose-200">
                                                            {isEraLocked ? `Unavailable in Era: ${b.era}` : isEcoLocked ? `Requires Ecological Index ${b.ecoReq}` : `Requires Active ${BUILDINGS[b.dependency!].name}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {!isLocked && !canAfford && (
                                                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded flex items-center gap-3">
                                                    <ShoppingCart className="text-amber-500 shrink-0" size={18} />
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-black text-amber-500 uppercase">Resources Required</p>
                                                        <p className="text-xs text-amber-200">Insufficient materials. Missing: {missingResources.join(', ')}</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={handlePurchase}
                                                    disabled={isLocked || (!canAfford && !state.cheatsEnabled)}
                                                    className={`
                                                    flex-1 py-4 px-6 rounded-md font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all duration-300
                                                    ${isLocked
                                                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                                                            : canAfford
                                                                ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
                                                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                                                `}
                                                >
                                                    {isLocked ? 'ASSET LOCKED' : (
                                                        <>
                                                            <Plus size={18} />
                                                            <span>Authorize Build</span>
                                                            <span className="font-mono bg-black/10 px-2 py-0.5 rounded ml-auto">{scaledCost.toLocaleString()}</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Footer / Meta */}
                                        <div className="px-6 py-3 bg-slate-950 border-t border-white/5 flex justify-between items-center text-[9px] font-mono text-slate-600 uppercase">
                                            <span>Build Window: {b.buildTime}s</span>
                                            <span>Eco Req: {b.ecoReq}</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )
            }
        </>
    );
};
