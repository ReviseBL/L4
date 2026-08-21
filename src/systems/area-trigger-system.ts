import type { Point2D } from '../core/math/geometry-types';

export interface AreaDefinition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class AreaTriggerSystem {
  private readonly activeAreas = new Set<string>();

  public constructor(private readonly areas: readonly AreaDefinition[]) {}

  public update(position: Point2D): readonly string[] {
    const entered: string[] = [];

    for (const area of this.areas) {
      const inside =
        Math.abs(position.x - area.x) <= area.width / 2 &&
        Math.abs(position.y - area.y) <= area.height / 2;
      const wasInside = this.activeAreas.has(area.id);

      if (inside && !wasInside) {
        this.activeAreas.add(area.id);
        entered.push(area.id);
      } else if (!inside && wasInside) {
        this.activeAreas.delete(area.id);
      }
    }

    return entered;
  }
}
