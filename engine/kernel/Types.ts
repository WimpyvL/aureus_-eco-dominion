/**
 * Engine Kernel - Core Types
 * Central type definitions for the engine runtime
 */

import { Random } from './Random';

/** Context passed to per-frame callbacks */
export interface FrameContext {
    /** Delta time since last frame (seconds) */
    dt: number;
    /** Total elapsed time (seconds) */
    time: number;
    /** Current frame number */
    frame: number;
}

/** Context passed to fixed-step simulation callbacks */
export interface FixedContext {
    /** Fixed timestep (seconds) - constant value */
    fixedDt: number;
    /** Which simulation step this is within the current frame (0, 1, 2...) */
    stepIndex: number;
    /** Total elapsed time (seconds) */
    time: number;
    /** Deterministic random number generator */
    random?: Random;
    /** Deterministic ID generator */
    getNextId?: (prefix: string) => string;
}

/** Engine configuration */
export interface EngineConfig {
    /** Target simulation rate (Hz) - default 60 */
    fixedTickRate: number;
    /** Maximum simulation steps per frame to prevent spiral of death */
    maxSimStepsPerFrame: number;
    /** Enable profiler by default */
    profilerEnabled: boolean;
}

/** Default engine configuration */
export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
    fixedTickRate: 60,
    maxSimStepsPerFrame: 5,
    profilerEnabled: true,
};

/** Phase markers for profiling */
export type EnginePhase =
    | 'frame'
    | 'input'
    | 'streaming'
    | 'jobsFlush'
    | 'simulation'
    | 'renderSync'
    | 'draw'
    | 'frameEnd';
