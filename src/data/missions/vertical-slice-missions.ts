import type { MissionDefinition } from '../../domain/missions/mission-types';
import { filamentMission } from './filament-mission';
import { groceryMission } from './grocery-mission';
import { medicineMission } from './medicine-mission';
import { month2CoffeeMission } from './month-2-coffee-mission';
import { month2NozzleMission } from './month-2-nozzle-mission';
import { month2PackageMission } from './month-2-package-mission';
import { month3MedicineMission } from './month-3-medicine-mission';
import { month3CableMission } from './month-3-cable-mission';
import { month3FilamentMission } from './month-3-filament-mission';
import { month4ShoppingMission } from './month-4-shopping-mission';
import { month4LargePackageMission } from './month-4-large-package-mission';
import { month4AsaMission } from './month-4-asa-mission';
import { month5ShoppingMission } from './month-5-shopping-mission';
import { month5L4ProjectMission } from './month-5-l4-project-mission';
import { month5KebabMission } from './month-5-kebab-mission';
import { month6FinalSpoolMission } from './month-6-final-spool-mission';
import { month6FoodMission } from './month-6-food-mission';

export const verticalSliceMissions: readonly MissionDefinition[] = [
  medicineMission,
  groceryMission,
  filamentMission,
  month2CoffeeMission,
  month2PackageMission,
  month2NozzleMission,
  month3MedicineMission,
  month3CableMission,
  month3FilamentMission,
  month4ShoppingMission,
  month4LargePackageMission,
  month4AsaMission,
  month5ShoppingMission,
  month5L4ProjectMission,
  month5KebabMission,
  month6FinalSpoolMission,
  month6FoodMission,
];
