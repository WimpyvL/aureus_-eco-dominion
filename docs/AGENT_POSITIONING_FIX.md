# Agent Positioning & Underground Visibility Fixes

## Issues Fixed

### 1. **Floating Agents** ✅
**Problem**: Agents appeared to float above the ground surface.

**Root Cause**: Line 258 in `AgentRenderSystem.ts` added `+ 0.05` to the Y position:
```typescript
meshGroup.position.y = h + layerOffset + 0.05; // ❌ Causes floating
```

**Solution**: Removed the `+0.05` offset and improved the Y calculation logic:
```typescript
// Surface (layer 0): place directly on terrain
// Underground (layer < 0): place at terrain + layer offset
const targetY = agentLayer < 0 ? (terrainHeight + agentLayer * 1.0) : terrainHeight;
meshGroup.position.y = THREE.MathUtils.lerp(meshGroup.position.y, targetY, 0.3);
```

**Result**: Agents now stand properly on the ground without floating.

---

### 2. **Underground Agent Visibility** ✅
**Problem**: Agents weren't visible when working in underground levels.

**Root Cause**: 
- Visibility logic was too restrictive
- Underground agents were hidden when in underground view mode
- Layer positioning calculation was incorrect

**Solution**: Added proper visibility logic based on view mode and agent layer:
```typescript
// Visibility logic based on view mode and layer
if (viewMode === 'UNDERGROUND') {
    // In underground mode, show agents that are underground
    const currentLayer = agentData?.layer || 0;
    meshGroup.visible = currentLayer < 0;
} else {
    // In surface mode, only show surface agents
    meshGroup.visible = agentLayer === 0;
}
```

**Result**: 
- Surface agents visible in surface mode
- Underground agents visible in underground mode
- Proper layer-based rendering

---

## Technical Details

### Agent Layer System

**Layer Values**:
- `0` = Surface level
- `-1` to `-10` = Underground levels (deeper = more negative)

**Y Position Calculation**:
```typescript
const terrainHeight = this.getHeightAt(meshGroup.position.x, meshGroup.position.z);
const targetY = agentLayer < 0 
    ? (terrainHeight + agentLayer * 1.0)  // Underground: terrain + negative offset
    : terrainHeight;                       // Surface: terrain height only
```

**Example**:
- Terrain height = 5.0
- Agent at layer -2
- Agent Y position = 5.0 + (-2 * 1.0) = 3.0 ✅

### Agent Navigation

Agents can navigate between layers using the 3D pathfinding system:

**From `AgentSystem.ts` (line 306)**:
```typescript
const path = findPath3D(startIdx, startLayer, targetIdx, targetLayer, grid);
```

**Path includes layer information** (`PathStep`):
```typescript
interface PathStep {
    index: number;  // Tile index
    layer: number;  // Vertical layer
}
```

**Layer updates during movement** (line 182):
```typescript
agent.layer = tL; // Update vertical layer when reaching waypoint
```

---

## How Underground Work Functions

### 1. **Job Assignment**
Jobs include layer information:
```typescript
interface Job {
    targetTileId: number;
    layer?: number; // 0 for surface, -1 to -10 for underground
}
```

### 2. **Agent Picks Up Underground Job** (AgentSystem.ts line 105-112)
```typescript
const digJob = state.jobs.find(j =>
    j.type === 'DIG' &&
    (!j.assignedAgentId || j.assignedAgentId === agent.id)
);
if (digJob) {
    this.goTo(agent, digJob.targetTileId, digJob.layer || 0, digJob.id, state.grid);
}
```

### 3. **Agent Navigates to Underground**
- Pathfinding calculates 3D path including vertical movement
- Agent follows path, updating `agent.layer` at each waypoint
- Renderer positions agent at correct Y coordinate

### 4. **Agent Performs Work**
- Agent reaches target tile and layer
- Transitions to `WORKING` state
- Performs dig/build action at underground layer

---

## Visibility Matrix

| View Mode | Agent Layer | Visible? |
|-----------|-------------|----------|
| SURFACE | 0 (surface) | ✅ Yes |
| SURFACE | -1 to -10 | ❌ No |
| UNDERGROUND | 0 (surface) | ❌ No |
| UNDERGROUND | -1 to -10 | ✅ Yes |

---

## Files Modified

1. **`game/render/systems/AgentRenderSystem.ts`**
   - Fixed Y position calculation (removed +0.05 offset)
   - Improved underground positioning logic
   - Added proper visibility filtering

---

## Testing Checklist

- [x] Surface agents stand on ground (not floating)
- [x] Surface agents visible in surface mode
- [x] Surface agents hidden in underground mode
- [x] Underground agents visible in underground mode
- [x] Underground agents hidden in surface mode
- [x] Agents can navigate to underground jobs
- [x] Agents update layer during movement
- [x] Agents positioned at correct depth underground

---

## Known Behaviors

### Expected Behavior
✅ Agents working underground will be visible when you switch to underground view  
✅ Agents on surface will disappear when viewing underground  
✅ Agents will navigate through mine entrances to reach underground areas  
✅ Multiple agents can work at different underground layers  

### How to See Underground Agents
1. Build a **Mine Entrance** (unlocks underground access)
2. Switch to **Underground View** (toggle button)
3. Queue dig jobs at underground layers
4. Agents will navigate down and become visible in underground view

---

## Performance Impact

**Minimal**: 
- Simple conditional checks per agent per frame
- No additional allocations
- Improved clarity in positioning logic

---

**Status**: ✅ Complete  
**Impact**: High (fixes major visual bugs)  
**Risk**: Low (isolated to rendering logic)

( |╲ )
