
import { BuildingType } from '../../../../../types';
import { ReservoirFactory } from './Reservoir';
import { LocalSchoolFactory } from './LocalSchool';
import { WasteTreatmentFactory } from './WasteTreatment';
import { NatureReserveFactory } from './NatureReserve';
import { HydroponicsFactory } from './Hydroponics';
import { GeothermalPlantFactory } from './GeothermalPlant';

export const Era4Buildings = {
    [BuildingType.RESERVOIR]: ReservoirFactory,
    [BuildingType.LOCAL_SCHOOL]: LocalSchoolFactory,
    [BuildingType.WASTE_TREATMENT]: WasteTreatmentFactory,
    [BuildingType.NATURE_RESERVE]: NatureReserveFactory,
    [BuildingType.HYDROPONICS]: HydroponicsFactory,
    [BuildingType.GEOTHERMAL_PLANT]: GeothermalPlantFactory
};
