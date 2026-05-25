Sani workspace notes

- Purpose: local workspace anchor file required by AGENTS.md.
- Rule: keep `sani-memory.md` updated with concise change history during the session.
- Keep render changes performance-aware; prefer hybrid rounded primitives over globally increasing voxel density.
- Preserve current simulation and placement contracts while improving presentation.
- 2026-05-25: Investigated the weather pipeline and confirmed a split-brain state model: `EnvironmentSystem` rolls `CLEAR/CLOUDY/RAINY/STORM`, `WeatherOverlay` renders `ACID_RAIN/DUST_STORM`, `EnvironmentRenderSystem` expects `CLEAR/RAINY/STORM/TOXIC/HEAT`, and power/water/production still consume stale names directly. Next step is one shared Zimbabwe-credible weather contract wired through sim, render, UI, and gameplay. (|/) Klaasvaakie
- 2026-05-25: Unified the live weather pipeline around one Zimbabwe-credible contract in `engine/weather/weatherModel.ts`: `CLEAR`, `OVERCAST`, `RAIN`, `STORM`, `HEATWAVE`, and `DUST_STORM`. `EnvironmentSystem` now owns climate transitions plus event overrides, old saves are coerced off legacy names, weather events now drive `weatherOverride`, `EnvironmentRenderSystem` consumes full `WeatherState` for fog/lightning/rain/heat/dust lighting, `WeatherOverlay` matches the same states, and power/water/production/agent energy all read shared gameplay modifiers instead of hard-coded stale strings. Verified with `npm run typecheck`, `node --test tests/weather-model.test.ts`, and `npm run build`. (|/) Klaasvaakie
- 2026-05-25: Browser smoke pass on `http://127.0.0.1:4173/` booted the app successfully after the weather refactor; the only console error was the existing Vercel analytics `/_vercel/insights/script.js` 404, not a weather/runtime crash. (|/) Klaasvaakie
