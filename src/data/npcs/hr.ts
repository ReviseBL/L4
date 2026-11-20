import type { HrDefinition } from '../../domain/npcs/hr-types';

export const hrDefinition = {
  id: 'hr-representative',
  displayName: 'HR',
  viewDistance: 360,
  viewHalfAngleDegrees: 90,
  focusHalfAngleDegrees: 44,
  peripheralRangeMultiplier: 0.55,
  patrolSpeed: 98,
  approachSpeed: 130,
  searchSpeed: 112,
  // Needs about a second of clear view before she recognises Hubi.
  recognitionTimeMs: 1_000,
  loseSightTimeMs: 850,
  searchDurationMs: 5_200,
  detectionCooldownMs: 7_000,
  conversationDistance: 58,
  postConversationGraceMs: 12_000,
} as const satisfies HrDefinition;
