2026-04-20: Created `sani.md` and `sani-memory.md` to satisfy workspace session requirements before starting code investigation.
2026-04-20: Added `game/render/mobileGestureMath.ts` and `game/mobilePlacement.ts`, updated `game/render/IsoCameraSystem.ts` and `engine/input/InputSystem.ts` to stabilize mobile zoom/rotation and stop multi-touch taps from triggering bogus placement clicks.
2026-04-20: Updated `game/AureusWorld.ts` and `App.tsx` so mobile build confirmation uses one world-owned placement path and only clears the pinned ghost after a successful placement.
2026-04-20: Added `tests/mobile-gestures.test.ts` and `tests/mobile-placement.test.ts`; verified with `node --test tests/mobile-gestures.test.ts tests/mobile-placement.test.ts` and `npm run build`.
