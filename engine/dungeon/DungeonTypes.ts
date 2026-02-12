
export type DungeonBlockType = 'air' | 'dirt' | 'stone' | 'gold' | 'gems' | 'mana' | 'heart' | 'support' | 'recharger';

export interface DungeonMiner {
    id: string;
    type: 'driller' | 'excavator' | 'foreman';
    position: { x: number; y: number; z: number };
    targetBlock?: { x: number; y: number; z: number };
    state: 'idle' | 'walking' | 'mining' | 'returning_to_base' | 'recharging';
    energy: number;
    miningProgress: number; // 0 to 1
}

export interface DungeonBuilding {
    id: string;
    type: 'support' | 'recharger';
    position: { x: number; y: number; z: number };
}

export interface DungeonState {
    unlocked: boolean;         // Is the dungeon accessible?
    miners: DungeonMiner[];
    buildings: DungeonBuilding[];

    // Pending resources (mined but not yet surged to surface)
    gold: number;
    gems: number;
    mana: number;

    logs: string[];            // Advisor banter log

    // Core Voxel Data
    // We store this as Uint8Array for efficiency and serialization
    voxelData: Uint8Array | null;
    revealedData: Uint8Array | null;
    gridSize: { x: number; y: number; z: number };
}
