import type { FinaleEndingId } from '../../domain/game-state/game-state-types';

const noir = (name: string) => ({ key: `zus-${name}`, url: `assets/zus/zus-${name}.jpg` });

/** Noir boards of the ZUS finale (same style as the opening), loaded by ZusScene. */
export const ZUS_BOARDS = {
  arrival: noir('01-arrival'),
  counter: noir('02-counter'),
  interview: noir('03-interview'),
  psychologist: noir('04-psychologist'),
  doctor: noir('05-doctor'),
  corridor: noir('06-corridor'),
  analysis: noir('07-analysis'),
} as const;

export type ZusBoardId = keyof typeof ZUS_BOARDS;

export const ZUS_ENDING_BOARDS: Readonly<Record<FinaleEndingId, { key: string; url: string }>> = {
  extended: noir('ending-extended'),
  'back-to-work': noir('ending-back-to-work'),
  'hr-meeting': noir('ending-hr'),
  'waiting-forever': noir('ending-waiting'),
};

/** Pixel-art pieces for the examinations. */
export const ZUS_PIXEL_ART = {
  corridorFloor: { key: 'zus-corridor-floor', url: 'assets/zus/zus-corridor-floor.png', width: 790, height: 248 },
  doctor: { key: 'zus-reflex-doctor', url: 'assets/zus/zus-reflex-doctor.png', width: 152, height: 230 },
  /** Herbi on the couch: relaxed, small kick, big kick. */
  leg: { key: 'zus-reflex-leg', url: 'assets/zus/zus-reflex-leg.png', frameWidth: 185, frameHeight: 202 },
} as const;
