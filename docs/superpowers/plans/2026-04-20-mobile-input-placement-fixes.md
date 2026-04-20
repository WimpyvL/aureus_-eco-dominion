# Mobile Input And Placement Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make mobile camera zoom/rotation feel reliable and restore mobile building placement through the deploy flow.

**Architecture:** Isolate mobile gesture math into a small pure module so zoom/rotation thresholds can be tested without the renderer, then route mobile placement confirmation through a single world-owned method so React no longer duplicates placement cleanup rules. Keep the existing desktop behavior intact.

**Tech Stack:** TypeScript, React 19, Three.js, Node built-in test runner

---

### Task 1: Lock Down Gesture Math

**Files:**
- Create: `game/render/mobileGestureMath.ts`
- Create: `tests/mobile-gestures.test.ts`
- Modify: `game/render/IsoCameraSystem.ts`

- [ ] Write failing tests for stable pinch zoom, normalized rotation delta, and gated midpoint pan.
- [ ] Run `node --test tests/mobile-gestures.test.ts` and confirm failures.
- [ ] Implement pure gesture helpers in `game/render/mobileGestureMath.ts`.
- [ ] Wire `IsoCameraSystem` to use those helpers from pointer-based multi-touch handling.
- [ ] Re-run `node --test tests/mobile-gestures.test.ts` and confirm pass.

### Task 2: Restore Mobile Confirm Placement

**Files:**
- Create: `tests/mobile-placement.test.ts`
- Modify: `game/AureusWorld.ts`
- Modify: `App.tsx`

- [ ] Write failing tests for world-owned confirm placement success/failure handling and pinned ghost cleanup.
- [ ] Run `node --test tests/mobile-placement.test.ts` and confirm failures.
- [ ] Add a world method that confirms the pinned placement through the normal placement path and returns success/failure.
- [ ] Update `App.tsx` to use that method so React only clears pending placement after a real placement result.
- [ ] Re-run `node --test tests/mobile-placement.test.ts` and confirm pass.

### Task 3: Final Verification

**Files:**
- Modify: `sani-memory.md`

- [ ] Update `sani-memory.md` with the exact changed areas and reasons.
- [ ] Run `node --test tests/mobile-gestures.test.ts tests/mobile-placement.test.ts`.
- [ ] Run `npm run build`.
- [ ] Review output and report only what the fresh commands prove.
