# SANI MEMORIES

## Session: 2026-01-23 to 2026-01-24

### Task: Restore World Visibility & Robust Underground Systems
**Status**: COMPLETED

#### Critical Changes:
1.  **Engine Worker (`engine.worker.ts`) Upgrade**:
    *   **Robust Checks**: Implemented `nTile?.underground?.[nLayer]?.excavated` checks to prevent worker crashes when layer data is partially initialized or missing.
    *   **Neighbor Culling Fix**: Corrected `isNeighborSolid` logic to properly handle the surface transition (Layer 0). Fixed issue where surface faces were being culled incorrectly or internal faces were rendered.
    *   **Resilience**: Wrapped layer meshing in `try-catch` blocks with specific warning logs to ensure a corrupted tile doesn't break the entire chunk generation.
    *   **Depth Scaling**: Enforced consistent 2.0 depth scaling across all faces to align with camera and logic expectations.

2.  **Game World (`AureusWorld.ts`) Initialization**:
    *   **Guaranteed Init**: Improved underground generation logic. It now performs a sweep scan of the grid and force-initializes default subterranean states and ore distributions if missing, preventing "undefined" strata access.

3.  **Tutorial System Implementation**:
    *   **Comprehensive Onboarding**: Created a multi-phase tutorial system covering: Navigation, Mining, Revenue, Acquisition, Construction, Survival (Needs), Networks (Utilities), Underground, Research, and Era Progress.
    *   **State Alignment**: Synced `GameStep` enum, `AureusWorld` progression logic, and `Modals.tsx` content to ensure a smooth guided experience for new players.
    *   **UI Polish**: Enhanced the `TutorialOverlay` with focused tasks and thematic descriptions.


5.  **Water Network System Upgrade**:
    *   **Physical Connectivity**: Replaced the simple global water sum with a Breadth-First Search (BFS) algorithm.
    *   **Logic**: Water now flows from Sources (Wells, Reservoirs) -> Pipes -> Consumers (Factories/Quarters).
    *   **State Updates**: Tiles now physically track `waterStatus: 'CONNECTED' | 'DISCONNECTED'` based on graph traversal.
    *   **Visual Logic**: The `InfrastructureFactory` (via `VoxelGenerators`) and `BuildingRenderSystem` now correctly render red warning lights/materials for disconnected pipes and consumers.

6.  **Power Grid System Upgrade**:
    *   **Physical Connectivity**: Implemented `POWER_LINE` building type and updated `PowerGridSystem` to use BFS propagation similar to water.
    *   **Visuals**: Added `InfrastructureFactory` logic to render power poles with wire connections. Wires auto-connect to neighbors. Status lights indicate grid connection.

#### Design Philosophy:
*   **Paper Cave Aesthetic**: Maintained the "Paper Cave" look by ensuring 2.0 depth scaling for underground layers while surface blocks remain at 1.0 logic height (0.5 half-height for mesh).
*   **Fail-Safe Meshing**: The worker is now "fail-soft" - it will log specific tile errors rather than crashing the thread.
*   **World Generation Isolation**: Architectural policy: World generation logic (Noise, Biomes, Initial Grid) is immutable and isolated from gameplay systems. It must not be influenced by simulation or rendering changes to preserve world consistency.

---
*End of current memories.*
