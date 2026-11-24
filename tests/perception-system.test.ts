import { describe, expect, it } from 'vitest';
import {
  PerceptionSystem,
  VISIBILITY_LEVEL,
  getVisionRangeFactor,
} from '../src/systems/perception-system';

const HUMAN_PROFILE = {
  focusHalfAngleRadians: (40 * Math.PI) / 180,
  peripheralRangeMultiplier: 0.5,
};

function pointAt(degrees: number, distance: number) {
  const angle = (degrees * Math.PI) / 180;
  return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
}

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

  describe('human vision profile (180°)', () => {
    const base = {
      observer: { x: 0, y: 0 },
      facingRadians: 0,
      range: 200,
      halfAngleRadians: Math.PI / 2,
      profile: HUMAN_PROFILE,
    };

    it('sees at full range inside the focus cone', () => {
      const system = new PerceptionSystem([]);
      expect(system.evaluate({ ...base, target: pointAt(10, 150) }).visibility).toBe(VISIBILITY_LEVEL.Clear);
    });

    it('notices a nearby target at the side only as peripheral', () => {
      const system = new PerceptionSystem([]);
      expect(system.evaluate({ ...base, target: pointAt(80, 60) }).visibility).toBe(VISIBILITY_LEVEL.Peripheral);
    });

    it('does not see a distant target at the side', () => {
      const system = new PerceptionSystem([]);
      expect(system.evaluate({ ...base, target: pointAt(80, 150) }).visibility).toBe(VISIBILITY_LEVEL.None);
    });

    it('never sees behind the observer', () => {
      const system = new PerceptionSystem([]);
      expect(system.evaluate({ ...base, target: pointAt(120, 30) }).visibility).toBe(VISIBILITY_LEVEL.None);
    });

    it('shapes the drawn cone with long centre and short wings', () => {
      const system = new PerceptionSystem([]);
      const rays = system.castVisionRays({ x: 0, y: 0 }, 0, Math.PI / 2, 200, 18, HUMAN_PROFILE);
      const centre = rays[9]!;
      const edge = rays[0]!;
      expect(Math.hypot(centre.x, centre.y)).toBeCloseTo(200, 0);
      expect(Math.hypot(edge.x, edge.y)).toBeCloseTo(100, 0);
      expect(getVisionRangeFactor(0, HUMAN_PROFILE)).toBe(1);
      expect(getVisionRangeFactor(Math.PI / 2, HUMAN_PROFILE)).toBe(0.5);
    });
  });

  it('treats a doorway as a closed door unless the observer stands at the doorstep', () => {
    const door = { left: 90, right: 110, top: 190, bottom: 210, transparentWithin: 60 };
    const system = new PerceptionSystem([door]);
    const inside = { x: 100, y: 120 };
    const query = (observer: { x: number; y: number }) => system.evaluate({
      observer, target: inside, facingRadians: Math.atan2(inside.y - observer.y, inside.x - observer.x), range: 500, halfAngleRadians: Math.PI / 2,
    });
    expect(query({ x: 100, y: 420 }).blocked).toBe(true);
    expect(query({ x: 100, y: 245 }).visibility).not.toBe('NONE');
    expect(system.hasLineOfSight({ x: 100, y: 420 }, inside)).toBe(false);
  });
});
