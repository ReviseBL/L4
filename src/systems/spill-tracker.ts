export type SpillEvent = 'started-spilling' | 'emptied';

export interface DeliveredSpillable {
  itemId: string;
  /** 0..1 of a full cup. */
  fullness: number;
}

/**
 * Tracks how full an open cup is while Herbi carries it. Only sprinting spills.
 * When the item leaves the inventory, the final fullness is kept for the
 * mission summary. Pure logic: the scene feeds it the carried item each frame.
 */
export class SpillTracker {
  private itemId: string | null = null;
  private fullness = 1;
  private warned = false;
  private delivered: DeliveredSpillable | null = null;

  public update(
    deltaMs: number,
    carried: { id: string; sprintDrainPerSecond: number } | null,
    sprinting: boolean,
  ): SpillEvent[] {
    if (!carried) {
      if (this.itemId) {
        this.delivered = { itemId: this.itemId, fullness: this.fullness };
        this.itemId = null;
      }
      return [];
    }
    if (this.itemId !== carried.id) {
      this.itemId = carried.id;
      this.fullness = 1;
      this.warned = false;
      this.delivered = null;
    }
    if (!sprinting || this.fullness <= 0) return [];

    const events: SpillEvent[] = [];
    this.fullness = Math.max(0, this.fullness - carried.sprintDrainPerSecond * (deltaMs / 1000));
    if (!this.warned) {
      this.warned = true;
      events.push('started-spilling');
    }
    if (this.fullness === 0) events.push('emptied');
    return events;
  }

  public getFullness(): number | null {
    return this.itemId ? this.fullness : null;
  }

  /** Returns the last delivered cup once (for the mission summary). */
  public takeDelivered(): DeliveredSpillable | null {
    const delivered = this.delivered;
    this.delivered = null;
    return delivered;
  }
}
