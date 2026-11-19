export interface ParcelCodeConfig {
  /** First look at the SMS (ms). */
  revealMs: number;
  /** Looking again costs this much time standing at the locker (ms). */
  peekRevealMs: number;
  /** Short lock after a wrong code while the screen complains (ms). */
  wrongCodeLockMs: number;
}

export type ParcelCodePhase = 'reveal' | 'input' | 'wrong' | 'done';
