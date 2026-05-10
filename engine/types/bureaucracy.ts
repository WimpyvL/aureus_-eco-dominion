
import { BuildingType } from './buildings';

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

export interface DialogueOption {
    text: string;
    nextNodeId?: string;
    action?: string; // Action identifier instead of function for serialization
    condition?: string; // Condition identifier
    leverageRequired?: number;
    trustRequired?: number;
}

export interface DialogueNode {
    id: string;
    text: string;
    options: DialogueOption[];
}

export interface BureaucracyState {
    permits: Record<string, Permit>;
    npcs: Record<string, NPC>;
    knownNpcIds: string[];
    dirtItems: DirtItem[];
    activeNPCId: string | null;
    activePermitId: string | null;
    activeMiniGame: 'FORM_PROCESSING' | null;
    pendingPermitAction: 'SUBMIT' | 'FAST_TRACK' | 'DIALOGUE' | null;
    activeDialogue: DialogueNode | null;
    dialogueTree: Record<string, DialogueNode>;
    tutorialStep: number;
}
