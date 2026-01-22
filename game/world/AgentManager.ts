/**
 * Agent Manager
 * Handles all agent-related operations: selection, commands, and camera focus.
 */

import { StateManager } from '../../engine/state/StateManager';
import { IsoCameraSystem } from '../render/IsoCameraSystem';
import { GRID_SIZE } from '../../engine/utils/GameUtils';

export class AgentManager {
    private stateManager: StateManager;
    private cameraSystem: IsoCameraSystem;

    constructor(stateManager: StateManager, cameraSystem: IsoCameraSystem) {
        this.stateManager = stateManager;
        this.cameraSystem = cameraSystem;
    }

    /**
     * Select an agent by ID
     */
    selectAgent(id: string | null): void {
        const state = this.stateManager.getMutableState();
        state.selectedAgentId = id;
    }

    /**
     * Command an agent to move to a specific tile
     */
    commandAgent(agentId: string, tileId: number): void {
        const state = this.stateManager.getMutableState();
        const agent = state.agents.find(a => a.id === agentId);
        if (!agent) return;

        // Manual command - create a manual job
        agent.currentJobId = `manual_${tileId}_${Date.now()}`;
        agent.targetTileId = tileId;
        agent.state = 'IDLE'; // Will trigger pathfinding on next think
    }

    /**
     * Zoom camera to focus on a specific agent
     * Useful for UI features like clicking on agent in a list
     */
    zoomToAgent(agentId: string): void {
        const state = this.stateManager.getState();
        const agent = state.agents.find(a => a.id === agentId);
        if (!agent) return;

        const offset = (GRID_SIZE - 1) / 2;
        const worldX = agent.x - offset;
        const worldZ = agent.z - offset;
        this.cameraSystem.zoomToPosition(worldX, worldZ, 2);
    }
}
