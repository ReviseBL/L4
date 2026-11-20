import { describe, expect, it } from 'vitest';
import { shouldYieldAtCrossing } from '../src/systems/traffic/crossing-yield';

const zebra = { left: 421, right: 589, top: 615, bottom: 855 };
const walker = { x: 505, y: 735 };

describe('shouldYieldAtCrossing', () => {
  it('stops an eastbound car just before the stripes when someone is crossing', () => {
    expect(shouldYieldAtCrossing(380, 1, zebra, [walker])).toBe(true);
  });

  it('stops a westbound car on the other side', () => {
    expect(shouldYieldAtCrossing(640, -1, zebra, [walker])).toBe(true);
  });

  it('ignores people away from the zebra and cars far away or already on it', () => {
    expect(shouldYieldAtCrossing(380, 1, zebra, [{ x: 900, y: 735 }])).toBe(false);
    expect(shouldYieldAtCrossing(200, 1, zebra, [walker])).toBe(false);
    expect(shouldYieldAtCrossing(470, 1, zebra, [walker])).toBe(false);
    expect(shouldYieldAtCrossing(380, -1, zebra, [walker])).toBe(false);
  });

  it('also waits for someone stepping off the curb', () => {
    expect(shouldYieldAtCrossing(380, 1, zebra, [{ x: 505, y: 605 }])).toBe(true);
  });
});
