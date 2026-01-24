/**
 * Engine Jobs - Job System
 * Central job queue with priority handling and result management
 * Note: Actual worker dispatch will be added in WorkerPool
 */

import { Job, JobResult, JobKind } from './jobs.types';
import { BinaryHeap } from '../utils/BinaryHeap';
import { telemetry } from '../utils/Telemetry';

/** Job system statistics */
export interface JobStats {
    queued: number;
    pending: number;
    completed: number;
    failed: number;
}

export class JobSystem {
    /** Jobs waiting to be dispatched (Priority Queue) */
    private queue = new BinaryHeap<Job>((a, b) => b.priority - a.priority);

    /** Jobs currently being processed by workers */
    private pending = new Map<string, Job>();

    /** Results ready to be consumed */
    private results: JobResult[] = [];

    /** Jobs currently in queue (ID -> Job) for deduplication */
    private queuedJobs = new Map<string, Job>();

    /** Statistics */
    private stats: JobStats = {
        queued: 0,
        pending: 0,
        completed: 0,
        failed: 0,
    };

    /**
     * Add a job to the queue
     * Deduplicates based on job.id (cancels existing if present)
     */
    enqueue(job: Job): void {
        if (this.queuedJobs.has(job.id)) {
            // Cancel existing job
            const existing = this.queuedJobs.get(job.id)!;
            existing.cancelled = true;
            // logic: we don't remove from heap O(N), just lazy cancel
        }

        this.queuedJobs.set(job.id, job);
        this.queue.push(job);
        this.stats.queued++;
    }

    /**
     * Add multiple jobs to the queue
     */
    enqueueBatch(jobs: Job[]): void {
        for (const job of jobs) {
            this.enqueue(job);
        }
    }

    /**
     * Get jobs to dispatch this frame (respects budget)
     * Moves jobs from queue to pending
     */
    getJobsToDispatch(maxJobs: number): Job[] {
        const toDispatch: Job[] = [];

        while (toDispatch.length < maxJobs && this.queue.size > 0) {
            const job = this.queue.pop()!;

            // Clean up from queued map
            if (this.queuedJobs.get(job.id) === job) {
                this.queuedJobs.delete(job.id);
            }

            if (job.cancelled) {
                this.stats.queued--; // It was counted as queued, now removed
                continue;
            }

            toDispatch.push(job);
            this.pending.set(job.id, job);
            this.stats.pending++;
        }

        return toDispatch;
    }

    /**
     * Called by worker pool when a job completes
     */
    pushResult(result: JobResult): void {
        this.results.push(result);

        // Remove from pending
        if (this.pending.has(result.jobId)) {
            this.pending.delete(result.jobId);
            this.stats.pending--;
        }

        if (result.success) {
            this.stats.completed++;
        } else {
            this.stats.failed++;
        }

        // Record latency telemetry
        const latency = Date.now() - result.queuedAt;
        const metricType = result.kind === 'PATHFIND' ? 'job_pathfind' :
            result.kind === 'MESH_CHUNK' ? 'job_mesh' : 'job_other';
        telemetry.record(metricType, latency);
    }

    /**
     * Drain all available results
     * Call this in jobsFlush phase
     */
    drainResults(): JobResult[] {
        const drained = this.results;
        this.results = [];
        return drained;
    }

    /**
     * Drain results of a specific type
     */
    drainResultsOfKind<T extends JobResult>(kind: JobKind): T[] {
        const matching: T[] = [];
        const remaining: JobResult[] = [];

        for (const result of this.results) {
            if (result.kind === kind) {
                matching.push(result as T);
            } else {
                remaining.push(result);
            }
        }

        this.results = remaining;
        return matching;
    }

    /**
     * Check if there are jobs of a specific type in queue
     */
    hasJobsOfKind(kind: JobKind): boolean {
        return this.queue.some(j => j.kind === kind);
    }

    /**
     * Cancel all jobs of a specific type
     */
    cancelJobsOfKind(kind: JobKind): number {
        const before = this.queue.size;
        this.queue.filter(j => j.kind !== kind);
        return before - this.queue.size;
    }

    /**
     * Cancel a specific job by ID
     */
    cancelJob(jobId: string): boolean {
        const before = this.queue.size;
        this.queue.filter(j => j.id !== jobId);
        return before !== this.queue.size;
    }

    /**
     * Get current queue length
     */
    get queueLength(): number {
        return this.queue.size;
    }

    /**
     * Get pending job count
     */
    get pendingCount(): number {
        return this.pending.size;
    }

    /**
     * Get results count
     */
    get resultsCount(): number {
        return this.results.length;
    }

    /**
     * Get statistics
     */
    getStats(): JobStats {
        return { ...this.stats };
    }

    /**
     * Clear all queues (on world unload)
     */
    clear(): void {
        this.queue.clear();
        this.queuedJobs.clear();
        this.pending.clear();
        this.results.length = 0;
    }
}
