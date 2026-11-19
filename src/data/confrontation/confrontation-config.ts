import type { ConfrontationConfig } from '../../domain/confrontation/confrontation-types';

export const confrontationConfig = {
  badExcusePenalty: {
    coworker: 4,
    hr: 5,
    manager: 7,
  },
  catchDistance: 40,
  releaseGraceMs: 5_000,
  recentMemory: 4,
  situationalPreference: 0.6,
} as const satisfies ConfrontationConfig;
