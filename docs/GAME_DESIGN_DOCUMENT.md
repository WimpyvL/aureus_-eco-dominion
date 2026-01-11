# Aureus: Eco Dominion - Game Design Document

**Version 1.0 | (|/) Klaasvaakie | January 2026**

---

## 📋 Executive Summary

Aureus: Eco Dominion is a voxel-based economic simulation game set in Zimbabwe where players manage a sustainable mining operation. The core challenge is balancing **resource extraction** (profits) against **ecological preservation** (eco score) and **community relations** (trust). 

This document analyzes the current game state, proposes building progression, and outlines enhancement strategies to make the game more fun and challenging.

---

## 🎮 PART 1: CURRENT GAME ANALYSIS

### 1.1 Core Gameplay Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT CORE LOOP                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│   │ EXTRACT  │ -> │  SELL    │ -> │  BUILD   │ -> │  EXPAND  │  │
│   │ Resources│    │ Minerals │    │ Buildings│    │ Colony   │  │
│   └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘  │
│        │               │               │               │        │
│        └───────────────┴───────────────┴───────────────┘        │
│                        ▼                                        │
│              ┌─────────────────────┐                            │
│              │  BALANCE 3 METRICS  │                            │
│              │  • AGT (Money)      │                            │
│              │  • Eco Score        │                            │
│              │  • Trust            │                            │
│              └─────────────────────┘                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Current Resource Systems

| Resource | Source | Usage | Status |
|----------|--------|-------|--------|
| **AGT (Currency)** | Building production, Selling minerals | Building purchases, Maintenance | ✅ Working |
| **Minerals** | Mining via Wash Plants, Headframe | Selling, Contracts | ✅ Working |
| **Gems** | Rare mining drops | Speedups, Special contracts | ⚠️ Underutilized |
| **Eco Score** | Green buildings offset pollution | Unlocks eco-buildings | ✅ Working |
| **Trust** | Community buildings | Unlocks features, Income multiplier | ⚠️ Underutilized |

### 1.3 Current Building Categories

#### INFRASTRUCTURE (5 buildings)
| Building | Cost | Status | Notes |
|----------|------|--------|-------|
| Road | 5 | ✅ Implemented | Basic pathfinding |
| Water Pipe | 15 | ⚠️ Partial | Visual only, no actual water logic |
| Perimeter Fence | 8 | ⚠️ Partial | No security integration |
| Water Pond | 150 | ✅ Implemented | Natural water source |
| Industrial Reservoir | 5000 | ✅ Implemented | Large water storage |

#### RESIDENTIAL (3 buildings)
| Building | Cost | Eco Req | Status |
|----------|------|---------|--------|
| Staff Quarters | 1200 | 0 | ✅ Core building - enables workers |
| Canteen | 800 | 0 | ✅ Hunger recovery |
| Social Hub | 1500 | 10 | ✅ Mood recovery |

#### INDUSTRIAL (5 buildings)
| Building | Cost | Eco Req | Production | Pollution |
|----------|------|---------|------------|-----------|
| Wash Plant | 1200 | 0 | +35 Min/s | 12.0 |
| Recycling Plant | 3000 | 30 | +20 Min/s | 1.0 |
| Ore Foundry | 25000 | 10 | +40 Min/s | 18.0 |
| Mining Headframe | 45000 | 0 | +60 Min/s | 25.0 |
| (None) | - | - | - | - |

#### ECOLOGICAL (4 buildings)
| Building | Cost | Eco Req | Effect |
|----------|------|---------|--------|
| Solar Array | 500 | 0 | -2.0 Pollution |
| Wind Turbine | 2500 | 10 | -6.0 Pollution |
| Community Garden | 600 | 0 | +4 Trust/s, -1.5 Pollution |
| Water Well | 1200 | 5 | +2 Trust/s |

#### SPECIAL BUILDINGS (4 buildings)
| Building | Cost | Eco Req | Effect | Size |
|----------|------|---------|--------|------|
| Security Post | 600 | 0 | Prevents theft | 1x1 |
| Education Center | 12000 | 20 | +25 Trust/s | 3x3 |
| Eco-Lodge Resort | 35000 | 40 | +150 AGT/s | 3x3 |
| Research Biosphere | 80000 | 60 | -40.0 Pollution | 3x3 |

### 1.4 Current Agent System

**Agent Roles:**
- Worker (General purpose)
- Miner (Mining specialist)
- Engineer (Construction specialist)
- Botanist (Farm/garden specialist)
- Security (Patrol specialist)
- Illegal Miner (Enemy NPC)

