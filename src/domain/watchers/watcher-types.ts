import type { Point2D } from '../../core/math/geometry-types';

/**
 * A neighbour who just stands around. If they spot Hubi they shout a friendly
 * greeting, which draws the attention of one company NPC. They never chase.
 */
export interface WatcherDefinition {
  id: string;
  displayName: string;
  /** Front-facing sprite (used when the texture is loaded). */
  textureKey: string;
  placeholderColor: number;
  position: Point2D;
  /** Centre of the head sweep (0 = east, 90 = south). */
  baseFacingDegrees: number;
  /** Head turns ±this many degrees around the base direction. */
  sweepDegrees: number;
  sweepPeriodMs: number;
  viewDistance: number;
  viewHalfAngleDegrees: number;
  focusHalfAngleDegrees: number;
  peripheralRangeMultiplier: number;
  shoutLines: readonly string[];
  /** Own recognition time (ms) instead of the shared one: sharper eyes. */
  recognitionMs?: number;
  /** One fixed sprite whatever the head does (e.g. seen from behind, sitting on a bench). */
  seatedTextureKey?: string;
}

export interface WatcherConfig {
  /** Chance that a given neighbour is outside during a mission (rolled per mission). */
  spawnChance: number;
  /** How long Hubi has to be in clear view before the shout (ms). */
  recognitionMs: number;
  /** Silence after a shout (ms). */
  cooldownMs: number;
  /** How long the speech bubble stays (ms). */
  shoutDisplayMs: number;
}

export type WatcherVisibility = 'NONE' | 'PERIPHERAL' | 'CLEAR';

export interface WatcherShout {
  watcherId: string;
  line: string;
}
