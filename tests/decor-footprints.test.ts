import { describe, expect, it } from 'vitest';
import { decorCollisionBox } from '../src/data/world/decor-footprints';

describe('decorCollisionBox', () => {
  it('puts the footprint on the bottom edge of the image', () => {
    // bench 56×44 centred at y 448 → bottom edge 470, footprint 14 tall.
    expect(decorCollisionBox('world-bench-56x44', 640, 448)).toEqual({ x: 640, y: 463, width: 46, height: 14 });
  });

  it('keeps multi-word names apart from single-word ones', () => {
    expect(decorCollisionBox('world-young-tree-30x59', 0, 0)?.width).toBe(10);
    expect(decorCollisionBox('world-tree-92x103', 0, 0)?.width).toBe(18);
  });

  it('scales with the image', () => {
    expect(decorCollisionBox('world-lilac-50x41', 0, 0, 2)).toEqual({ x: 0, y: 27, width: 76, height: 28 });
  });

  it('leaves flat decor walk-through', () => {
    expect(decorCollisionBox('world-flowerbed-36x28', 0, 0)).toBeNull();
    expect(decorCollisionBox('world-trzepak-66x57', 0, 0)).toBeNull();
    expect(decorCollisionBox('not-art', 0, 0)).toBeNull();
  });
});
