import { describe, expect, it } from 'vitest';
import { navigationBuildings } from '../src/data/world/navigation-buildings';
import { nextWaypoint } from '../src/systems/navigation/door-router';

const home = navigationBuildings[0];
const pharmacy = navigationBuildings[3];

describe('nextWaypoint', () => {
  it('walks straight when no building is involved', () => {
    expect(nextWaypoint({ x: 600, y: 700 }, { x: 900, y: 700 }, navigationBuildings)).toEqual({ x: 900, y: 700 });
  });

  it('leaves a building through its door (inner point, then outer point)', () => {
    const inside = { x: 200, y: 200 };
    const outside = { x: 650, y: 575 };
    expect(nextWaypoint(inside, outside, navigationBuildings)).toEqual(home.doorInside);
    expect(nextWaypoint(home.doorInside, outside, navigationBuildings)).toEqual(home.doorOutside);
    expect(nextWaypoint(home.doorOutside, outside, navigationBuildings)).toEqual(outside);
  });

  it('enters a building through its door when chasing inside', () => {
    const street = { x: 780, y: 900 };
    const counter = { x: 860, y: 1100 };
    expect(nextWaypoint(street, counter, navigationBuildings)).toEqual(pharmacy.doorOutside);
    expect(nextWaypoint(pharmacy.doorOutside, counter, navigationBuildings)).toEqual(pharmacy.doorInside);
    expect(nextWaypoint(pharmacy.doorInside, counter, navigationBuildings)).toEqual(counter);
  });

  it('door points are inside and outside their building', () => {
    for (const building of navigationBuildings) {
      const inside = Math.abs(building.doorInside.y - building.y) <= building.height / 2;
      const outside = Math.abs(building.doorOutside.y - building.y) > building.height / 2;
      expect(inside && outside).toBe(true);
    }
  });
});
