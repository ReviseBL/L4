import type { Point2D } from '../../core/math/geometry-types';

/**
 * An order made while Herbi waits next to the counter (the kebab stand).
 * The estate keeps running; the order only progresses while he stays near.
 */
export interface ServiceWaitDefinition {
  id: string;
  /** Who talks behind the counter (bubble label). */
  vendorName: string;
  /** Where Herbi has to stay, and how far he may wander. */
  spot: Point2D;
  radius: number;
  /** Where the vendor's speech bubble hangs. */
  bubbleAt: Point2D;
  /** Bubble lines, shown one after another; the order takes lines × lineMs. */
  lines: readonly string[];
  lineMs: number;
  readyLine: string;
  startMessage: string;
  leftMessage: string;
  backMessage: string;
  stillCookingMessage: string;
  promptLabel: string;
}
