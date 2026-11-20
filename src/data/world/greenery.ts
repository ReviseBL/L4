import type { GreeneryKind, ScatterZone } from '../../systems/world/greenery-scatter';

/** Fixed seed: the scatter looks random but the map is the same every visit. */
export const GREENERY_SEED = 0x4c34;
export const GREENERY_COUNT = 22;
export const GREENERY_MIN_SPACING = 56;

export const GREENERY_KINDS: readonly GreeneryKind[] = [
  { key: 'world-flowerbed-36x28', weight: 3, height: 28 },
  { key: 'world-dandelions-24x21', weight: 2, height: 21, flat: true },
  { key: 'world-dandelions-22x19', weight: 2, height: 19, flat: true },
  { key: 'world-boxwood-30x29', weight: 3, height: 29 },
  { key: 'world-lilac-46x37', weight: 1, height: 37 },
  { key: 'world-young-tree-30x59', weight: 1, height: 59 },
  { key: 'world-leaf-pile-30x18', weight: 1, height: 18, flat: true },
];

/** Grass only: gardens behind the hedges, front lawns between buildings, the south strip. */
export const GREENERY_ZONES: readonly ScatterZone[] = [
  { left: 515, top: 30, right: 775, bottom: 290 },
  { left: 1165, top: 30, right: 1400, bottom: 290 },
  { left: 1860, top: 30, right: 2185, bottom: 290 },
  { left: 515, top: 395, right: 775, bottom: 515 },
  { left: 1165, top: 395, right: 1400, bottom: 515 },
  { left: 1860, top: 395, right: 2185, bottom: 515 },
  { left: 15, top: 950, right: 585, bottom: 1060 },
  { left: 975, top: 950, right: 1260, bottom: 1075 },
  { left: 505, top: 1070, right: 585, bottom: 1385 },
  { left: 975, top: 1100, right: 1030, bottom: 1385 },
  { left: 2130, top: 1070, right: 2190, bottom: 1385 },
];

/** Never in these: the kebab yard and its path, the parking lot, the pharmacy door. */
export const GREENERY_KEEP_OUT: readonly ScatterZone[] = [
  { left: 1530, top: 940, right: 1700, bottom: 1400 },
  { left: 1480, top: 935, right: 2190, bottom: 1065 },
  { left: 720, top: 990, right: 840, bottom: 1060 },
  // HR's pharmacy loop cuts across the south lawn.
  { left: 495, top: 925, right: 1065, bottom: 1065 },
];
