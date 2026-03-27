Original prompt: Please fix the demo . It should build out all the buildings and their upgraded versions as well.

- Investigated `TutorialDemoSystem`; demo path was not handling `START_DEMO` at the simulation-command layer.
- Reworked demo flow to explicitly enter `GameStep.DEMO`, enable deterministic placement, and place every building tier as final-state showcase tiles.
- Moved showcase origin near the randomized spawn instead of hardcoding distant world coordinates.
- Next: build the app and sanity-check demo mode in-browser.
- 
pm run build passed after the demo rewrite.
- Playwright transport died on first attempt; retrying after browser install/reset.
- Ran the bundled web-game Playwright client against the local Vite server to exercise demo mode.
- Restarting the local Vite server with log redirection after the first background launch died.
- The bundled client hung in this environment, so verification is falling back to a direct Playwright script.
- Tightened the showcase layout into a multi-column grid and added dry-ground origin selection near spawn.
- Added a dev-only window.__aureusGetState() hook to inspect live engine state during browser verification.
- Collapsed the demo scheduler so each row places in one burst and the showcase completes much faster.
- Switched the showcase population to an immediate burst so demo completion is not gated by slow simulation throughput.
- Restarting the dev server cleanly because the live checks were still showing stale demo behavior.
- Fixed command ordering: demo now stays cheat-enabled long enough for the placement burst to clear the construction inventory gate.
- Wired demo mode into the existing loading overlay state so the player only regains control after prebuild completes.
- Replaced demo showcase command spam with a direct batched world write plus per-chunk refresh, which should remove the long loading delay.
