# Aureus: Eco-Dominion - Game Flow & Progression Map (V2)

## Phase 1: Survival & Foundation (The Tutorial)
**Goal:** Establish a stable colony that keeps 3 agents alive and happy.

### 1. Arrival (Surface Layer)
*   **State:** 3 Agents drop in. Idle.
*   **Context:** Wild terrain (Trees, Rocks, Ruins).
*   **Step 1: Navigation**: Camera Pan/Zoom/Rotate.
*   **Step 2: Harvesting**: Player manually marks Trees/Rocks for harvest.
    *   *System*: Agents prioritize these jobs (Prio 85).
    *   *Outcome*: Wood, Stone, Minerals added to global inventory.
*   **Step 3: Storage & Economy**:
    *   *Constraint*: Inventory cap is 500.
    *   *Action*: Build **Storage Depot** (+500 Cap).
    *   *Action*: Sell excess Minerals/Gems for **AGT** (Credits).
*   **Step 4: Basic Needs**:
    *   Agents get hungry/tired.
    *   *Action*: Build **Staff Quarters** (Sleep).
    *   *Action*: Build **Canteen** (Eat).
    *   *Outcome*: Agents auto-use these to restore energy/hunger.

## Phase 2: The Underground (Expansion)
**Goal:** Access the rich mineral seams below and establish infrastructure.

### 2. Breaking Ground (Layer -1 to -3)
*   **Step 1: The Entrance**:
    *   Build **Mining Headframe** on surface.
    *   *System*: Auto-digs entrance shaft to Layer -1.
*   **Step 2: Subterranean View**:
    *   Toggle View Mode (`V`). Camera slices terrain.
    *   Switch Layers (`PgUp/PgDn`).
*   **Step 3: Excavation**:
    *   Mark logic: Dig Tunnels (Layer -1).
    *   *Action*: Dig towards Ore Veins (Iron/Coal).
    *   *System*: Agents descend, dig, and carry ore back to surface storage.

## Phase 3: Industrialization (Processing)
**Goal:** Refine raw resources into high-value goods for profit.

### 3. The Supply Chain
*   **Step 1: Power**:
    *   Build **Solar Array** or **Generator**.
    *   Connect via **Power Lines**.
*   **Step 2: Water**:
    *   Build **Water Well** or **Pond pump**.
    *   Connect via **Pipes** (Layer -1 infrastructure).
*   **Step 3: Refining**:
    *   Build **Wash Plant** (Needs Power + Water).
    *   *Loop*: Raw Ore -> Wash Plant -> Refined Minerals -> Sell for AGT.
    *   *Risk*: Pollution rises. Eco Score drops.

## Phase 4: Era Progression (Growth)
**Goal:** Unlock advanced tech and manage the ecosystem.

### 4. Tech & Management
*   **Research**:
    *   Spend Minerals/AGT to unlock "Advanced Drilling" or "Medical Bay".
*   **Era 2 (Growth)**:
    *   *Condition*: 5 Colonists, 5000 AGT.
    *   *Unlock*: Medical Bay, Security Post, Concrete.
*   **Eco Balance**:
    *   Pollution hurts Trust.
    *   *Action*: Build **Parks** / **Nature Reserves**.
    *   *Action*: Research Green Tech.

## Phase 5: Voxel Destruction & Defense (Experimental)
**Goal:** Handle geological instability and external threats.

*   **Events**: Earthquakes / Cave-ins.
*   **Mechanic**: Voxel Integrity.
    *   *Event*: Explosion/Damage reduces tile integrity.
    *   *Outcome*: Tile turns to rubble/empty.
    *   *Counter*: Build **Support Pillars** underground to prevent collapse.
*   **Defense**: (Future) Turrets vs Creatures?

---

## Revised Tutorial Script (Proposal)

1.  **INTRO**: "Welcome Director."
2.  **NAV**: "Inspect the terrain."
3.  **HARVEST**: "We need resources. Mark 5 Trees and 3 Rocks."
    *   *Check*: Resources > X.
4.  **STORAGE**: "Capacity critical. Build a Storage Depot."
    *   *Check*: MaxCapacity >= 1000.
5.  **SELL**: "Funding required. Sell 100 Minerals."
    *   *Check*: AGT increases.
6.  **BUILD**: "Crew fatigue increasing. Build Staff Quarters."
    *   *Check*: Building exists.
7.  **UNDERGROUND**: "Sensors detect Iron below. Switch filters."
    *   *Action*: Toggle Underground Mode.
    *   *Action*: Dig 5 tiles.
8.  **COMPLETE**: "Operations established. Handing over control."

