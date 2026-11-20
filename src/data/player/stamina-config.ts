import type { StaminaConfig } from '../../systems/player/stamina';

/**
 * Hubi is not built for running: about two and a half seconds of sprint,
 * then he has to catch his breath until a third of the tank is back.
 */
export const staminaConfig: StaminaConfig = {
  sprintMs: 2_600,
  recoverWalkingMs: 6_500,
  recoverStandingMs: 4_000,
  exhaustedUntil: 0.35,
};

export const STAMINA_LINES = {
  exhausted: 'Hubi łapie zadyszkę. Sprint chwilowo niedostępny.',
} as const;
