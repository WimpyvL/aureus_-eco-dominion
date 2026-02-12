/**
 * useAureusEngine Hook (v2 - Engine Owned State)
 * 
 * React integration for the Aureus engine.
 * The engine now owns all game state. This hook:
 * - Creates and manages the engine lifecycle
 * - Subscribes React to state changes for re-rendering
 * - Provides action methods for UI interaction
 */

import { useRef, useEffect, useState, useCallback } from 'react';

import { WorldHost, Runtime } from '../engine';
import { ThreeRenderAdapter } from '../engine/render';
import { DebugHud } from '../engine/tools';
import { AureusWorld, AureusWorldConfig } from './AureusWorld';
import { GameState, SfxType } from '../types';

export interface LoadingProgress {
    stage: string;
    percent: number;
    error?: string;
}

export interface UseAureusEngineOptions {
    /** Container element for the renderer */
    container: HTMLElement | null;

    /** Callbacks for external game interactions (optional, for compatibility) */
    onTileClick?: (x: number, z: number, isTouch?: boolean) => void;
    onTileRightClick?: (x: number, z: number, isTouch?: boolean) => void;
    onAgentClick?: (id: string | null) => void;
    onTileHover?: (x: number | null, z: number | null) => void;
    onSfx?: (type: SfxType) => void;

    /** Whether the game is paused (e.g., on home page) */
    paused?: boolean;
}

export interface AureusEngineHandle {
    /** The Aureus game world */
    world: AureusWorld | null;

    /** Engine runtime */
    runtime: Runtime | null;

    /** Debug HUD */
    debugHud: DebugHud | null;

    /** Whether the engine is ready */
    ready: boolean;

    /** Current game state (engine-owned, React subscribes) */
    state: GameState | null;

    /** Loading progress */
    loading: LoadingProgress;

    /** Get state ref for synchronous access */
    getStateRef: () => GameState | null;

    /** Get debug stats */
    getDebugStats: () => any;

    /** Dispatch action */
    dispatch: (action: any) => void;
}

/**
 * Hook for integrating Aureus engine with React
 * Engine owns state, React subscribes for UI updates
 */
