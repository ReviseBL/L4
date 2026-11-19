import { describe, expect, it } from 'vitest';
import { callNoiseConfig } from '../src/data/phone/call-noise-config';
import { suspicionConfig } from '../src/data/suspicion/suspicion-config';
import { evaluateCallNoise } from '../src/systems/call-noise-system';

const noCars: { x: number; y: number }[] = [];

describe('evaluateCallNoise', () => {
  it('is quiet inside buildings even right next to the street', () => {
    const result = evaluateCallNoise({ position: { x: 285, y: 470 }, hidden: false, cars: [{ x: 300, y: 560 }] }, callNoiseConfig);
    expect(result).toEqual({ loud: false, reason: 'indoors', zoneId: 'home' });
  });

  it('is loud on the street and the sidewalks along it', () => {
    expect(evaluateCallNoise({ position: { x: 900, y: 735 }, hidden: false, cars: noCars }, callNoiseConfig).reason).toBe('street');
    expect(evaluateCallNoise({ position: { x: 900, y: 575 }, hidden: false, cars: noCars }, callNoiseConfig).loud).toBe(true);
    expect(evaluateCallNoise({ position: { x: 900, y: 895 }, hidden: false, cars: noCars }, callNoiseConfig).loud).toBe(true);
  });

  it('is quiet when hiding, even on the street', () => {
    expect(evaluateCallNoise({ position: { x: 900, y: 735 }, hidden: true, cars: noCars }, callNoiseConfig)).toEqual({
      loud: false,
      reason: 'hidden',
      zoneId: null,
    });
  });

  it('hears a nearby company car away from the street', () => {
    const position = { x: 1600, y: 1050 };
    expect(evaluateCallNoise({ position, hidden: false, cars: noCars }, callNoiseConfig).loud).toBe(false);
    expect(evaluateCallNoise({ position, hidden: false, cars: [{ x: 1700, y: 1050 }] }, callNoiseConfig).reason).toBe('car');
  });

  it('has a centrally configured suspicion value for a noisy call', () => {
    expect(suspicionConfig.suspicionEvents.noisyWorkCall).toBeGreaterThan(suspicionConfig.suspicionEvents.missedWorkCall);
  });
});
