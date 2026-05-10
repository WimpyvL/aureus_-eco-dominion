import { AureusWorld } from './AureusWorld';
import { SfxType } from '../types';

/**
 * Connects the UI's TOGGLE_VIEW action to the engine-owned dungeon/underground state.
 *
 * The UI already dispatches TOGGLE_VIEW and listens to state.activeView, but the world
 * dispatcher does not currently switch views. This side-effect patch keeps the change
 * scoped until the dispatcher can be refactored directly.
 */
const proto = AureusWorld.prototype as any;

if (!proto.__undergroundTogglePatched) {
    const originalDispatch = proto.dispatch;

    proto.dispatch = function patchedDispatch(action: any): void {
        if (action?.type === 'TOGGLE_VIEW') {
            const stateManager = this.stateManager;
            const state = stateManager.getState();
            const isDungeon = state.activeView === 'DUNGEON';

            if (isDungeon) {
                stateManager.update({
                    activeView: 'SURFACE',
                    viewMode: 'SURFACE'
                });
                stateManager.pushEffect({ type: 'AUDIO', sfx: SfxType.UI_CLICK });
                return;
            }

            if (!state.dungeon?.unlocked && state.resources.trust < 50) {
                stateManager.update({
                    newsFeed: [
                        {
                            id: `dungeon_locked_${Date.now()}`,
                            headline: 'Underground access requires Trust level 50.',
                            type: 'NEGATIVE',
                            timestamp: Date.now()
                        },
                        ...state.newsFeed
                    ].slice(0, 12)
                });
                stateManager.pushEffect({ type: 'AUDIO', sfx: SfxType.ERROR });
                return;
            }

            stateManager.update({
                activeView: 'DUNGEON',
                viewMode: 'UNDERGROUND',
                dungeon: {
                    ...state.dungeon,
                    unlocked: true
                }
            });
            stateManager.pushEffect({ type: 'AUDIO', sfx: SfxType.UI_CLICK });
            return;
        }

        return originalDispatch.call(this, action);
    };

    proto.__undergroundTogglePatched = true;
}
