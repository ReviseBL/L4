import { describe, expect, it } from 'vitest';
import {
  getNpcAnimationDefinitions,
  NPC_DIRECTIONS,
  NPC_SHEET_COLUMNS,
  NPC_SHEET_ROWS,
  NPC_SPRITES,
} from '../src/data/npcs/npc-sprite-config';
import { resolveNpcDirection } from '../src/entities/npc/npc-visual-direction';

describe('NPC sprite configuration', () => {
  it('maps idle and walk for every direction onto valid sheet frames', () => {
    for (const sprite of Object.values(NPC_SPRITES)) {
      const definitions = getNpcAnimationDefinitions(sprite);
      expect(definitions.length).toBe(2 * NPC_DIRECTIONS.length);
      const keys = definitions.map((definition) => definition.key);
      expect(new Set(keys).size).toBe(keys.length);
      const frames = definitions.flatMap((definition) => definition.frames);
      expect(Math.min(...frames)).toBe(0);
      expect(Math.max(...frames)).toBe(NPC_SHEET_COLUMNS * NPC_SHEET_ROWS - 1);
      expect(new Set(frames).size).toBe(NPC_SHEET_COLUMNS * NPC_SHEET_ROWS);
    }
  });

  it('puts the coworker walk-left animation on row 6 of the sheet', () => {
    const walkLeft = getNpcAnimationDefinitions(NPC_SPRITES.coworker).find(
      (definition) => definition.action === 'walk' && definition.direction === 'left',
    );
    expect(walkLeft?.frames).toEqual([36, 37, 38, 39, 40, 41]);
  });
});

describe('NPC visual direction', () => {
  it('follows the dominant axis of movement', () => {
    expect(resolveNpcDirection(-50, 5, 'down')).toBe('left');
    expect(resolveNpcDirection(50, -5, 'down')).toBe('right');
    expect(resolveNpcDirection(3, -60, 'left')).toBe('up');
    expect(resolveNpcDirection(-3, 60, 'right')).toBe('down');
  });

  it('keeps the current axis on near-diagonal movement to avoid flicker', () => {
    expect(resolveNpcDirection(40, 45, 'right')).toBe('right');
    expect(resolveNpcDirection(45, 40, 'down')).toBe('down');
  });

  it('keeps the last direction when there is no vector', () => {
    expect(resolveNpcDirection(0, 0, 'up')).toBe('up');
  });
});
