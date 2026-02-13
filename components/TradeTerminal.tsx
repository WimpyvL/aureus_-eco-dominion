
import React from 'react';
import { GameState, Action } from '../types';
import { TrendingUp, TrendingDown, Minus, Briefcase, RefreshCw, DollarSign } from 'lucide-react';

interface TradeTerminalProps {
    isOpen: boolean;
    onClose: () => void;
    state: GameState;
    dispatch: React.Dispatch<Action>;
    playSfx: (sfx: any) => void;
}

const PriceSparkline: React.FC<{ history: number[]; color: string }> = ({ history, color }) => {
    if (!history || history.length < 2) return null;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;

    // SVG points
    const points = history.map((val, i) => {
        const x = (i / (history.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full h-16 bg-slate-900/50 rounded-lg border border-slate-700 relative overflow-hidden">
            <svg className="w-full h-full p-1" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    points={points}
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        </div>
    );
};

export const TradeTerminal: React.FC<TradeTerminalProps> = ({ isOpen, onClose, state, dispatch, playSfx }) => {
    const { market, resources } = state;
    const [walletAddress, setWalletAddress] = React.useState('');

    if (!market || !state.contracts) return null;

    return (
        <div
            className={`fixed top-0 right-0 h-full w-96 bg-slate-950 border-l border-slate-700 shadow-2xl z-50 transform transition-transform duration-300 pointer-events-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <TrendingUp className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-wide uppercase italic">Global Market Exchange</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Trade Network</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <Minus className="text-slate-500" size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6">
                    {/* MINERALS MARKET */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Raw Minerals Index</h3>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-mono text-white">{market.minerals.currentPrice.toFixed(1)}</span>
                                    <span className="text-xs font-bold text-slate-500 mb-1">AGT / ton</span>
                                </div>
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${market.minerals.trend === 'RISING' ? 'bg-emerald-500/20 text-emerald-400' :
                                market.minerals.trend === 'FALLING' ? 'bg-rose-500/20 text-rose-400' :
                                    'bg-slate-800 text-slate-400'
                                }`}>
                                {market.minerals.trend === 'RISING' && <TrendingUp size={12} />}
                                {market.minerals.trend === 'FALLING' && <TrendingDown size={12} />}
                                {market.minerals.trend}
                            </div>
                        </div>
                        <PriceSparkline history={market.minerals.history} color={market.minerals.trend === 'FALLING' ? '#fb7185' : '#34d399'} />
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={() => { dispatch({ type: 'SELL_MINERALS' }); playSfx('UI_COIN'); }}
                                disabled={resources.minerals <= 0}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1"
                            >
                                SELL ({Math.floor(resources.minerals)})
                            </button>
                            <button
                                onClick={() => { dispatch({ type: 'BUY_RESOURCE', payload: { resource: 'minerals', amount: 100 } }); }}
                                disabled={resources.agt < Math.floor(market.minerals.currentPrice * 1.25 * 100)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-blue-400 font-bold py-2 rounded-lg text-xs border border-blue-500/30"
                            >
                                BUY 100 ({(market.minerals.currentPrice * 1.25 * 100).toFixed(0)})
                            </button>
                        </div>
                    </div>

                    {/* THUNDERGEMS MARKET */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Thundergems Index</h3>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-mono text-white">{market.gems.currentPrice.toFixed(1)}</span>
                                    <span className="text-xs font-bold text-slate-500 mb-1">AGT / Gem</span>
                                </div>
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${market.gems.trend === 'RISING' ? 'bg-emerald-500/20 text-emerald-400' :
                                market.gems.trend === 'FALLING' ? 'bg-rose-500/20 text-rose-400' :
                                    'bg-slate-800 text-slate-400'
                                }`}>
                                {market.gems.trend === 'RISING' && <TrendingUp size={12} />}
                                {market.gems.trend === 'FALLING' && <TrendingDown size={12} />}
                                {market.gems.trend}
                            </div>
                        </div>
                        <PriceSparkline history={market.gems.history} color="#a78bfa" />
                        <div className="mt-4 space-y-3">
                            <div>
                                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Recipient Wallet Address</label>
                                <input
                                    type="text"
                                    placeholder="Enter 0x..."
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white font-mono focus:border-purple-500 focus:outline-none placeholder-slate-600"
                                    value={walletAddress}
                                    onChange={(e) => setWalletAddress(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        dispatch({ type: 'SELL_GEMS', payload: { address: walletAddress } });
                                        playSfx('UI_COIN');
                                        setWalletAddress(''); // Clear after send? Or keep? Clearing for now.
                                    }}
                                    disabled={resources.gems <= 0 || !walletAddress.trim()}
                                    className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg text-xs"
                                >
                                    DEPOSIT ({Math.floor(resources.gems)})
                                </button>
                                {/* Buying raw gems doesn't make sense if they are tokens, maybe 'Buy Back'? Keeping generic for now */}
                                <button
                                    onClick={() => { dispatch({ type: 'BUY_RESOURCE', payload: { resource: 'gems', amount: 10 } }); }}
                                    disabled={resources.agt < Math.floor(market.gems.currentPrice * 1.25 * 10)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-purple-400 font-bold py-2 rounded-lg text-xs border border-purple-500/30"
                                >
                                    BUY 10 ({(market.gems.currentPrice * 1.25 * 10).toFixed(0)})
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* WOOD & STONE MARKET (Compact) */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Wood Market</h3>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-2xl font-mono text-white">{market.wood.currentPrice.toFixed(1)} <span className="text-xs text-slate-500">AGT</span></span>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{market.wood.trend}</div>
                            </div>
                            <PriceSparkline history={market.wood.history} color="#92400e" />
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => { dispatch({ type: 'SELL_WOOD' }); playSfx('UI_COIN'); }}
                                    disabled={resources.wood <= 0}
                                    className="flex-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-[10px]"
                                >
                                    SELL
                                </button>
                                <button
                                    onClick={() => { dispatch({ type: 'BUY_RESOURCE', payload: { resource: 'wood', amount: 50 } }); }}
                                    disabled={resources.agt < Math.floor(market.wood.currentPrice * 1.25 * 50)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-amber-500 font-bold py-2 rounded-lg text-[10px] border border-amber-500/30"
                                >
                                    BUY 50 ({(market.wood.currentPrice * 1.25 * 50).toFixed(0)})
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Stone Market</h3>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-2xl font-mono text-white">{market.stone.currentPrice.toFixed(1)} <span className="text-xs text-slate-500">AGT</span></span>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{market.stone.trend}</div>
                            </div>
                            <PriceSparkline history={market.stone.history} color="#64748b" />
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => { dispatch({ type: 'SELL_STONE' }); playSfx('UI_COIN'); }}
                                    disabled={resources.stone <= 0}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-[10px]"
                                >
                                    SELL
                                </button>
                                <button
                                    onClick={() => { dispatch({ type: 'BUY_RESOURCE', payload: { resource: 'stone', amount: 50 } }); }}
                                    disabled={resources.agt < Math.floor(market.stone.currentPrice * 1.25 * 50)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-400 font-bold py-2 rounded-lg text-[10px] border border-slate-500/30"
                                >
                                    BUY 50 ({(market.stone.currentPrice * 1.25 * 50).toFixed(0)})
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CONTRACTS (Placeholder for now) */}
                    <div className="border-t border-slate-800 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Briefcase className="text-amber-500" size={18} />
                            <h3 className="text-white font-bold uppercase tracking-widest text-sm">Active Contracts</h3>
                        </div>

                        {state.contracts.length === 0 ? (
                            <div className="text-center p-8 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                                <RefreshCw className="mx-auto text-slate-600 mb-2 animate-spin-slow" size={24} />
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">No Contracts Available</p>
                                <p className="text-slate-600 text-[10px] mt-1">Check back next cycle</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {state.contracts.map(contract => {
                                    const resType = contract.resource.toLowerCase() as 'minerals' | 'gems' | 'wood' | 'stone';
                                    const canAfford = resources[resType] >= contract.amount;

                                    return (
                                        <div key={contract.id} className="bg-slate-900 border border-slate-700 rounded-lg p-3 relative overflow-hidden group">
                                            {/* Progress Bar Background for Timer */}
                                            <div
                                                className="absolute bottom-0 left-0 h-1 bg-amber-500 transition-all duration-1000"
                                                style={{ width: `${(contract.timeLeft / 120) * 100}%` }}
                                            />

                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide max-w-[70%]">{contract.description}</h4>
                                                <span className={`text-[10px] font-mono font-bold ${contract.timeLeft < 30 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>
                                                    {contract.timeLeft}s
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between mt-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-500 uppercase font-bold">Requires</span>
                                                    <span className={`text-sm font-bold ${canAfford ? 'text-white' : 'text-rose-400'}`}>
                                                        {contract.amount} {contract.resource}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-slate-500 uppercase font-bold">Reward</span>
                                                    <span className="text-sm font-bold text-emerald-400">
                                                        +{contract.reward} AGT
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    if (canAfford) {
                                                        dispatch({ type: 'DELIVER_CONTRACT', payload: contract.id });
                                                        playSfx('UI_COIN');
                                                    } else {
                                                        playSfx('UI_ERROR');
                                                    }
                                                }}
                                                disabled={!canAfford}
                                                className={`mt-3 w-full py-2 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all
                                                    ${canAfford
                                                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20 active:translate-y-0.5'
                                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                                                    }
                                                `}
                                            >
                                                {canAfford ? 'Deliver Goods' : 'Insufficient Resources'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};
