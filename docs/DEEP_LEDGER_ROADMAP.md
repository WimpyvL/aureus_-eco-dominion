# The Deep Ledger: Underground Feature Roadmap

## Status

**Stage:** Design locked, implementation pending  
**Feature area:** Underground / dungeon / subsurface operations  
**Current base:** The underground toggle is functional. This roadmap defines what the underground becomes next.

## Core pitch

**The Deep Ledger** is the hidden underground economy of Aureus.

The surface is the public story: ecology, trust, citizens, compliance, visible infrastructure, and reputation.

The underground is the private machine: extraction, instability, illegal miners, exposure risk, hidden contracts, and dangerous profit.

The design goal is simple:

> Build a clean eco-colony on the surface while managing the dangerous extraction empire beneath it. Every shortcut funds growth. Every secret risks exposure.

## Design pillars

| Pillar | Meaning | Player question |
|---|---|---|
| Explore | Reveal underground sectors and tile data | What is hidden below this colony? |
| Extract | Mine minerals, gems, Aureus veins, and relic fragments | How much can I pull out before risk climbs? |
| Stabilize | Manage collapse, gas, flooding, heat, and oxygen | Can I keep this machine alive? |
| Exploit | Use illegal miners, black-market routes, and off-book contracts | Do I take the fast dirty profit? |
| Conceal | Control exposure, inspections, public inquiry, and trust loss | Can I keep the surface story clean? |

## Surface versus underground identity

| Surface | Underground |
|---|---|
| Trust | Exposure Risk |
| Eco Score | Stability |
| Public buildings | Secret infrastructure |
| Population | Underground crew |
| Clean economy | Black Ledger economy |
| Expansion | Excavation |
| Compliance | Concealment |

## Canonical names

| Concept | Name |
|---|---|
| Feature system | The Deep Ledger |
| Underground mode label | Below Sector |
| First sector | Sector B1 |
| First building | Survey Drill |
| Rare resource | Aureus Vein |
| Hidden scandal meter | Exposure Risk |
| Illegal economy panel | Black Ledger |
| Major scandal event | Public Inquiry |

## Phase 1: Survey foundation

### Goal

Give underground mode a real first loop:

```text
Reach Trust 50
→ Build Survey Drill
→ Enter Below Sector
→ Reveal underground tiles
→ Read ore, hazard, and stability data
→ Choose where to dig later
```

### Scope

- Add underground state model.
- Add deterministic underground tile generation.
- Add Survey Drill building.
- Add underground survey reveal logic.
- Add Underground HUD.
- Backfill missing underground state for old saves.

### Acceptance criteria

- [ ] `GameState` includes `underground`.
- [ ] New games initialize underground state.
- [ ] Old saves do not crash if `underground` is missing.
- [ ] `SURVEY_DRILL` exists as a buildable building.
- [ ] Completed Survey Drills reveal underground tiles in radius 4.
- [ ] Revealed tiles include resource type, ore richness, stability, and hazard.
- [ ] Underground HUD appears only in underground/dungeon view.
- [ ] HUD displays depth, stability, oxygen, exposure, surveyed tile count, and hazard count.
- [ ] Surface gameplay remains unchanged.

### Suggested files

```text
engine/underground/UndergroundGenerator.ts
engine/sim/systems/UndergroundSurveySystem.ts
components/UndergroundHUD.tsx
types.ts
engine/state/StateManager.ts
engine/data/VoxelConstants.ts
game/AureusWorld.ts
App.tsx
```

## Phase 2: Digging and extraction

### Goal

Turn revealed data into playable choices.

### Scope

- Add Mine Shaft.
- Add Tunnel tile state.
- Add Cargo Lift.
- Add basic resource extraction.
- Add connected-to-surface requirement.
- Add tile inspector.

### Acceptance criteria

