/** NPCs that can catch Hubi in person and demand an explanation. */
export type ConfrontationSource = 'coworker' | 'hr' | 'manager';

export type ExcuseQuality = 'good' | 'bad';

/**
 * When a scene may be used:
 * - carrying: Hubi visibly holds something (package, spool, kebab...)
 * - heavy: Hubi lugs a heavy item (spools, big boxes)
 * Scenes without a requirement fit any situation.
 */
export type ConfrontationRequirement = 'carrying' | 'heavy';

export interface ConfrontationContext {
  carrying: boolean;
  heavy: boolean;
}

export interface ConfrontationExcuse {
  id: string;
  text: string;
  quality: ExcuseQuality;
  /** What the NPC says after hearing this excuse. */
  reply: string;
}

export interface ConfrontationScenario {
  id: string;
  source: ConfrontationSource;
  requires?: ConfrontationRequirement;
  /** NPC's opening line when they catch the player. */
  opening: string;
  /** Exactly one good excuse and at least one bad one. */
  excuses: readonly ConfrontationExcuse[];
}

export interface ConfrontationConfig {
  /** Extra suspicion (on top of the detection itself) for a bad excuse. */
  badExcusePenalty: Readonly<Record<ConfrontationSource, number>>;
  /** How close (px) a chasing NPC must get to count as catching the player. */
  catchDistance: number;
  /** After the talk the NPC ignores the player for this long. */
  releaseGraceMs: number;
  /** How many recent scenarios per NPC are excluded from the next draw. */
  recentMemory: number;
  /** Chance to use a carrying/heavy scene when one fits the situation. */
  situationalPreference: number;
}

export interface PreparedConfrontation {
  scenario: ConfrontationScenario;
  /** Excuses in randomised display order. */
  excuses: readonly ConfrontationExcuse[];
}

export interface ConfrontationOutcome {
  scenarioId: string;
  source: ConfrontationSource;
  excuseId: string;
  quality: ExcuseQuality;
  penalty: number;
  reply: string;
}
