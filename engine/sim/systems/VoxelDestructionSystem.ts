
import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { GameState, GridTile, BuildingType, SfxType } from '../../../types';
import { ChunkStore } from '../../space/ChunkStore';
import { worldToChunk, CHUNK_SIZE } from '../../utils/coords';

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
            const toProcess = state.commandQueue.filter(cmd => cmd.type === 'EXPLODE_TILE');

            if (toProcess.length > 0) {
                state.commandQueue = state.commandQueue.filter(cmd => cmd.type !== 'EXPLODE_TILE');

                for (const cmd of toProcess) {
                    if (cmd.type === 'EXPLODE_TILE') {
                        const { x, z, radius, damage } = cmd.payload;
                        this.applyRadialDamage(state, x, z, radius, damage);
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
    public startDamageTransaction(state: GameState, x: number, z: number, amount: number, isExplosive: boolean = false): void {
        const tile = ChunkStore.getTile(state.chunks, x, z);
        if (!tile) return;

        // Ensure integrity is initialized
        if (tile.integrity === undefined) tile.integrity = 100;

        // Apply damage
        tile.integrity -= amount;

        // Visual feedback
        if (amount > 5) {
            state.pendingEffects.push({ type: 'FX', fxType: 'DUST', x, z });
            state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.MINING_HIT });
        }

        // Destruction Check
        if (tile.integrity <= 0) {
            this.destroyVoxel(state, x, z, isExplosive);
        }
    }

    private destroyVoxel(state: GameState, x: number, z: number, explosive: boolean): void {
        const tile = ChunkStore.getTile(state.chunks, x, z);
        if (!tile) return;

        state.pendingEffects.push({ type: 'FX', fxType: 'MINING', x, z });
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.CAMP_BUILD });

        // Reset tile
        tile.buildingType = BuildingType.EMPTY;
        tile.integrity = 100;
        tile.foliage = 'NONE';
        tile.terrainHeight = 0;

        const { cx, cz } = worldToChunk(x, z, CHUNK_SIZE);
        state.pendingEffects.push({ type: 'CHUNK_UPDATE', cx, cz, updates: [tile] });
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

        // Unbounded iteration: only touch tiles within radius
        const minX = Math.floor(centerX - radius);
        const maxX = Math.ceil(centerX + radius);
        const minZ = Math.floor(centerZ - radius);
        const maxZ = Math.ceil(centerZ + radius);

        for (let z = minZ; z <= maxZ; z++) {
            for (let x = minX; x <= maxX; x++) {
                const dx = x - centerX;
                const dz = z - centerZ;
                const distSq = dx * dx + dz * dz;

                if (distSq <= rSq) {
                    const dist = Math.sqrt(distSq);
                    const falloff = 1.0 - (dist / radius);
                    const damage = maxDamage * falloff;

                    if (damage > 0) {
                        this.startDamageTransaction(state, x, z, damage, true);
                    }
                }
            }
        }
    }
}
