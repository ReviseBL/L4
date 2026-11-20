import { describe, expect, it } from 'vitest';
import { STALL_LIMIT_MS, StallDetector } from '../src/systems/navigation/stall-detector';

describe('StallDetector', () => {
  const target = { x: 100, y: 0 };

  it('reports a stall after pushing in place for the limit', () => {
    const detector = new StallDetector();
    detector.update(16, { x: 0, y: 0 }, target);
    let stalled = false;
    for (let ms = 0; ms < STALL_LIMIT_MS + 32 && !stalled; ms += 16) stalled = detector.update(16, { x: 0, y: 0 }, target);
    expect(stalled).toBe(true);
  });

  it('stays quiet while the NPC makes progress', () => {
    const detector = new StallDetector();
    let stalled = false;
    for (let step = 0; step < 100; step += 1) stalled ||= detector.update(16, { x: step, y: 0 }, target);
    expect(stalled).toBe(false);
  });

  it('starts over when the target changes', () => {
    const detector = new StallDetector();
    for (let ms = 0; ms < STALL_LIMIT_MS - 100; ms += 16) detector.update(16, { x: 0, y: 0 }, target);
    expect(detector.update(16, { x: 0, y: 0 }, { x: 0, y: 100 })).toBe(false);
    expect(detector.update(200, { x: 0, y: 0 }, { x: 0, y: 100 })).toBe(false);
  });
});

describe('ObstacleAvoider', () => {
  const blocked = { x: 0, y: 0 };
  const target = { x: 10, y: -200 };

  it('sidesteps towards the target side before giving up', async () => {
    const { ObstacleAvoider, SIDESTEP_MS, SIDESTEPS_BEFORE_GIVING_UP } = await import('../src/systems/navigation/stall-detector');
    const avoider = new ObstacleAvoider();
    const decisions: string[] = [];
    let firstSidestep: { x: number; y: number } | null = null;
    for (let t = 0; t < (STALL_LIMIT_MS + SIDESTEP_MS) * (SIDESTEPS_BEFORE_GIVING_UP + 1) + 500; t += 50) {
      const decision = avoider.update(50, blocked, target, { x: 0, y: -50 });
      if (decision.type !== 'go' && decisions[decisions.length - 1] !== decision.type) decisions.push(decision.type);
      if (decision.type === 'sidestep' && !firstSidestep) firstSidestep = decision.direction;
    }
    expect(firstSidestep?.x).toBeGreaterThan(0);
    expect(decisions.slice(0, 2)).toEqual(['sidestep', 'give-up']);
  });

  it('just goes while the NPC moves', async () => {
    const { ObstacleAvoider } = await import('../src/systems/navigation/stall-detector');
    const avoider = new ObstacleAvoider();
    for (let step = 0; step < 100; step += 1) {
      expect(avoider.update(16, { x: 0, y: -step }, target, { x: 0, y: -step - 10 }).type).toBe('go');
    }
  });
});
