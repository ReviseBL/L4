import type { Point2D } from '../../core/math/geometry-types';
import type { EnemyType } from '../campaign/campaign-types';
import type { NpcSpriteId } from '../../data/npcs/npc-sprite-config';

export const NPC_STATE = {
  Patrol: 'PATROL',
  Suspicious: 'SUSPICIOUS',
  Detected: 'DETECTED',
  Searching: 'SEARCHING',
  Returning: 'RETURNING',
} as const;

export type NpcState = (typeof NPC_STATE)[keyof typeof NPC_STATE];

export interface NpcDefinition {
  id: string;
  enemyType: EnemyType;
  displayName: string;
  /** Animated sheet to use; the colleague's by default. */
  spriteId?: NpcSpriteId;
  viewDistance: number;
  /** Total field of view (half angle). 90 = 180° like a human. */
  viewHalfAngleDegrees: number;
  /** Sharp central vision at full range. */
  focusHalfAngleDegrees: number;
  /** Range of peripheral (side) vision as a fraction of viewDistance. */
  peripheralRangeMultiplier: number;
  patrolSpeed: number;
  detectedSpeed: number;
  searchSpeed: number;
  recognitionTimeMs: number;
  loseSightTimeMs: number;
  searchDurationMs: number;
  detectionCooldownMs: number;
}

export interface NpcDifficultyModifiers {
  viewDistanceMultiplier: number;
  awarenessMultiplier: number;
  searchDurationMultiplier: number;
}

export interface NpcPatrolSetup {
  spawn: Point2D;
  route: readonly Point2D[];
}