**Agent Needs:**
- Energy (0-100) → Restored by Staff Quarters
- Hunger (0-100) → Restored by Canteen
- Mood (0-100) → Restored by Social Hub

### 1.5 Current Tech Tree

```
INDUSTRIAL                 ECOLOGICAL                 SOCIAL
────────────               ──────────                 ──────
Advanced Drilling          Adv. Photovoltaics         Community Outreach
(+15% Mineral Prod)        (+20% Solar Eff)           (+20% Trust)
      │                          │                         │
      ▼                          ▼                         ▼
Market Analytics           Closed-Loop Water          Neighborhood Watch
(+20% Sell Value)          (-30% Pollution)           (Reduces Theft)
      │                          │                         │
      ▼                          ▼                         ▼
Drone Automation           Direct Air Capture         STEM Scholarship
(+25% Prod, -10% Upkeep)   (-50% Pollution)           (+50% Trust, +10% Prod)
```

---

## 🚨 PART 2: CURRENT PROBLEMS

### 2.1 Gameplay Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| **No Clear Progression** | 🔴 HIGH | Buildings unlock by eco/trust but no structured phases |
| **Gems Underused** | 🟡 MEDIUM | Only used for speedups, no gem-specific buildings |
| **Water System Broken** | 🔴 HIGH | Pipes exist but don't actually transport water |
| **No Power Grid** | 🟡 MEDIUM | Solar/Wind don't power anything |
| **Security Shallow** | 🟡 MEDIUM | Security posts exist but fence integration missing |
| **Missing Mid-Game** | 🔴 HIGH | Big gap between early buildings and mega-structures |
| **No Victory Condition** | 🟡 MEDIUM | GameStep.VICTORY exists but no way to achieve it |
| **Contracts Too Simple** | 🟡 MEDIUM | Just "deliver X resources" with no variety |

### 2.2 Balance Issues

| Issue | Current State | Problem |
|-------|---------------|---------|
| Early game too slow | Start with 0 AGT | Hard to bootstrap |
| Pollution overwhelming | Wash Plant = 12 pollution | First industrial building kills eco |
| Trust undervalued | Only affects income multiplier | No tangible benefit |
| Maintenance imbalance | Varies wildly | Some buildings drain economy |

---

## 🏗️ PART 3: PROPOSED BUILDING PROGRESSION

### 3.1 Era System

**Introduce 5 Eras** that create natural game phases:

| Era | Theme | Unlock Condition | New Buildings |
|-----|-------|------------------|---------------|
| **Era 1: Settlement** | Survival basics | Tutorial complete | 8 starter buildings |
| **Era 2: Growth** | Colony expansion | 5 colonists + 1000 AGT | 8 intermediate buildings |
| **Era 3: Industry** | Heavy production | 10 colonists + 50 Eco | 7 industrial buildings |
| **Era 4: Sustainability** | Balance restoration | 60 Eco + 50 Trust | 6 eco-tech buildings |
| **Era 5: Prosperity** | Victory path | 80 Eco + 80 Trust | 5 endgame buildings |

### 3.2 Complete Building Roster

#### ERA 1: SETTLEMENT (Tutorial → 5 colonists)

| # | Building | Cost | Size | Purpose | NEW? |
|---|----------|------|------|---------|------|
| 1 | **Road** | 5 | 1x1 | Basic infrastructure | ✓ Exists |
| 2 | **Staff Quarters** | 1200 | 2x2 | Worker housing | ✓ Exists |
| 3 | **Canteen** | 800 | 2x2 | Food needs | ✓ Exists |
| 4 | **Wash Plant** | 1200 | 2x2 | First mining | ✓ Exists |
| 5 | **Solar Array** | 500 | 2x1 | Entry-level eco | ✓ Exists |
| 6 | **Water Well** | 400 | 1x1 | Basic water | 🔄 Reduce cost |
| 7 | **Storage Depot** | 600 | 2x2 | Increase mineral cap | 🆕 NEW |
| 8 | **Workshop** | 900 | 2x2 | Speeds construction | 🆕 NEW |

#### ERA 2: GROWTH (5 colonists + 1000 AGT)

