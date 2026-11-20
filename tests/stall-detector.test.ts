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
