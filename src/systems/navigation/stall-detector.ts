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

export type AvoidanceDecision =
  | { type: 'go' }
  | { type: 'sidestep'; direction: { x: number; y: number } }
  | { type: 'give-up' };

/** How long a sidestep lasts, and how many in a row before the target is dropped. */
export const SIDESTEP_MS = 1_200;
export const SIDESTEPS_BEFORE_GIVING_UP = 3;

/**
 * Gets an NPC around furniture the door router does not know about (a
 * counter, a shelf): when it stalls it steps sideways for a moment, towards
 * the side of its target, and only drops the target after a few tries.
 */
export class ObstacleAvoider {
  private readonly stall = new StallDetector();
  private sidestepMs = 0;
  private sidestep: { x: number; y: number } | null = null;
  private attempts = 0;
  private target: Point2D | null = null;

  public update(deltaMs: number, position: Point2D, target: Point2D | null, step: Point2D): AvoidanceDecision {
    if (!target || !this.target || target.x !== this.target.x || target.y !== this.target.y) {
      this.attempts = 0;
      this.sidestepMs = 0;
      this.sidestep = null;
    }
    this.target = target ? { x: target.x, y: target.y } : null;

    if (this.sidestep && this.sidestepMs > 0) {
      this.sidestepMs -= deltaMs;
      this.stall.reset();
      return { type: 'sidestep', direction: this.sidestep };
    }
    this.sidestep = null;
    if (!this.stall.update(deltaMs, position, target)) return { type: 'go' };

    this.attempts += 1;
    if (this.attempts > SIDESTEPS_BEFORE_GIVING_UP) {
      this.attempts = 0;
      return { type: 'give-up' };
    }
    this.sidestep = pickSidestep(position, target ?? position, step, this.attempts);
    this.sidestepMs = SIDESTEP_MS;
    return { type: 'sidestep', direction: this.sidestep };
  }

  public reset(): void {
    this.stall.reset();
    this.sidestep = null;
    this.sidestepMs = 0;
    this.attempts = 0;
    this.target = null;
  }
}

/** Perpendicular to the blocked step, leaning towards the target; flips on every other try. */
function pickSidestep(position: Point2D, target: Point2D, step: Point2D, attempt: number): { x: number; y: number } {
  const dx = step.x - position.x;
  const dy = step.y - position.y;
  const length = Math.hypot(dx, dy) || 1;
  let perpendicular = { x: -dy / length, y: dx / length };
  const towardsTarget = perpendicular.x * (target.x - position.x) + perpendicular.y * (target.y - position.y);
  if (towardsTarget < 0) perpendicular = { x: -perpendicular.x, y: -perpendicular.y };
  if (towardsTarget === 0 && attempt % 2 === 0) perpendicular = { x: -perpendicular.x, y: -perpendicular.y };
  if (attempt === 2) perpendicular = { x: -perpendicular.x, y: -perpendicular.y };
  return perpendicular;
}
