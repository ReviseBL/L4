import { describe, expect, it } from 'vitest';
import { HidingSystem } from '../src/systems/hiding-system';

describe('HidingSystem', () => {
  it('enters and exits a nearby hide spot', () => {
    const system = new HidingSystem([
      { id: 'test-hide', x: 10, y: 10, radius: 30, label: 'Test hide spot' },
    ]);

    expect(system.toggle({ x: 12, y: 12 }).type).toBe('entered');
    expect(system.isHidden()).toBe(true);
    expect(system.toggle({ x: 12, y: 12 }).type).toBe('exited');
    expect(system.isHidden()).toBe(false);
  });

  it('does not hide the player away from a hide spot', () => {
    const system = new HidingSystem([
      { id: 'test-hide', x: 10, y: 10, radius: 20, label: 'Test hide spot' },
    ]);

    expect(system.toggle({ x: 100, y: 100 }).type).toBe('unavailable');
    expect(system.isHidden()).toBe(false);
  });

  it('blocks selected hide spots while carrying a large item', () => {
    const spot = { id: 'small-hide', x: 10, y: 10, radius: 20, label: 'Small hide spot' };
    const system = new HidingSystem([spot]);
    system.setUnavailableSpotIds([spot.id]);

    expect(system.toggle({ x: 10, y: 10 }).type).toBe('blocked');
    expect(system.isHidden()).toBe(false);
  });
});