| # | Building | Cost | Size | Purpose | NEW? |
|---|----------|------|------|---------|------|
| 9 | **Fence** | 8 | 1x1 | Perimeter security | ✓ Exists |
| 10 | **Security Post** | 600 | 1x1 | Monitors area | ✓ Exists |
| 11 | **Social Hub** | 1500 | 2x2 | Mood recovery | ✓ Exists |
| 12 | **Community Garden** | 600 | 2x2 | Trust + Eco | ✓ Exists |
| 13 | **Wind Turbine** | 2500 | 1x1 | Advanced eco | ✓ Exists |
| 14 | **Generator** | 1800 | 1x1 | Power production | 🆕 NEW |
| 15 | **Medical Bay** | 2000 | 2x2 | Heals injured workers | 🆕 NEW |
| 16 | **Training Center** | 2500 | 2x2 | Improves worker skills | 🆕 NEW |

#### ERA 3: INDUSTRY (10 colonists + 50 Eco)

| # | Building | Cost | Size | Purpose | NEW? |
|---|----------|------|------|---------|------|
| 17 | **Recycling Plant** | 3000 | 2x2 | Clean mining | ✓ Exists |
| 18 | **Water Pipe** | 15 | 1x1 | Water transport | ✓ Exists |
| 19 | **Pond** | 150 | 1x1 | Water source | ✓ Exists |
| 20 | **Ore Foundry** | 25000 | 3x3 | Heavy processing | ✓ Exists |
| 21 | **Gem Refinery** | 15000 | 2x2 | Extract gems from ore | 🆕 NEW |
| 22 | **Rail Line** | 50/tile | 1x1 | Fast resource transport | 🆕 NEW |
| 23 | **Distribution Hub** | 8000 | 2x2 | Auto-distributes resources | 🆕 NEW |

#### ERA 4: SUSTAINABILITY (60 Eco + 50 Trust)

| # | Building | Cost | Size | Purpose | NEW? |
|---|----------|------|------|---------|------|
| 24 | **Reservoir** | 5000 | 3x3 | Industrial water | ✓ Exists |
| 25 | **Education Center** | 12000 | 3x3 | Massive trust | ✓ Exists |
| 26 | **Waste Treatment** | 10000 | 2x2 | Reduces all pollution 20% | 🆕 NEW |
| 27 | **Nature Reserve** | 8000 | 4x4 | Huge eco regen, wildlife | 🆕 NEW |
| 28 | **Hydroponics** | 6000 | 2x2 | Food + Eco combined | 🆕 NEW |
| 29 | **Geothermal Plant** | 18000 | 2x2 | Clean power, never stops | 🆕 NEW |

#### ERA 5: PROSPERITY (80 Eco + 80 Trust)

| # | Building | Cost | Size | Purpose | NEW? |
|---|----------|------|------|---------|------|
| 30 | **Eco-Lodge Resort** | 35000 | 3x3 | Luxury tourism income | ✓ Exists |
| 31 | **Mining Headframe** | 45000 | 4x4 | Maximum mining | ✓ Exists |
| 32 | **Research Biosphere** | 80000 | 3x3 | Victory building | ✓ Exists |
| 33 | **Monument** | 50000 | 2x2 | Victory condition trigger | 🆕 NEW |
| 34 | **Spaceport** | 100000 | 5x5 | Export to orbit (endgame) | 🆕 NEW |

### 3.3 New Building Definitions

```typescript
// NEW BUILDINGS TO ADD

STORAGE_DEPOT: {
  cost: 600,
  buildTime: 30,
  size: 2x2,
  effect: "+500 mineral storage capacity",
  pollution: 0.2
}

WORKSHOP: {
  cost: 900,
  buildTime: 45,
  size: 2x2,
  effect: "+25% construction speed in radius",
  pollution: 0.5
}

GENERATOR: {
  cost: 1800,
  buildTime: 40,
  size: 1x1,
  effect: "Provides 10 power units",
  pollution: 3.0
}

MEDICAL_BAY: {
  cost: 2000,
  buildTime: 60,
  size: 2x2,
  effect: "Heals injured workers, +10 max energy",
  pollution: 0.3
}

TRAINING_CENTER: {
  cost: 2500,
  buildTime: 80,
  size: 2x2,
  effect: "Workers gain skills 50% faster",
  pollution: 0.2
}

GEM_REFINERY: {
  cost: 15000,
  buildTime: 200,
  size: 2x2,
  effect: "+5 Gems/minute from mineral processing",
  pollution: 5.0
}

RAIL_LINE: {
  cost: 50,
  buildTime: 5,
  size: 1x1,
  effect: "Transport resources 3x faster",
  pollution: 0.1
}

DISTRIBUTION_HUB: {
  cost: 8000,
  buildTime: 120,
  size: 2x2,
  effect: "Auto-delivers resources to nearby buildings",
  pollution: 1.0
}

WASTE_TREATMENT: {
  cost: 10000,
  buildTime: 150,
  size: 2x2,
  effect: "All buildings -20% pollution",
  pollution: -5.0
}

NATURE_RESERVE: {
  cost: 8000,
  buildTime: 200,
  size: 4x4,
  effect: "Massive eco regen, spawns wildlife",
  pollution: -15.0
}

HYDROPONICS_FARM: {
  cost: 6000,
  buildTime: 100,
  size: 2x2,
  effect: "+food production, -2 pollution",
  pollution: -2.0
}

GEOTHERMAL_PLANT: {
  cost: 18000,
  buildTime: 180,
  size: 2x2,
  effect: "50 power, works day/night",
  pollution: 0.5
}

MONUMENT: {
  cost: 50000,
  buildTime: 500,
  size: 2x2,
  effect: "Victory condition - shows achievement",
  ecoReq: 90,
  trustReq: 90
}

SPACEPORT: {
  cost: 100000,
  buildTime: 1000,
  size: 5x5,
  effect: "Export minerals to orbit for 10x price",
  ecoReq: 80,
  pollution: 10.0
}
```

