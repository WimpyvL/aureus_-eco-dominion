# Deep Ledger MVP Status

## Status

**MVP state:** Core loop complete  
**Date:** 2026-05-13  
**Scope:** Underground / Deep Ledger vertical slice

The Deep Ledger is now past concept/prototype foundation and has a playable MVP loop.

```text
Survey → Select → Dig → Connect → Support → Extract → Collapse → Repair → Mitigate hazards
```

This does not mean the feature is final-polished. It means the minimum playable underground system now exists and can be tested as a coherent loop.

## What is included in the MVP

| Area | Status | Notes |
|---|---:|---|
| Underground unlock/toggle | Done | Underground view is accessible and functional. |
| Underground state model | Done | Tiles, depth, stability, oxygen, exposure, hazards, selection. |
| Deterministic tile generation | Done | Tiles are generated from position/depth/seed. |
| Surveying | Done | Survey Drill / mining access reveals Sector B1 tiles. |
| Visual map markers | Done | Surveyed, tunnel, support, collapse, hazard, and resource markers. |
| Marker selection | Done | Clicking markers selects and syncs inspector/action panel. |
| Tile inspector | Done | Shows resource, hazard, stability, and status data. |
| Tunnel opening | Done | Surveyed tiles can be opened as tunnels. |
| Connectivity | Done | Connected tunnel network is recalculated. |
| Extraction | Done | Connected deposit tunnels can extract resources. |
| Depletion | Done | Deposits lose ore richness and can become empty. |
| Support/reinforcement | Done | Tunnels can be supported to improve stability. |
| Collapse risk | Done | Unsupported, unstable tunnels can collapse. |
| Collapse repair | Done | Collapsed tiles can be cleared and reopened. |
| Hazard mitigation | Done | Gas, water, instability, heat, and illegal tunnel hazards can be mitigated. |
| Collapsible UI | Done | Deep Ledger overlays/panels can be minimized. |

## Current player loop

1. Enter surface view.
2. Use Survey Drill access to place a Survey Drill.
3. Enter underground view.
4. Use Deep Map markers to see surveyed tiles.
5. Click a marker to select a tile.
6. Read the Tile Inspector.
7. Use Tunnel Action panel to:
   - open tunnels
   - clear collapsed tunnels
   - mitigate hazards
   - support tunnels
   - extract deposits
8. Watch stability, exposure, oxygen, hazards, connectivity, and collapse risk.

## MVP testing checklist

Use this checklist when validating the feature.

### Survey and visibility

- [ ] Survey Drill reveals underground tiles.
- [ ] Deep Map markers appear in underground view.
- [ ] Markers hide outside underground view.
- [ ] Legend is collapsible.
- [ ] Status HUD is collapsible.

### Selection and inspection

- [ ] Clicking a marker highlights it.
- [ ] Tile Inspector updates to the clicked tile.
- [ ] Tunnel Action panel updates to the clicked tile.
- [ ] Prev/Next still works and updates selected marker.

### Tunnel actions

- [ ] Surveyed tile can be opened.
- [ ] Opened tile becomes a tunnel.
- [ ] Tunnel connectivity recalculates after opening.
- [ ] Disconnected tunnels cannot extract.
- [ ] Connected tunnels can extract.

### Extraction

- [ ] Minerals increase minerals.
- [ ] Gems increase AGT.
- [ ] Aureus veins increase AGT and exposure.
- [ ] Relic fragments add research if available, otherwise AGT fallback.
- [ ] Ore richness decreases after extraction.
- [ ] Deposit becomes `NONE` when depleted.
- [ ] Extraction lowers local/global stability.

### Stability and collapse

- [ ] Unsupported low-stability tunnels generate warnings.
- [ ] Unsupported low-stability tunnels can collapse.
- [ ] Collapsed tiles break tunnel connectivity.
- [ ] Reinforced tunnels are protected from collapse risk.

### Repair and mitigation

- [ ] Collapsed tiles can be cleared.
- [ ] Cleared tiles reopen as weak tunnels.
- [ ] Connectivity recalculates after clearing.
- [ ] Hazard tiles can be mitigated.
- [ ] Mitigation clears hazards and improves stability.
- [ ] Illegal tunnel mitigation reduces exposure.
- [ ] Gas mitigation restores oxygen.

## Known MVP compromises

These are intentional shortcuts to keep the MVP shippable.

| Compromise | Current behavior | Future replacement |
|---|---|---|
| Runtime patches | Deep Ledger is currently wired through patch modules. | Promote into engine systems and React components. |
| DOM markers | Underground visuals use DOM overlays. | Replace with proper Three.js underground render layer. |
| Fallback connectivity root | First tunnel can act as MVP access root if explicit roots are absent. | Use Mine Shaft / Cargo Lift / Access Hatch roots. |
| Action-based hazard counters | One Mitigate button clears hazard types. | Dedicated Vent Node, Pump Node, Cooling, Security buildings. |
| Survey Drill access shortcut | Drill is available through shortcut access. | Formal shop/category integration. |
| Basic balancing | Costs/yields are first-pass values. | Dedicated balance pass after playtesting. |

## Post-MVP priorities

### 1. Stabilization and balance

- Tune AGT costs.
- Tune extraction yield.
- Tune collapse chance.
- Tune exposure gain/loss.
- Tune mitigation rewards.
- Verify save/load behavior after long sessions.

### 2. Proper access structures

Replace fallback connectivity root with explicit structures:

- Mine Shaft
- Cargo Lift
- Access Hatch

Only networks connected to those access structures should extract.

### 3. Proper hazard buildings

Promote mitigation into buildable counters:

| Hazard | Building/system |
|---|---|
| Gas | Vent Node |
| Water | Pump Node |
| Heat | Cooling Node |
| Instability | Support Beam / Seismic Sensor |
| Illegal Tunnel | Security Checkpoint |

### 4. Black Ledger contracts

Add hidden economy contracts:

- off-book mineral extraction
- private Aureus vein buyer
- relic buyer
- suppress collapse report
- illegal miner deal
- public inquiry risk

### 5. Architecture cleanup

Promote patch modules into proper systems:

```text
UndergroundSurveySystem
UndergroundDigSystem
UndergroundConnectivitySystem
UndergroundExtractionSystem
UndergroundHazardSystem
UndergroundRenderSystem
UndergroundInputSystem
```

### 6. UI cleanup

Move overlays into proper React components and consolidate layout.

## Definition of MVP complete

Deep Ledger MVP is considered complete when this loop works from start to finish:

```text
Survey tile
→ Select marker
→ Open tunnel
→ Connect route
→ Support tunnel
→ Extract resource
→ Experience instability/collapse risk
→ Clear collapse
→ Mitigate hazard
→ Continue operating
```

As of this document, that loop is implemented.

## Next recommended PR

```text
chore: stabilize Deep Ledger MVP tuning
```

Suggested scope:

- Add a small constants/config module for Deep Ledger costs and tuning values.
- Move duplicated numbers out of the action panel.
- Add clear comments around MVP shortcuts.
- Keep behavior unchanged unless a value is obviously broken.

---

( |╲ ) / (│╲)
