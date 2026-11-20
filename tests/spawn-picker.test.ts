import { describe, expect, it } from 'vitest';
import { pickSpawnIndex } from '../src/systems/navigation/spawn-picker';

const route = [{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 900, y: 0 }, { x: 1500, y: 0 }];

describe('pickSpawnIndex', () => {
  it('never starts the day next to Hubi', () => {
    for (const roll of [0, 0.3, 0.6, 0.99]) {
      const index = pickSpawnIndex(route, [{ x: 50, y: 0 }], 450, () => roll);
      expect([2, 3]).toContain(index);
    }
  });

  it('varies between the far waypoints with the random roll', () => {
    expect(pickSpawnIndex(route, [{ x: 50, y: 0 }], 450, () => 0)).toBe(2);
    expect(pickSpawnIndex(route, [{ x: 50, y: 0 }], 450, () => 0.9)).toBe(3);
  });

  it('falls back to the farthest waypoint when everything is close', () => {
    expect(pickSpawnIndex(route, [{ x: 700, y: 0 }], 5_000, () => 0)).toBe(3);
  });
});
