import type { Point2D } from '../../core/math/geometry-types';
import type { NavigationBuilding } from '../../domain/world/navigation-types';

const ARRIVE_RADIUS = 18;
/** Half-width of the doorway column (door is 76 px wide). */
const DOORWAY_HALF_WIDTH = 38;

/**
 * Next point to walk towards on the way from `from` to `to`. NPCs move in
 * straight lines, so without this they press against walls forever; here
 * leaving or entering a building always goes through its door. Pure.
 */
export function nextWaypoint(
  from: Point2D,
  to: Point2D,
  buildings: readonly NavigationBuilding[],
): Point2D {
  // Standing in the doorway still counts as inside, so the NPC walks straight
  // out past the wall corners instead of cutting the corner and snagging.
  const fromBuilding = buildings.find((building) => isInside(building, from) || isInDoorway(building, from));
  const toBuilding = buildings.find((building) => isInside(building, to));

  if (fromBuilding && fromBuilding !== toBuilding) {
    // Leave: line up at the inner door point, then step out. Once Hubi's
    // pursuer is already between the inner point and the door, keep going out
    // (otherwise it would bounce between the two points).
    const doorSpan = distance(fromBuilding.doorInside, fromBuilding.doorOutside);
    return distance(from, fromBuilding.doorOutside) > doorSpan + ARRIVE_RADIUS
      ? fromBuilding.doorInside
      : fromBuilding.doorOutside;
  }
  if (toBuilding && toBuilding !== fromBuilding) {
    // Enter: line up outside the door, then step in.
    const doorSpan = distance(toBuilding.doorInside, toBuilding.doorOutside);
    return distance(from, toBuilding.doorInside) > doorSpan + ARRIVE_RADIUS
      ? toBuilding.doorOutside
      : toBuilding.doorInside;
  }
  return to;
}

export function isInside(building: NavigationBuilding, point: Point2D, margin = 0): boolean {
  return (
    Math.abs(point.x - building.x) <= building.width / 2 + margin &&
    Math.abs(point.y - building.y) <= building.height / 2 + margin
  );
}

function isInDoorway(building: NavigationBuilding, point: Point2D): boolean {
  const top = Math.min(building.doorInside.y, building.doorOutside.y);
  const bottom = Math.max(building.doorInside.y, building.doorOutside.y);
  return Math.abs(point.x - building.doorOutside.x) <= DOORWAY_HALF_WIDTH && point.y > top && point.y < bottom - 4;
}

function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
