import { LucideIcon } from 'lucide-react';

export type PermitStatus = 'LOCKED' | 'AVAILABLE' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Permit {
  id: string;
  name: string;
  formNumber: string;
  description: string;
  cost: number;
  status: PermitStatus;
  rejectionReason?: string;
  unlocksFeature?: string;
  accuracy?: number;
}

export type DirtType = 'PERMIT_VIOLATION' | 'BACKROOM_DEAL' | 'PERSONAL_SECRET';

export interface DirtItem {
  id: string;
  type: DirtType;
  description: string;
  targetNpcId: string; // Who this dirt is about
  value: number; // How much leverage it provides
}

export type MoodShiftType = 'GRUMPY' | 'HAPPY' | 'NEUTRAL';

export interface NPC {
  id: string;
  name: string;
  role: string;
  persona: string;
  motive: string;
  vulnerability: {
    id: string;
    description: string;
    discovered: boolean;
    leverageDialogue: string;
    successDialogue: string;
    reward: 'DISCOUNT' | 'SPEED' | 'INFO';
  };
  trustLevel: number; // 0-100 (Relationship)
  leverage: number; // 0-100 (Dirt/Favors held by player)
  potentialLeverage: string; // Description of what kind of dirt exists
  avatar: string;
  rivals: string[]; // NPC IDs
  allies: string[]; // NPC IDs
  workHours: { start: number; end: number };
  moodShiftType: MoodShiftType;
}

export interface Tile {
  id: string;
  type: 'DIRT' | 'ORE' | 'ROCK' | 'EMPTY';
  stability: number;
  mined: boolean;
  revealed: boolean; // Visible but not collected (for prospecting)
  x: number;
  y: number;
}

export interface Mine {
  id: string;
  name: string;
  location: 'OUTSKIRTS' | 'DEEP_WASTE';
  travelTime: number; // in hours
  hasLocals: boolean;
  chiefId?: string;
  yield: number;
  danger: number;
  discovered: boolean;
  // New fields
  grid: Tile[];
  gridWidth: number;
  gridHeight: number;
  status: 'LOCKED' | 'PROSPECTING' | 'OPERATIONAL';
  prospectingCount: number;
  permits: {
    prospectingId: string;
    miningId: string;
  };
}

export interface WorldPosition {
  x: number;
  y: number;
}

export interface Building {
  id: string;
  npcId: string;
  name: string;
  pos: WorldPosition;
  type: 'OFFICE' | 'HOME' | 'MINE_ENTRANCE' | 'PUB' | 'HOTLINE' | 'PARK' | 'LANDMARK' | 'RESIDENTIAL' | 'INDUSTRIAL';
  isDiscovered: boolean;
  description?: string;
  explorationItems?: string[];
}

export interface RelationshipFeedback {
  id: string;
  npcId: string;
  amount: number;
  type: 'TRUST' | 'LEVERAGE';
  timestamp: number;
}

export interface Objective {
  id: string;
  text: string;
  isCompleted: boolean;
  type: 'TALK' | 'COLLECT' | 'UPGRADE' | 'PERMIT' | 'DISCOVER';
  targetId?: string;
}

export interface OfficeItem {
  id: string;
  name: string;
  description: string;
  type: 'DIRT' | 'CLUE' | 'EVENT';
  icon: string;
  position: { x: number; y: number }; // Percentage based for responsive layout
  onInteract?: (state: GameState) => Partial<GameState>;
}

export interface GameState {
  money: number;
  ore: number;
  evidence: number;
  energy: number;
  maxEnergy: number;
  movementSpeed: number;
  upgrades: string[];
  dirtItems: DirtItem[];
  leverage: string[];
  foundOfficeItemIds: string[];
  explorationActive: boolean;
  meters: {
    trust: number;
    influence: number;
    exposure: number;
  };
  permits: Record<string, Permit>;
  npcs: Record<string, NPC>;
  knownNpcIds: string[];
  objectives: Objective[];
  mines: Mine[];
  activeMineId: string | null;
  currentScene: 'MINE' | 'OFFICE' | 'WORLD' | 'MENU';
  activeNPCId: string | null;
  activePermitId: string | null;
  activeBuildingId: string | null;
  activeMiniGame: 'FORM_PROCESSING' | null;
  pendingPermitAction: 'SUBMIT' | 'FAST_TRACK' | 'DIALOGUE' | null;
  day: number;
  time: number; // 0 to 2400 (military time representation or just 0-24 float)
  playerPos: WorldPosition;
  targetPos: WorldPosition | null;
  path: WorldPosition[];
  feedbacks: RelationshipFeedback[];
  tutorialStep: number;
  tutorialMinimized: boolean;
  camera: {
    x: number;
    y: number;
    zoom: number;
  };
}

export interface Tile {
  id: string;
  x: number;
  y: number;
  type: 'DIRT' | 'ORE' | 'ROCK' | 'EMPTY';
  stability: number;
  mined: boolean;
  revealed: boolean;
}

export interface DialogueNode {
  id: string;
  text: string;
  options: DialogueOption[];
}

export interface DialogueOption {
  text: string;
  nextNodeId?: string;
  action?: (state: GameState) => Partial<GameState>;
  condition?: (state: GameState) => boolean;
  leverageRequired?: number;
  trustRequired?: number;
}
