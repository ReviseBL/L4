import type { BuildingWindow, WindowGlimpseConfig } from '../../domain/world/window-types';

/**
 * Windows in the street walls (between the door and the shop sign). Home and
 * pharmacy windows are safe (curtains, frosted glass). Through the clear
 * Chwilka and 3D-shop windows a chaser outside can glimpse Hubi inside.
 */
export const BUILDING_WINDOWS: readonly BuildingWindow[] = [
  { id: 'home-1', buildingId: 'home', x: 135, wallY: 480, facing: 'down', safe: true },
  { id: 'home-2', buildingId: 'home', x: 200, wallY: 480, facing: 'down', safe: true },
  { id: 'home-3', buildingId: 'home', x: 370, wallY: 480, facing: 'down', safe: true },
  { id: 'home-4', buildingId: 'home', x: 435, wallY: 480, facing: 'down', safe: true },
  { id: 'chwilka-1', buildingId: 'chwilka', x: 835, wallY: 480, facing: 'down', safe: false },
  { id: 'chwilka-2', buildingId: 'chwilka', x: 895, wallY: 480, facing: 'down', safe: false },
  { id: '3d-shop-1', buildingId: '3d-shop', x: 1475, wallY: 490, facing: 'down', safe: false },
  { id: '3d-shop-2', buildingId: '3d-shop', x: 1545, wallY: 490, facing: 'down', safe: false },
  { id: 'pharmacy-1', buildingId: 'pharmacy', x: 860, wallY: 1020, facing: 'up', safe: true },
  { id: 'pharmacy-2', buildingId: 'pharmacy', x: 920, wallY: 1020, facing: 'up', safe: true },
];

export const WINDOW_GLIMPSE_CONFIG: WindowGlimpseConfig = {
  halfWidth: 19,
  cooldownMs: 15_000,
  lingerMs: 6_000,
  lookFromDistance: 46,
};

/** Shop names for the "someone glanced in" message. */
export const WINDOW_SHOP_NAMES: Readonly<Record<string, string>> = {
  chwilka: 'Chwilki',
  '3d-shop': '3D shopu',
};
