import type { PlayerDirection } from '../../domain/player/player-visual-types';

/** Próg prędkości, poniżej którego NPC uznajemy za stojącego. */
export const NPC_MOVING_SPEED_THRESHOLD = 4;

const isHorizontal = (direction: PlayerDirection): boolean => direction === 'left' || direction === 'right';

/**
 * Kierunek animacji z wektora ruchu lub patrzenia. Dominuje dłuższa oś; przy ruchu
 * prawie po skosie zostaje dotychczasowa oś (histereza), żeby sprite nie migotał.
 */
export function resolveNpcDirection(
  x: number,
  y: number,
  current: PlayerDirection,
  hysteresis = 1.25,
): PlayerDirection {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  if (ax < 0.001 && ay < 0.001) return current;

  let horizontal = ax >= ay;
  if (isHorizontal(current) && ax * hysteresis >= ay) horizontal = true;
  else if (!isHorizontal(current) && ay * hysteresis >= ax) horizontal = false;

  if (horizontal) return x < 0 ? 'left' : 'right';
  return y < 0 ? 'up' : 'down';
}
