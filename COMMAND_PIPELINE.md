# Aureus Command Pipeline Contract

## Overview
The Aureus Command Pipeline transforms non-deterministic, direct state mutation into a formal, observable, and rejectable command stream. This ensures that every action taken by the UI or an agent is validated against the simulation state before being applied.

## Architecture

### 1. Command Enqueueing
UI components and external actors (like AI agents) never mutate the `GameState` directly. Instead, they issue a `GameCommand` via the `StateManager`.

```typescript
// Example: UI calls pushCommand
stateManager.pushCommand('PLACE_BUILDING', { x, z, buildingType });
```

### 2. Command Dispatcher
The `CommandDispatcher` is a high-priority `SimSystem` that runs at the beginning of every simulation tick.

- **Collects**: Clears the `commandQueue` for the current tick.
- **Validates**: Passes each command to registered systems via the `handleCommand` method.
- **Executes**: If a system returns a `CommandResult` indicating success, the command is considered processed.
- **Reports**: Captures `CommandResult` (Success or Failure with Reason) and updates `state.ui.lastCommandResult` and `state.debug.commandTrace`.

### 3. System Contract
Systems that handle commands must implement the `handleCommand` method:

```typescript
handleCommand(cmd: GameCommand, ctx: CommandContext, state: GameState): CommandResult | null;
```

- **Returns `null`**: If the system does not recognize the command.
- **Returns `CommandResult`**: If the system handles the command.
    - `{ ok: true }`: Command accepted and state mutated.
    - `{ ok: false, code: CommandErrorCode, reason: string }`: Command rejected. No state mutation should have occurred (or it should be rolled back).

## Observability

### Debug Trace
The `state.debug.commandTrace` is a ring buffer containing the last 100 command executions. Developers can inspect this to see:
- Tick of execution.
- Command ID and Type.
- Payload summary.
- Which system handled it.
- Precise result (Success/Failure reason).

### UI Feedback
The `state.ui.lastCommandResult` contains the result of the last critical command (e.g., building placement). This is used by the UI to show error messages or play failure sounds.

## Future Extensions
- **Infinite World Scaling**: Commands can be serialized and sent to remote chunk workers.
- **Replay System**: Persistence of the command stream allows for perfect simulation replay.
- **Multiplayer**: Server-side validation of client commands using the same contract.
