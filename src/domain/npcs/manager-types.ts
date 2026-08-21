import type { Point2D } from '../../core/math/geometry-types';
import type { NpcDifficultyModifiers } from './npc-types';

export const MANAGER_STATE = {
  PatrolArea: 'PATROL_AREA',
  Investigating: 'INVESTIGATING',
  Suspicious: 'SUSPICIOUS',
  Chase: 'CHASE',
  Searching: 'SEARCHING',
  CheckingLocation: 'CHECKING_LOCATION',
  Returning: 'RETURNING',
} as const;

export type ManagerState = (typeof MANAGER_STATE)[keyof typeof MANAGER_STATE];

export interface ManagerInterestPoint extends Point2D {
  id: string;
  lingerMs?: number;
}

export interface ManagerDefinition {
  id: string;
  displayName: string;
  viewDistance: number;
  viewHalfAngleDegrees: number;
  patrolSpeed: number;
  investigateSpeed: number;
  chaseSpeed: number;
  searchSpeed: number;
  recognitionTimeMs: number;
  loseSightTimeMs: number;
  suspiciousForgetTimeMs: number;
  areaPatrolDurationMs: number;
  searchMemoryDurationMs: number;
  detectionCooldownMs: number;
  proximityWarningDistance: number;
  criticalSignalCooldownMs: number;
  checkingOffsets: readonly Point2D[];
}

export interface ManagerBrainSnapshot {
  state: ManagerState;
  lastKnownPlayer: Point2D | null;
  movementTarget: Point2D | null;
  detectionTriggered: boolean;
}

export type ManagerDifficultyModifiers = NpcDifficultyModifiers;
