
import { BuildingType } from '../../../../../types';
import { RoadFactory } from './Road';
import { PipeFactory } from './Pipe';
import { PowerLineFactory } from './PowerLine';
import { StaffQuartersFactory } from './StaffQuarters';
import { CanteenFactory } from './Canteen';
import { WashPlantFactory } from './WashPlant';
import { SolarArrayFactory } from './SolarArray';
import { WaterWellFactory } from './WaterWell';
import { MiningHeadframeFactory } from './MiningHeadframe';
import { SawmillFactory } from './Sawmill';
import { StoneQuarryFactory } from './StoneQuarry';
import { StorageDepotFactory } from './StorageDepot';
import { StorageExtensionFactory } from './StorageExtension';
import { WorkshopFactory } from './Workshop';
import { SupportPillarFactory } from './SupportPillar';
import { MiningDrillFactory } from './MiningDrill';
import { UndergroundFansFactory } from './UndergroundFans';

export const Era1Buildings = {
    [BuildingType.ROAD]: RoadFactory,
    [BuildingType.PIPE]: PipeFactory,
    [BuildingType.POWER_LINE]: PowerLineFactory,
    [BuildingType.STAFF_QUARTERS]: StaffQuartersFactory,
    [BuildingType.CANTEEN]: CanteenFactory,
    [BuildingType.WASH_PLANT]: WashPlantFactory,
    [BuildingType.SOLAR_ARRAY]: SolarArrayFactory,
    [BuildingType.WATER_WELL]: WaterWellFactory,
    [BuildingType.MINING_HEADFRAME]: MiningHeadframeFactory,
    [BuildingType.SAWMILL]: SawmillFactory,
    [BuildingType.STONE_QUARRY]: StoneQuarryFactory,
    [BuildingType.STORAGE_DEPOT]: StorageDepotFactory,
    [BuildingType.STORAGE_EXTENSION]: StorageExtensionFactory,
    [BuildingType.WORKSHOP]: WorkshopFactory,
    [BuildingType.SUPPORT_PILLAR]: SupportPillarFactory,
    [BuildingType.MINING_DRILL]: MiningDrillFactory,
    [BuildingType.UNDERGROUND_FANS]: UndergroundFansFactory
};
