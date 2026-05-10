import { NPC, Permit, Tile, Building, Mine, DialogueNode, OfficeItem } from './types';

export const generateGrid = (width: number, height: number, yieldRate: number = 0.2): Tile[] => {
  const grid: Tile[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isOre = Math.random() < yieldRate;
      const isRock = !isOre && Math.random() < 0.1;
      grid.push({
        id: `${x}-${y}`,
        x,
        y,
        type: isOre ? 'ORE' : isRock ? 'ROCK' : 'DIRT',
        stability: 100,
        mined: false,
        revealed: false
      });
    }
  }
  return grid;
};

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
  },
  'inspector': {
    id: 'inspector',
    name: 'Inspector Krell',
    role: 'Safety Auditor',
    persona: 'Cold, robotic, cites sub-clauses from memory.',
    motive: 'Perfect compliance (or the appearance of it).',
    vulnerability: {
      id: 'krell_past',
      description: 'Haunted by a structural failure in Sector 4.',
      discovered: false,
      leverageDialogue: 'I found the original blueprints for Sector 4. They don\'t match your report.',
      successDialogue: 'Keep your voice down. Give me that, and I\'ll sign whatever you want.',
      reward: 'INFO'
    },
    trustLevel: 30,
    leverage: 0,
    potentialLeverage: 'Records of the Sector 4 structural failure cover-up.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Krell&backgroundColor=c0aede',
    rivals: ['union', 'fixer'],
    allies: ['licensing'],
    workHours: { start: 8, end: 16 },
    moodShiftType: 'GRUMPY'
  },
  'fixer': {
    id: 'fixer',
    name: 'Slink',
    role: 'Black Market Fixer',
    persona: 'Fast-talking, twitchy, knows everyone\'s secrets.',
    motive: 'Maximum chaos and profit.',
    vulnerability: {
      id: 'slink_debt',
      description: 'Owes a lot of money to off-world syndicates.',
      discovered: false,
      leverageDialogue: 'I know about the debt collectors looking for you.',
      successDialogue: 'Hey, hey! No need to broadcast that. I can get you a discount, just keep quiet.',
      reward: 'DISCOUNT'
    },
    trustLevel: 20,
    leverage: 0,
    potentialLeverage: 'The location of his hidden stash of stolen tech.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Slink&backgroundColor=ffd5dc',
    rivals: ['licensing', 'inspector'],
    allies: ['union'],
    workHours: { start: 18, end: 4 },
    moodShiftType: 'HAPPY'
  },
  'journalist': {
    id: 'journalist',
    name: 'Elena Vox',
    role: 'Investigative Reporter',
    persona: 'Idealistic but cynical, looking for the "big one".',
    motive: 'Exposing the truth (or getting clicks).',
    vulnerability: {
      id: 'vox_scoop',
      description: 'Desperate for a story that will make her famous.',
      discovered: false,
      leverageDialogue: 'I have the scoop of the century on the Mayor.',
      successDialogue: 'Finally! Give it here. I owe you one.',
      reward: 'INFO'
    },
    trustLevel: 10,
    leverage: 0,
    potentialLeverage: 'Proof of her taking a bribe to kill a story.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena&backgroundColor=d1d4f9',
    rivals: [],
    allies: [],
    workHours: { start: 0, end: 24 },
    moodShiftType: 'NEUTRAL'
  },
  'chief': {
    id: 'chief',
    name: 'Chief Okon',
    role: 'Local Community Leader',
    persona: 'Dignified, weary, protective of his people.',
    motive: 'Preserving the land and his community\'s health.',
    vulnerability: {
      id: 'okon_health',
      description: 'His granddaughter is sick and needs rare medicine.',
      discovered: false,
      leverageDialogue: 'I have the medicine your granddaughter needs.',
      successDialogue: 'You... you are a savior. The tribe is in your debt.',
      reward: 'INFO'
    },
    trustLevel: 15,
    leverage: 0,
    potentialLeverage: 'Knowledge of the secret "Old Vein" location.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Okon&backgroundColor=f1f2f3',
    rivals: ['licensing'],
    allies: [],
    workHours: { start: 6, end: 20 },
    moodShiftType: 'NEUTRAL'
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
  },
  'mining-permit-iron': {
    id: 'mining-permit-iron',
    name: 'Iron Vein Extraction Permit',
    formNumber: 'FE-26',
    description: 'Full operational rights for the Iron Vein Outpost. Compliance with safety regulations mandatory.',
    cost: 500,
    status: 'LOCKED',
    unlocksFeature: 'iron_mine_full'
  },
  'prospecting-permit-deep': {
    id: 'prospecting-permit-deep',
    name: 'Deep Hollow Survey Request',
    formNumber: 'DH-01',
    description: 'Permission to survey the Deep Hollow region. High danger pay required for inspectors.',
    cost: 300,
    status: 'LOCKED'
  },
  'mining-permit-deep': {
    id: 'mining-permit-deep',
    name: 'Deep Hollow Excavation Rights',
    formNumber: 'DH-02',
    description: 'Full mining rights for Deep Hollow. Waiver of liability for "shadow sickness" required.',
    cost: 1200,
    status: 'LOCKED'
  },
  'prospecting-permit-abyss': {
    id: 'prospecting-permit-abyss',
    name: 'Abyssal Reach Probe Auth',
    formNumber: 'AR-00',
    description: 'Authorization to send probes into the Abyssal Reach. Extreme caution advised.',
    cost: 1000,
    status: 'LOCKED'
  },
  'mining-permit-abyss': {
    id: 'mining-permit-abyss',
    name: 'Abyssal Reach Exploitation Grant',
    formNumber: 'AR-666',
    description: 'Unrestricted mining access to the Abyssal Reach. God help us all.',
    cost: 5000,
    status: 'LOCKED'
  }
};

