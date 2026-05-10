# Command Pipeline Architecture

## The Command Dispatcher Pattern

Aureus uses a centralized `CommandDispatcher` to handle all user-initiated actions. This ensures a consistent flow for state updates, validation, and error handling.

### 1. Flow Overview

1. **User Action (UI/Input)** -> `stateManager.pushCommand(type, payload)`
2. **Game Loop (`AureusWorld`)** -> `commandDispatcher.dispatch(command, state)`
3. **Dispatcher Routing** -> Delegates to specific System (e.g., `ConstructionSystem`, `ExcavationSystem`)
4. **System Execution** -> Validates and performs logic, returns `CommandResult`
5. **Result Handling** -> `Dispatcher` logs success/failure and updates `state.lastCommandResult`

### 2. Key Interfaces

#### `Command`
```typescript
interface Command {
    id: string;
    type: CommandType; // e.g., 'BUILD', 'QUEUE_DIG', 'PURCHASE'
    payload: any;
    timestamp: number;
}
```

#### `CommandResult`
```typescript
interface CommandResult {
    success: boolean;
    message?: string;
    error?: string;
    data?: any; // Optional return data (e.g., cost incurred, items added)
}
```

### 3. System Implementation

Systems must implement the `handleCommand` method to participate in this pipeline.

```typescript
// Example: ConstructionSystem.ts
public handleCommand(command: Command, state: GameState): CommandResult {
    switch (command.type) {
        case 'BUILD':
            return this.tryPlaceBuilding(command.payload, state);
        case 'DEMOLISH':
            return this.tryBulldoze(command.payload, state);
        default:
            return { success: false, error: 'Unknown command' };
    }
}
```

### 4. Deterministic State Updates

All modifications to the `GameState` MUST occur within the `handleCommand` execution or the `sim.tick` loop to ensure determinism.

- **Systems** operate on `MutableGameState`.
- **Command Handling** generally executes *before* the simulation tick in a frame.

### 5. Error Handling & Feedback

- **Validation Errors**: Return `{ success: false, error: "..." }`. The Dispatcher logs this as a warning.
- **Critical Failures**: Throwing an error within `handleCommand` is caught by the Dispatcher, logged as a critical error, and does not crash the game loop.
- **UI Feedback**: The frontend subscribes to `state.lastCommandResult` to show toil messages or error toasts.
