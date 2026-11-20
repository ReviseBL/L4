import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '../src/core/math/seeded-random';
import { RIVER_TRASH } from '../src/data/world/river';
import { RiverTrashDrift } from '../src/systems/world/river-trash';

describe('RiverTrashDrift', () => {
  it('starts with a few items and keeps them in the water lane', () => {
    const drift = new RiverTrashDrift(RIVER_TRASH, 2200, createSeededRandom(3));
    expect(drift.getItems()).toHaveLength(RIVER_TRASH.initialCount);
    for (const item of drift.getItems()) {
      expect(item.y).toBeGreaterThanOrEqual(RIVER_TRASH.laneTop);
      expect(item.y).toBeLessThanOrEqual(RIVER_TRASH.laneBottom);
      expect(RIVER_TRASH.textureKeys).toContain(item.key);
    }
  });

  it('floats downstream, sends new rubbish now and then and drops what left the map', () => {
    const drift = new RiverTrashDrift(RIVER_TRASH, 2200, createSeededRandom(8));
    const spawned = new Set<object>();
    for (let t = 0; t < 200_000; t += 100) for (const item of drift.update(100)) spawned.add(item);
    expect(spawned.size).toBeGreaterThan(200_000 / RIVER_TRASH.maxIntervalMs);
    expect(drift.getItems().every((item) => item.x <= 2240)).toBe(true);
    expect(drift.getItems().length).toBeLessThan(20);
  });
});