- [ ] Mine Shaft creates a valid underground access point.
- [ ] Player can dig surveyed tiles.
- [ ] Dug tiles become tunnels.
- [ ] Tunnels must connect back to surface access to function.
- [ ] Extracted resources move to surface through Mine Shaft or Cargo Lift.
- [ ] Tile inspector shows status, resource, richness, stability, and hazard.

### Suggested files

```text
engine/sim/systems/UndergroundDigSystem.ts
engine/sim/systems/UndergroundExtractionSystem.ts
components/UndergroundTileInspector.tsx
game/render/systems/UndergroundRenderSystem.ts
```

## Phase 3: Stability and hazards

### Goal

Make underground profitable but unsafe.

### Scope

- Add Support Beam.
- Add stability decay.
- Add cave-ins.
- Add gas, water, heat, and instability hazards.
- Add Seismic Sensor, Vent Node, and Pump Node.
- Add worker injury or production interruption events.

### Acceptance criteria

- [ ] Dug tiles reduce local stability.
- [ ] Support Beam increases local stability.
- [ ] Tiles below stability threshold can collapse.
- [ ] Gas lowers oxygen unless ventilation exists.
- [ ] Water can flood tiles unless pumps exist.
- [ ] Heat reduces productivity unless cooling tech/building exists.
- [ ] Hazards produce news-feed events and penalties.

### Suggested files

```text
engine/sim/systems/UndergroundHazardSystem.ts
engine/sim/systems/UndergroundStabilitySystem.ts
components/UndergroundHUD.tsx
```

## Phase 4: Illegal miners and security

### Goal

Connect existing illegal-miner themes directly to underground gameplay.

### Scope

- Illegal tunnels can appear as hazards.
- Illegal miners can steal resources, sabotage supports, or offer shady deals.
- Add Security Checkpoint, Motion Sensor, and Sealed Bulkhead.
- Give player responses: arrest, hire, ignore, exploit.

### Acceptance criteria

- [ ] Illegal tunnel hazard can spawn underground.
- [ ] Illegal miners can affect underground resources or stability.
- [ ] Security buildings reduce illegal activity.
- [ ] Player choices affect Trust and Exposure Risk.

## Phase 5: Black Ledger contracts

### Goal

Add the signature hidden economy.

### Scope

- Add Black Ledger panel.
- Add off-book contracts.
- Add Exposure Risk rewards and penalties.
- Add Public Inquiry event.
- Add temporary lockdowns or fines when exposure hits 100.

### Acceptance criteria

- [ ] Black Ledger contracts generate from underground state.
- [ ] Contracts trade high AGT/resource reward for Exposure Risk.
- [ ] Exposure has thresholds at 25, 50, 75, and 100.
- [ ] Public Inquiry triggers at 100 Exposure.
- [ ] Public Inquiry causes Trust loss, AGT fine, and temporary underground restrictions.

## Data model proposal

```ts
export type UndergroundTileStatus =
  | 'HIDDEN'
  | 'SURVEYED'
  | 'DUG'
  | 'REINFORCED'
  | 'COLLAPSED'
  | 'FLOODED'
  | 'SEALED';

export type UndergroundResourceType =
  | 'NONE'
  | 'MINERALS'
  | 'GEMS'
  | 'AUREUS_VEIN'
  | 'RELIC_FRAGMENT';

export type UndergroundHazardType =
  | 'NONE'
  | 'GAS'
  | 'WATER'
  | 'HEAT'
  | 'INSTABILITY'
  | 'ILLEGAL_TUNNEL';

export interface UndergroundTile {
  id: string;
  x: number;
  z: number;
  depth: number;
  status: UndergroundTileStatus;
  resourceType: UndergroundResourceType;
  oreRichness: number;
  stability: number;
  hazard: UndergroundHazardType;
  hasTunnel: boolean;
  hasSupport: boolean;
  connectedToSurface: boolean;
}

export interface UndergroundState {
  unlocked: boolean;
  depthLevel: number;
  exposureRisk: number;
  globalStability: number;
  oxygen: number;
  activeHazards: UndergroundHazardType[];
  selectedTileId: string | null;
  tiles: Record<string, UndergroundTile>;
}
```

