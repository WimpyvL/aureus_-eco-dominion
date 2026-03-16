
import { BaseSimSystem } from '../Simulation';
import { GameState } from '../../types/game';
import { DungeonState, DungeonMiner } from '../../dungeon/DungeonTypes';
import { DungeonEngine } from '../../dungeon/DungeonEngine';
import { FixedContext } from '../../kernel/Types';

const MINER_CONFIGS = {
    driller: { speed: 0.15, miningSpeed: 0.1, color: 0xffaa00, scale: 0.3 },
    excavator: { speed: 0.1, miningSpeed: 0.2, color: 0xcc4400, scale: 0.4 },
    foreman: { speed: 0.2, miningSpeed: 0.05, color: 0x00ccff, scale: 0.35 }
};

const ENERGY_LOW_THRESHOLD = 20;
const ENERGY_DRAIN_WALK = 0.05;
const ENERGY_DRAIN_MINE = 0.2;
const ENERGY_GAIN_RECHARGE_DEFAULT = 0.5;
const ENERGY_GAIN_RECHARGE_PAD = 2.0;

export class DungeonMinerSystem extends BaseSimSystem {
    readonly id = 'dungeon_miners';
    readonly priority = 40; // Run after core systems

    private engine: DungeonEngine | null = null;

    tick(ctx: FixedContext, state: GameState): void {
        const dState = state.dungeon;
        if (!dState || !dState.unlocked) return;

        // Sync Engine
        if (!this.engine || this.engine['state'] !== dState) {
            this.engine = new DungeonEngine(dState);
        }

        const engine = this.engine;
        const heartPos = { x: dState.gridSize.x / 2, y: 1, z: dState.gridSize.z / 2 };

        // Process Miners
        dState.miners.forEach(m => {
            const config = MINER_CONFIGS[m.type];

            // 1. Check Energy / Needs
            if (m.state !== 'recharging' && m.energy <= ENERGY_LOW_THRESHOLD && m.state !== 'returning_to_base') {
                // Find nearest recharger or heart
                let target = heartPos;
                let minDist = Math.sqrt((m.position.x - heartPos.x) ** 2 + (m.position.z - heartPos.z) ** 2);

                // Check pads
                dState.buildings.forEach(b => {
                    if (b.type === 'recharger') {
                        const d = Math.sqrt((m.position.x - b.position.x) ** 2 + (m.position.z - b.position.z) ** 2);
                        if (d < minDist) {
                            minDist = d;
                            target = b.position;
                        }
                    }
                });

                m.state = 'returning_to_base';
                m.targetBlock = { x: Math.floor(target.x), y: Math.floor(target.y), z: Math.floor(target.z) };
            }

            // 2. State: Recharging
            if (m.state === 'recharging') {
                const onPad = dState.buildings.some(b =>
                    b.type === 'recharger' &&
                    Math.floor(m.position.x) === Math.floor(b.position.x) &&
                    Math.floor(m.position.z) === Math.floor(b.position.z)
                );

                const rate = onPad ? ENERGY_GAIN_RECHARGE_PAD : ENERGY_GAIN_RECHARGE_DEFAULT;
                m.energy = Math.min(100, m.energy + rate);

                if (m.energy >= 100) {
                    m.state = 'idle';
                    m.targetBlock = undefined;
                }
                return;
            }

            // 3. State: Moving (Walking or Returning)
            if ((m.state === 'walking' || m.state === 'returning_to_base') && m.targetBlock) {
                const tx = m.targetBlock.x + 0.5;
                const tz = m.targetBlock.z + 0.5;

                const dx = tx - m.position.x;
                const dz = tz - m.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                if (dist > 0.5) {
                    const step = Math.min(dist, config.speed);
                    m.position.x += (dx / dist) * step;
                    m.position.z += (dz / dist) * step;
                    m.energy = Math.max(0, m.energy - ENERGY_DRAIN_WALK);
                } else {
                    // Arrived
                    if (m.state === 'returning_to_base') {
                        m.state = 'recharging';
                    } else {
                        m.state = 'mining';
                        m.miningProgress = 0;
                    }
                }
                return;
            }

            // 4. State: Mining
            if (m.state === 'mining' && m.targetBlock) {
                const bx = m.targetBlock.x;
                const by = m.targetBlock.y;
                const bz = m.targetBlock.z;

                const blockType = engine.getBlockId(bx, by, bz);

                if (!blockType || blockType === DungeonEngine.BLOCK.AIR) {
                    // Block is gone
                    m.state = 'idle';
                    m.targetBlock = undefined;
                    return;
                }

                const hardness = DungeonEngine.BLOCK_HARDNESS[blockType] || 1;
                m.miningProgress += (config.miningSpeed / hardness);
                m.energy = Math.max(0, m.energy - ENERGY_DRAIN_MINE);

                if (m.miningProgress >= 1) {
                    // Mined!
                    const isSpecial = blockType === DungeonEngine.BLOCK.GOLD ||
                        blockType === DungeonEngine.BLOCK.GEMS ||
                        blockType === DungeonEngine.BLOCK.MANA;

                    if (isSpecial) {
                        const hasPermit = state.bureaucracy?.permits?.['extraction-intent']?.status === 'APPROVED';
                        if (!hasPermit) {
                            dState.logs.push(`Illegal extraction detected at (${bx}, ${bz})! Permit 17-B required.`);
                            // Optionally penalize or block? For now, we block the actual resource gain.
                            m.state = 'idle';
                            m.targetBlock = undefined;
                            m.miningProgress = 0;
                            return;
                        }
                    }

                    if (blockType === DungeonEngine.BLOCK.GOLD) {
                        dState.gold += 50;
                        dState.logs.push("Gold discovered!");
                    } else if (blockType === DungeonEngine.BLOCK.GEMS) {
                        dState.gems += 10;
                        dState.logs.push("Shiny gems found!");
                    } else if (blockType === DungeonEngine.BLOCK.MANA) {
                        dState.mana += 25;
                        dState.logs.push("Mana crystal accessed.");
                    }

                    engine.setBlockId(bx, by, bz, DungeonEngine.BLOCK.AIR);
                    engine.reveal(bx, by, bz);

                    // Reveal neighbors at all heights
                    for (let nx = -1; nx <= 1; nx++) {
                        for (let nz = -1; nz <= 1; nz++) {
                            for (let ny = 0; ny <= 3; ny++) {
                                engine.reveal(bx + nx, ny, bz + nz);
                            }
                        }
                    }

                    m.state = 'idle';
                    m.targetBlock = undefined;
                    m.miningProgress = 0;
                }
            }
        });
    }
}