---

## ⚡ PART 4: NEW GAME SYSTEMS

### 4.1 Power Grid System

**Concept:** Industrial buildings now require power to operate.

```
POWER PRODUCERS:
├── Generator (10 power, high pollution)
├── Solar Array (5 power, day only)
├── Wind Turbine (8 power, weather dependent)
└── Geothermal Plant (50 power, constant)

POWER CONSUMERS:
├── Wash Plant: 5 power
├── Recycling Plant: 8 power
├── Ore Foundry: 15 power
├── Mining Headframe: 25 power
└── Gem Refinery: 10 power

RULES:
- Buildings without power operate at 25% efficiency
- Power is distributed via range (buildings within 10 tiles)
- Power lines could be optional upgrade
```

### 4.2 Water Network System

**Concept:** Certain buildings require water connection.

```
WATER SOURCES:
├── Water Well (10 water units)
├── Pond (5 water units, natural)
└── Reservoir (50 water units)

WATER CONSUMERS:
├── Canteen: 2 water
├── Community Garden: 3 water
├── Wash Plant: 5 water
├── Hydroponics: 4 water
└── Staff Quarters: 1 water

TRANSPORT:
- Pipes connect water sources to consumers
- Each pipe segment has a max throughput
- Visual water flow in pipes
```

### 4.3 Threat System (Enhanced Illegal Miners)

**Make illegal miners a real threat:**

```
THREAT LEVELS:
1. SCOUTS - Single miners scouting your perimeter
2. CAMP - 3-5 miners establish illegal camp
3. RAID - Organized theft attempt
4. SABOTAGE - Damage to buildings

DEFENSES:
├── Fence: Slows intruders
├── Security Post: Detects intruders in radius
├── Security Patrol: Actively chases intruders
└── Watchtower (NEW): Extends detection range

CONSEQUENCES:
- Camps reduce eco score over time
- Raids steal accumulated minerals
- Sabotage damages random building
- Undefended areas are vulnerable
```

### 4.4 Seasonal/Weather Events

**Expand weather impact:**

| Season | Duration | Effects |
|--------|----------|---------|
| Dry Season | 5 min | +30% mining, -20% eco regen |
| Rainy Season | 5 min | +50% eco regen, -30% construction speed |
| Dust Storm | 2 min | -50% production, +50% maintenance |
| Golden Hour | 30 sec | +100% solar power |

### 4.5 Contract System v2

**More varied contracts:**

| Type | Example | Complexity |
|------|---------|------------|
| **Resource** | Deliver 100 minerals | Basic |
| **Building** | Construct 2 Solar Arrays | Medium |
| **Eco** | Reach 70 Eco score | Medium |
| **Speed** | Produce 500 minerals in 3 min | Hard |
| **Combination** | 80 Eco AND deliver 50 gems | Expert |

---

## 🎯 PART 5: VICTORY CONDITIONS

### 5.1 Primary Victory: Prosperity Achievement

```
MONUMENT VICTORY:
━━━━━━━━━━━━━━━━
Requirements to build Monument:
✓ 90+ Eco Score
✓ 90+ Trust Score  
✓ 20+ Colonists
✓ 50,000 AGT saved
✓ All tech trees completed (at least tier 2)

Building Monument triggers VICTORY state.
```

### 5.2 Alternative Victories (Optional)