export const REJECTION_REASONS = [
  "Ink color was 'Excessively Hopeful'.",
  "Margins failed to meet the 1.2mm 'Bureaucratic Anxiety' standard.",
  "Signature looks suspiciously like a cry for help.",
  "Form was submitted during a mandatory 'Silence Appreciation' hour.",
  "The inspector had a bad dream about a mole.",
  "Your ethical compliance score is 'Questionably Sincere'.",
  "Missing 'Appendix G: Proof of Existence'.",
  "The paper weight was 0.5g too light, suggesting a lack of gravitas."
];

export const INITIAL_MINES: Mine[] = [
  {
    id: 'iron-vein',
    name: 'Iron Vein Outpost',
    location: 'OUTSKIRTS',
    travelTime: 2,
    hasLocals: false,
    yield: 1,
    danger: 10,
    discovered: true,
    grid: generateGrid(5, 10, 0.3), // 5x10 grid (50 tiles)
    gridWidth: 5,
    gridHeight: 10,
    status: 'PROSPECTING', // Starts in prospecting phase
    prospectingCount: 0,
    permits: {
      prospectingId: 'prospecting-license',
      miningId: 'mining-permit-iron'
    }
  },
  {
    id: 'deep-hollow',
    name: 'Deep Hollow',
    location: 'DEEP_WASTE',
    travelTime: 6,
    hasLocals: true,
    chiefId: 'chief-hollow',
    yield: 3,
    danger: 40,
    discovered: false,
    grid: generateGrid(8, 15, 0.5), // Larger grid
    gridWidth: 8,
    gridHeight: 15,
    status: 'LOCKED',
    prospectingCount: 0,
    permits: {
      prospectingId: 'prospecting-permit-deep',
      miningId: 'mining-permit-deep'
    }
  },
  {
    id: 'abyssal-reach',
    name: 'Abyssal Reach',
    location: 'DEEP_WASTE',
    travelTime: 12,
    hasLocals: false,
    yield: 10,
    danger: 90,
    discovered: false,
    grid: generateGrid(10, 20, 0.8), // Huge grid
    gridWidth: 10,
    gridHeight: 20,
    status: 'LOCKED',
    prospectingCount: 0,
    permits: {
      prospectingId: 'prospecting-permit-abyss',
      miningId: 'mining-permit-abyss'
    }
  }
];

