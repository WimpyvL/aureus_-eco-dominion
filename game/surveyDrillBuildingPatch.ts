import { BUILDINGS } from '../engine/data/VoxelConstants';
import { BuildingType, Era } from '../types';

/**
 * Runtime registration for the Deep Ledger Survey Drill.
 *
 * This keeps the first integration small while the static building catalogue and
 * sidebar are refactored toward a data-driven registry.
 */
export const SURVEY_DRILL = 'SURVEY_DRILL' as BuildingType;

if (!(BUILDINGS as any)[SURVEY_DRILL]) {
    (BUILDINGS as any)[SURVEY_DRILL] = {
        type: SURVEY_DRILL,
        name: 'Survey Drill',
        cost: 250,
        desc: 'Reveals underground deposits, hazards, and stability data around its location.',
        ecoReq: 0,
        stats: 'Deep Ledger Scan Radius 4',
        width: 1,
        depth: 1,
        buildTime: 24,
        maintenance: 8,
        pollution: 1.0,
        era: Era.SETTLEMENT,
        power: { consumes: 4 },
        costs: {
            agt: 250,
            stone: 40,
            minerals: 15
        }
    };
}
