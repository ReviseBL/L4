import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '../src/core/math/seeded-random';
import { MIODZIK_SPOTS, miodzikConfig } from '../src/data/easter-eggs/dog-config';
import { Miodzik } from '../src/systems/easter-eggs/miodzik';

describe('Miodzik', () => {
  it('is out only in some missions, in one of the spots', () => {
    expect(new Miodzik(miodzikConfig, MIODZIK_SPOTS, () => 0.99).startMission()).toBeNull();
    const spot = new Miodzik(miodzikConfig, MIODZIK_SPOTS, () => 0.1).startMission();
    expect(MIODZIK_SPOTS).toContain(spot);
  });

  it('stands, sits, barks now and then and sometimes pees (leaving a puddle)', () => {
    const dog = new Miodzik(miodzikConfig, MIODZIK_SPOTS, createSeededRandom(4));
    while (!dog.startMission()) { /* roll until he is out */ }
    const poses = new Set<string>();
    let barks = 0;
    let puddles = 0;
    for (let t = 0; t < 600_000; t += 100) {
      const frame = dog.update(100);
      poses.add(frame.pose);
      if (frame.bark) { barks += 1; expect(miodzikConfig.barkLines).toContain(frame.bark); }
      if (frame.puddle) puddles += 1;
    }
    expect([...poses].sort()).toEqual(['pee', 'sit', 'stand']);
    expect(barks).toBeGreaterThan(600_000 / miodzikConfig.barkEveryMs[1]);
    expect(puddles).toBeGreaterThan(0);
  });

  it('stays still and quiet on a day he is not out', () => {
    const dog = new Miodzik(miodzikConfig, MIODZIK_SPOTS, () => 0.99);
    dog.startMission();
    expect(dog.update(60_000)).toEqual({ pose: 'stand', bark: null, puddle: false });
  });
});
