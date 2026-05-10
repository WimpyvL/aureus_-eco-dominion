/**
 * Simple Object Pool for path arrays to reduce GC pressure
 */
export class PathPool {
    private static pool: any[][] = [];
    private static readonly MAX_POOL_SIZE = 100;

    /**
     * Get an empty path array from the pool
     */
    static acquire<T>(): T[] {
        const path = this.pool.pop();
        if (path) {
            path.length = 0;
            return path;
        }
        return [];
    }

    /**
     * Return a path array to the pool for reuse
     */
    static release(path: any[] | null | undefined): void {
        if (!path) return;

        if (this.pool.length < this.MAX_POOL_SIZE) {
            path.length = 0;
            this.pool.push(path);
        }
    }
}
