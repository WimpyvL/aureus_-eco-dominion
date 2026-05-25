import test from 'node:test';
import assert from 'node:assert/strict';

import {
    SURVEY_DRILL_BUILDING_TYPE,
    applyDeepLedgerSurvey,
} from '../engine/underground/DeepLedgerSurveyCore.ts';

test('applyDeepLedgerSurvey backfills missing underground state for legacy saves without unlocking access', () => {
    const legacyState: any = {
        seed: 42,
        dungeon: { unlocked: false },
        chunks: {},
    };

    const result = applyDeepLedgerSurvey(legacyState);

    assert.equal(result.changed, true);
    assert.equal(legacyState.underground.unlocked, false);
    assert.equal(legacyState.underground.depthLevel, 1);
    assert.equal(legacyState.underground.exposureRisk, 0);
    assert.deepEqual(legacyState.underground.activeHazards, []);
    assert.deepEqual(legacyState.underground.tiles, {});
});

test('applyDeepLedgerSurvey reveals radius-4 tiles around completed survey drills and unlocks below-sector access', () => {
    const state: any = {
        seed: 7,
        dungeon: { unlocked: false },
        chunks: {
            '0,0': {
                tiles: [
                    {
                        x: 10,
                        z: -3,
                        buildingType: SURVEY_DRILL_BUILDING_TYPE,
                        isUnderConstruction: false,
                        structureHeadX: 10,
                        structureHeadZ: -3,
                    },
                ],
            },
        },
    };

    const result = applyDeepLedgerSurvey(state);
    const centerTile = state.underground.tiles['10,-3,1'];

    assert.equal(result.changed, true);
    assert.equal(result.surveyedTileCount > 20, true);
    assert.equal(state.underground.unlocked, true);
    assert.equal(state.dungeon.unlocked, true);
    assert.equal(centerTile.status, 'SURVEYED');
    assert.equal(typeof centerTile.oreRichness, 'number');
    assert.equal(state.underground.globalStability > 0, true);
});
