import { describe, expect, it } from 'vitest';
import { BUILDING_WINDOWS, WINDOW_WATCH_CONFIG } from '../src/data/world/building-windows';
import { WindowWatchSystem } from '../src/systems/world/window-watch-system';

const shopWindow = BUILDING_WINDOWS.find((window) => window.id === 'chwilka-1')!;
const homeWindow = BUILDING_WINDOWS.find((window) => window.id === 'home-1')!;
const inFront = (window: typeof shopWindow) => ({ x: window.x, y: window.wallY + 30 });

function standFor(system: WindowWatchSystem, ms: number, at: { x: number; y: number }, moving = false, hidden = false) {
  const events = [];
  for (let t = 0; t < ms; t += 50) {
    const event = system.update(50, at, moving, hidden);
    if (event) events.push(event);
  }
  return events;
}

describe('WindowWatchSystem', () => {
  it('notices Hubi standing still in front of a shop window', () => {
    const system = new WindowWatchSystem(BUILDING_WINDOWS, WINDOW_WATCH_CONFIG);
    const events = standFor(system, WINDOW_WATCH_CONFIG.noticeAfterMs + 100, inFront(shopWindow));
    expect(events).toHaveLength(1);
    expect(events[0]?.window.buildingId).toBe('chwilka');
  });

  it('ignores safe windows, walking past and hiding', () => {
    const system = new WindowWatchSystem(BUILDING_WINDOWS, WINDOW_WATCH_CONFIG);
    expect(standFor(system, 5_000, inFront(homeWindow))).toHaveLength(0);
    expect(standFor(system, 5_000, inFront(shopWindow), true)).toHaveLength(0);
    expect(standFor(system, 5_000, inFront(shopWindow), false, true)).toHaveLength(0);
  });

  it('does not count the inside of the shop or the far sidewalk', () => {
    const system = new WindowWatchSystem(BUILDING_WINDOWS, WINDOW_WATCH_CONFIG);
    expect(system.findWindowInFront({ x: shopWindow.x, y: shopWindow.wallY - 30 })).toBeNull();
    expect(system.findWindowInFront({ x: shopWindow.x, y: shopWindow.wallY + 120 })).toBeNull();
  });

  it('waits out the cooldown before noticing again', () => {
    const system = new WindowWatchSystem(BUILDING_WINDOWS, WINDOW_WATCH_CONFIG);
    const events = standFor(system, WINDOW_WATCH_CONFIG.cooldownMs, inFront(shopWindow));
    expect(events).toHaveLength(1);
  });
});
