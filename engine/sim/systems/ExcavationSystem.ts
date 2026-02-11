import { BaseSimSystem } from '../Simulation';
import { FixedContext, CommandContext, CommandResult, CommandErrorCode } from '../../kernel/Types';
import { GameState, GridTile, SfxType, GameCommand } from '../../../types';
import { ChunkStore } from '../../space/ChunkStore';
import { worldToChunk, CHUNK_SIZE } from '../../utils/coords';

export class ExcavationSystem extends BaseSimSystem {
    readonly id = 'excavation';
    readonly priority = 20; // Run before movement/rendering but after input? 
    // AgentSystem is likely priority 50. JobGeneration is 10.
    // Let's run this at 20 so it processes completions before agents try to act on new state? 
    // Actually AgentSystem marks state=2. This system cleans it up. So run after AgentSystem?
    // If AgentSystem is 50, let's make this 55.

    tick(ctx: FixedContext, state: GameState): void {
        const chunks = state.chunks;
        if (!chunks) return;

        // 1. Scan for completed digs (State 2 or 5 from AgentSystem)
        for (const chunk of Object.values(chunks)) {
            for (const tile of chunk.tiles) {
                if (tile.digState) {
                    for (const layerStr in tile.digState) {
                        const layer = parseInt(layerStr);
                        const status = tile.digState[layer];

                        if (status === 2 || status === 5) { // 2 = Finished Tunnel, 5 = Finished Entrance
                            this.completeDig(tile.x, tile.z, layer, state, status === 5);

                            delete tile.digState[layer];
                            if (Object.keys(tile.digState).length === 0) {
                                delete tile.digState;
                            }
                            chunk.simDirty = true;
                        }
                    }
                }
            }
        }
    }

    handleCommand(cmd: GameCommand, ctx: CommandContext, state: GameState): CommandResult | null {
        switch (cmd.type) {
            case 'QUEUE_DIG':
                return this.handleQueueDig(cmd.payload.x, cmd.payload.z, cmd.payload.layer, state);
            default:
                return null;
        }
    }

    private handleQueueDig(x: number, z: number, layer: number, state: GameState): CommandResult {
        const tile = ChunkStore.getTile(state.chunks, x, z);
        if (!tile) return { ok: false, code: CommandErrorCode.INVALID_TARGET, reason: 'Tile not found' };

        if (!tile.underground) tile.underground = {};
        if (tile.underground[layer] && tile.underground[layer].excavated) {
            return { ok: false, code: CommandErrorCode.INVALID_STATE, reason: 'Already excavated' };
        }

        if (!tile.digState) tile.digState = {};

        // Priority: If it's the top layer and coming from surface, mark as entrance dig (4)
        tile.digState[layer] = (layer === -1 && state.viewMode === 'SURFACE') ? 4 : 1;

        // Create Job for AgentSystem
        const jobId = `dig_${x}_${z}_${layer}_${Date.now()}`;
        const exists = state.jobs.some(j => j.id.startsWith(`dig_${x}_${z}_${layer}`));

        if (!exists) {
            state.jobs.push({
                id: jobId,
                type: 'DIG' as any, // Simple mode uses 'DIG'
                targetX: x,
                targetZ: z,
                layer: layer,
                priority: 50,
                assignedAgentId: null
            });
        }

        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.UI_CLICK });
        return { ok: true };
    }

    /**
     * Called when an agent finishes a DIG job at a specific location.
     */
    public completeDig(x: number, z: number, layer: number, state: GameState, isEntrance: boolean = false): void {
        const tile = ChunkStore.getTile(state.chunks, x, z);
        if (!tile || !tile.underground) return;

        const strata = tile.underground[layer];
        if (!strata || strata.excavated) return;

        // 1. Excavate the tile
        strata.excavated = true;

        // 2. If flagged as an entrance, it creates a hole on the surface
        if (isEntrance) {
            tile.hasEntrance = true;
        }

        // 3. Reveal adjacent ores (Fog of War)
        this.revealAdjacentOres(tile, layer, state.chunks);

        // 4. Mark grid as dirty for rendering
        const { cx, cz } = worldToChunk(x, z, CHUNK_SIZE);
        state.pendingEffects.push({ type: 'CHUNK_UPDATE', cx, cz, updates: [tile] });
    }

    private revealAdjacentOres(centerTile: GridTile, layer: number, chunks: Record<string, any>): void {
        const x = centerTile.x;
        const z = centerTile.z;

        const neighbors = [
            { dx: 0, dz: -1 }, // North
            { dx: 0, dz: 1 },  // South
            { dx: -1, dz: 0 }, // West
            { dx: 1, dz: 0 }   // East
        ];

        for (const offset of neighbors) {
            const nx = x + offset.dx;
            const nz = z + offset.dz;

            const neighbor = ChunkStore.getTile(chunks, nx, nz);

            if (neighbor && neighbor.underground && neighbor.underground[layer]) {
                const nStrata = neighbor.underground[layer];
                // If it has ore, reveal it
                if (nStrata.oreType && !nStrata.oreVisible) {
                    nStrata.oreVisible = true;
                }
            }
        }
    }
}
