import type { Point2D } from '../../core/math/geometry-types';

/** A window in a building's street wall. */
export interface BuildingWindow {
  id: string;
  buildingId: string;
  /** Centre of the window on the wall. */
  x: number;
  wallY: number;
  /** Which way the street is: 'down' for the north buildings, 'up' for the pharmacy. */
  facing: 'down' | 'up';
  /**
   * Safe windows (home, pharmacy) have curtains / frosted glass: nobody sees
   * in. Shop windows are clear, so a chaser outside can glimpse Herbi inside.
   */
  safe: boolean;
}

export interface WindowGlimpseConfig {
  /** Half-width of the glass opening along the wall. */
  halfWidth: number;
  /** Quiet time per NPC after a glimpse. */
  cooldownMs: number;
  /** Extra time the NPC hangs around the shop after a glimpse. */
  lingerMs: number;
  /** How far in front of the window the NPC goes to have a look. */
  lookFromDistance: number;
}

/** What a chasing NPC knows about its own eyes this frame. */
export interface GlimpseObserver {
  id: string;
  position: Point2D;
  facingRadians: number;
  range: number;
  halfAngleRadians: number;
}

/** An interior Herbi can be seen in through its windows. */
export interface GlimpseRoom {
  buildingId: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface WindowGlimpse {
  observerId: string;
  window: BuildingWindow;
  /** Spot outside the window where the NPC goes to look around. */
  lookFrom: Point2D;
}