## Deterministic tile generation proposal

Underground generation should be deterministic so the game does not need to store every hidden tile.

Generation inputs:

- x
- z
- depth
- world seed, when available

Generated outputs:

- resource type
- ore richness
- base stability
- hazard type

Resource probabilities for Sector B1:

| Resource | Suggested chance |
|---|---:|
| None | 65% |
| Minerals | 22% |
| Gems | 7% |
| Aureus Vein | 3% |
| Relic Fragment | 3% |

Hazard probabilities for Sector B1:

| Hazard | Suggested chance |
|---|---:|
| None | 78% |
| Instability | 8% |
| Water | 6% |
| Gas | 5% |
| Illegal Tunnel | 3% |

## Building roadmap

| Phase | Building | Purpose |
|---|---|---|
| 1 | Survey Drill | Reveals underground tile data |
| 2 | Mine Shaft | Creates surface access |
| 2 | Tunnel | Enables movement/extraction |
| 2 | Cargo Lift | Moves resources upward |
| 3 | Support Beam | Raises stability |
| 3 | Vent Node | Counters gas |
| 3 | Pump Node | Counters water |
| 3 | Seismic Sensor | Warns before collapse |
| 4 | Security Checkpoint | Counters illegal miners |
| 4 | Sealed Bulkhead | Contains hazards |
| 5 | Black Market Cache | Unlocks shady contracts |
| 5 | Relic Lab | Converts relics into research |

## Underground HUD

When `activeView === 'DUNGEON'`, show:

```text
DEEP LEDGER // SECTOR B1
Depth: B1
Stability: 100%
Oxygen: 100%
Exposure: 0%
Surveyed Tiles: 0
Hazards: 0
```

## UI copy

### Locked message

```text
Below Sector locked. Reach Trust 50 to authorize subsurface operations.
```

### Survey Drill description

```text
Reveals underground deposits, hazards, and stability data around its location.
```

### First tutorial line

```text
The surface tells the public story. The Deep Ledger records what happens beneath it.
```

### Hazard warning

```text
Instability detected. Reinforcement recommended before extraction.
```

### Exposure warning

```text
Exposure Risk rising. Public scrutiny may trigger an inquiry.
```

## PR sequence

| PR | Title | Scope | Risk |
|---|---|---|---|
| 1 | `feat: add Deep Ledger survey foundation` | State, generator, Survey Drill, HUD | Medium |
| 2 | `feat: add underground digging and mine shafts` | Tunnels, Mine Shaft, tile inspector | High |
| 3 | `feat: add underground stability and hazards` | Collapse, gas, water, supports | Medium-high |
| 4 | `feat: add illegal miner underground events` | Illegal tunnels, security counters | Medium |
| 5 | `feat: add Black Ledger contracts` | Shady contracts, exposure thresholds, inquiry | Medium |
| 6 | `feat: add underground rendering pass` | Proper tile visuals and overlays | High |

## Implementation rules

- Keep React as a view layer. Engine owns gameplay state.
- Do not put underground simulation logic inside UI components.
- Keep Phase 1 focused on data, reveal, and HUD.
- Do not add Black Ledger contracts before survey and digging exist.
- Do not rename existing `dungeon` code until replacement systems are stable.
- Backfill missing underground state on loaded saves.
- Keep each PR reviewable and shippable.

## Immediate next task

Create PR 1:

```text
feat: add Deep Ledger survey foundation
```

Minimum shippable contents:

- `UndergroundState` and `UndergroundTile` types.
- Initial underground state in new games.
- Save backfill for missing underground state.
- Deterministic underground generator.
- Survey Drill building definition.
- Survey system that reveals radius 4 around completed drills.
- HUD visible only while underground view is active.

---

( |╲ ) / (│╲)
