
import { BuildingType } from '../../../../../types';
import { SafariLodgeFactory } from './SafariLodge';
import { GreenTechLabFactory } from './GreenTechLab';
import { MonumentFactory } from './Monument';
import { SpaceportFactory } from './Spaceport';

export const Era5Buildings = {
    [BuildingType.SAFARI_LODGE]: SafariLodgeFactory,
    [BuildingType.GREEN_TECH_LAB]: GreenTechLabFactory,
    [BuildingType.MONUMENT]: MonumentFactory,
    [BuildingType.SPACEPORT]: SpaceportFactory
};
