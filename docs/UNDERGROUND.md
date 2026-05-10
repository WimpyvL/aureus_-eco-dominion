# Underground System Design

## Overview
The Underground System in Aureus extends the game world vertically, introducing a layered voxel environment beneath the surface. This document outlines the architecture for data storage, rendering, pathfinding, and agent interaction within this subsurface domain.

## Core Concepts

### 1. Vertical Layering
- **Surface**: Layer 0 (Terrain Height).
- **Underground**: Layers -1 to -10.
- **Depth Scaling**: Each underground layer represents **2.0 units** of depth.
  - Layer -1: y = (TerrainHeight * 0.5) - 2.0
  - Layer -2: y = (TerrainHeight * 0.5) - 4.0
  - ...etc.

### 2. Data Structure (`UndergroundTile`)
Underground data is stored sparsely within the existing `GridTile` structure.

```typescript
// engine/types/world.ts
export interface UndergroundTile {
    excavated: boolean;       // True = Walkable, False = Solid Rock
    oreType?: 'GOLD' | 'IRON' | 'GEM' | 'COAL';
    oreVisible: boolean;      // Fog-of-war mechanism
    supportType?: 'PILLAR' | 'WOOD_BEAM';
    collapseRisk: number;     // Future mechanic
    collapsed?: boolean;
}

export interface GridTile {
    // ... existing properties
    underground: Record<number, UndergroundTile>; // Keyed by layer index (-1, -2, etc.)
    hasEntrance?: boolean; // Marker for surface-to-underground access
}
```

## Systems Interaction

### 1. Generation (`ChunkStore.ts`)
- Upon chunk generation, Layer -1 is initialized as **SOLID** (`excavated: false`).
- Deeper layers are generated on-demand or during initial world gen if configured.

### 2. Pathfinding (`Pathfinding.ts`)
- **A* Algorithm**: Modified to support 3D coordinates (x, z, layer).
- **Cost Function**:
  - `Surface (Layer 0)`: Standard terrain costs.
  - `Underground (Layer < 0)`:
    - **Excavated**: Cost = 1 (Walkable).
    - **Solid**: Cost = Infinity (Blocked).
- **Exceptions**:
  - Agents with a `DIG` job can target a **SOLID** tile (as the destination only).
  - Vertical transitions require a `hasEntrance` flag at the specific x,z coordinate on the Surface.

### 3. Excavation Loop (`ExcavationSystem.ts` & `AgentSystem.ts`)
1. **Command**: User issues `QUEUE_DIG` at (x, z, layer).
2. **Job**: `JobGenerationSystem` creates a `DIG` job.
3. **Execution**:
   - Agent pathfinds to the SOLID tile (allowed exception).
   - Agent performs work, accumulating progress.
4. **Completion**:
   - `ExcavationSystem` sets `tile.underground[layer].excavated = true`.
   - The tile becomes walkable.
   - If adjacent to other solid tiles, they become valid dig targets.

## Rendering (`TerrainRenderSystem.ts`)

### Meshing Strategy
- **Surface**: Renders terrain heightmap.
- **Underground**: Renders a "cave mesh" for layers -1 to -10.
- **Culling**: Faces are only generated if the neighbor is **NOT SOLID** (i.e., excavated or empty). This creates the "room" geometry inside the solid rock.
- **Clipping**:
  - `AureusWorld` manages a global `subterraneanClippingPlane`.
  - When in **Underground Mode**, the plane cuts off geometry above the current layer ceiling to allow visibility into the rooms.
  - **Correction**: The plane constant is set to `baseSurfaceY + (layer * 2.0) + 2.0` to reveal the full room height.

## Worker Integration
- **`engine.worker.ts`**: Handles heavy mesh generation.
- **Synchronization**: `SYNC_CHUNKS` message keeps the worker's local state updated with the main thread's changes (e.g., excavation progress).

## Future Expansion
- **Collapse Mechanics**: Utilizing `collapseRisk`.
- **Support Structures**: Building pillars to reduce risk.
- **Fluids**: Water/Lava pockets.
