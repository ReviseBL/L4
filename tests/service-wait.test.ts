import { describe, expect, it } from 'vitest';
import { serviceWaits } from '../src/data/challenges/service-waits';
import { ServiceWait } from '../src/systems/challenges/service-wait';

const kebab = serviceWaits.kebab!;

describe('ServiceWait', () => {
  it('takes one line length per bubble line and reports ready once', () => {
    const wait = new ServiceWait(kebab);
    expect(wait.getDurationMs()).toBe(kebab.lines.length * kebab.lineMs);
    expect(wait.update(wait.getDurationMs() - 1, true)).toBe(false);
    expect(wait.update(1, true)).toBe(true);
    expect(wait.update(100, true)).toBe(false);
    expect(wait.getCurrentLine()).toBe(kebab.readyLine);
  });

  it('pauses while the player is away', () => {
    const wait = new ServiceWait(kebab);
    wait.update(1_000, true);
    wait.update(60_000, false);
    expect(wait.getProgress()).toBeCloseTo(1_000 / wait.getDurationMs());
    expect(wait.isReady()).toBe(false);
  });

  it('walks through the vendor lines in order', () => {
    const wait = new ServiceWait(kebab);
    expect(wait.getCurrentLine()).toBe(kebab.lines[0]);
    wait.update(kebab.lineMs, true);
    expect(wait.getCurrentLine()).toBe(kebab.lines[1]);
  });
});
