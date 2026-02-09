# Level 2: Unbounded World Architectural Notes

The game engine has been transitioned from a fixed-size `100x100` grid to an unbounded, chunked coordinate system. This document outlines the core changes and how to maintain the new architecture.

## 1. Spatial Coordinates (x, z)

- The world now uses an infinite 2D plane with integers `(x, z)`.
- **Negative coordinates** are fully supported.
- All tile lookups MUST use world coordinates, not indices.

## 2. Chunk-Based Storage

- The world is divided into **Chunks** of size `16x16`.
- `GameState.chunks` is a `Record<string, Chunk>` where the key is the string `"cx,cz"`.
- Use `toChunkKey(cx, cz)` from `engine/utils/coords.ts` to generate these keys.

## 3. Core Utilities (`engine/utils/coords.ts`)

Always use these helpers for coordinate math to ensure negative stability:
- `worldToChunk(x, z, size)`: Returns the chunk coordinates `(cx, cz)`.
- `worldToLocal(x, z, size)`: Returns local tile coordinates `(lx, lz)` within a chunk.
- `floorDiv(n, d)`: Custom floor division that handles negative numbers correctly.

## 4. Tile Resolution (`ChunkStore`)

The `ChunkStore` class is the authoritative way to interact with world data:
- `ChunkStore.getTile(chunks, x, z)`: Safely retrieves a `GridTile` at world coordinates. Returns `null` if the chunk is not loaded.
- `ChunkStore.ensureChunk(chunks, cx, cz, seed)`: Guarantees a chunk exists, generating it procedurally if necessary.

## 5. Performance & Streaming

- **Culling**: Most systems now iterate over `state.chunks` rather than the whole world.
- **Rendering**: The `StreamingManager` handles loading/unloading chunks into the `Three.js` scene based on camera proximity.
- **Dirty Flags**: `chunk.simDirty` and `chunk.meshDirty` are used to optimize updates. Always mark chunks as dirty when modifying a tile.

## 6. Deprecated Constants

- `GRID_SIZE` is RETIRED and has been purged from the simulation layer. 
- Do not use index-based math (`z * GRID_SIZE + x`).
- Use `CHUNK_SIZE` instead for locality logic.
