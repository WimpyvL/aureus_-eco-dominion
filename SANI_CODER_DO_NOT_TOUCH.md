# Sani Coder — Do Not Touch List

This file defines **hard boundaries** for what Sani Coder must **not** edit, refactor, rename, or “improve” without an explicit instruction from William/Klaasvaakie.

If a change request touches any item below, Sani Coder must:
1) **Stop** and flag the risk.
2) Propose a **safe alternative** (wrapper, adapter, feature-flag, new module).
3) Only proceed if the user explicitly authorizes the exception.

---

## 1) Identity, rituals, and signature rules
Do not touch:
- Any **activation trace** behavior or formatting.
- Any **protocol trigger phrases**, exact wording, or gating rules.
- Any **Vault / ThreadBorn / Bridge Thread / Labyrinth** terminology usage.
- The **canonical signature stamp requirement** for files: `( |╲ )` / `(│╲)`.

Allowed:
- Add new docs *around* these rules.
- Add helper tooling that *preserves* these outputs exactly.

---

## 2) Build + execution entry points
Do not touch:
- `package.json` scripts (build/dev/test) unless explicitly asked.
- Vite/Next/Webpack config, toolchain versions, lockfiles.
- Any runtime boot sequence order (engine init, worker init, audio init).

Allowed:
- Add a new script instead of modifying an existing one.
- Add comments clarifying behavior.

---

## 3) Serialization, save data, and persistence contracts
Do not touch:
- Save-file schemas, serialization keys, version markers.
- Any field names used in persisted state.
- Any migration logic (if present).

Allowed:
- Add **new** optional fields with backward compatibility.
- Add schema validation that accepts legacy versions.

---

## 4) Worker protocol and message contracts
Do not touch:
- Worker message shapes (request/response payloads), `type` fields, or `jobId` semantics.
- Transferable buffers rules (ArrayBuffer ownership/transfer assumptions).
- Any implicit ordering assumptions between main thread and worker.

Allowed:
- Add new message types while keeping existing ones intact.
- Create adapters that translate old↔new shapes.

---

## 5) Coordinate system conventions
Do not touch:
- Existing coordinate semantics (`x/y` vs `x/z`) across engine, worker, and rendering.
- Any indexing formulas that depend on current conventions.

Allowed:
- Add **utility functions** (`toWorldXZ`, `tileIndex`, `clampChunkBounds`) and migrate *new* code to use them.
- Add comments that clarify the convention.

---

## 6) Engine tick, simulation ordering, determinism assumptions
Do not touch:
- The order of the main simulation loop phases (tick/update/dispatch/render).
- Any “one-tick-per-frame” assumption.
- Any determinism-related decisions (seed usage, RNG call order) unless explicitly asked.

Allowed:
- Add profiling and instrumentation that is gated by a debug flag.
- Add optional deterministic mode behind a flag.

---

## 7) Public API surfaces and module boundaries
Do not touch:
- Exports used by other modules without tracking all call sites.
- Public interfaces/types used across folders (engine↔game↔ui).
- File paths referenced by tooling, workers, or dynamic imports.

Allowed:
- Add new exports; do not break existing ones.
- Deprecate with backwards-compatible wrappers.

---

## 8) Asset pipelines and rendering assumptions
Do not touch:
- Shader code, material pipelines, renderer initialization order.
- GPU buffer layouts and attribute ordering.
- Any “no external assets” constraint for voxels (if set by project).

Allowed:
- Add new render features as optional toggles.
- Add debug overlays that can be disabled.

---

## 9) Audio/SFX behavior
Do not touch:
- Audio routing, sound IDs/enums, SFX triggering semantics.
- Volume defaults and mute behavior.

Allowed:
- Add new sounds by adding new IDs without reusing old IDs.
- Add safe guards for missing assets (fallbacks) without changing behavior.

---

## 10) Performance-sensitive hot paths
Do not touch:
- Anything explicitly labeled “hot path”, “perf critical”, “tight loop”.
- Inner loops in meshing/geometry generation unless asked.
- Buffer packing formats in workers.

Allowed:
- Suggest optimizations in a separate plan.
- Add benchmarks/profilers without changing behavior.

---

## 11) Security and sensitive environment config
Do not touch:
- Secrets, keys, tokens, `.env` patterns.
- Deployment wiring, CI/CD credentials.

Allowed:
- Add `.env.example` templates.
- Add validation that fails safely when env vars are missing.

---

## 12) Naming, refactors, and “cleanup” changes
Do not touch:
- Large renames, folder moves, or sweeping refactors.
- “Prettifying” code that changes logic or ordering.

Allowed:
- Small local improvements inside a single file when explicitly requested.
- Comment-only clarifications.

---

## Default safe behavior
When uncertain, Sani Coder must:
- Prefer **additive** changes over modifications.
- Use **feature flags** and **wrappers**.
- Keep **diffs small** and **traceable**.
- Never silently change behavior to “fix” something without a user directive.

---

( |╲ )
