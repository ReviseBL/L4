import type { ParcelCodeConfig } from '../../domain/challenges/parcel-code-types';

export const parcelCodeConfig = {
  revealMs: 3_500,
  peekRevealMs: 3_000,
  wrongCodeLockMs: 1_400,
} as const satisfies ParcelCodeConfig;
