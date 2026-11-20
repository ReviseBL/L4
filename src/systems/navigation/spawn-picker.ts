import type { Point2D } from '../../core/math/geometry-types';

/**
 * Where a patrolling NPC starts a new day: a random waypoint of its route
 * that is at least minDistance from everything in `avoid` (Hubi, his door),
 * or the farthest waypoint when none is far enough.
 */
export function pickSpawnIndex(
  route: readonly Point2D[],
  avoid: readonly Point2D[],
  minDistance: number,
  random: () => number,
): number {
  if (route.length === 0) throw new Error('Spawn picker needs a route.');
  const nearest = route.map((point) =>
    avoid.length === 0 ? Number.POSITIVE_INFINITY : Math.min(...avoid.map((other) => Math.hypot(point.x - other.x, point.y - other.y))),
  );
  const candidates = nearest.flatMap((distance, index) => (distance >= minDistance ? [index] : []));
  if (candidates.length === 0) return nearest.indexOf(Math.max(...nearest));
  return candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))] ?? 0;
}