export function useAureusEngine(options: UseAureusEngineOptions): AureusEngineHandle {
    const {
        container,
        onTileClick,
        onTileRightClick,
        onAgentClick,
        onTileHover,
        onSfx,
        paused = false,
    } = options;

    // Engine instances
    const [world, setWorld] = useState<AureusWorld | null>(null);
    const [runtime, setRuntime] = useState<Runtime | null>(null);
    const [debugHud, setDebugHud] = useState<DebugHud | null>(null);
    const [ready, setReady] = useState(false);

    // Loading progress
    const [loading, setLoading] = useState<LoadingProgress>({ stage: 'Waiting for DOM...', percent: 0 });

    // State subscription - React re-renders when engine state changes
    const [state, setState] = useState<GameState | null>(null);
    const stateRef = useRef<GameState | null>(null);

    // Synchronous state access
    const getStateRef = useCallback(() => stateRef.current, []);

    // Update ref when state changes
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    // Callback refs - these capture the latest callbacks without triggering re-init
    const callbacksRef = useRef({ onTileClick, onTileRightClick, onAgentClick, onTileHover, onSfx });
    useEffect(() => {
        callbacksRef.current = { onTileClick, onTileRightClick, onAgentClick, onTileHover, onSfx };
    }, [onTileClick, onTileRightClick, onAgentClick, onTileHover, onSfx]);

    // Initialize engine
    useEffect(() => {
        if (!container) {
            setLoading({ stage: 'Waiting for container...', percent: 5 });
            return;
        }

        console.log('[useAureusEngine] Container ready, starting initialization...');
        let cancelled = false;

        const initializeEngine = async () => {
            // Helper to add delays between stages for smoother loading experience
            const stageDelay = (ms: number = 500) => new Promise(r => setTimeout(r, ms));

            try {
                // Stage 1: Create Render Adapter
                setLoading({ stage: 'Initializing renderer...', percent: 10 });
                console.log('[useAureusEngine] Creating render adapter...');

                const render = new ThreeRenderAdapter({
                    antialias: true,
                    shadowMap: true,
                    fogEnabled: true,
                });
                render.init(container);

                if (cancelled) return;
                await stageDelay();

                setLoading({ stage: 'Creating game world...', percent: 20 });
                console.log('[useAureusEngine] Creating AureusWorld...');

                // Stage 2: Create World
                const worldInstance = new AureusWorld(render);

                if (cancelled) return;
                await stageDelay();

                setLoading({ stage: 'Configuring input system...', percent: 30 });
                console.log('[useAureusEngine] Configuring world...');

                // Use refs for callbacks to avoid stale closures
                const config: AureusWorldConfig = {
                    container,
                    onTileClick: (x, z, isTouch) => callbacksRef.current.onTileClick?.(x, z, isTouch),
                    onTileRightClick: (x, z, isTouch) => callbacksRef.current.onTileRightClick?.(x, z, isTouch),
                    onAgentClick: (id) => callbacksRef.current.onAgentClick?.(id),
                    onTileHover: (x, z) => callbacksRef.current.onTileHover?.(x, z),
                    onSfx: (type) => callbacksRef.current.onSfx?.(type),
                };

                try {
                    worldInstance.configure(config);
                    console.log('[useAureusEngine] ✓ Configure complete');
                } catch (e) {
                    console.error('[useAureusEngine] Configure failed:', e);
                    throw e;
                }

                if (cancelled) return;
                await stageDelay();
                console.log('[useAureusEngine] Proceeding to state subscription...');

                // Subscribe React to state changes
                const unsubscribe = worldInstance.subscribeToState((newState) => {
                    setState(newState);
                });
                console.log('[useAureusEngine] ✓ State subscription set up');

                // DON'T set state yet - wait until engine is fully ready
                const initialState = worldInstance.getState();
                console.log('[useAureusEngine] Initial state prepared:', initialState ? 'OK' : 'NULL');

                if (cancelled) {
                    unsubscribe();
                    return;
                }

                setWorld(worldInstance);
                console.log('[useAureusEngine] ✓ World set');
                await stageDelay();

                setLoading({ stage: 'Creating runtime...', percent: 40 });
                console.log('[useAureusEngine] Creating WorldHost and Runtime...');

                // Stage 4: Create runtime
                const worldHost = new WorldHost();
                const runtimeInstance = new Runtime(worldHost, {
                    fixedTickRate: 30, // Reduced from 60 to prevent CPU overload
                    maxSimStepsPerFrame: 3, // Reduced from 5
                    profilerEnabled: true,
                });
                setRuntime(runtimeInstance);

                if (cancelled) {
                    unsubscribe();
                    return;
                }
                await stageDelay();

                setLoading({ stage: 'Initializing debug tools...', percent: 50 });
                console.log('[useAureusEngine] Creating DebugHud...');

                // Stage 5: Create debug HUD (Disabled to remove black square in top right)
                /*
                const debugHudInstance = new DebugHud({ position: 'top-right' });
                debugHudInstance.init(container, runtimeInstance, () => render.getStats());
                setDebugHud(debugHudInstance);
                */

                if (cancelled) {
                    unsubscribe();
                    return;
                }
                await stageDelay();

                setLoading({ stage: 'Loading world data...', percent: 60 });
                console.log('[useAureusEngine] Setting world on host...');

                // Stage 6: Load world (this calls world.init() internally)
                try {
                    console.log('[useAureusEngine] Calling worldHost.setWorld...');
                    await worldHost.setWorld(worldInstance);
                    console.log('[useAureusEngine] ✓ worldHost.setWorld completed');
                } catch (e) {
                    console.error('[useAureusEngine] worldHost.setWorld failed:', e);
                    throw e;
                }

                if (cancelled) {
                    unsubscribe();
                    return;
                }
                await stageDelay();

                setLoading({ stage: 'Starting simulation...', percent: 80 });
                // Stage 7: Start runtime
                runtimeInstance.start();

                if (cancelled) {
                    unsubscribe();
                    runtimeInstance.stop();
                    return;
                }

                await stageDelay();
                setLoading({ stage: 'Finalizing...', percent: 90 });

                await stageDelay();
                setLoading({ stage: 'Game Engine Running!', percent: 100 });

                // Give user a moment to see 100% before transitioning
                await new Promise(r => setTimeout(r, 1500));

                setReady(true);

                // NOW set state - this triggers the loading screen to hide
                setState(worldInstance.getState());

                /* 
                // AUTO-LOAD: If a save exists, load it automatically
                const savedGame = localStorage.getItem('aureus_save_v2');
                if (savedGame) {
                    console.log('[useAureusEngine] Found saved game, auto-loading...');
                    worldInstance.loadGame(savedGame);
                    setState(worldInstance.getState());
                }
                */

                // Store cleanup function
                (window as any).__aureusCleanup = () => {
                    unsubscribe();
                    runtimeInstance.stop();
                    // debugHudInstance.dispose();
                    worldInstance.teardown();
                    render.dispose();
                };

            } catch (error) {
                console.error('[useAureusEngine] ❌ FATAL ERROR:', error);
                setLoading({
                    stage: 'Error!',
                    percent: 0,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        };

        initializeEngine();

        // Cleanup
        return () => {
            console.log('[useAureusEngine] Cleaning up...');
            cancelled = true;
            setReady(false);

            if ((window as any).__aureusCleanup) {
                (window as any).__aureusCleanup();
                delete (window as any).__aureusCleanup;
            }

            setWorld(null);
            setRuntime(null);
            // setDebugHud(null);
            setState(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [container]); // Only re-run when container changes, not callbacks

    // Sync pause state
    useEffect(() => {
        if (world) {
            world.setGamePaused(paused);
        }
    }, [world, paused]);

    return {
        world,
        runtime,
        debugHud,
        ready,
        state,
        loading,
        getStateRef,
        getDebugStats: useCallback(() => {
            if (!world || !runtime) return null;

            const worldStats = world.getDebugStats();
            const cpuTime = runtime.profiler?.get('frame') || 0;

            return {
                ...worldStats,
                cpuTime
            };
        }, [world, runtime]),
        dispatch: useCallback((action: any) => {
            world?.dispatch(action);
        }, [world])
    };
}

export default useAureusEngine;
