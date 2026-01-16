import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState, GridTile } from '../../../types';
import { GRID_SIZE } from '../../utils/GameUtils';

export class ExcavationSystem extends BaseSimSystem {
    readonly id = 'excavation';
    readonly priority = 20; // Run before movement/rendering but after input? 
    // AgentSystem is likely priority 50. JobGeneration is 10.
    // Let's run this at 20 so it processes completions before agents try to act on new state? 
    // Actually AgentSystem marks state=2. This system cleans it up. So run after AgentSystem?
    // If AgentSystem is 50, let's make this 55.

    tick(ctx: FixedContext, state: GameState): void {
        const grid = state.grid;
        if (!grid) return;

        // 1. Process Command Queue (for QUEUE_DIG)
        // Commands would be pushed here by UI/InputSystem
        // We'll iterate the shared commandQueue if we want, or rely on direct state mutation from UI
        // For simplicity, let's look for tiles with digState that need processing

        // 2. Scan for completed digs (State 2 from AgentSystem)
        // This acts as the "Event Listener" for job completion
        for (let i = 0; i < grid.length; i++) {
            const tile = grid[i];

            if (tile.digState) {
                for (const layerStr in tile.digState) {
                    const layer = parseInt(layerStr);
                    const status = tile.digState[layer];

                    if (status === 2) { // 2 = Excavated by Agent
                        this.completeDig(tile.id, layer, state);

                        // Clear the temporary dig state, as the permanent underground state is now set
                        delete tile.digState[layer];
                        if (Object.keys(tile.digState).length === 0) {
                            delete tile.digState;
                        }
                    }
                }
            }
        }
    }

    /**
     * Called when an agent finishes a DIG job at a specific location.
     */
    public completeDig(tileId: number, layer: number, state: GameState): void {
        const tile = state.grid[tileId];
        if (!tile || !tile.underground) return;

        const strata = tile.underground[layer];
        if (!strata || strata.excavated) return;

        // 1. Excavate the tile
        strata.excavated = true;

        // 2. If it's the top layer, it creates an entrance/hole on the surface
        if (layer === -1) {
            tile.hasEntrance = true;
        }

        // 3. Reveal adjacent ores (Fog of War)
        this.revealAdjacentOres(tile, layer, state.grid);

        // 4. Mark grid as dirty for rendering
        state.pendingEffects.push({ type: 'GRID_UPDATE', updates: [tile] });
    }

    private revealAdjacentOres(centerTile: GridTile, layer: number, grid: GridTile[]): void {
        const x = centerTile.x;
        const z = centerTile.y; // Grid uses y property for Z coordinate in 2D array logic often, but let's assume index structure matches

        const neighbors = [
            { dx: 0, dz: -1 }, // North
            { dx: 0, dz: 1 },  // South
            { dx: -1, dz: 0 }, // West
            { dx: 1, dz: 0 }   // East
        ];

        for (const offset of neighbors) {
            const nx = x + offset.dx;
            const nz = z + offset.dz;

            if (nx >= 0 && nx < GRID_SIZE && nz >= 0 && nz < GRID_SIZE) {
                const nIdx = nz * GRID_SIZE + nx;
                const neighbor = grid[nIdx];

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
}
