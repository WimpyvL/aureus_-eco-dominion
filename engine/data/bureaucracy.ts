
import { NPC, Permit, DialogueNode } from '../types/bureaucracy';

export const INITIAL_NPCS: Record<string, NPC> = {
    'licensing': {
        id: 'licensing',
        name: 'Officer Vane',
        role: 'Licensing Gatekeeper',
        persona: 'Insecure, obsessed with stamps and protocol.',
        motive: 'Wants to feel important and feared.',
        vulnerability: {
            id: 'vane_status',
            description: 'Desperate for recognition and a promotion.',
            discovered: false,
            leverageDialogue: 'I heard the Regional Director is looking for "efficient" officers for the new sector...',
            successDialogue: 'The new sector? You... you have influence there? Perhaps we can expedite this.',
            reward: 'SPEED'
        },
        trustLevel: 50,
        leverage: 0,
        potentialLeverage: 'Evidence of mismanaged permit fees.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vane&backgroundColor=b6e3f4',
        rivals: ['chief', 'fixer'],
        allies: ['inspector'],
        workHours: { start: 9, end: 17 },
        moodShiftType: 'GRUMPY'
    },
    'union': {
        id: 'union',
        name: 'Big Sal',
        role: 'Union Representative',
        persona: 'Gruff, talks about "the boys", loves backroom deals.',
        motive: 'Personal enrichment disguised as worker safety.',
        vulnerability: {
            id: 'sal_luxury',
            description: 'Has a taste for expensive, imported cigars.',
            discovered: false,
            leverageDialogue: 'I found these Cubans in a crate near the border. Interested?',
            successDialogue: 'Well now, that is a fine aroma. Maybe we can overlook a few safety regs.',
            reward: 'DISCOUNT'
        },
        trustLevel: 40,
        leverage: 0,
        potentialLeverage: 'Proof of pocketing worker safety funds.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sal&backgroundColor=ffdfbf',
        rivals: ['inspector'],
        allies: ['fixer'],
        workHours: { start: 10, end: 22 },
        moodShiftType: 'HAPPY'
    }
};

export const INITIAL_PERMITS: Record<string, Permit> = {
    'extraction-intent': {
        id: 'extraction-intent',
        name: 'Extraction Intent (Form 17-B)',
        formNumber: '17-B',
        description: 'Preliminary declaration of intent to extract resources from the crust. Required for all mining operations.',
        cost: 50,
        status: 'AVAILABLE',
        unlocksFeature: 'prospecting'
    },
    'prospecting-license': {
        id: 'prospecting-license',
        name: 'Prospecting License (Form 404)',
        formNumber: '404',
        description: 'Allows for surface-level sampling (up to 10 samples) to determine site viability. Do not extract ore.',
        cost: 150,
        status: 'LOCKED',
        unlocksFeature: 'mine_access'
    }
};

export const DIALOGUE_TREES: Record<string, Record<string, DialogueNode>> = {
    'licensing': {
        'root': {
            id: 'root',
            text: "Vane doesn't look up from his ledger. 'Form 1-A is the foundation of civilization. Without it, you are merely a loiterer with a shovel. What do you want?'",
            options: [
                {
                    text: "I need a permit to start digging.",
                    action: 'START_TUTORIAL_PERMIT',
                    nextNodeId: 'tutorial_intro'
                },
                {
                    text: "Your filing system is remarkably efficient, Officer.",
                    action: 'FLATTER_VANE',
                    nextNodeId: 'flattery'
                }
            ]
        },
        'tutorial_intro': {
            id: 'tutorial_intro',
            text: "'New meat? Very well. You'll need Form 17-B. I've unlocked it in your file. Fill it out. Don't make mistakes.'",
            options: [
                { text: "I'll get right on it.", nextNodeId: 'root' }
            ]
        },
        'flattery': {
            id: 'flattery',
            text: "He pauses, a tiny smirk appearing. 'Efficiency is its own reward, but recognition... recognition is rare in this sector. You have a keen eye.'",
            options: [
                { text: "Just stating the obvious.", nextNodeId: 'root' }
            ]
        }
    }
};
