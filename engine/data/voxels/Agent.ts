
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Agent Voxel Generation
 * 
 * This file now re-exports from the modular agent system.
 * For direct access to individual role factories, import from:
 * - engine/data/voxels/agents
 * - engine/data/voxels/agents/roles
 * - engine/data/voxels/agents/common
 */

// Re-export everything from the modular agents system
export {
  createAgentGroup,
  createAgentByRole,
  updateAgentRoleMaterial,
  AgentFactory,

  // Individual factories
  WorkerFactory,
  MinerFactory,
  EngineerFactory,
  BotanistFactory,
  SecurityFactory,
  IllegalMinerFactory,

  // Common utilities
  SKIN_COLOR,
  CLOTH_COLOR,
  ACCENT_WHITE,
  HAIR_COLOR,
  PIVOTS,
  buildPart,
  createLegs,
  createArms,
  createTorso,
  createHead,
  assembleAgent
} from './agents';

// Type exports
export type { VoxelDef, AgentFactoryOptions, AgentFactoryFn } from './agents';
