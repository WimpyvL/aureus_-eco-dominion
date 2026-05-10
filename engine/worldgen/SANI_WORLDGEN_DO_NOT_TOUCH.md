
# ⚠️ UNTOUCHABLE ZONE: WORLD GENERATION

Architectural decision by Sani & User.

The logic in this folder (`engine/worldgen/`) is considered **IMMUTABLE** and **ISOLATED**.

### Rules:
1. **No Gameplay dependencies**: Logic here must be pure math, noise, and basic types. It should not depend on simulations, rendering systems, or UI.
2. **Consistency is King**: Changes here affect the root "truth" of the world maps. Do not alter noise seeds, frequencies, or biome distribution logic unless explicitly requested to "Reset the World".
3. **Parity**: The logic here must be usable by both the main thread (React/Engine) and the background Workers (Meshing/Pathfinding).

### Contents:
- `Core.ts`: Noise, Biomes, and Procedural Foliage rules.
- `GridGenerator.ts`: Creation of the initial world state (GridTile array).
