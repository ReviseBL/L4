import type { BuildingWindow, WindowWatchConfig } from '../../domain/world/window-types';

/**
 * Windows in the street walls (between the door and the shop sign). Home and
 * pharmacy are safe; staff in Chwilka and the 3D shop notice someone who
 * keeps standing in front of their window.
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

export const WINDOW_WATCH_CONFIG: WindowWatchConfig = {
  noticeAfterMs: 1_600,
  cooldownMs: 10_000,
  halfWidth: 28,
  depth: 56,
  wallHalfThickness: 12,
};

/** What Hubi hears when someone spots him through the glass. */
export const WINDOW_NOTICE_MESSAGES: Readonly<Record<string, string>> = {
  chwilka: 'Kasjerka z Chwilki zerka przez szybę. Lepiej nie sterczeć pod oknem.',
  '3d-shop': 'Sprzedawca z 3D shopu przygląda Ci się przez witrynę.',
};
