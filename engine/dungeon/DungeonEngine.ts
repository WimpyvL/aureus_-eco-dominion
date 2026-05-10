
import { DungeonState, DungeonBlockType } from './DungeonTypes';

export class DungeonEngine {
    // Block IDs for Uint8Array storage
    static BLOCK = {
        AIR: 0,
        DIRT: 1,
        STONE: 2,
        GOLD: 3,
        GEMS: 4,
        MANA: 5,
        HEART: 6,
        SUPPORT: 7,
        RECHARGER: 8
    };

    static CEILING_HEIGHT = 4;

    // Hardness for mining time calculation
    static BLOCK_HARDNESS: Record<number, number> = {
        [DungeonEngine.BLOCK.DIRT]: 1,
        [DungeonEngine.BLOCK.STONE]: 3,
        [DungeonEngine.BLOCK.GOLD]: 1.5,
        [DungeonEngine.BLOCK.GEMS]: 2,
        [DungeonEngine.BLOCK.MANA]: 2,
        [DungeonEngine.BLOCK.HEART]: 999,
        [DungeonEngine.BLOCK.SUPPORT]: 5,
        [DungeonEngine.BLOCK.RECHARGER]: 2,
    };

    private state: DungeonState;
    private suppressRenderInvalidationDepth = 0;

    constructor(state: DungeonState) {
        this.state = state;
        this.ensureRenderVersion();

        // Initialize arrays if null
        if (!this.state.voxelData) {
            const { x, y, z } = this.state.gridSize;
            this.state.voxelData = new Uint8Array(x * y * z);
            this.state.revealedData = new Uint8Array(x * y * z);
            this.runWithoutRenderInvalidation(() => this.initWorld());
            this.markRenderDirty();
        }
    }

    getState(): DungeonState {
        return this.state;
    }

    getRenderVersion(): number {
        this.ensureRenderVersion();
        return this.state.renderVersion;
    }

    private initWorld() {
        const { x: sx, y: sy, z: sz } = this.state.gridSize;
        const data = this.state.voxelData!;
        const revealed = this.state.revealedData!;

        for (let i = 0; i < data.length; i++) {
            const { y } = this.indexToPos(i);
            if (y === 0) {
                data[i] = DungeonEngine.BLOCK.STONE;
            } else if (y >= 1 && y <= 3) {
                const rand = Math.random();
                if (rand > 0.985) data[i] = DungeonEngine.BLOCK.MANA;
                else if (rand > 0.96) data[i] = DungeonEngine.BLOCK.GEMS;
                else if (rand > 0.92) data[i] = DungeonEngine.BLOCK.GOLD;
                else if (rand > 0.75) data[i] = DungeonEngine.BLOCK.STONE;
                else data[i] = DungeonEngine.BLOCK.DIRT;
            } else {
                data[i] = DungeonEngine.BLOCK.AIR;
            }
        }

        // Clear center room and reveal walls
        const midX = Math.floor(sx / 2);
        const midZ = Math.floor(sz / 2);
        for (let x = midX - 4; x <= midX + 4; x++) {
            for (let z = midZ - 4; z <= midZ + 4; z++) {
                const isWall = x === midX - 4 || x === midX + 4 || z === midZ - 4 || z === midZ + 4;

                for (let y = 1; y <= 3; y++) {
                    if (!isWall) {
                        this.setBlockId(x, y, z, DungeonEngine.BLOCK.AIR);
                    }
                    this.reveal(x, y, z); // Reveal both air and the immediate wall
                }
                this.reveal(x, 0, z); // Reveal floor
            }
        }

        // Place Heart
        this.setBlockId(midX, 1, midZ, DungeonEngine.BLOCK.HEART);
        this.reveal(midX, 1, midZ);
    }

    private ensureRenderVersion() {
        if (typeof this.state.renderVersion !== 'number' || !Number.isFinite(this.state.renderVersion)) {
            this.state.renderVersion = 0;
        }
    }

    private markRenderDirty() {
        if (this.suppressRenderInvalidationDepth > 0) return;
        this.ensureRenderVersion();
        this.state.renderVersion += 1;
    }

    private runWithoutRenderInvalidation<T>(fn: () => T): T {
        this.suppressRenderInvalidationDepth += 1;
        try {
            return fn();
        } finally {
            this.suppressRenderInvalidationDepth -= 1;
        }
    }

    // --- Accessors ---

    isValid(x: number, y: number, z: number): boolean {
        const { x: sx, y: sy, z: sz } = this.state.gridSize;
        return x >= 0 && x < sx && y >= 0 && y < sy && z >= 0 && z < sz;
    }

    index(x: number, y: number, z: number): number {
        return x + y * this.state.gridSize.x + z * this.state.gridSize.x * this.state.gridSize.y;
    }