export const DIALOGUE_TREES: Record<string, Record<string, DialogueNode>> = {
  'licensing': {
    'root': {
      id: 'root',
      text: "Vane doesn't look up from his ledger. 'Form 1-A is the foundation of civilization. Without it, you are merely a loiterer with a shovel. What do you want?'",
      options: [
        {
          text: "I need a permit to start digging. (Tutorial)",
          condition: (s) => s.tutorialStep === 2,
          action: (s) => ({
            tutorialStep: 3,
            permits: {
              ...s.permits,
              'extraction-intent': { ...s.permits['extraction-intent'], status: 'AVAILABLE' }
            }
          }),
          nextNodeId: 'tutorial_intro'
        },
        {
          text: "I'm here for the Prospecting License.",
          nextNodeId: 'prospecting',
          condition: (s) => s.permits['prospecting-license'].status === 'AVAILABLE'
        },
        {
          text: "I need to discuss my rejected application (Form 17-B).",
          nextNodeId: 'rejection_discussion',
          condition: (s) => s.permits['extraction-intent'].status === 'REJECTED'
        },
        {
          text: "Your filing system is remarkably efficient, Officer.",
          action: (s) => ({
            npcs: {
              ...s.npcs,
              'licensing': { ...s.npcs['licensing'], trustLevel: Math.min(100, s.npcs['licensing'].trustLevel + 5) }
            }
          }),
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
    'rejection_discussion': {
      id: 'rejection_discussion',
      text: "'Ah, yes. The 17-B. Rejected for... let me see... 'Excessive Hopefulness'. A serious infraction. We can't have dreamers clogging up the tunnels.'",
      options: [
        {
          text: "This is absurd! I demand an appeal.",
          nextNodeId: 'appeal_denied'
        },
        {
          text: "Is there any way to... expedite a reconsideration?",
          nextNodeId: 'bribe_hint'
        }
      ]
    },
    'appeal_denied': {
      id: 'appeal_denied',
      text: "'Appeals require Form 99-Z, which is currently out of print. Come back in six to eight months.' He smirks, clearly enjoying this.",
      options: [
        { text: "I don't have six months.", nextNodeId: 'bribe_hint' }
      ]
    },
    'bribe_hint': {
      id: 'bribe_hint',
      text: "'Time is a luxury, isn't it? Just like... recognition. You know, the Regional Director is visiting soon. He values... initiative.'",
      options: [
        {
          text: "I see. Initiative. [Insight]",
          action: (s) => ({
            tutorialStep: 5, // Advance to 'Use Knowledge' step
            npcs: {
              ...s.npcs,
              'licensing': { 
                ...s.npcs['licensing'], 
                vulnerability: { ...s.npcs['licensing'].vulnerability, discovered: true } 
              }
            }
          }),
          nextNodeId: 'negotiation_phase'
        }
      ]
    },
    'negotiation_phase': {
      id: 'negotiation_phase',
      text: "Vane waits, tapping his pen. He expects you to make a move.",
      options: [
        {
          text: "I heard the Director is looking for 'efficient' officers... [Use Vulnerability]",
          condition: (s) => s.npcs['licensing'].vulnerability.discovered,
          action: (s) => ({
            tutorialStep: 7, // Complete tutorial
            permits: {
              ...s.permits,
              'extraction-intent': { ...s.permits['extraction-intent'], status: 'APPROVED' }
            },
            npcs: {
              ...s.npcs,
              'licensing': { ...s.npcs['licensing'], trustLevel: s.npcs['licensing'].trustLevel + 20 }
            }
          }),
          nextNodeId: 'tutorial_success'
        },
        {
          text: "Maybe I can offer a 'processing fee'? ($50)",
          condition: (s) => s.money >= 50,
          action: (s) => ({
            money: s.money - 50,
            tutorialStep: 7, // Complete tutorial
            permits: {
              ...s.permits,
              'extraction-intent': { ...s.permits['extraction-intent'], status: 'APPROVED' }
            }
          }),
          nextNodeId: 'tutorial_success'
        }
      ]
    },
    'tutorial_success': {
      id: 'tutorial_success',
      text: "'Well now. That is... precisely the kind of initiative we look for. Your 17-B is approved. Try not to die down there.'",
      options: [
        { text: "Thanks, Vane.", nextNodeId: 'root' }
      ]
    },
    'prospecting': {
      id: 'prospecting',
      text: "'The 1-A? A bold choice. It requires a $50 processing fee and a soul free of administrative clutter. Shall we proceed?'",
      options: [
        {
          text: "Here is the $50. [Pay]",
          condition: (s) => s.money >= 50,
          action: (s) => ({
            money: s.money - 50,
            activeMiniGame: 'FORM_PROCESSING',
            activePermitId: 'prospecting-license',
            pendingPermitAction: 'DIALOGUE',
            activeNPCId: null
          }),
          nextNodeId: 'approved'
        },
        { text: "I'll come back later.", nextNodeId: 'root' }
      ]
    },
    'flattery': {
      id: 'flattery',
      text: "He pauses, a tiny smirk appearing. 'Efficiency is its own reward, but recognition... recognition is rare in this sector. You have a keen eye.'",
      options: [
        { text: "Just stating the obvious.", nextNodeId: 'root' }
      ]
    },
    'approved': {
      id: 'approved',
      text: "'Stamp. Stamp. Stamp. You are now officially a Prospector. Don't make me regret my ink usage.'",
      options: [
        { text: "Thank you, Officer.", nextNodeId: 'root' }
      ]
    }
  },
  'chief': {
    'root': {
      id: 'root',
      text: "Chief Okon stands by a small fire. 'The earth groans beneath your machines, stranger. Why have you come to our sector?'",
      options: [
        {
          text: "I'm just looking for work.",
          nextNodeId: 'work'
        },
        {
          text: "I want to help your people. [Trust 30+]",
          trustRequired: 30,
          nextNodeId: 'help'
        },
        {
          text: "I have medicine for the elders. [Give Item]",
          condition: (s) => s.upgrades.includes('meds'),
          action: (s) => ({
            npcs: {
              ...s.npcs,
              'chief': { ...s.npcs['chief'], trustLevel: Math.min(100, s.npcs['chief'].trustLevel + 25) }
            }
          }),
          nextNodeId: 'meds_given'
        }
      ]
    },
    'work': {
      id: 'work',
      text: "'Work brings holes. Holes bring the Bureau. The Bureau brings sickness. Be careful what you dig for.'",
      options: [
        { text: "I understand.", nextNodeId: 'root' }
      ]
    },
    'help': {
      id: 'help',
      text: "'Help is a heavy word. If you truly wish to help, find out why the water in the lower tunnels has turned black. Officer Vane knows, but he hides behind his stamps.'",
      options: [
        { 
          text: "I'll look into it. [Gain Dirt on Vane]",
          action: (s) => ({
            dirtItems: [...s.dirtItems, {
              id: `dirt-vane-water-${Date.now()}`,
              type: 'PERMIT_VIOLATION',
              description: "Evidence of Vane ignoring water contamination reports.",
              targetNpcId: 'licensing',
              value: 20
            }]
          }),
          nextNodeId: 'quest_accepted'
        }
      ]
    },
    'quest_accepted': {
      id: 'quest_accepted',
      text: "'Then we shall see if your heart is as strong as your shovel.'",
      options: [{ text: "Goodbye.", nextNodeId: 'root' }]
    },
    'meds_given': {
      id: 'meds_given',
      text: "His eyes soften. 'You bring life to a dying place. We will not forget this.'",
      options: [{ text: "It was the right thing to do.", nextNodeId: 'root' }]
    }
  },
  'union': {
    'root': {
      id: 'root',
      text: "Big Sal is leaning back, a thick cigar in his hand. 'The boys are restless, kid. Safety's a joke, and the pay is worse. You looking to make things better, or just looking to get rich?'",
      options: [
        {
          text: "I want to ensure worker safety. [Trust 20+]",
          trustRequired: 20,
          nextNodeId: 'safety'
        },
        {
          text: "I'm looking for a way to 'expedite' my permits.",
          nextNodeId: 'expedite'
        }
      ]
    },
    'safety': {
      id: 'safety',
      text: "'Safety, huh? Inspector Krell talks a big game, but he's in Vane's pocket. If you want real safety, you need to talk to the Chief. He knows the land better than any auditor.'",
      options: [
        { 
          text: "I'll talk to Chief Okon. [Gain Trust with Union]",
          action: (s) => ({
            npcs: {
              ...s.npcs,
              'union': { ...s.npcs['union'], trustLevel: Math.min(100, s.npcs['union']!.trustLevel + 10) }
            }
          }),
          nextNodeId: 'root'
        }
      ]
    },
    'expedite': {
      id: 'expedite',
      text: "'Expedite? That's a fancy word for a bribe. I like fancy words. But Vane is a stickler. Unless you have something on him... something that would make him sweat through his uniform.'",
      options: [
        { text: "I'll see what I can find.", nextNodeId: 'root' }
      ]
    }
  },
  'journalist': {
    'root': {
      id: 'root',
      text: "Elena Vox is frantically typing on a tablet. 'The Bureau is a black hole, and I'm the only one trying to shine a light. You got something for me, or are you just another cog in the machine?'",
      options: [
        {
          text: "I have evidence of corruption. [Show Dirt]",
          condition: (s) => s.dirtItems.length > 0,
          nextNodeId: 'dirt_menu'
        },
        {
          text: "What are you working on right now?",
          nextNodeId: 'current_story'
        }
      ]
    },
    'dirt_menu': {
      id: 'dirt_menu',
      text: "'Let's see it. The more scandalous, the better. I can make sure the right people see this... and the wrong people feel the heat.'",
      options: [
        { 
          text: "Leak everything. [Gain Leverage/Exposure]",
          action: (s) => {
            // This is a complex action, I'll just use the base action logic for now
            // But I can trigger it here
            return {
              // This will be handled by the base action if I want, 
              // but I can also just implement it here for the tree
            };
          },
          nextNodeId: 'root'
        },
        { text: "Actually, I'll hold onto it.", nextNodeId: 'root' }
      ]
    },
    'current_story': {
      id: 'current_story',
      text: "'I'm looking into the Sector 4 structural failure. Krell says it was an 'act of god', but I think it was an 'act of greed'. If you find anything in those tunnels... anything at all... bring it to me.'",
      options: [
        { text: "I'll keep my eyes open.", nextNodeId: 'root' }
      ]
    }
  }
};

export const OFFICE_ITEMS: Record<string, OfficeItem> = {
  'vane_ledger': {
    id: 'vane_ledger',
    name: 'Vane\'s Personal Ledger',
    description: 'A dusty ledger hidden under a stack of Form 99-Zs. It contains notes about "Regional Director visits" and "promotion criteria".',
    type: 'CLUE',
    icon: 'BookOpen',
    position: { x: 20, y: 30 }
  },
  'trash_can_vane': {
    id: 'trash_can_vane',
    name: 'Overflowing Trash Can',
    description: 'Shredded documents and coffee stains. Something catches your eye.',
    type: 'DIRT',
    icon: 'Trash2',
    position: { x: 80, y: 70 }
  },
  'krell_blueprints': {
    id: 'krell_blueprints',
    name: 'Sector 4 Blueprints',
    description: 'Old, yellowed blueprints. Some sections are marked with red "X"s that were later erased.',
    type: 'CLUE',
    icon: 'Map',
    position: { x: 50, y: 40 }
  },
  'sal_cigar_box': {
    id: 'sal_cigar_box',
    name: 'Empty Cigar Box',
    description: 'An expensive-looking box from the "Upper Spires". It smells of luxury.',
    type: 'CLUE',
    icon: 'Box',
    position: { x: 30, y: 60 }
  }
};

export const BUILDINGS: Record<string, Building> = {
  'player_home': {
    id: 'player_home',
    npcId: 'none',
    name: 'Your Shabby Apartment',
    pos: { x: 2, y: 2 },
    type: 'HOME',
    isDiscovered: true
  },
  'licensing_office': {
    id: 'licensing_office',
    npcId: 'licensing',
    name: 'Bureau of Extraction',
    pos: { x: 15, y: 5 },
    type: 'OFFICE',
    isDiscovered: false,
    explorationItems: ['vane_ledger', 'trash_can_vane']
  },
  'union_hall': {
    id: 'union_hall',
    npcId: 'union',
    name: 'The Gilded Pick (Union)',
    pos: { x: 25, y: 10 },
    type: 'PUB',
    isDiscovered: false,
    explorationItems: ['sal_cigar_box']
  },
  'inspector_hq': {
    id: 'inspector_hq',
    npcId: 'inspector',
    name: 'Compliance Tower',
    pos: { x: 5, y: 25 },
    type: 'OFFICE',
    isDiscovered: false,
    explorationItems: ['krell_blueprints']
  },
  'fixer_den': {
    id: 'fixer_den',
    npcId: 'fixer',
    name: 'Slink\'s Salvage',
    pos: { x: 28, y: 28 },
    type: 'HOME',
    isDiscovered: false
  },
  'hotline_booth': {
    id: 'hotline_booth',
    npcId: 'journalist',
    name: 'Public Hotline Booth',
    pos: { x: 15, y: 15 },
    type: 'HOTLINE',
    isDiscovered: true // Always known
  },
  'mine_entrance': {
    id: 'mine_entrance',
    npcId: 'none',
    name: 'Sector 4 Entrance',
    pos: { x: 28, y: 2 },
    type: 'MINE_ENTRANCE',
    isDiscovered: true
  },
  // New Landmarks and decorative buildings
  'central_park': {
    id: 'central_park',
    npcId: 'none',
    name: 'Dusty Palms Park',
    pos: { x: 10, y: 10 },
    type: 'PARK',
    isDiscovered: true,
    description: 'The only place with actual (dying) trees.'
  },
  'water_tower': {
    id: 'water_tower',
    npcId: 'none',
    name: 'The Great Cistern',
    pos: { x: 18, y: 22 },
    type: 'LANDMARK',
    isDiscovered: true,
    description: 'A rusty monument to the town\'s thirst.'
  },
  'residential_a': {
    id: 'residential_a',
    npcId: 'none',
    name: 'Worker Blocks A-12',
    pos: { x: 5, y: 5 },
    type: 'RESIDENTIAL',
    isDiscovered: true
  },
  'residential_b': {
    id: 'residential_b',
    npcId: 'none',
    name: 'The Slumber Stacks',
    pos: { x: 22, y: 5 },
    type: 'RESIDENTIAL',
    isDiscovered: true
  },
  'industrial_zone': {
    id: 'industrial_zone',
    npcId: 'none',
    name: 'Smog Valley',
    pos: { x: 10, y: 28 },
    type: 'INDUSTRIAL',
    isDiscovered: true
  },
  'old_monument': {
    id: 'old_monument',
    npcId: 'none',
    name: 'Founder\'s Folly',
    pos: { x: 28, y: 15 },
    type: 'LANDMARK',
    isDiscovered: true
  }
};
