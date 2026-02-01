
import * as THREE from 'three';
import { AgentRole, Agent } from '../../../../types';

// Import all role factories
import {
    WorkerFactory,
    MinerFactory,
    EngineerFactory,
    BotanistFactory,
    SecurityFactory,
    IllegalMinerFactory
} from './roles';

// Re-export common utilities
export * from './common';

// Type for agent factory function
export type AgentFactoryFn = () => THREE.Group;

// Central agent factory registry
export const AgentFactory: Record<AgentRole, AgentFactoryFn> = {
    'WORKER': WorkerFactory,
    'MINER': MinerFactory,
    'ENGINEER': EngineerFactory,
    'BOTANIST': BotanistFactory,
    'SECURITY': SecurityFactory,
    'ILLEGAL_MINER': IllegalMinerFactory
};

/**
 * Create an agent mesh group for the given agent.
 * This is the main entry point for creating agent visuals.
 */
export function createAgentGroup(agent: Agent): THREE.Group {
    const factory = AgentFactory[agent.type];
    if (!factory) {
        console.warn(`Unknown agent type: ${agent.type}, falling back to WORKER`);
        return AgentFactory['WORKER']();
    }
    return factory();
}

/**
 * Convenience function to create agent by role directly.
 */
export function createAgentByRole(role: AgentRole): THREE.Group {
    const factory = AgentFactory[role];
    if (!factory) {
        console.warn(`Unknown agent role: ${role}, falling back to WORKER`);
        return AgentFactory['WORKER']();
    }
    return factory();
}

/**
 * Placeholder for material update (full rebuild required with voxel approach)
 */
export function updateAgentRoleMaterial(group: THREE.Group, role: AgentRole): void {
    // Meshing approach requires full rebuild for simplicity if role changes
    // Future: Could implement mesh caching/pooling here
}

// Export individual factories for direct access
export {
    WorkerFactory,
    MinerFactory,
    EngineerFactory,
    BotanistFactory,
    SecurityFactory,
    IllegalMinerFactory
};
