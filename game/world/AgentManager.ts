
import { StateManager } from '../../engine/state/StateManager';
import { IsoCameraSystem } from '../render/IsoCameraSystem';

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
        const state = this.stateManager.getState();
        state.selectedAgentId = id;
        this.stateManager.markDirty('selectedAgentId');
    }

    /**
     * Command an agent to move to a specific location
     */
    commandAgent(agentId: string, x: number, z: number): void {
        const state = this.stateManager.getState();
        const agent = state.agents.find(a => a.id === agentId);
        if (!agent) return;

        // Manual command - create a manual job
        agent.currentJobId = `manual_${x}_${z}_${Date.now()}`;
        agent.targetX = x;
        agent.targetZ = z;
        agent.state = 'IDLE'; // Will trigger pathfinding on next think
        this.stateManager.markDirty('agents');
    }

    /**
     * Zoom camera to focus on a specific agent
     */
    zoomToAgent(agentId: string): void {
        const state = this.stateManager.getState();
        const agent = state.agents.find(a => a.id === agentId);
        if (!agent) return;

        this.cameraSystem.zoomToPosition(agent.x, agent.z, 2);
    }
}
