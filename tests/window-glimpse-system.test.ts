import { describe, expect, it } from 'vitest';
import { BUILDING_WINDOWS, WINDOW_GLIMPSE_CONFIG } from '../src/data/world/building-windows';
import { WindowGlimpseSystem } from '../src/systems/world/window-glimpse-system';

const rooms = [
  { buildingId: 'chwilka', left: 790, right: 1150, top: 150, bottom: 480 },
  { buildingId: 'home', left: 70, right: 500, top: 90, bottom: 480 },
];
const insideShop = { x: 840, y: 420 };
const lookingUp = { id: 'coworker', position: { x: 830, y: 583 }, facingRadians: -Math.PI / 2, range: 400, halfAngleRadians: Math.PI / 2 };

describe('WindowGlimpseSystem', () => {
  it('lets a chaser outside glimpse Hubi through a shop window and sends him to look around', () => {
    const system = new WindowGlimpseSystem(BUILDING_WINDOWS, rooms, WINDOW_GLIMPSE_CONFIG);
    const [glimpse] = system.update(16, insideShop, false, [lookingUp]);
    expect(glimpse?.window.buildingId).toBe('chwilka');
    expect(glimpse?.lookFrom.y).toBeGreaterThan(480);
  });

  it('cannot see through home windows, solid wall, behind its back or while Hubi hides', () => {
    const system = new WindowGlimpseSystem(BUILDING_WINDOWS, rooms, WINDOW_GLIMPSE_CONFIG);
    expect(system.update(16, { x: 140, y: 420 }, false, [{ ...lookingUp, position: { x: 140, y: 583 } }])).toEqual([]);
    expect(system.update(16, { x: 1000, y: 420 }, false, [{ ...lookingUp, position: { x: 1000, y: 583 } }])).toEqual([]);
    expect(system.update(16, insideShop, false, [{ ...lookingUp, facingRadians: Math.PI / 2 }])).toEqual([]);
    expect(system.update(16, insideShop, true, [lookingUp])).toEqual([]);
  });

  it('waits out the cooldown before the same NPC glimpses again', () => {
    const system = new WindowGlimpseSystem(BUILDING_WINDOWS, rooms, WINDOW_GLIMPSE_CONFIG);
    expect(system.update(16, insideShop, false, [lookingUp])).toHaveLength(1);
    expect(system.update(WINDOW_GLIMPSE_CONFIG.cooldownMs - 100, insideShop, false, [lookingUp])).toEqual([]);
    expect(system.update(200, insideShop, false, [lookingUp])).toHaveLength(1);
  });
});
