import type { Point2D } from '../../core/math/geometry-types';

/**
 * Sidewalk paths for walking NPCs. The street runs y 615-855; pedestrians
 * keep to the north (y 535-615) or south (y 855-935) sidewalk and cross only
 * on the zebra. Each path runs west → east and steps around street furniture
 * (the hedge and the dumpster in the north, the planter in the south). The
 * dumpster detour keeps clear of the hiding spot behind it.
 */
export const ZEBRA_CROSSING = { left: 421, right: 589, top: 615, bottom: 855, walkX: 505 } as const;

export const NORTH_SIDEWALK_PATH: readonly Point2D[] = [
  { x: ZEBRA_CROSSING.walkX, y: 583 },
  { x: 1195, y: 583 },
  { x: 1205, y: 518 },
  { x: 1335, y: 518 },
  { x: 1345, y: 583 },
  { x: 2000, y: 583 },
];

export const SOUTH_SIDEWALK_PATH: readonly Point2D[] = [
  { x: ZEBRA_CROSSING.walkX, y: 878 },
  { x: 1095, y: 878 },
  { x: 1095, y: 915 },
  { x: 1185, y: 915 },
  { x: 1185, y: 878 },
  { x: 2000, y: 878 },
];

/**
 * The stretch of a west → east path between two x positions, in walking
 * order (fromX may be east of toX). Corners in between are kept, so the
 * walker still steps around obstacles.
 */
export function walkAlong(path: readonly Point2D[], fromX: number, toX: number): Point2D[] {
  const start = { x: fromX, y: yAt(path, fromX) };
  const end = { x: toX, y: yAt(path, toX) };
  const low = Math.min(fromX, toX);
  const high = Math.max(fromX, toX);
  const inner = path.filter((point) => point.x > low && point.x < high);
  if (fromX > toX) inner.reverse();
  return dedupe([start, ...inner, end]);
}

/** Joins walks into one closed patrol loop, dropping repeated points at the seams. */
export function joinWalks(...walks: readonly (readonly Point2D[])[]): Point2D[] {
  return dedupe(walks.flat());
}

function yAt(path: readonly Point2D[], x: number): number {
  const first = path[0];
  const last = path[path.length - 1];
  if (!first || !last) throw new Error('Sidewalk path needs points.');
  if (x <= first.x) return first.y;
  if (x >= last.x) return last.y;
  for (let index = 1; index < path.length; index += 1) {
    const a = path[index - 1]!;
    const b = path[index]!;
    if (x <= b.x) {
      if (b.x === a.x) return b.y;
      return Math.round(a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x));
    }
  }
  return last.y;
}

function dedupe(points: readonly Point2D[]): Point2D[] {
  const result: Point2D[] = [];
  for (const point of points) {
    const previous = result[result.length - 1];
    if (!previous || previous.x !== point.x || previous.y !== point.y) result.push({ x: point.x, y: point.y });
  }
  const first = result[0];
  const last = result[result.length - 1];
  if (result.length > 1 && first && last && first.x === last.x && first.y === last.y) result.pop();
  return result;
}
