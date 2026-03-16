import React from 'react';
import { useAureusEngine } from '../game/useAureusEngine';
import { GameState } from '../types';
import './DungeonHUD.css';

export interface DungeonHUDProps {
    state: GameState;
}

export const DungeonHUD: React.FC<DungeonHUDProps> = ({ state }) => {
    const { world } = useAureusEngine({ container: null, paused: true }); // We only need world handle

    if (state.activeView !== 'DUNGEON') {
        return null;
    }

    const { dungeon } = state;

    const handleSetMode = (mode: any) => {
        (world as any)?.dungeonInputHandler?.setMode(mode);
    };

    const handleHireMiner = () => {
        // Cost: 500 AGT
        if (state.resources.agt >= 500) {
            const newMiner = {
                id: `miner_${Date.now()}`,
                type: 'driller' as const,
                position: {
                    x: Math.floor(dungeon.gridSize.x / 2),
                    y: 1,
                    z: Math.floor(dungeon.gridSize.z / 2)
                },
                state: 'idle' as const,
                energy: 100,
                miningProgress: 0
            };
            dungeon.miners.push(newMiner);
            state.resources.agt -= 500;
        }
    };

    const handleDeposit = () => {
        // Transfer dungeon resources to surface
        state.resources.agt += dungeon.gold;
        state.resources.gems += dungeon.gems;
        // Mana could be a new resource or converted

        dungeon.gold = 0;
        dungeon.gems = 0;
        dungeon.mana = 0;

        dungeon.logs.push('Resources deposited to surface storage.');
    };

    return (
        <div className="dungeon-hud">
            {/* Resource Display */}
            <div className="dungeon-resources">
                <div className="resource-item">
                    <span className="resource-icon">🪙</span>
                    <span className="resource-value">{dungeon.gold}</span>
                </div>
                <div className="resource-item">
                    <span className="resource-icon">💎</span>
                    <span className="resource-value">{dungeon.gems}</span>
                </div>
                <div className="resource-item">
                    <span className="resource-icon">✨</span>
                    <span className="resource-value">{dungeon.mana}</span>
                </div>
            </div>

            {/* Miner List */}
            <div className="miner-list">
                <h3>Miners ({dungeon.miners.length})</h3>
                {dungeon.miners.map(miner => (
                    <div key={miner.id} className="miner-item">
                        <span className="miner-id">{miner.id}</span>
                        <span className="miner-state">{miner.state}</span>
                        <span className="miner-energy">⚡{Math.round(miner.energy)}%</span>
                    </div>
                ))}
            </div>

            {/* Command Strip */}
            <div className="dungeon-commands">
                <div className="mode-selector">
                    <button
                        onClick={() => handleSetMode('mine')}
                        className={(world as any)?.dungeonInputHandler?.getMode() === 'mine' ? 'active' : ''}
                    >
                        ⛏️ Mine
                    </button>
                    <button
                        onClick={() => handleSetMode('build_support')}
                        className={(world as any)?.dungeonInputHandler?.getMode() === 'build_support' ? 'active' : ''}
                    >
                        🧱 Support (50 STN)
                    </button>
                    <button
                        onClick={() => handleSetMode('build_recharger')}
                        className={(world as any)?.dungeonInputHandler?.getMode() === 'build_recharger' ? 'active' : ''}
                    >
                        🔋 Recharger (100 AGT)
                    </button>
                </div>

                <hr />

                <button onClick={handleHireMiner} disabled={state.resources.agt < 500}>
                    Hire Miner (500 AGT)
                </button>
                <button onClick={handleDeposit} disabled={dungeon.gold === 0 && dungeon.gems === 0 && dungeon.mana === 0}>
                    Deposit Resources
                </button>
            </div>

            {/* Advisor Feed */}
            <div className="dungeon-logs">
                {dungeon.logs.slice(-5).reverse().map((log, i) => (
                    <div key={i} className={`log-entry ${log.includes('PERMIT') || log.includes('Illegal') ? 'text-rose-400 font-bold animate-pulse' : ''}`}>
                        {log.includes('Illegal') ? '⚠️ ' : ''}{log}
                    </div>
                ))}
            </div>
        </div>
    );
};
