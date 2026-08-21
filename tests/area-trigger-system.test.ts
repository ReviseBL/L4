import { describe, expect, it } from 'vitest';
import { AreaTriggerSystem } from '../src/systems/area-trigger-system';

describe('AreaTriggerSystem', () => {
  it('emits only when entering an area', () => {
    const system = new AreaTriggerSystem([{ id: 'home', x: 0, y: 0, width: 100, height: 100 }]);

    expect(system.update({ x: 0, y: 0 })).toEqual(['home']);
    expect(system.update({ x: 10, y: 10 })).toEqual([]);
    expect(system.update({ x: 100, y: 100 })).toEqual([]);
    expect(system.update({ x: 0, y: 0 })).toEqual(['home']);
  });
});
