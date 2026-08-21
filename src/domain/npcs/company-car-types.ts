import type { Point2D } from '../../core/math/geometry-types';

export const COMPANY_CAR_STATE = {
  Driving: 'DRIVING',
  Suspicious: 'SUSPICIOUS',
  SpottedPlayer: 'SPOTTED_PLAYER',
  Cooldown: 'COOLDOWN',
} as const;

export type CompanyCarState = (typeof COMPANY_CAR_STATE)[keyof typeof COMPANY_CAR_STATE];

export interface CompanyCarDefinition {
  id: string;
  displayName: string;
  viewDistance: number;
  viewHalfAngleDegrees: number;
  drivingSpeed: number;
  recognitionTimeMs: number;
  suspiciousDecayMs: number;
  spottedPresentationMs: number;
  detectionCooldownMs: number;
}

export interface CompanyCarSnapshot {
  state: CompanyCarState;
  detectionTriggered: boolean;
  lastSeenPlayer: Point2D | null;
}
