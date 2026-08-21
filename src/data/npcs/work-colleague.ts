import type { NpcDefinition } from '../../domain/npcs/npc-types';

export const workColleagueDefinition = {
  id: 'work-colleague',
  enemyType: 'coworker',
  displayName: 'KOLEGA Z PRACY',
  viewDistance: 350,
  viewHalfAngleDegrees: 38,
  patrolSpeed: 92,
  detectedSpeed: 150,
  searchSpeed: 112,
  recognitionTimeMs: 650,
  loseSightTimeMs: 900,
  searchDurationMs: 4_500,
  detectionCooldownMs: 6_000,
} as const satisfies NpcDefinition;
