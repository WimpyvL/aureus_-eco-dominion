/**
 * Engine Benchmark & Telemetry
 * Aggregates performance stats from across the engine subsystems.
 */

import { Profiler } from './Profiler';

export interface TelemetrySnapshot {
    fps: number;
    frameTime: {
        avg: number;
        p95: number;
        p99: number;
    };
    jobs: {
        queueDepth: number;
        processedPerSec: number;
    };
    entities: {
        active: number;
        total: number;
    };
}

export class Benchmark {
    private jobProcessedCounter = 0;
    private jobProcessedLastSec = 0;
    private lastSecTime = 0;

    constructor(
        private profiler: Profiler
    ) { }

    /**
     * Call this when a job is processed
     */
    recordJobProcessed(count: number = 1) {
        this.jobProcessedCounter += count;
    }

    update(time: number) {
        if (time - this.lastSecTime >= 1.0) {
            this.jobProcessedLastSec = this.jobProcessedCounter;
            this.jobProcessedCounter = 0;
            this.lastSecTime = time;
        }
    }

    getReport(queueDepth: number, entityCount: number): TelemetrySnapshot {
        const frameStats = this.profiler.getStats('frame');

        return {
            fps: 1000 / (frameStats?.average || 16.6),
            frameTime: {
                avg: frameStats?.average || 0,
                p95: frameStats?.p95 || 0,
                p99: frameStats?.p99 || 0
            },
            jobs: {
                queueDepth,
                processedPerSec: this.jobProcessedLastSec
            },
            entities: {
                active: entityCount,
                total: entityCount // todo: distinct active vs total
            }
        };
    }
}
