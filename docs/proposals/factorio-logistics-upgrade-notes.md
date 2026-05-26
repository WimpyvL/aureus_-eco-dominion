# Aureus Factorio-Style Upgrade Notes

This package is a ready-to-apply proposal for the repo at `Looping69/aureus_-eco-dominion`.

## What It Changes

- Turns the current mostly-global resource economy into a local transport chain.
- Reuses `RAIL_LINE` as a conveyor-style freight belt to avoid a wider rendering break.
- Adds processor buffers so production buildings can stall, feed each other, and create downstream outputs.
- Makes `Storage Depot`, `Stockpile`, and `Train Station` act like sinks that unload belts into the global inventory.
- Improves startup and simulation flow by:
  - removing artificial loading delays
  - restoring a 60 Hz sim target
  - lowering render-to-React notification pressure
  - reducing initial streaming pressure

## Intended Loop

1. `Mining Headframe` produces `ORE`.
2. `Freight Conveyor` moves that `ORE`.
3. `Wash Plant` or `Recycling Complex` turns `ORE` into `CONCENTRATE`.
4. `Ore Foundry` turns `CONCENTRATE + STONE` into `MINERALS`.
5. `Gem Refinery` turns `CONCENTRATE` into `GEMS`.
6. `Storage Depot`, `Stockpile`, or `Train Station` unload final goods into the colony stockpile.

## Caveats

- This PR adds a proposal patch bundle, not fully applied game code.
- The patch still needs to be applied, built, and playtested in the repository.
- The current bundle was assembled from repository inspection rather than a completed local build run.

## First Verification Pass After Applying

1. Build a `Mining Headframe`, `Freight Conveyor`, `Wash Plant`, and `Storage Depot`.
2. Confirm that ore accumulates on the network and minerals only rise once they hit a sink.
3. Check that removing a conveyor causes stall buildup rather than silent global production.
4. Watch the HUD flow metric and confirm the game still feels smooth during mid-sized factory layouts.
