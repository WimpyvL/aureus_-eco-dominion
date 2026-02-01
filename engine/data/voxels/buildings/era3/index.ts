
import { BuildingType } from '../../../../../types';
import { PondFactory } from './Pond';
import { RecyclingPlantFactory } from './RecyclingPlant';
import { OreFoundryFactory } from './OreFoundry';
import { GemRefineryFactory } from './GemRefinery';
import { RailLineFactory } from './RailLine';
import { DistributionHubFactory } from './DistributionHub';

export const Era3Buildings = {
    [BuildingType.POND]: PondFactory,
    [BuildingType.RECYCLING_PLANT]: RecyclingPlantFactory,
    [BuildingType.ORE_FOUNDRY]: OreFoundryFactory,
    [BuildingType.GEM_REFINERY]: GemRefineryFactory,
    [BuildingType.RAIL_LINE]: RailLineFactory,
    [BuildingType.DISTRIBUTION_HUB]: DistributionHubFactory
};
