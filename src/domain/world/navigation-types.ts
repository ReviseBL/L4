import type { Point2D } from '../../core/math/geometry-types';

/** A walk-in building: interior rectangle (centre + size) and its single door. */
export interface NavigationBuilding {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Just inside the doorway. */
  doorInside: Point2D;
  /** Just outside the doorway. */
  doorOutside: Point2D;
}
