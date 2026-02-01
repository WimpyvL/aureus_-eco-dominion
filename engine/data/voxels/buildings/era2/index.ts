
import { BuildingType } from '../../../../../types';
import { FenceFactory } from './Fence';
import { SocialHubFactory } from './SocialHub';
import { SecurityPostFactory } from './SecurityPost';
import { CommunityGardenFactory } from './CommunityGarden';
import { WindTurbineFactory } from './WindTurbine';
import { StockpileFactory } from './Stockpile';
import { GeneratorFactory } from './Generator';
import { MedicalBayFactory } from './MedicalBay';
import { TrainingCenterFactory } from './TrainingCenter';
import { OreExtractorFactory } from './OreExtractor';

export const Era2Buildings = {
    [BuildingType.FENCE]: FenceFactory,
    [BuildingType.SOCIAL_HUB]: SocialHubFactory,
    [BuildingType.SECURITY_POST]: SecurityPostFactory,
    [BuildingType.COMMUNITY_GARDEN]: CommunityGardenFactory,
    [BuildingType.WIND_TURBINE]: WindTurbineFactory,
    [BuildingType.STOCKPILE]: StockpileFactory,
    [BuildingType.GENERATOR]: GeneratorFactory,
    [BuildingType.MEDICAL_BAY]: MedicalBayFactory,
    [BuildingType.TRAINING_CENTER]: TrainingCenterFactory,
    [BuildingType.ORE_EXTRACTOR]: OreExtractorFactory
};
