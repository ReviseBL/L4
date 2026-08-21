import { describe, expect, it } from 'vitest';
import { resolvePlayerVisualState } from '../src/entities/player/player-visual-state';
import type { PlayerVisualStateInput } from '../src/domain/player/player-visual-types';

const base: PlayerVisualStateInput = {
  direction: 'left',
  moving: false,
  sprinting: false,
  carrying: false,
  phoneActive: false,
  hidden: false,
  interacting: false,
};

describe('player visual state', () => {
  it('keeps the last direction while idle', () => {
    expect(resolvePlayerVisualState(base)).toEqual({
      action: 'idle',
      direction: 'left',
      hidden: false,
    });
  });

  it('uses sprint only for moving player without a higher-priority state', () => {
    expect(resolvePlayerVisualState({ ...base, moving: true, sprinting: true }).action).toBe('sprint');
  });

  it('uses carry movement instead of the regular movement animation', () => {
    expect(resolvePlayerVisualState({ ...base, carrying: true, moving: true, sprinting: true }).action)
      .toBe('carry-walk');
  });

  it('gives phone priority over carry and sprint', () => {
    expect(resolvePlayerVisualState({
      ...base,
      carrying: true,
      phoneActive: true,
      moving: true,
      sprinting: true,
    }).action).toBe('phone');
  });

  it('preserves hidden presentation without changing the selected movement direction', () => {
    expect(resolvePlayerVisualState({ ...base, hidden: true })).toEqual({
      action: 'idle',
      direction: 'left',
      hidden: true,
    });
  });
});

