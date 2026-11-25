import type { StaminaConfig } from '../../systems/player/stamina';

/**
 * Herbi is not built for running: about two and a half seconds of sprint,
 * then he has to catch his breath until a third of the tank is back.
 */
export const staminaConfig: StaminaConfig = {
  sprintMs: 2_600,
  recoverWalkingMs: 6_500,
  recoverStandingMs: 4_000,
  exhaustedUntil: 0.35,
};

export const STAMINA_LINES = {
  exhausted: 'Herbi łapie zadyszkę. Sprint chwilowo niedostępny.',
} as const;
