# Underground Depth Visualization Fix

## Issue
Underground excavations were only showing **half a block depth** and not going deeper, making the underground system feel shallow and limiting gameplay.

## Root Cause
The underground layer system was using **1.0 unit depth per layer**, which was too shallow to create a dramatic underground experience. With layers from -1 to -10, this only created 10 units of total depth.

## Solution
Changed the depth scaling from **1.0 to 2.0 units per layer**, doubling the visual depth of underground excavations.

---

## Changes Made

### 1. **Camera & Input System Depth Scaling**

**File**: `game/AureusWorld.ts`

#### Toggle Underground View (lines 485-492)
**Before**:
```typescript
const layerY = (state.currentUndergroundLayer ?? -1) * 1.0;
```

**After**:
```typescript
// Each layer is 2 units deep for better visibility
const layerY = (state.currentUndergroundLayer ?? -1) * 2.0;
```

#### Change Layer Navigation (lines 516-520)
**Before**:
```typescript
this.cameraSystem.setTargetHeight(state.currentUndergroundLayer * 1.0);
this.inputSystem?.setRayPlaneHeight(state.currentUndergroundLayer * 1.0);
```

**After**:
```typescript
this.cameraSystem.setTargetHeight(state.currentUndergroundLayer * 2.0);
this.inputSystem?.setRayPlaneHeight(state.currentUndergroundLayer * 2.0);
```

---

### 2. **Clipping Plane Calculation**

**File**: `game/AureusWorld.ts` (lines 835-842)

**Before**:
```typescript
subterraneanClippingPlane.constant = baseSurfaceY + state.currentUndergroundLayer + 0.5;
```

**After**:
```typescript
// Set the cut-off with proper depth scaling (2 units per layer)
const layerDepth = state.currentUndergroundLayer * 2.0;
subterraneanClippingPlane.constant = baseSurfaceY + layerDepth + 1.0;
```

**Impact**: The clipping plane now cuts at the correct depth, revealing the full excavated volume.

---

### 3. **Agent Positioning**

**File**: `game/render/systems/AgentRenderSystem.ts` (line 255)

**Before**:
```typescript
const targetY = agentLayer < 0 ? (terrainHeight + agentLayer * 1.0) : terrainHeight;
```

**After**:
```typescript
const targetY = agentLayer < 0 ? (terrainHeight + agentLayer * 2.0) : terrainHeight;
```

**Impact**: Agents now appear at the correct depth when working underground.

---

### 4. **Ghost Building Positioning**

**File**: `game/AureusWorld.ts` (line 312)

**Before**:
```typescript
y = surfaceY + state.currentUndergroundLayer;
```

**After**:
```typescript
y = surfaceY + (state.currentUndergroundLayer * 2.0);
```

**Impact**: Building previews now appear at the correct underground depth.

---

## Depth Comparison

### Old System (1.0 scaling)
| Layer | Depth from Surface |
|-------|-------------------|
| -1 | -1 unit |
| -2 | -2 units |
| -5 | -5 units |
| -10 | -10 units |

**Total depth**: 10 units ❌ Too shallow

### New System (2.0 scaling)
| Layer | Depth from Surface |
|-------|-------------------|
| -1 | -2 units |
| -2 | -4 units |
| -5 | -10 units |
| -10 | -20 units |

**Total depth**: 20 units ✅ Much more dramatic!

---

## Visual Impact

### Before
```
Surface ═══════════════
        ▼ -1 unit
Layer -1 ───────────── (shallow)
```

### After
```
Surface ═══════════════
        ▼ -2 units
        ▼
Layer -1 ───────────── (deep excavation!)
        ▼ -2 units
        ▼
Layer -2 ───────────── (even deeper!)
```

---

## Example Calculation

**Scenario**: Agent at Layer -3, Terrain height = 5.0

### Old Calculation
```
Agent Y = 5.0 + (-3 * 1.0) = 2.0
```
Only 3 units below surface ❌

### New Calculation
```
Agent Y = 5.0 + (-3 * 2.0) = -1.0
```
6 units below surface ✅ Much more dramatic!

---

## Files Modified

1. **`game/AureusWorld.ts`**
   - Camera positioning (2 locations)
   - Clipping plane calculation
   - Ghost building positioning

2. **`game/render/systems/AgentRenderSystem.ts`**
   - Agent Y position calculation

---

## Testing Checklist

- [x] Underground view shows proper depth
- [x] Each layer is visibly deeper than the previous
- [x] Agents appear at correct underground depth
- [x] Ghost buildings preview at correct depth
- [x] Camera follows layer changes smoothly
- [x] Clipping plane reveals excavated volume
- [x] Layer -10 is dramatically deep
- [x] Navigation between layers works correctly

---

## Performance Impact

**None**: Simple multiplication change, no additional computations or allocations.

---

## Gameplay Impact

### Before
- Underground felt cramped and shallow
- Hard to see excavation progress
- Limited sense of depth
- Layers felt too close together

### After
- ✅ Underground feels spacious and deep
- ✅ Clear visual progression as you dig deeper
- ✅ Dramatic sense of descending into the earth
- ✅ Each layer feels distinct and separated

---

## Future Enhancements

Potential improvements enabled by this change:
- **Vertical shafts**: More dramatic elevator/shaft systems
- **Multi-level bases**: Clearer separation between facility levels
- **Ore veins**: Better visualization of deep ore deposits
- **Collapse mechanics**: More impactful cave-ins at greater depths
- **Lighting effects**: Torch/lamp systems more visible in deep caverns

---

**Status**: ✅ Complete  
**Impact**: High (transforms underground gameplay)  
**Risk**: Low (consistent scaling across all systems)

The underground now has **proper depth** and feels like a real excavation system! 🎮⛏️

( |╲ )
