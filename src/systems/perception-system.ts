import type { ObstacleBounds, Point2D } from '../core/math/geometry-types';

export const VISIBILITY_LEVEL = {
  None: 'NONE',
  Peripheral: 'PERIPHERAL',
  Clear: 'CLEAR',
} as const;

export type VisibilityLevel = (typeof VISIBILITY_LEVEL)[keyof typeof VISIBILITY_LEVEL];

export interface PerceptionQuery {
  observer: Point2D;
  target: Point2D;
  facingRadians: number;
  range: number;
  halfAngleRadians: number;
  rangeMultiplier?: number;
  targetHidden?: boolean;
}

export interface PerceptionResult {
  visibility: VisibilityLevel;
  distance: number;
  angleOffsetRadians: number;
  blocked: boolean;
}

export class PerceptionSystem {
  public constructor(private readonly obstacles: readonly ObstacleBounds[]) {}

  public evaluate(query: PerceptionQuery): PerceptionResult {
    const deltaX = query.target.x - query.observer.x;
    const deltaY = query.target.y - query.observer.y;
    const distance = Math.hypot(deltaX, deltaY);
    const targetAngle = Math.atan2(deltaY, deltaX);
    const angleOffsetRadians = normalizeAngle(targetAngle - query.facingRadians);
    const effectiveRange = query.range * (query.rangeMultiplier ?? 1);

    if (query.targetHidden || distance > effectiveRange || Math.abs(angleOffsetRadians) > query.halfAngleRadians) {
      return {
        visibility: VISIBILITY_LEVEL.None,
        distance,
        angleOffsetRadians,
        blocked: false,
      };
    }

    const blocked = this.isLineBlocked(query.observer, query.target);

    if (blocked) {
      return {
        visibility: VISIBILITY_LEVEL.None,
        distance,
        angleOffsetRadians,
        blocked: true,
      };
    }

    const isPeripheral =
      Math.abs(angleOffsetRadians) > query.halfAngleRadians * 0.68 || distance > effectiveRange * 0.82;

    return {
      visibility: isPeripheral ? VISIBILITY_LEVEL.Peripheral : VISIBILITY_LEVEL.Clear,
      distance,
      angleOffsetRadians,
      blocked: false,
    };
  }

  public castVisionRays(
    observer: Point2D,
    facingRadians: number,
    halfAngleRadians: number,
    range: number,
    rayCount = 24,
  ): Point2D[] {
    const points: Point2D[] = [];

    for (let index = 0; index <= rayCount; index += 1) {
      const progress = index / rayCount;
      const angle = facingRadians - halfAngleRadians + progress * halfAngleRadians * 2;
      const end = {
        x: observer.x + Math.cos(angle) * range,
        y: observer.y + Math.sin(angle) * range,
      };
      const intersectionProgress = this.findNearestIntersectionProgress(observer, end);
      const safeProgress = intersectionProgress === null ? 1 : Math.max(0, intersectionProgress - 0.004);

      points.push({
        x: observer.x + (end.x - observer.x) * safeProgress,
        y: observer.y + (end.y - observer.y) * safeProgress,
      });
    }

    return points;
  }

  private isLineBlocked(start: Point2D, end: Point2D): boolean {
    const intersection = this.findNearestIntersectionProgress(start, end);
    return intersection !== null && intersection > 0.002 && intersection < 0.98;
  }

  private findNearestIntersectionProgress(start: Point2D, end: Point2D): number | null {
    let nearest: number | null = null;

    for (const obstacle of this.obstacles) {
      const progress = getSegmentBoxIntersectionProgress(start, end, obstacle);

      if (progress !== null && progress > 0.002 && (nearest === null || progress < nearest)) {
        nearest = progress;
      }
    }

    return nearest;
  }
}

function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function getSegmentBoxIntersectionProgress(
  start: Point2D,
  end: Point2D,
  bounds: ObstacleBounds,
): number | null {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  let minimum = 0;
  let maximum = 1;

  const xResult = updateInterval(start.x, deltaX, bounds.left, bounds.right, minimum, maximum);

  if (!xResult) {
    return null;
  }

  minimum = xResult.minimum;
  maximum = xResult.maximum;

  const yResult = updateInterval(start.y, deltaY, bounds.top, bounds.bottom, minimum, maximum);
  return yResult?.minimum ?? null;
}

function updateInterval(
  start: number,
  delta: number,
  lower: number,
  upper: number,
  currentMinimum: number,
  currentMaximum: number,
): { minimum: number; maximum: number } | null {
  if (Math.abs(delta) < Number.EPSILON) {
    return start >= lower && start <= upper
      ? { minimum: currentMinimum, maximum: currentMaximum }
      : null;
  }

  let first = (lower - start) / delta;
  let second = (upper - start) / delta;

  if (first > second) {
    [first, second] = [second, first];
  }

  const minimum = Math.max(currentMinimum, first);
  const maximum = Math.min(currentMaximum, second);

  return minimum <= maximum ? { minimum, maximum } : null;
}
