import { describe, expect, it } from 'vitest';
import {
  getHubiAnimationKey,
  HUBI_ANIMATION_DEFINITIONS,
  HUBI_FRAME_HEIGHT,
  HUBI_FRAME_WIDTH,
  HUBI_ORIGIN,
  HUBI_PHYSICS_BODY,
  PLAYER_DIRECTIONS,
} from '../src/data/player/player-animation-config';

describe('Hubi animation configuration', () => {
  it('matches the frozen player frame and physics geometry', () => {
    expect({ width: HUBI_FRAME_WIDTH, height: HUBI_FRAME_HEIGHT }).toEqual({ width: 32, height: 44 });
    expect(HUBI_ORIGIN).toEqual({ x: 0.5, y: 0.5 });
    expect(HUBI_PHYSICS_BODY).toEqual({ width: 24, height: 25, offsetX: 4, offsetY: 17 });
  });

  it('defines every production animation for all four directions', () => {
    const actions = ['idle', 'walk', 'sprint', 'carry-idle', 'carry-walk', 'phone', 'interact'] as const;
    for (const action of actions) {
      for (const direction of PLAYER_DIRECTIONS) {
        expect(HUBI_ANIMATION_DEFINITIONS.some((definition) =>
          definition.action === action && definition.direction === direction,
        )).toBe(true);
      }
    }
  });

  it('uses unique stable animation keys and valid sheet frames', () => {
    const keys = HUBI_ANIMATION_DEFINITIONS.map((definition) =>
      getHubiAnimationKey(definition.action, definition.direction),
    );
    const frames = HUBI_ANIMATION_DEFINITIONS.flatMap((definition) => definition.frames);
    expect(new Set(keys).size).toBe(keys.length);
    expect(Math.min(...frames)).toBe(0);
    expect(Math.max(...frames)).toBe(103);
    expect(new Set(frames).size).toBe(104);
  });
});

