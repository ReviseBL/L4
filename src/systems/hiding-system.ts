import type { Point2D } from '../core/math/geometry-types';

export interface HideSpot extends Point2D {
  id: string;
  radius: number;
  label: string;
  /** Where Herbi crouches when he hides here (behind the object), if not where he stands. */
  tuckAt?: Point2D;
  /** Draw depth while tucked in, just below the object's art, so it covers him. */
  tuckDepth?: number;
}

export type HidingToggleResult =
  | { type: 'entered'; spot: HideSpot }
  | { type: 'exited'; spot: HideSpot }
  | { type: 'blocked'; spot: HideSpot }
  | { type: 'unavailable' };

export class HidingSystem {
  private activeSpot: HideSpot | null = null;
  private unavailableSpotIds = new Set<string>();

  public constructor(private readonly spots: readonly HideSpot[]) {}

  public findNearby(position: Point2D): HideSpot | null {
    return (
      this.spots.find(
        (spot) => (spot.x - position.x) ** 2 + (spot.y - position.y) ** 2 <= spot.radius ** 2,
      ) ?? null
    );
  }

  public toggle(position: Point2D): HidingToggleResult {
    if (this.activeSpot) {
      const spot = this.activeSpot;
      this.activeSpot = null;
      return { type: 'exited', spot };
    }

    const nearbySpot = this.findNearby(position);

    if (!nearbySpot) {
      return { type: 'unavailable' };
    }

    if (!this.isAvailable(nearbySpot)) {
      return { type: 'blocked', spot: nearbySpot };
    }

    this.activeSpot = nearbySpot;
    return { type: 'entered', spot: nearbySpot };
  }

  public isHidden(): boolean {
    return this.activeSpot !== null;
  }

  public isAvailable(spot: HideSpot): boolean {
    return !this.unavailableSpotIds.has(spot.id);
  }

  public setUnavailableSpotIds(ids: readonly string[]): void {
    this.unavailableSpotIds = new Set(ids);
  }
}
