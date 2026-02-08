# Aureus Engine Contract

This document defines the core architectural laws governing the Aureus Engine. Adherence to these contracts ensures system stability, determinism, and performance.

## 1. State Mutation & Ownership (The Purity Rule)
The engine operates on a **Single Source of Truth** model managed by the `StateManager`.

- **Mutation Rule**: **ONLY** the simulation tick is allowed to mutate `GameState`. 
- **Command Queue**: All external intent (UI clicks, Input handlers) **MUST** be pushed to a command queue. The `StateManager` processes these commands exclusively during its fixed simulation update.
- **Dev Guard**: A `assertMutableContext("simTick")` guard is enforced. Any mutation attempt outside this context is considered a critical bug.
- **React Interaction**: React is strictly a **read-only view**. It consumes snapshots. It never touches the mutable state.

## 2. Temporal Logic: Fixed Tick vs. Frame Loop
The engine strictly separates simulation logic from visual presentation.

### Fixed Tick (Simulation)
- **Rate**: 60Hz deterministic interval.
- **Ownership**: 
  - Applying queued commands.
  - Resource arithmetic.
  - Agent AI state transitions.
  - Building production ticks.
- **Rule**: If it affects the outcome of the game, it happens here.

### Frame Loop (Render Loop)
- **Rate**: Browsers' `requestAnimationFrame` (Variable).
- **Ownership**: 
  - Input polling.
  - Camera matrices.
  - Visual interpolation (Tweening).
  - Batching mesh updates for the GPU.
- **Rule**: NO business logic. NO state mutation.

## 3. Thread Ownership: Main vs. Worker
Offloading heavy compute keeps the UI responsive.

- **Main Thread (Authority)**:
  - Owns the `StateManager`.
  - Owns the Simulation Loop.
  - Owns the Three.js Scene Graph.
  - Controls the `WorkerManager`.
- **Worker Thread (Asset Generator)**:
  - **Mesh Generation**: Calculates vertex/index buffers for chunks.
  - **Pathfinding**: Computes heatmaps and A* paths.
  - **Ownership**: The worker owns its local geometry cache. It never writes back to the main `GameState` directly; it returns formatted results via `postMessage`.

## 4. World Topology: Chunks & Layers
The world is a tiled grid partitioned into Chunks.

- **"Chunk" Definition**: A 16x16 vertical slice of the world.
- **Layers**:
  - **Surface**: The 0-index layer (Biomes, Foliage, Buildings).
  - **Underground**: Layers -1 to -10 (Resource strata, Foundation logic).
- **LOD (Level of Detail)**:
  - **Active Chunk**: Full data resolution + active simulation.
  - **Distant Chunk**: Geometry only (Surface shell), no simulation ticking.

## 5. Protocol Versioning
Every message between the Main thread and Workers **MUST** include a `schemaVersion`. 
- Deserialization will fail explicitly if the version is mismatched, preventing silent data corruption or crashes during engine updates.

---
*(|) Sani Coder - Systems Architect*