    indexToPos(index: number) {
        const { x: sx, y: sy } = this.state.gridSize;
        const x = index % sx;
        const y = Math.floor((index / sx) % sy);
        const z = Math.floor(index / (sx * sy));
        return { x, y, z };
    }

    getBlockId(x: number, y: number, z: number): number {
        if (!this.isValid(x, y, z)) return DungeonEngine.BLOCK.AIR;
        return this.state.voxelData![this.index(Math.floor(x), Math.floor(y), Math.floor(z))];
    }

    setBlockId(x: number, y: number, z: number, id: number) {
        if (!this.isValid(x, y, z)) return;
        const index = this.index(Math.floor(x), Math.floor(y), Math.floor(z));
        if (this.state.voxelData![index] === id) return;
        this.state.voxelData![index] = id;
        this.markRenderDirty();
    }

    isRevealed(x: number, y: number, z: number): boolean {
        if (!this.isValid(x, y, z)) return false;
        return this.state.revealedData![this.index(Math.floor(x), Math.floor(y), Math.floor(z))] === 1;
    }

    reveal(x: number, y: number, z: number) {
        if (!this.isValid(x, y, z)) return;
        const index = this.index(Math.floor(x), Math.floor(y), Math.floor(z));
        if (this.state.revealedData![index] === 1) return;
        this.state.revealedData![index] = 1;
        this.markRenderDirty();
    }

    // --- Logic ---

    // Used by renderer to determine what to draw
    shouldRender(x: number, y: number, z: number): boolean {
        const type = this.getBlockId(x, y, z);
        if (type === DungeonEngine.BLOCK.AIR) return false;
        if (y > DungeonEngine.CEILING_HEIGHT) return false;

        // Always render special blocks if revealed
        if ((type === DungeonEngine.BLOCK.HEART ||
            type === DungeonEngine.BLOCK.SUPPORT ||
            type === DungeonEngine.BLOCK.RECHARGER) && this.isRevealed(x, y, z)) {
            return true;
        }

        // Render solid blocks if they have an exposed face
        // AND the block itself is revealed? 
        // Logic from VVD: blocks are hidden until revealed.
        if (!this.isRevealed(x, y, z)) return false;

        const neighbors = [
            [1, 0, 0], [-1, 0, 0],
            [0, 1, 0], [0, -1, 0],
            [0, 0, 1], [0, 0, -1]
        ];

        for (const [nx, ny, nz] of neighbors) {
            const tx = x + nx; const ty = y + ny; const tz = z + nz;
            // If neighbor is air and revealed, we are a surface
            if (this.isValid(tx, ty, tz)) {
                if (this.isRevealed(tx, ty, tz) && this.getBlockId(tx, ty, tz) === DungeonEngine.BLOCK.AIR) {
                    return true;
                }
            }
        }

        // Render floor if visible from above?
        // Original logic: if (y === 0 && this.isRevealed(x, 1, z) && this.getVoxel(x, 1, z) === AIR)
        if (y === 0 && this.isRevealed(x, 1, z) && this.getBlockId(x, 1, z) === DungeonEngine.BLOCK.AIR) {
            return true;
        }

        return false;
    }

    checkStability(): { x: number, y: number, z: number }[] {
        const collapses: { x: number, y: number, z: number }[] = [];
        const radius = 4;
        const { x: sx, z: sz } = this.state.gridSize;

        for (let x = 0; x < sx; x++) {
            for (let z = 0; z < sz; z++) {
                // Check ceiling spot (y=1)
                const type = this.getBlockId(x, 1, z);

                // If it's AIR (dug out) and revealed, check if it's supported
                if (type === DungeonEngine.BLOCK.AIR && this.isRevealed(x, 1, z)) {
                    let supported = false;
                    for (let dx = -radius; dx <= radius; dx++) {
                        for (let dz = -radius; dz <= radius; dz++) {
                            if (Math.abs(dx) + Math.abs(dz) > radius) continue;
                            const tx = x + dx;
                            const tz = z + dz;
                            const checkType = this.getBlockId(tx, 1, tz);

                            // Stone, Heart, Support, unmined Dirt/Gold etc act as support
                            if (checkType !== DungeonEngine.BLOCK.AIR && checkType !== DungeonEngine.BLOCK.RECHARGER) {
                                supported = true;
                                break;
                            }
                        }
                        if (supported) break;
                    }

                    if (!supported && Math.random() < 0.05) {
                        // Collapse! Fill vertical column with dirt
                        for (let y = 1; y <= 3; y++) {
                            if (this.getBlockId(x, y, z) === DungeonEngine.BLOCK.AIR) {
                                this.setBlockId(x, y, z, DungeonEngine.BLOCK.DIRT);
                                collapses.push({ x, y, z });
                            }
                        }
                    }
                }
            }
        }
        return collapses;
    }
}
