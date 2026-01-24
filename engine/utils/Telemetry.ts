/**
 * Engine Telemetry Service
 * Tracks and aggregates performance metrics (p50, p95, p99)
 */

export type MetricType = 'frame' | 'job_pathfind' | 'job_mesh' | 'job_other';

interface MetricStore {
    samples: number[];
    maxSamples: number;
}

export class Telemetry {
    private static instance: Telemetry;
    private metrics: Map<MetricType, MetricStore> = new Map();
    private readonly DEFAULT_WINDOW = 300; // ~5 seconds at 60fps

    private constructor() { }

    public static getInstance(): Telemetry {
        if (!Telemetry.instance) {
            Telemetry.instance = new Telemetry();
        }
        return Telemetry.instance;
    }

    /**
     * Record a sample for a metric
     */
    public record(type: MetricType, value: number): void {
        let store = this.metrics.get(type);
        if (!store) {
            store = { samples: [], maxSamples: this.DEFAULT_WINDOW };
            this.metrics.set(type, store);
        }

        store.samples.push(value);
        if (store.samples.length > store.maxSamples) {
            store.samples.shift();
        }
    }

    /**
     * Get statistics for a metric
     */
    public getStats(type: MetricType): { p50: number; p95: number; p99: number; avg: number } {
        const store = this.metrics.get(type);
        if (!store || store.samples.length === 0) {
            return { p50: 0, p95: 0, p99: 0, avg: 0 };
        }

        const sorted = [...store.samples].sort((a, b) => a - b);
        const sum = sorted.reduce((a, b) => a + b, 0);

        return {
            p50: sorted[Math.floor(sorted.length * 0.50)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)],
            avg: sum / sorted.length
        };
    }

    /**
     * Get a human-readable summary
     */
    public getSummary(): string {
        const frame = this.getStats('frame');
        const pf = this.getStats('job_pathfind');
        const mesh = this.getStats('job_mesh');

        return `[Telemetry] FPS: ${(1000 / (frame.avg || 16.6)).toFixed(1)} | ` +
            `Frame: ${frame.p95.toFixed(2)}ms (p95) | ` +
            `Pathfind: ${pf.p95.toFixed(1)}ms (p95) | ` +
            `Meshing: ${mesh.p95.toFixed(1)}ms (p95)`;
    }

    /**
     * Clear all metrics
     */
    public reset(): void {
        this.metrics.clear();
    }
}

export const telemetry = Telemetry.getInstance();
