export interface InteractionTarget {
  id: string;
  x: number;
  y: number;
  radius: number;
  prompt: string;
  message: string;
}

export interface InteractionResult {
  target: InteractionTarget;
  message: string;
}

export class InteractionSystem {
  public constructor(private readonly targets: readonly InteractionTarget[]) {}

  public findNearby(
    x: number,
    y: number,
    preferredTargetId: string | null = null,
  ): InteractionTarget | null {
    if (preferredTargetId) {
      const preferredTarget = this.targets.find((target) => target.id === preferredTargetId);

      if (
        preferredTarget &&
        (preferredTarget.x - x) ** 2 + (preferredTarget.y - y) ** 2 <= preferredTarget.radius ** 2
      ) {
        return preferredTarget;
      }
    }

    let closest: InteractionTarget | null = null;
    let closestDistanceSquared = Number.POSITIVE_INFINITY;

    for (const target of this.targets) {
      const distanceSquared = (target.x - x) ** 2 + (target.y - y) ** 2;

      if (distanceSquared <= target.radius ** 2 && distanceSquared < closestDistanceSquared) {
        closest = target;
        closestDistanceSquared = distanceSquared;
      }
    }

    return closest;
  }

  public interact(
    x: number,
    y: number,
    preferredTargetId: string | null = null,
  ): InteractionResult | null {
    const target = this.findNearby(x, y, preferredTargetId);

    return target ? { target, message: target.message } : null;
  }
}
