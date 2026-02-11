/**
 * Engine Sim - Simulation System Interface
 * Contract for game systems that run during fixed-step simulation
 */

import { FixedContext, CommandResult, CommandContext } from '../kernel/Types';
import { GameCommand } from '../types';

/**
 * A simulation system runs during the fixed-step simulation phase
 * Examples: movement, physics, AI, resource production
 */
export interface SimSystem {
    /** System identifier */
    readonly id: string;

    /** System priority - higher runs first */
    readonly priority: number;

    /** Whether system is currently enabled */
    enabled: boolean;

    /** Initialize system */
    init(): void;

    /** Run one fixed-step tick */
    tick(ctx: FixedContext, state: any): void;

    /** Handle a game command. Return null if not handled by this system. */
    handleCommand(cmd: GameCommand, ctx: CommandContext, state: any): CommandResult | null;

    /** Cleanup system */
    dispose(): void;
}


/**
 * Simulation manager - runs systems in priority order
 */
export class Simulation {
    private systems: SimSystem[] = [];
    private initialized = false;

    /**
     * Register a system
     */
    addSystem(system: SimSystem): void {
        this.systems.push(system);
        // Sort by priority (higher first)
        this.systems.sort((a, b) => b.priority - a.priority);

        if (this.initialized) {
            system.init();
        }
    }

    /**
     * Remove a system
     */
    removeSystem(id: string): boolean {
        const idx = this.systems.findIndex(s => s.id === id);
        if (idx !== -1) {
            const system = this.systems.splice(idx, 1)[0];
            system.dispose();
            return true;
        }
        return false;
    }

    /**
     * Get a system by ID
     */
    getSystem<T extends SimSystem>(id: string): T | undefined {
        return this.systems.find(s => s.id === id) as T | undefined;
    }

    /**
     * Initialize all systems
     */
    init(): void {
        for (const system of this.systems) {
            system.init();
        }
        this.initialized = true;
    }

    /**
     * Run one simulation tick
     */
    tick(ctx: FixedContext, state: any): void {
        for (const system of this.systems) {
            if (system.enabled) {
                system.tick(ctx, state);
            }
        }
    }


    /**
     * Enable/disable a system
     */
    setEnabled(id: string, enabled: boolean): void {
        const system = this.systems.find(s => s.id === id);
        if (system) {
            system.enabled = enabled;
        }
    }

    /**
     * Cleanup all systems
     */
    dispose(): void {
        for (const system of this.systems) {
            system.dispose();
        }
        this.systems.length = 0;
        this.initialized = false;
    }

    /**
     * Get system count
     */
    get systemCount(): number {
        return this.systems.length;
    }

    /**
     * Get enabled system count
     */
    get enabledCount(): number {
        return this.systems.filter(s => s.enabled).length;
    }
}

/**
 * Base class for simulation systems
 */
export abstract class BaseSimSystem implements SimSystem {
    abstract readonly id: string;
    abstract readonly priority: number;
    enabled = true;

    init(): void { }
    abstract tick(ctx: FixedContext, state: any): void;
    handleCommand(cmd: GameCommand, ctx: CommandContext, state: any): CommandResult | null {
        return null;
    }
    dispose(): void { }
}

