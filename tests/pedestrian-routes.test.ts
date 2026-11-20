import { describe, expect, it } from 'vitest';
import { joinWalks, NORTH_SIDEWALK_PATH, SOUTH_SIDEWALK_PATH, walkAlong, ZEBRA_CROSSING } from '../src/data/world/pedestrian-routes';

const onRoad = (y: number) => y > ZEBRA_CROSSING.top && y < ZEBRA_CROSSING.bottom;

describe('pedestrian routes', () => {
  it('keeps the detour corners between the end points', () => {
    expect(walkAlong(NORTH_SIDEWALK_PATH, 1100, 1500)).toEqual([
      { x: 1100, y: 583 }, { x: 1195, y: 583 }, { x: 1205, y: 518 }, { x: 1335, y: 518 }, { x: 1345, y: 583 }, { x: 1500, y: 583 },
    ]);
  });

  it('walks backwards when fromX is east of toX', () => {
    const walk = walkAlong(NORTH_SIDEWALK_PATH, 1500, 900);
    expect(walk[0]).toEqual({ x: 1500, y: 583 });
    expect(walk[1]).toEqual({ x: 1345, y: 583 });
    expect(walk[walk.length - 1]).toEqual({ x: 900, y: 583 });
    expect(walkAlong(SOUTH_SIDEWALK_PATH, 1300, 900)).toEqual([{ x: 1300, y: 878 }, { x: 900, y: 878 }]);
  });

  it('a joined loop leaves the sidewalks only on the zebra', () => {
    const loop = joinWalks(
      walkAlong(NORTH_SIDEWALK_PATH, ZEBRA_CROSSING.walkX, 2000),
      walkAlong(NORTH_SIDEWALK_PATH, 2000, ZEBRA_CROSSING.walkX),
      walkAlong(SOUTH_SIDEWALK_PATH, ZEBRA_CROSSING.walkX, 2000),
      walkAlong(SOUTH_SIDEWALK_PATH, 2000, ZEBRA_CROSSING.walkX),
    );
    loop.forEach((point, index) => {
      const next = loop[(index + 1) % loop.length]!;
      expect(onRoad(point.y)).toBe(false);
      const crossesStreet = (point.y < ZEBRA_CROSSING.top) !== (next.y < ZEBRA_CROSSING.top);
      if (crossesStreet) {
        expect(point.x).toBe(ZEBRA_CROSSING.walkX);
        expect(next.x).toBe(ZEBRA_CROSSING.walkX);
      }
    });
    expect(loop[0]).not.toEqual(loop[loop.length - 1]);
  });
});
