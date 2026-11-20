import type { Point2D } from '../../core/math/geometry-types';

/** How long an NPC may push against something without moving before it gives up on the target. */
export const STALL_LIMIT_MS = 900;
const MIN_STEP = 0.35;

/**
 * Notices an NPC stuck against an obstacle (a bench, a hedge corner). Feed it
 * the position and current target every frame; it answers true once per
 * STALL_LIMIT_MS of no progress towards the same target.
 */
export class StallDetector {
  private previous: Point2D | null = null;
  private target: Point2D | null = null;
  private stalledMs = 0;

  public update(deltaMs: number, position: Point2D, target: Point2D | null): boolean {
    const moved = this.previous
      ? Math.hypot(position.x - this.previous.x, position.y - this.previous.y)
      : Number.POSITIVE_INFINITY;
    const sameTarget = target !== null && this.target !== null && target.x === this.target.x && target.y === this.target.y;
    this.previous = { x: position.x, y: position.y };
    this.target = target ? { x: target.x, y: target.y } : null;

    if (!target || !sameTarget || moved >= MIN_STEP) {
      this.stalledMs = 0;
      return false;
    }
    this.stalledMs += Math.max(0, deltaMs);
    if (this.stalledMs < STALL_LIMIT_MS) return false;
    this.stalledMs = 0;
    return true;
  }

  public reset(): void {
    this.previous = null;
    this.target = null;
    this.stalledMs = 0;
  }
}
