/**
 * Engine World - World Interface
 * Contract that any game world must implement to run in the engine
 */

import { FrameContext, FixedContext } from '../kernel/Types';

/**
 * World lifecycle states
 */
export type WorldState =
    | 'uninitialized'
    | 'loading'
    | 'ready'
    | 'running'
    | 'paused'
    | 'tearingDown'
    | 'disposed';

/**
 * World interface - implement this for your game
 * Each method corresponds to a phase in the engine spine
 */
export interface World {
    /** Unique identifier for this world instance */
    readonly id: string;

    /** Current lifecycle state */
    readonly state: WorldState;

    /** Job System Statistics for Telemetry */
    readonly jobStats?: { queued: number; pending: number; completed: number };

    // ═══════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════

    /**
     * Initialize the world - load assets, create initial state
     * Called once when world is first loaded
     */
    init(): Promise<void> | void;

    /**
     * Cleanup and dispose all resources
     * Called when world is unloaded
     */
    teardown(): Promise<void> | void;

    // ═══════════════════════════════════════════════════════════════
    // FRAME PHASES (Called in order every frame)
    // ═══════════════════════════════════════════════════════════════

    /**
     * PHASE 1: Frame Begin
     * Poll input, sync external state, prepare for frame
     */
    frameBegin(ctx: FrameContext): void;

    /**
     * PHASE 2: Streaming
     * Decide what chunks/regions to load/unload based on camera
     * Queue loading jobs, dispose unneeded data
     */
    streaming(ctx: FrameContext): void;

    /**
     * PHASE 3: Jobs Flush
     * Apply results from worker threads (meshing, pathfinding, etc)
     * This happens BEFORE simulation so results are available
     */
    jobsFlush(ctx: FrameContext): void;

    /**
     * PHASE 4: Simulation (Fixed Timestep)
     * Core gameplay logic - physics, AI, game rules
     * Called N times per frame to maintain fixed timestep
     */
    simulation(ctx: FixedContext): void;

    /**
     * PHASE 5: Render Sync
     * Update renderable state from authoritative data
     * Interpolate between simulation states if needed
     */
    renderSync(ctx: FrameContext): void;

    /**
     * PHASE 6: Draw
     * Submit draw calls to GPU
     */
    draw(ctx: FrameContext): void;

    /**
     * PHASE 7: Frame End
     * Cleanup, telemetry, prepare for next frame
     */
    frameEnd(ctx: FrameContext): void;
}

/**
 * Base World class with default no-op implementations
 * Extend this for convenience
 */
export abstract class BaseWorld implements World {
    abstract readonly id: string;
    state: WorldState = 'uninitialized';

    get jobStats() { return { queued: 0, pending: 0, completed: 0 }; }

    async init(): Promise<void> {
        this.state = 'loading';
        await this.onInit();
        this.state = 'ready';
    }

    async teardown(): Promise<void> {
        this.state = 'tearingDown';
        await this.onTeardown();
        this.state = 'disposed';
    }

    /** Override this for initialization logic */
    protected onInit(): Promise<void> | void { }

    /** Override this for cleanup logic */
    protected onTeardown(): Promise<void> | void { }

    frameBegin(_ctx: FrameContext): void { }
    streaming(_ctx: FrameContext): void { }
    jobsFlush(_ctx: FrameContext): void { }
    simulation(_ctx: FixedContext): void { }
    renderSync(_ctx: FrameContext): void { }
    draw(_ctx: FrameContext): void { }
    frameEnd(_ctx: FrameContext): void { }
}
