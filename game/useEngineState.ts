/**
 * useEngineState
 * React hook to subscribe to engine state changes.
 * Replaces useReducer for game state management.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../types';
import { AureusWorld } from './AureusWorld';

export function useEngineState(world: AureusWorld | null) {
    const [state, setState] = useState<GameState | null>(null);
    const stateRef = useRef<GameState | null>(null);

    useEffect(() => {
        if (!world) return;

        // Get initial state
        const initial = world.getState();
        setState(initial);
        stateRef.current = initial;

        // Subscribe to changes
        const unsubscribe = world.subscribeToState((newState) => {
            stateRef.current = newState;
            setState(newState);
        });

        return unsubscribe;
    }, [world]);

    // For synchronous access without triggering re-render
    const getStateRef = useCallback(() => stateRef.current, []);

    return { state, getStateRef };
}

/**
 * Action dispatcher for UI -> Engine communication
 * Replaces React dispatch({ type: ... })
 */
export interface EngineActions {
    placeBuilding: (x: number, z: number, type?: string) => void;
    bulldozeTile: (x: number, z: number) => void;
    selectBuilding: (type: string | null) => void;
    selectAgent: (id: string | null) => void;
    commandAgent: (agentId: string, x: number, z: number) => void;
    setInteractionMode: (mode: 'BUILD' | 'BULLDOZE' | 'INSPECT' | 'DIG') => void;
    sellMinerals: () => void;
    setAutoSell: (enabled: boolean, threshold: number) => void;
    researchTech: (techId: string) => void;
    toggleDebug: () => void;
    saveGame: () => void;
    loadGame: (data: string) => void;
    speedUpConstruction: (x: number, z: number) => void;
    acceptContract: (contractId: string) => void;
    deliverContract: (contractId: string) => void;
}

export function useEngineActions(world: AureusWorld | null): EngineActions {
    return {
        placeBuilding: useCallback((x: number, z: number, type?: string) => {
            world?.placeBuilding(x, z, type);
        }, [world]),

        bulldozeTile: useCallback((x: number, z: number) => {
            world?.bulldozeTile(x, z);
        }, [world]),

        selectBuilding: useCallback((type: string | null) => {
            world?.selectBuilding(type);
        }, [world]),

        selectAgent: useCallback((id: string | null) => {
            world?.selectAgent(id);
        }, [world]),

        commandAgent: useCallback((agentId: string, x: number, z: number) => {
            world?.commandAgent(agentId, x, z);
        }, [world]),

        setInteractionMode: useCallback((mode: 'BUILD' | 'BULLDOZE' | 'INSPECT') => {
            world?.setInteractionMode(mode);
        }, [world]),

        sellMinerals: useCallback(() => {
            world?.sellMinerals();
        }, [world]),

        setAutoSell: useCallback((enabled: boolean, threshold: number) => {
            world?.setAutoSell(enabled, threshold);
        }, [world]),

        researchTech: useCallback((techId: string) => {
            world?.researchTech(techId);
        }, [world]),

        toggleDebug: useCallback(() => {
            world?.toggleDebug();
        }, [world]),

        saveGame: useCallback(() => {
            world?.saveGame();
        }, [world]),

        loadGame: useCallback((data: string) => {
            world?.loadGame(data);
        }, [world]),

        speedUpConstruction: useCallback((x: number, z: number) => {
            world?.speedUpConstruction(x, z);
        }, [world]),

        acceptContract: useCallback((contractId: string) => {
            world?.acceptContract(contractId);
        }, [world]),

        deliverContract: useCallback((contractId: string) => {
            world?.deliverContract(contractId);
        }, [world]),
    };
}
