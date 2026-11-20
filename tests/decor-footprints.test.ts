import { describe, expect, it } from 'vitest';
import { decorCollisionBox } from '../src/data/world/decor-footprints';

describe('decorCollisionBox', () => {
  it('puts the footprint on the bottom edge of the image', () => {
    // bench 56×44 centred at y 448 → bottom edge 470, footprint 14 tall.
    expect(decorCollisionBox('world-bench-56x44', 640, 448)).toEqual({ x: 640, y: 463, width: 46, height: 14 });
  });

  it('keeps multi-word names apart from single-word ones', () => {
    expect(decorCollisionBox('world-dead-tree-60x73', 0, 0)?.width).toBe(14);
    expect(decorCollisionBox('world-tree-92x103', 0, 0)?.width).toBe(18);
  });

  it('scales with the image', () => {
    expect(decorCollisionBox('world-bench-56x44', 0, 0, 2)).toEqual({ x: 0, y: 30, width: 92, height: 28 });
  });

  it('leaves shrubs, small street furniture and flat decor walk-through', () => {
    for (const key of ['world-lilac-50x41', 'world-boxwood-30x29', 'world-hedge-76x54', 'world-trash-bin-22x29',
      'world-lamp-32x72', 'world-young-tree-30x59', 'world-flowerbed-36x28', 'world-trzepak-66x57', 'not-art']) {
      expect(decorCollisionBox(key, 0, 0)).toBeNull();
    }
  });
});
