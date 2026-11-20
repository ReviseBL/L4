import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '../src/core/math/seeded-random';
import { scatterGreenery } from '../src/systems/world/greenery-scatter';

const options = {
  zones: [{ left: 0, top: 0, right: 400, bottom: 400 }],
  kinds: [{ key: 'a', weight: 1, height: 20 }, { key: 'b', weight: 1, height: 10, flat: true }],
  blockers: [{ x: 200, y: 200, radius: 60 }],
  keepOut: [{ left: 0, top: 0, right: 100, bottom: 100 }],
  count: 12,
  minSpacing: 40,
};

describe('scatterGreenery', () => {
  it('is stable for a seed', () => {
    expect(scatterGreenery(createSeededRandom(5), options)).toEqual(scatterGreenery(createSeededRandom(5), options));
  });

  it('respects zones, spacing, blockers and keep-out areas', () => {
    const placed = scatterGreenery(createSeededRandom(9), options);
    expect(placed.length).toBeGreaterThan(5);
    for (const item of placed) {
      expect(item.x >= 0 && item.x <= 400 && item.y >= 0 && item.y <= 400).toBe(true);
      expect(item.x <= 100 && item.y <= 100).toBe(false);
      expect(Math.hypot(item.x - 200, item.y - 200)).toBeGreaterThanOrEqual(60);
      for (const other of placed) {
        if (other !== item) expect(Math.hypot(other.x - item.x, other.y - item.y)).toBeGreaterThanOrEqual(40);
      }
      expect(item.depth).toBe(item.key === 'b' ? 2 : item.y + 10);
    }
  });
});
