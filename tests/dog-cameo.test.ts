import { describe, expect, it } from 'vitest';
import { dogCameoConfig } from '../src/data/easter-eggs/dog-config';
import { DogCameo } from '../src/systems/easter-eggs/dog-cameo';

const sequence = (...values: number[]) => { let i = 0; return () => values[i++ % values.length]!; };

describe('DogCameo', () => {
  it('shows up only in some missions, once, within the time window', () => {
    const cameo = new DogCameo(dogCameoConfig, sequence(0.1, 0.5));
    expect(cameo.startMission()).toBe(true);
    let startedAt = -1;
    for (let t = 0; t < dogCameoConfig.latestMs + 1_000; t += 100) {
      if (cameo.update(100)) { expect(startedAt).toBe(-1); startedAt = t; }
    }
    expect(startedAt).toBeGreaterThanOrEqual(dogCameoConfig.earliestMs - 100);
    expect(startedAt).toBeLessThanOrEqual(dogCameoConfig.latestMs);
    const absent = new DogCameo(dogCameoConfig, () => 0.99);
    expect(absent.startMission()).toBe(false);
    expect(absent.update(dogCameoConfig.latestMs * 2)).toBe(false);
  });

  it('runs across the whole view, off-screen to off-screen, near Hubi', () => {
    const view = { left: 100, right: 1060, top: 200, bottom: 740 };
    const right = new DogCameo(dogCameoConfig, sequence(0.2, 0.5, 0)).planRun(view, 500);
    expect(right.direction).toBe(1);
    expect(right.fromX).toBeLessThan(view.left);
    expect(right.toX).toBeGreaterThan(view.right);
    // Runs along the nearest open strip (the north sidewalk here), not through walls.
    expect(Math.abs(right.y - 583)).toBeLessThanOrEqual(dogCameoConfig.laneSpread * 0.15 + 1);
    const noLane = new DogCameo({ ...dogCameoConfig, lanes: [] }, sequence(0.2, 0.5, 0)).planRun(view, 500);
    expect(Math.abs(noLane.y - 500)).toBeLessThanOrEqual(dogCameoConfig.laneSpread);
    const left = new DogCameo(dogCameoConfig, sequence(0.8, 1, 0.99)).planRun(view, 735);
    expect(left.direction).toBe(-1);
    expect(left.y).toBeLessThanOrEqual(view.bottom - 30);
    expect(dogCameoConfig.barkLines).toContain(left.bark);
  });
});
