import type { NpcDefinition } from '../../domain/npcs/npc-types';

/**
 * A colleague from accounting who jogs along the river in his lunch break.
 * He covers the bottom of the map (the lawn, the river bank and the gaps
 * between the blocks), so the riverside is no longer a free highway.
 * Faster than the office colleague but he sees a little less far.
 */
export const riversideJoggerDefinition = {
  id: 'riverside-jogger',
  enemyType: 'coworker',
  displayName: 'KOLEGA Z KSIĘGOWOŚCI',
  viewDistance: 310,
  viewHalfAngleDegrees: 85,
  focusHalfAngleDegrees: 36,
  peripheralRangeMultiplier: 0.55,
  patrolSpeed: 128,
  detectedSpeed: 168,
  searchSpeed: 120,
  recognitionTimeMs: 700,
  loseSightTimeMs: 900,
  searchDurationMs: 4_000,
  detectionCooldownMs: 6_000,
} as const satisfies NpcDefinition;

/** Blue-ish tint so he does not look like the office colleague (same sprite sheet). */
export const RIVERSIDE_JOGGER_TINT = 0x9ec9ff;
/** He jogs from this month on (month 1 stays the tutorial). */
export const RIVERSIDE_JOGGER_FROM_MONTH = 2;
