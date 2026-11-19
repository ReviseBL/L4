import type { ManagerDefinition } from '../../domain/npcs/manager-types';

export const managerDefinition = {
  id: 'manager',
  displayName: 'KIEROWNIK',
  viewDistance: 450,
  viewHalfAngleDegrees: 90,
  focusHalfAngleDegrees: 46,
  peripheralRangeMultiplier: 0.55,
  patrolSpeed: 112,
  investigateSpeed: 132,
  chaseSpeed: 220,
  searchSpeed: 142,
  recognitionTimeMs: 420,
  loseSightTimeMs: 1_050,
  suspiciousForgetTimeMs: 1_150,
  areaPatrolDurationMs: 4_200,
  searchMemoryDurationMs: 8_500,
  detectionCooldownMs: 9_000,
  proximityWarningDistance: 430,
  criticalSignalCooldownMs: 24_000,
  checkingOffsets: [
    { x: 82, y: -45 },
    { x: -68, y: 62 },
    { x: 105, y: 58 },
  ],
} as const satisfies ManagerDefinition;
