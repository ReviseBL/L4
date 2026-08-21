import { describe, expect, it } from 'vitest';
import { PerceptionSystem, VISIBILITY_LEVEL } from '../src/systems/perception-system';

describe('PerceptionSystem', () => {
  it('detects a clear target inside the central field of view', () => {
    const system = new PerceptionSystem([]);
    const result = system.evaluate({
      observer: { x: 0, y: 0 },
      target: { x: 100, y: 0 },
      facingRadians: 0,
      range: 200,
      halfAngleRadians: Math.PI / 4,
    });

    expect(result.visibility).toBe(VISIBILITY_LEVEL.Clear);
  });

  it('marks the edge of the cone as peripheral', () => {
    const system = new PerceptionSystem([]);
    const angle = (38 * Math.PI) / 180;
    const result = system.evaluate({
      observer: { x: 0, y: 0 },
      target: { x: Math.cos(angle) * 100, y: Math.sin(angle) * 100 },
      facingRadians: 0,
      range: 200,
      halfAngleRadians: Math.PI / 4,
    });

    expect(result.visibility).toBe(VISIBILITY_LEVEL.Peripheral);
  });

  it('does not see through an obstacle', () => {
    const system = new PerceptionSystem([{ left: 40, right: 60, top: -20, bottom: 20 }]);
    const result = system.evaluate({
      observer: { x: 0, y: 0 },
      target: { x: 100, y: 0 },
      facingRadians: 0,
      range: 200,
      halfAngleRadians: Math.PI / 4,
    });

    expect(result.visibility).toBe(VISIBILITY_LEVEL.None);
    expect(result.blocked).toBe(true);
  });

  it('never detects a hidden target', () => {
    const system = new PerceptionSystem([]);
    const result = system.evaluate({
      observer: { x: 0, y: 0 },
      target: { x: 50, y: 0 },
      facingRadians: 0,
      range: 200,
      halfAngleRadians: Math.PI / 4,
      targetHidden: true,
    });

    expect(result.visibility).toBe(VISIBILITY_LEVEL.None);
  });
});
