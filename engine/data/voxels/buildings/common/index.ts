
import { BuildingType } from '../../../../../types';
import { EmptyFactory } from './Empty';
import { ConstructionFactory } from './Construction';

export const CommonBuildings = {
    [BuildingType.EMPTY]: EmptyFactory,
    'CONSTRUCTION': ConstructionFactory
};
