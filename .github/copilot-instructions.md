## Build, test, lint
- Install deps: `npm install`
- Dev server: `npm run dev` (runs `scripts/intro.js` splash, then starts Vite) or `npm run vite` to skip the intro.
- Production: `npm run build` then `npm run preview`.
- Tests/lint: No test or lint scripts are defined; no single-test entrypoints exist.

## High-level architecture
- **Engine-first design**: React is a pure view layer consuming immutable snapshots from `StateManager`; simulation ticks own all writes. The frame spine runs `input → streaming → jobsFlush → simulation → renderSync → draw` (plus `frameEnd` cleanup/telemetry).
- **Boot flow**: `useAureusEngine` builds `ThreeRenderAdapter` + `AureusWorld`, then runs `Runtime(WorldHost)`; the game currently sets `fixedTickRate: 30` in runtime config for simulation stepping.
- **Command pipeline**: UI/agents call `stateManager.pushCommand(type, payload)`. `CommandDispatcher` (early sim system) validates commands via `handleCommand`, returning `CommandResult`; outcomes surface in `state.ui.lastCommandResult` and `state.debug.commandTrace`.
- **World topology**: Infinite chunked grid (16×16 tiles) with negative coords; chunk keys use `"cx,cz"`. Coordinate math goes through `engine/utils/coords.ts` helpers (`worldToChunk`, `worldToLocal`, `floorDiv`). `ChunkStore` guards tile access and generation; mark `simDirty`/`meshDirty` when mutating tiles.
- **Threading**: Main thread owns state, sim loop, and Three.js scene; web workers handle mesh generation and pathfinding and respond via `postMessage` payloads that include `schemaVersion`.
- **Modules**: `engine/kernel` (loop, scheduler, state), `engine/world` (world lifecycle), `engine/space` (spatial structures/streaming), `engine/jobs` (worker pool/queue), `engine/render` (Three.js adapters/camera/building/voxel/effects), `engine/sim` (Agent/Job/Resource/Building/Contract/Weather systems), `engine/tools` (debug UI/metrics), `game/` (AureusWorld orchestration, React hook `useAureusEngine`, game-specific renderers), `components/` (UI), `services/` (audio/analytics).

## Key conventions
- Mutations only during the fixed-step simulation tick; use the command queue and simulation systems for changes. React and render loops must stay read-only.
- Keep sim loop order intact and avoid touching hot paths, boot sequence, or package scripts without explicit approval (see `SANI_CODER_DO_NOT_TOUCH.md`).
- Preserve signature markers `( |╲ )` / `(│╲)` and the `(|/)` branding noted in `SIGNATURE_LOCATIONS.md`.
- Use `ChunkStore` and coord helpers to handle world lookups (especially with negative coordinates) instead of manual indexing; `GRID_SIZE` is retired—use `CHUNK_SIZE`.
- Worker payloads/message shapes and persisted schemas are contract-bound; add new types versioned by `schemaVersion` rather than mutating existing ones.
- For new systems, follow the modular pattern: create a system class with `tick`/`handleCommand`, register it via `AureusWorld.sim.addSystem(...)`, and wire command-capable systems into `commandDispatcher.setSystems([...])` in intended priority order.
