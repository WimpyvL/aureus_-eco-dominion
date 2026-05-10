
export type BlockType = 'air' | 'dirt' | 'stone' | 'gold' | 'gems' | 'mana' | 'heart' | 'support' | 'recharger';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type MinerClass = 'driller' | 'excavator' | 'foreman';

export interface Miner {
  id: string;
  type: MinerClass;
  position: Vector3;
  targetBlock?: Vector3;
  state: 'idle' | 'walking' | 'mining' | 'returning_to_base' | 'recharging';
  energy: number;
  miningProgress: number; // 0 to 1
}

export interface Building {
  id: string;
  type: 'support' | 'recharger';
  position: Vector3;
}

export interface GameState {
  gold: number;
  gems: number;
  mana: number;
  miners: Miner[];
  buildings: Building[];
  logs: string[];
}
