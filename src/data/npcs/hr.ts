import type { HrDefinition } from '../../domain/npcs/hr-types';

export const hrDefinition = {
  id: 'hr-representative',
  displayName: 'HR',
  viewDistance: 415,
  viewHalfAngleDegrees: 90,
  focusHalfAngleDegrees: 44,
  peripheralRangeMultiplier: 0.55,
  patrolSpeed: 98,
  approachSpeed: 142,
  searchSpeed: 112,
  recognitionTimeMs: 500,
  loseSightTimeMs: 850,
  searchDurationMs: 5_200,
  detectionCooldownMs: 7_000,
  conversationDistance: 58,
} as const satisfies HrDefinition;
