/**
 * Engine Kernel - Performance Profiler
 * Precise timing for each engine phase with history and budget tracking
 */

import { EnginePhase } from './Types';

interface PhaseTiming {
    current: number;
    average: number;
    min: number;
    max: number;
    samples: number[];
}

export class Profiler {
    private marks = new Map<string, number>();
    private timings = new Map<string, PhaseTiming>();
    private enabled = true;

    /** How many samples to keep for averaging */
    private readonly sampleSize = 60;

    /** Frame budget in milliseconds (16.67ms = 60fps) */
    public frameBudgetMs = 16.67;

    /**
     * Enable or disable profiling
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    /**
     * Start timing a phase
     */
    begin(label: string): void {
        if (!this.enabled || (import.meta as any).env?.PROD) return;
        this.marks.set(label, performance.now());
    }

    /**
     * End timing a phase and record the result
     */
    end(label: string): number {
        if (!this.enabled || (import.meta as any).env?.PROD) return 0;

        const start = this.marks.get(label);
        if (start == null) return 0;

        const duration = performance.now() - start;
        this.record(label, duration);
        return duration;
    }

    /**
     * Record a timing value directly
     */
    private record(label: string, duration: number): void {
        let timing = this.timings.get(label);

        if (!timing) {
            timing = {
                current: 0,
                average: 0,
                min: Infinity,
                max: 0,
                samples: [],
            };
            this.timings.set(label, timing);
        }

        timing.current = duration;
        timing.samples.push(duration);

        // Keep sample buffer bounded
        if (timing.samples.length > this.sampleSize) {
            timing.samples.shift();
        }

        // Update stats
        timing.min = Math.min(timing.min, duration);
        timing.max = Math.max(timing.max, duration);
        timing.average = timing.samples.reduce((a, b) => a + b, 0) / timing.samples.length;
    }

    /**
     * Get current timing for a phase
     */
    get(label: string): number {
        return this.timings.get(label)?.current ?? 0;
    }

    /**
     * Get average timing for a phase
     */
    getAverage(label: string): number {
        return this.timings.get(label)?.average ?? 0;
    }

    /**
     * Get full timing stats for a phase
     */
    getStats(label: string): PhaseTiming | null {
        return this.timings.get(label) ?? null;
    }

    /**
     * Get all timing data for debug display
     */
    getAllStats(): Map<string, PhaseTiming> {
        return new Map(this.timings);
    }

    /**
     * Check if we're over frame budget
     */
    isOverBudget(): boolean {
        const frameTime = this.get('frame');
        return frameTime > this.frameBudgetMs;
    }

    /**
     * Get percentage of frame budget used
     */
    getBudgetUsage(): number {
        return (this.get('frame') / this.frameBudgetMs) * 100;
    }

    /**
     * Generate a formatted report string
     */
    report(): string {
        const lines: string[] = ['=== PROFILER REPORT ==='];

        const orderedPhases: EnginePhase[] = [
            'frame', 'input', 'streaming', 'jobsFlush',
            'simulation', 'renderSync', 'draw', 'frameEnd'
        ];

        for (const phase of orderedPhases) {
            const stats = this.timings.get(phase);
            if (stats) {
                lines.push(
                    `${phase.padEnd(12)} | cur: ${stats.current.toFixed(2).padStart(6)}ms | ` +
                    `avg: ${stats.average.toFixed(2).padStart(6)}ms | ` +
                    `min: ${stats.min.toFixed(2).padStart(6)}ms | max: ${stats.max.toFixed(2).padStart(6)}ms`
                );
            }
        }

        lines.push(`Budget: ${this.getBudgetUsage().toFixed(1)}% (${this.frameBudgetMs}ms target)`);
        return lines.join('\n');
    }

    /**
     * Reset all timing data
     */
    reset(): void {
        this.marks.clear();
        this.timings.clear();
    }
}
