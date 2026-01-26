
import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState, GridTile, BuildingType, SfxType } from '../../../types';
import { GRID_SIZE } from '../../utils/GameUtils';

/**
 * Voxel Destruction System
 * Handles structural integrity, damage, and debris.
 */
export class VoxelDestructionSystem extends BaseSimSystem {
    readonly id = 'voxel_destruction';
    readonly priority = 90; // High priority to process damage before rendering

    tick(ctx: FixedContext, state: GameState): void {
        // Process Command Queue
        if (state.commandQueue && state.commandQueue.length > 0) {
            // Filter out our commands to process
            const toProcess = state.commandQueue.filter(cmd => cmd.type === 'EXPLODE_TILE');

            // Remove them from the main queue (mutation)
            if (toProcess.length > 0) {
                state.commandQueue = state.commandQueue.filter(cmd => cmd.type !== 'EXPLODE_TILE');

                for (const cmd of toProcess) {
                    if (cmd.type === 'EXPLODE_TILE') {
                        const { index, radius, damage } = cmd.payload;
                        const cx = index % GRID_SIZE;
                        const cz = Math.floor(index / GRID_SIZE);
                        this.applyRadialDamage(state, cx, cz, radius, damage);
                    }
                }
            }
        }

        // Check for floating islands occasionally (throttle this)
        if (state.tickCount % 30 === 0) {
            this.checkStructuralIntegrity(state);
        }
    }

    /**
     * Applies damage to a voxel at a specific index and layer
     */
    public startDamageTransaction(state: GameState, tileIndex: number, amount: number, isExplosive: boolean = false): void {
        const tile = state.grid[tileIndex];
        if (!tile) return;

        // Ensure integrity is initialized
        if (tile.integrity === undefined) tile.integrity = 100;

        // Apply damage
        tile.integrity -= amount;

        // Visual feedback (Darkening is handled by renderer based on integrity)
        // FX
        if (amount > 5) {
            state.pendingEffects.push({ type: 'FX', fxType: 'DUST', index: tileIndex });
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.MINING_HIT });
        }

        // Destruction Check
        if (tile.integrity <= 0) {
            this.destroyVoxel(state, tileIndex, isExplosive);
        }
    }

    private destroyVoxel(state: GameState, index: number, explosive: boolean): void {
        const tile = state.grid[index];

        // Spawn Debris (Logic adapted from _create_debri_multimesh)
        // We use FX system for this
        state.pendingEffects.push({ type: 'FX', fxType: 'MINING', index: index });
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.CAMP_BUILD }); // Collapse sound?

        // Reset tile
        tile.buildingType = BuildingType.EMPTY;
        tile.integrity = 100;
        tile.foliage = 'NONE';
        tile.terrainHeight = 0; // Flatten? Or keep height? standard destruction implies removal.

        // Trigger structural check around this voxel
        // We can do an immediate checks or wait for the tick
    }

    /**
     * Flood fill algorithm to detect floating islands
     * Adapted from voxel_object.gd _flood_fill
     */
    private checkStructuralIntegrity(state: GameState): void {
        // We only care about buildings or height-based terrain that shouldn't float.
        // For a 2.5D grid, "floating" means tiles with height > 0 that have no neighbors 
        // or buildings that are disconnected. 
        // However, the original code supports full 3D voxels. 
        // Our 'grid' is 2D with 'underground' layers.

        // Let's implement a simple check: Surface tiles are always supported by "bedrock".
        // Underground tiles (support pillars, etc) might need connection to specific points.

        // Verify underground support
        // Iterate surface tiles that have underground structures
        // (Implementation dependent on specific game rules for support)

        // For now, simpler implementation:
        // If a tile has high terrainHeight but is surrounded by 0 height neighbors, collapse it?
        // Or if specific buildings (bridges) lose support?
    }

    /**
     * Radial damage (Explosion)
     * Adapted from voxel_damager.gd hit()
     */
    public applyRadialDamage(state: GameState, centerX: number, centerZ: number, radius: number, maxDamage: number): void {
        const rSq = radius * radius;

        // Bounds
        const minX = Math.max(0, Math.floor(centerX - radius));
        const maxX = Math.min(GRID_SIZE - 1, Math.ceil(centerX + radius));
        const minZ = Math.max(0, Math.floor(centerZ - radius));
        const maxZ = Math.min(GRID_SIZE - 1, Math.ceil(centerZ + radius));

        for (let z = minZ; z <= maxZ; z++) {
            for (let x = minX; x <= maxX; x++) {
                const dx = x - centerX;
                const dz = z - centerZ;
                const distSq = dx * dx + dz * dz;

                if (distSq <= rSq) {
                    const dist = Math.sqrt(distSq);
                    // Linear falloff from center (simplified curve)
                    const falloff = 1.0 - (dist / radius);
                    const damage = maxDamage * falloff;

                    if (damage > 0) {
                        const idx = z * GRID_SIZE + x;
                        this.startDamageTransaction(state, idx, damage, true);
                    }
                }
            }
        }
    }
}
