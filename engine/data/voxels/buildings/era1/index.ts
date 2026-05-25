
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
import { WorkshopFactory } from './Workshop';
import { MineShaftFactory } from './MineShaft';
import { SurveyDrillFactory } from './SurveyDrill';

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
    [BuildingType.WORKSHOP]: WorkshopFactory,
    [BuildingType.MINE_SHAFT]: MineShaftFactory,
    [BuildingType.SURVEY_DRILL]: SurveyDrillFactory
};
