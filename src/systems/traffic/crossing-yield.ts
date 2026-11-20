import type { Point2D } from '../../core/math/geometry-types';

export interface CrossingZone {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** How far before the stripes a car starts braking, and how far around them it looks for people. */
export const YIELD_LOOKAHEAD = 90;
export const PEDESTRIAN_MARGIN = 18;

/**
 * True when a car driving horizontally should stop before the zebra because
 * someone is on it (or stepping onto it). A car already over the stripes
 * keeps going so it does not block them.
 */
export function shouldYieldAtCrossing(
  carFrontX: number,
  directionX: -1 | 0 | 1,
  crossing: CrossingZone,
  pedestrians: readonly Point2D[],
): boolean {
  if (directionX === 0) return false;
  const approaching = directionX > 0
    ? carFrontX >= crossing.left - YIELD_LOOKAHEAD && carFrontX <= crossing.left + 4
    : carFrontX <= crossing.right + YIELD_LOOKAHEAD && carFrontX >= crossing.right - 4;
  if (!approaching) return false;
  return pedestrians.some(
    (person) =>
      person.x >= crossing.left - PEDESTRIAN_MARGIN &&
      person.x <= crossing.right + PEDESTRIAN_MARGIN &&
      person.y >= crossing.top - PEDESTRIAN_MARGIN &&
      person.y <= crossing.bottom + PEDESTRIAN_MARGIN,
  );
}
