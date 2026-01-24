/**
 * Engine Jobs - Job Type Definitions
 * Define all job types and their payloads here
 */

/** Available job types */
export type JobKind =
    | 'MESH_CHUNK'
    | 'PATHFIND'
    | 'GENERATE_TERRAIN'
    | 'SAVE_CHUNK'
    | 'LOAD_CHUNK';

/** Base interface for all jobs */
export interface BaseJob {
    /** Unique job ID */
    id: string;
    /** Job type discriminator */
    kind: JobKind;
    /** Priority (higher = sooner) */
    priority: number;
    /** Timestamp when job was queued */
    queuedAt: number;
    /** Cancellation flag for deduplication */
    cancelled?: boolean;
}

export const JOB_PRIORITY = {
    HIGH: 100,
    PATHFINDING: 50,
    MESHING: 10,
    LOW: 1
};

/** Mesh generation job */
export interface MeshChunkJob extends BaseJob {
    kind: 'MESH_CHUNK';
    payload: {
        chunkId: string;
        cx: number;
        cz: number;
        tiles: any[]; // GridTile[] but can be loose for transfer
        gridSize: number;
        viewMode?: 'SURFACE' | 'UNDERGROUND';
        lod?: number;
    }
}

// ... 
/** Pathfinding job */
export interface PathfindJob extends BaseJob {
    kind: 'PATHFIND';
    startX: number;
    startZ: number;
    endX: number;
    endZ: number;
    agentId: string;
}

/** Terrain generation job */
export interface GenerateTerrainJob extends BaseJob {
    kind: 'GENERATE_TERRAIN';
    chunkKey: string;
    seed: number;
}

/** Chunk save job */
export interface SaveChunkJob extends BaseJob {
    kind: 'SAVE_CHUNK';
    chunkKey: string;
}

/** Chunk load job */
export interface LoadChunkJob extends BaseJob {
    kind: 'LOAD_CHUNK';
    chunkKey: string;
}

/** Union of all job types */
export type Job =
    | MeshChunkJob
    | PathfindJob
    | GenerateTerrainJob
    | SaveChunkJob
    | LoadChunkJob;

// ═══════════════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════════════

/** Base interface for all job results */
export interface BaseJobResult {
    jobId: string;
    kind: JobKind;
    success: boolean;
    error?: string;
    completedAt: number;
    queuedAt: number;
}
export interface MeshChunkResult extends BaseJobResult {
    kind: 'MESH_CHUNK';
    chunkId: string;
    cx: number;
    cz: number;
    solid: { p: Float32Array; n: Float32Array; c: Float32Array; u: Float32Array } | null;
    water: { p: Float32Array; n: Float32Array; c: Float32Array; u: Float32Array } | null;
    ghost: { p: Float32Array; n: Float32Array; c: Float32Array; u: Float32Array } | null;
    foliage: any[];
    lod?: number;
}

/** Pathfinding result */
export interface PathfindResult extends BaseJobResult {
    kind: 'PATHFIND';
    agentId: string;
    path: number[] | null;
}

/** Terrain generation result */
export interface GenerateTerrainResult extends BaseJobResult {
    kind: 'GENERATE_TERRAIN';
    chunkKey: string;
    // Voxel data would go here
}

/** Union of all result types */
export type JobResult =
    | MeshChunkResult
    | PathfindResult
    | GenerateTerrainResult
    | BaseJobResult;

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

let jobIdCounter = 0;

/**
 * Generate a unique job ID
 */
export function generateJobId(): string {
    return `job_${Date.now()}_${++jobIdCounter}`;
}

/**
 * Create a job with common fields populated
 */
export function createJob<T extends Job>(
    kind: T['kind'],
    data: Omit<T, 'id' | 'kind' | 'queuedAt' | 'priority'> & { priority?: number }
): T {
    return {
        id: generateJobId(),
        kind,
        priority: data.priority ?? 0,
        queuedAt: Date.now(),
        ...data,
    } as T;
}
