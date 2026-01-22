# AureusWorld Refactoring Plan

## Current State
- **1063 lines** in a single file
- **52 methods** handling multiple responsibilities
- Mixed concerns: building, agents, economy, underground, contracts, etc.

## Refactoring Strategy

### New Structure
```
game/
├── AureusWorld.ts (orchestrator, ~200 lines)
├── world/
│   ├── BuildingManager.ts      # Building placement, bulldoze, ghost
│   ├── AgentManager.ts          # Agent selection, commands
│   ├── EconomyManager.ts        # Resources, selling, buying
│   ├── UndergroundManager.ts    # View mode, layers, digging
│   ├── ContractManager.ts       # Contracts, delivery
│   ├── ResearchManager.ts       # Tech tree
│   └── GameStateManager.ts      # Save/load, tutorial
```

## Responsibilities

### 1. **BuildingManager** (~150 lines)
- `placeBuilding()`
- `bulldozeTile()`
- `selectBuilding()`
- `pinBuildingForConfirmation()`
- `clearPinnedBuilding()`
- `speedUpConstruction()`

### 2. **AgentManager** (~100 lines)
- `selectAgent()`
- `commandAgent()`
- `zoomToAgent()`

### 3. **EconomyManager** (~100 lines)
- `sellMinerals()`
- `buyBuilding()`
- `setAutoSell()`

### 4. **UndergroundManager** (~200 lines)
- `toggleViewMode()`
- `changeUndergroundLayer()`
- `queueDig()`
- `isLayerAccessible()`

### 5. **ContractManager** (~80 lines)
- `acceptContract()`
- `deliverContract()`

### 6. **ResearchManager** (~80 lines)
- `researchTech()`

### 7. **GameStateManager** (~100 lines)
- `saveGame()`
- `loadGame()`
- `advanceTutorial()`
- `toggleDebug()`

### 8. **AureusWorld** (orchestrator, ~200 lines)
- Constructor & initialization
- Engine lifecycle methods
- Delegates to managers
- Interaction handlers
- Render loop

## Benefits

1. **Single Responsibility**: Each manager handles one domain
2. **Testability**: Easy to unit test individual managers
3. **Maintainability**: Find code faster, easier to modify
4. **Reusability**: Managers can be used independently
5. **Readability**: Smaller files, clearer intent
6. **Collaboration**: Multiple devs can work on different managers

## Implementation Order

1. ✅ Create manager interfaces
2. ✅ Extract BuildingManager
3. ✅ Extract AgentManager
4. ✅ Extract EconomyManager
5. ✅ Extract UndergroundManager
6. ✅ Extract ContractManager
7. ✅ Extract ResearchManager
8. ✅ Extract GameStateManager
9. ✅ Refactor AureusWorld to use managers
10. ✅ Test and verify

## Migration Strategy

- **Non-breaking**: Managers wrap existing logic
- **Incremental**: One manager at a time
- **Safe**: Keep original methods as delegates initially
- **Clean**: Remove duplicates after verification

---

**Goal**: Transform 1063-line monolith into 8 focused modules averaging ~120 lines each.
