import { AureusWorld } from './AureusWorld';
import { SfxType } from '../types';
import { SURVEY_DRILL } from './surveyDrillBuildingPatch';
import { BUILDINGS } from '../engine/data/VoxelConstants';

/**
 * Temporary Deep Ledger build access.
 *
 * Adds a small surface-mode Survey Drill shortcut until the large SupplySidebar
 * can be refactored into a data-driven shop registry.
 */
const proto = AureusWorld.prototype as any;
const BUTTON_ID = 'deep-ledger-survey-drill-access';
const COST = 250;

function getButton(): HTMLButtonElement | null {
    if (typeof document === 'undefined') return null;

    let button = document.getElementById(BUTTON_ID) as HTMLButtonElement | null;

    if (!button) {
        button = document.createElement('button');
        button.id = BUTTON_ID;
        button.type = 'button';
        button.style.position = 'fixed';
        button.style.right = '18px';
        button.style.bottom = '96px';
        button.style.zIndex = '72';
        button.style.pointerEvents = 'auto';
        button.style.border = '2px solid rgba(120, 53, 15, 0.95)';
        button.style.borderBottomWidth = '5px';
        button.style.borderRadius = '8px';
        button.style.padding = '10px 14px';
        button.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.98), rgba(180, 83, 9, 0.98))';
        button.style.color = '#1c1917';
        button.style.fontFamily = 'Rajdhani, Inter, system-ui, sans-serif';
        button.style.fontWeight = '900';
        button.style.fontSize = '12px';
        button.style.letterSpacing = '0.08em';
        button.style.textTransform = 'uppercase';
        button.style.boxShadow = '4px 4px 0 rgba(0, 0, 0, 0.35)';
        button.style.cursor = 'pointer';
        button.innerHTML = 'Survey Drill<br><span style="font-size: 10px; opacity: 0.75;">Deep Ledger Scan</span>';
        document.body.appendChild(button);
    }

    return button;
}

function updateSurveyDrillAccess(world: any): void {
    const button = getButton();
    if (!button) return;

    const state = world.stateManager?.getState?.();
    if (!state || state.activeView !== 'SURFACE' || state.isFPS) {
        button.style.display = 'none';
        return;
    }

    const hasDefinition = Boolean((BUILDINGS as any)[SURVEY_DRILL]);
    if (!hasDefinition) {
        button.style.display = 'none';
        return;
    }

    button.style.display = 'block';
    button.title = 'Buy and place a Survey Drill to reveal Sector B1 underground deposits and hazards.';
    button.onclick = () => {
        const currentState = world.stateManager?.getState?.();
        if (!currentState) return;

        if (!currentState.cheatsEnabled && currentState.resources.agt < COST) {
            world.stateManager?.pushEffect?.({ type: 'AUDIO', sfx: SfxType.ERROR });
            currentState.newsFeed.unshift({
                id: `survey_drill_no_funds_${Date.now()}`,
                headline: `Survey Drill requires ${COST} AGT.`,
                type: 'NEGATIVE',
                timestamp: Date.now()
            });
            world.stateManager?.markDirty?.('newsFeed' as any, 'pendingEffects' as any);
            return;
        }

        if (!currentState.cheatsEnabled) {
            currentState.resources.agt -= COST;
            world.stateManager?.markDirty?.('resources' as any);
        }

        world.selectBuilding?.(SURVEY_DRILL);
        world.stateManager?.pushEffect?.({ type: 'AUDIO', sfx: SfxType.UI_CLICK });
        currentState.newsFeed.unshift({
            id: `survey_drill_ready_${Date.now()}`,
            headline: 'Survey Drill ready. Place it on the surface to scan Sector B1.',
            type: 'POSITIVE',
            timestamp: Date.now()
        });
        world.stateManager?.markDirty?.('newsFeed' as any, 'pendingEffects' as any);
    };
}

if (!proto.__surveyDrillAccessPatched) {
    const originalDraw = proto.draw;
    const originalTeardown = proto.onTeardown;

    proto.draw = function patchedSurveyDrillAccessDraw(this: any, ctx: any): void {
        const result = originalDraw.call(this, ctx);
        updateSurveyDrillAccess(this);
        return result;
    };

    proto.onTeardown = async function patchedSurveyDrillAccessTeardown(this: any): Promise<void> {
        const button = typeof document !== 'undefined' ? document.getElementById(BUTTON_ID) : null;
        button?.remove();
        return originalTeardown.call(this);
    };

    proto.__surveyDrillAccessPatched = true;
}
