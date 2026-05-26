/**
 * useAureusEngine Hook (v2 - Engine Owned State)
 * 
 * React integration for the Aureus engine.
 * The engine now owns all game state. This hook:
 * - Creates and manages the engine lifecycle
 * - Subscribes React to state changes for re-rendering
 * - Provides action methods for UI interaction
 */

import { startTransition, useRef, useEffect, useState, useCallback } from 'react';

import { WorldHost, Runtime } from '../engine';
import { RuntimeQualityGovernor, ThreeRenderAdapter, getRecommendedRenderQuality } from '../engine/render';
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

    const [world, setWorld] = useState<AureusWorld | null>(null);
    const [runtime, setRuntime] = useState<Runtime | null>(null);
    const [debugHud, setDebugHud] = useState<DebugHud | null>(null);
    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState<LoadingProgress>({ stage: 'Waiting for DOM...', percent: 0 });
    const [state, setState] = useState<GameState | null>(null);
    const stateRef = useRef<GameState | null>(null);

    const getStateRef = useCallback(() => stateRef.current, []);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const callbacksRef = useRef({ onTileClick, onTileRightClick, onAgentClick, onTileHover, onSfx });
    useEffect(() => {
        callbacksRef.current = { onTileClick, onTileRightClick, onAgentClick, onTileHover, onSfx };
    }, [onTileClick, onTileRightClick, onAgentClick, onTileHover, onSfx]);

    useEffect(() => {
        if (!container) {
            setLoading({ stage: 'Waiting for container...', percent: 5 });
            return;
        }

        console.log('[useAureusEngine] Container ready, starting initialization...');
        let cancelled = false;

        const initializeEngine = async () => {
            const stageDelay = (ms: number = 16) => new Promise((resolve) => setTimeout(resolve, ms));

            try {
                setLoading({ stage: 'Initializing renderer...', percent: 10 });
                console.log('[useAureusEngine] Creating render adapter...');

                const renderQuality = getRecommendedRenderQuality();
                const render = new ThreeRenderAdapter({
                    antialias: renderQuality.antialias,
                    shadowMap: renderQuality.shadowMap,
                    pixelRatio: renderQuality.pixelRatio,
                    shadowMapSize: renderQuality.shadowMapSize,
                    fogEnabled: true,
                });
                render.init(container);

                if (cancelled) return;
                await stageDelay(0);

                setLoading({ stage: 'Creating game world...', percent: 20 });
                console.log('[useAureusEngine] Creating AureusWorld...');

                const worldInstance = new AureusWorld(render);

                if (cancelled) return;
                await stageDelay(0);

                setLoading({ stage: 'Configuring input system...', percent: 30 });
                console.log('[useAureusEngine] Configuring world...');

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
                await stageDelay(0);
                console.log('[useAureusEngine] Proceeding to state subscription...');

                const unsubscribe = worldInstance.subscribeToState((newState) => {
                    startTransition(() => setState(newState));
                });
                console.log('[useAureusEngine] ✓ State subscription set up');

                const initialState = worldInstance.getState();
                console.log('[useAureusEngine] Initial state prepared:', initialState ? 'OK' : 'NULL');

                if (cancelled) {
                    unsubscribe();
                    return;
                }

                setWorld(worldInstance);
                console.log('[useAureusEngine] ✓ World set');
                await stageDelay(0);

                setLoading({ stage: 'Creating runtime...', percent: 40 });
                console.log('[useAureusEngine] Creating WorldHost and Runtime...');

                const worldHost = new WorldHost();
                const runtimeInstance = new Runtime(worldHost, {
                    fixedTickRate: 60,
                    maxSimStepsPerFrame: 2,
                    profilerEnabled: false,
                });
                const qualityGovernor = new RuntimeQualityGovernor(runtimeInstance, render);
                setRuntime(runtimeInstance);

                if (cancelled) {
                    unsubscribe();
                    return;
                }
                await stageDelay(0);

                setLoading({ stage: 'Initializing debug tools...', percent: 50 });
                console.log('[useAureusEngine] Creating DebugHud...');

                if (cancelled) {
                    unsubscribe();
                    return;
                }
                await stageDelay(0);

                setLoading({ stage: 'Loading world data...', percent: 60 });
                console.log('[useAureusEngine] Setting world on host...');

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
                await stageDelay(0);

                setLoading({ stage: 'Starting simulation...', percent: 80 });
                runtimeInstance.start();
                qualityGovernor.start();

                if (cancelled) {
                    unsubscribe();
                    qualityGovernor.stop();
                    runtimeInstance.stop();
                    return;
                }

                await stageDelay(0);
                setLoading({ stage: 'Finalizing...', percent: 90 });
                setLoading({ stage: 'Game Engine Running!', percent: 100 });

                setReady(true);
                setState(worldInstance.getState());

                if (import.meta.env.DEV) {
                    (window as any).__aureusWorld = worldInstance;
                    (window as any).__aureusGetState = () => worldInstance.getState();
                }

                (window as any).__aureusCleanup = () => {
                    if (import.meta.env.DEV) {
                        delete (window as any).__aureusWorld;
                        delete (window as any).__aureusGetState;
                    }
                    unsubscribe();
                    qualityGovernor.stop();
                    runtimeInstance.stop();
                    worldInstance.teardown();
                    render.dispose();
                };
            } catch (error) {
                console.error('[useAureusEngine] ❌ FATAL ERROR:', error);
                setLoading({
                    stage: 'Error!',
                    percent: 0,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        };

        initializeEngine();

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
            setState(null);
        };
    }, [container]);

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
                cpuTime,
            };
        }, [world, runtime]),
        dispatch: useCallback((action: any) => {
            world?.dispatch(action);
        }, [world]),
    };
}

export default useAureusEngine;
