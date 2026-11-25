import type { Point2D } from '../../core/math/geometry-types';
import type { NpcDifficultyModifiers } from './npc-types';

export const HR_STATE = {
  Patrol: 'PATROL',
  Suspicious: 'SUSPICIOUS',
  Approaching: 'APPROACHING',
  Conversation: 'CONVERSATION',
  Searching: 'SEARCHING',
  Returning: 'RETURNING',
} as const;

export type HrState = (typeof HR_STATE)[keyof typeof HR_STATE];

export interface HrDefinition {
  id: string;
  displayName: string;
  viewDistance: number;
  /** Total field of view (half angle). 90 = 180° like a human. */
  viewHalfAngleDegrees: number;
  /** Sharp central vision at full range. */
  focusHalfAngleDegrees: number;
  /** Range of peripheral (side) vision as a fraction of viewDistance. */
  peripheralRangeMultiplier: number;
  patrolSpeed: number;
  approachSpeed: number;
  searchSpeed: number;
  recognitionTimeMs: number;
  loseSightTimeMs: number;
  searchDurationMs: number;
  detectionCooldownMs: number;
  conversationDistance: number;
  /** After a talk HR walks away and ignores Herbi for this long, so he can leave. */
  postConversationGraceMs: number;
}

export interface HrBrainSnapshot {
  state: HrState;
  lastKnownPlayer: Point2D | null;
  detectionTriggered: boolean;
  conversationRequested: boolean;
}

export type HrDifficultyModifiers = NpcDifficultyModifiers;
