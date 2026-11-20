import type { NavigationBuilding } from '../../domain/world/navigation-types';

/**
 * Enterable buildings, mirroring addBuilding() calls in the test world
 * builder (walls 24 px, door 76 px). NPCs route through these doors instead
 * of walking into walls.
 */
export const navigationBuildings = [
  { id: 'home', x: 285, y: 285, width: 430, height: 390, doorInside: { x: 285, y: 438 }, doorOutside: { x: 285, y: 522 } },
  { id: 'chwilka', x: 970, y: 315, width: 360, height: 330, doorInside: { x: 970, y: 438 }, doorOutside: { x: 970, y: 522 } },
  { id: '3d-shop', x: 1630, y: 315, width: 430, height: 350, doorInside: { x: 1630, y: 448 }, doorOutside: { x: 1630, y: 532 } },
  { id: 'pharmacy', x: 780, y: 1170, width: 360, height: 300, doorInside: { x: 780, y: 1062 }, doorOutside: { x: 780, y: 978 } },
] as const satisfies readonly NavigationBuilding[];