| Victory Type | Requirement | Theme |
|--------------|-------------|-------|
| **Economic** | Accumulate 1,000,000 AGT | Pure profit focus |
| **Ecological** | 100 Eco for 10 minutes | Perfect sustainability |
| **Social** | 100 Trust + 50 colonists | Community leader |
| **Industrial** | Export 10,000 minerals | Mining empire |

### 5.3 Failure Conditions

| Failure | Trigger | Message |
|---------|---------|---------|
| **Bankruptcy** | AGT < -5000 for 2 minutes | "Colony funding withdrawn" |
| **Ecological Collapse** | Eco = 0 for 5 minutes | "Land deemed unsuitable" |
| **Exodus** | Trust = 0, all workers leave | "Workers have abandoned colony" |
| **Overrun** | 10+ illegal camps | "Illegal mining overwhelms operation" |

---

## 🔧 PART 6: IMPLEMENTATION PRIORITY

### Phase 1: Core Fixes (Week 1)

1. ✅ Fix mobile controls (DONE)
2. 🔲 Implement power grid basics
3. 🔲 Add Era unlock system
4. 🔲 Add 3 new Era 1-2 buildings
5. 🔲 Balance early game economy

### Phase 2: Mid-Game Content (Week 2)

1. 🔲 Add 5 new Era 3-4 buildings
2. 🔲 Implement water network
3. 🔲 Enhanced threat system
4. 🔲 Contract system v2
5. 🔲 Weather events expansion

### Phase 3: Endgame & Polish (Week 3)

1. 🔲 Add Era 5 buildings
2. 🔲 Victory conditions
3. 🔲 Failure conditions  
4. 🔲 Achievement system
5. 🔲 Final balance pass

---

## 📊 PART 7: BALANCE RECOMMENDATIONS

### 7.1 Starting Resources

```
CURRENT:          PROPOSED:
AGT: 0            AGT: 500 (bootstrap fund)
Minerals: 0       Minerals: 0
Gems: 5           Gems: 3
Eco: 60           Eco: 65
Trust: 15         Trust: 20
```

### 7.2 Building Cost Curve

```
Era 1: 5 - 1500 AGT
Era 2: 600 - 3000 AGT  
Era 3: 3000 - 25000 AGT
Era 4: 5000 - 18000 AGT
Era 5: 35000 - 100000 AGT
```

### 7.3 Pollution Balance

```
Eco-positive buildings should roughly offset industrial:
- Every Wash Plant (-12 eco) needs ~2 Solar Arrays (+4 eco) + 1 Garden (+1.5 eco)
- This creates natural ratio: 1 industrial : 2-3 green buildings
```

### 7.4 Trust Value Proposition

**Make Trust more impactful:**
- 0-20 Trust: No benefits
- 20-40 Trust: +10% income multiplier
- 40-60 Trust: Faster recruitment
- 60-80 Trust: Unlock Era 4, Advanced contracts
- 80-100 Trust: Era 5, Victory path, Premium contracts

---

## 🎮 PART 8: FUN FACTOR ANALYSIS

### What Makes This Game Fun?

| Element | Current | Target |
|---------|---------|--------|
| **Progression** | Weak (no eras) | Strong (5 eras) |
| **Challenge** | Easy (no threats) | Medium (threats + balance) |
| **Decisions** | Few (build anything) | Many (power/water/defense) |
| **Feedback** | Minimal | Rich (effects, news, achievements) |
| **Goals** | Unclear | Crystal clear (era progress, victory) |

### Proposed "Fun Moments"

1. **First Wash Plant** - "Finally making money!"
2. **First Worker Hire** - "My colony is growing!"
3. **Defeating Illegal Camp** - "Protected my territory!"
4. **Eco Recovery** - "Turned pollution around!"
5. **Era Unlock** - "New era of possibilities!"
6. **Building Monument** - "I achieved prosperity!"

---

## 📝 SUMMARY

### Current State
- 22 buildings exist, most functional
- Core loop works but lacks depth
- No progression system
- Missing power/water mechanics
- Victory condition undefined

### After Implementation
- 34 buildings total (+12 new)
- 5 distinct eras with clear progression
- Power and water networks add complexity
- Enhanced threat system adds challenge
- Clear victory and failure conditions
- Balanced economy with meaningful choices

### Next Steps
1. Approve this design document
2. Prioritize Phase 1 implementation
3. Playtest after each phase
4. Iterate based on feedback

---

**Document prepared by: (|/) Klaasvaakie**  
**Aureus: Eco Dominion - Proprietary & Confidential**
