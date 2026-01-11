/**
 * Deterministic Linear Congruential Generator
 */
export class Random {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    /**
     * Returns a float between 0 and 1
     */
    next(): number {
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return (this.seed >>> 0) / 4294967296;
    }

    /**
     * Returns a float between min and max
     */
    range(min: number, max: number): number {
        return min + this.next() * (max - min);
    }

    /**
     * Returns an integer between min and max (exclusive)
     */
    rangeInt(min: number, max: number): number {
        return Math.floor(this.range(min, max));
    }

    /**
     * Returns true/false based on probability
     */
    chance(probability: number): boolean {
        return this.next() < probability;
    }
}
