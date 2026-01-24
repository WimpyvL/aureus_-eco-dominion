/**
 * Engine Kernel - Runtime
 * The main loop controller - orchestrates the entire frame sequence
 */

import { Clock } from './Clock';
import { Profiler } from './Profiler';
import { EventBus, engineEvents } from './EventBus';
import { FrameContext, FixedContext, EngineConfig, DEFAULT_ENGINE_CONFIG } from './Types';
import { WorldHost } from '../world/WorldHost';
import { Benchmark } from './Benchmark';
import { telemetry } from '../utils/Telemetry';

export class Runtime {
    readonly clock: Clock;
    readonly profiler: Profiler;
    readonly benchmark: Benchmark;
    readonly events: EventBus;

    private running = false;
    private paused = false;
    private rafId: number | null = null;
    private config: EngineConfig;

    constructor(
        private worldHost: WorldHost,
        config: Partial<EngineConfig> = {}
    ) {
        this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
        this.clock = new Clock(this.config.fixedTickRate);
        this.profiler = new Profiler();
        this.profiler.setEnabled(this.config.profilerEnabled);
        this.benchmark = new Benchmark(this.profiler);
        this.events = engineEvents;
    }

    /**
     * Start the engine loop
     */
    start(): void {
        if (this.running) return;

        this.running = true;
        this.paused = false;
        this.clock.start();
        this.events.emit('engine:start', undefined);

        const loop = (now: number) => {
            if (!this.running) return;

            this.clock.tick(now);

            if (!this.paused) {
                this.frame();
            }

            this.rafId = requestAnimationFrame(loop);
        };

        this.rafId = requestAnimationFrame(loop);
    }

    /**
     * Stop the engine loop completely
     */
    stop(): void {
        if (!this.running) return;

        this.running = false;
        this.events.emit('engine:stop', undefined);

        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    /**
     * Pause simulation (render still runs)
     */
    pause(): void {
        if (!this.paused) {
            this.paused = true;
            this.events.emit('engine:pause', undefined);
        }
    }

    /**
     * Resume from pause
     */
    resume(): void {
        if (this.paused) {
            this.paused = false;
            this.events.emit('engine:resume', undefined);
        }
    }

    /**
     * Toggle pause state
     */
    togglePause(): void {
        if (this.paused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    /**
     * Execute one frame - the spine sequence
     */
    private frame(): void {
        const frameCtx: FrameContext = {
            dt: this.clock.delta,
            time: this.clock.time,
            frame: this.clock.frame,
        };

        this.profiler.begin('frame');

        // ─────────────────────────────────────────────
        // PHASE 1: Frame Begin (input polling, state sync)
        // ─────────────────────────────────────────────
        this.profiler.begin('input');
        this.worldHost.frameBegin(frameCtx);
        this.profiler.end('input');

        // ─────────────────────────────────────────────
        // PHASE 2: Streaming (chunk load/unload decisions)
        // ─────────────────────────────────────────────
        this.profiler.begin('streaming');
        this.worldHost.streaming(frameCtx);
        this.profiler.end('streaming');

        // ─────────────────────────────────────────────
        // PHASE 3: Jobs Flush (apply worker results)
        // ─────────────────────────────────────────────
        this.profiler.begin('jobsFlush');
        this.worldHost.jobsFlush(frameCtx);
        this.profiler.end('jobsFlush');

        // ─────────────────────────────────────────────
        // PHASE 4: Fixed-Step Simulation
        // ─────────────────────────────────────────────
        this.profiler.begin('simulation');
        const steps = this.clock.consumeFixedSteps(this.config.maxSimStepsPerFrame);
        for (let i = 0; i < steps; i++) {
            const fixedCtx: FixedContext = {
                fixedDt: this.clock.fixedDt,
                stepIndex: i,
                time: this.clock.time,
            };
            this.worldHost.simulation(fixedCtx);
        }
        this.profiler.end('simulation');

        // ─────────────────────────────────────────────
        // PHASE 5: Render Sync (update meshes from state)
        // ─────────────────────────────────────────────
        this.profiler.begin('renderSync');
        this.worldHost.renderSync(frameCtx);
        this.profiler.end('renderSync');

        // ─────────────────────────────────────────────
        // PHASE 6: Draw (GPU submit)
        // ─────────────────────────────────────────────
        this.profiler.begin('draw');
        this.worldHost.draw(frameCtx);
        this.profiler.end('draw');

        // ─────────────────────────────────────────────
        // PHASE 7: Frame End (cleanup, telemetry)
        // ─────────────────────────────────────────────
        this.profiler.begin('frameEnd');
        this.worldHost.frameEnd(frameCtx);
        this.benchmark.update(frameCtx.time);

        // Telemetry Reporting
        telemetry.record('frame', frameCtx.dt * 1000);

        // Log telemetry every 5 seconds (debug mode)
        if (Math.floor(frameCtx.time) % 5 === 0 && Math.abs(frameCtx.time % 1) < frameCtx.dt * 2) {
            console.log(telemetry.getSummary());
        }

        this.profiler.end('frameEnd');

        this.profiler.end('frame');
    }

    /**
     * Get engine status
     */
    getStatus(): { running: boolean; paused: boolean; fps: number; frame: number } {
        return {
            running: this.running,
            paused: this.paused,
            fps: this.clock.getFPS(),
            frame: this.clock.frame,
        };
    }

    /**
     * Get profiler for external access
     */
    getProfiler(): Profiler {
        return this.profiler;
    }

    getBenchmark(): Benchmark {
        return this.benchmark;
    }
}
