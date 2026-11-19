import type { ItemDefinition } from '../domain/items/item-types';

export class InventorySystem {
  private readonly definitions = new Map<string, ItemDefinition>();
  private readonly quantities = new Map<string, number>();

  public constructor(
    definitions: readonly ItemDefinition[],
    initialQuantities: Readonly<Record<string, number>> = {},
  ) {
    for (const definition of definitions) {
      this.definitions.set(definition.id, definition);
    }

    for (const [itemId, quantity] of Object.entries(initialQuantities)) {
      if (this.definitions.has(itemId) && Number.isInteger(quantity) && quantity > 0) {
        this.quantities.set(itemId, quantity);
      }
    }
  }

  public add(itemId: string, quantity = 1): void {
    this.requireDefinition(itemId);
    this.quantities.set(itemId, (this.quantities.get(itemId) ?? 0) + quantity);
  }

  public remove(itemId: string, quantity = 1): void {
    this.requireDefinition(itemId);
    const current = this.quantities.get(itemId) ?? 0;
    const next = Math.max(0, current - quantity);

    if (next === 0) {
      this.quantities.delete(itemId);
    } else {
      this.quantities.set(itemId, next);
    }
  }

  public has(itemId: string, quantity = 1): boolean {
    return (this.quantities.get(itemId) ?? 0) >= quantity;
  }

  public getDisplayText(): string {
    const labels = [...this.quantities.entries()].map(([itemId, quantity]) => {
      const name = this.requireDefinition(itemId).displayName;
      return quantity > 1 ? `${name} ×${quantity}` : name;
    });

    return labels.length > 0 ? labels.join(', ') : 'PUSTO';
  }

  public getQuantities(): Readonly<Record<string, number>> {
    return Object.fromEntries(this.quantities);
  }

  public getSprintMultiplier(): number {
    return [...this.quantities.keys()].reduce((multiplier, itemId) => {
      const itemMultiplier = this.requireDefinition(itemId).sprintMultiplier ?? 1;
      return Math.min(multiplier, itemMultiplier);
    }, 1);
  }

  /** Walking speed factor and sprint availability for everything currently carried. */
  public getCarryMovement(): { walkMultiplier: number; sprintAllowed: boolean } {
    let walkMultiplier = 1;
    let sprintAllowed = true;
    for (const itemId of this.quantities.keys()) {
      const heavy = this.requireDefinition(itemId).heavyCarry;
      if (heavy) {
        walkMultiplier = Math.min(walkMultiplier, heavy.walkMultiplier);
        sprintAllowed = false;
      }
    }
    return { walkMultiplier, sprintAllowed };
  }

  /** The carried item that can spill (coffee), if any. */
  public getCarriedSpillable(): { id: string; sprintDrainPerSecond: number } | null {
    for (const itemId of this.quantities.keys()) {
      const spillable = this.requireDefinition(itemId).spillable;
      if (spillable) return { id: itemId, sprintDrainPerSecond: spillable.sprintDrainPerSecond };
    }
    return null;
  }

  public getUnavailableHideSpotIds(): readonly string[] {
    const ids = new Set<string>();

    for (const itemId of this.quantities.keys()) {
      for (const spotId of this.requireDefinition(itemId).unavailableHideSpotIds ?? []) {
        ids.add(spotId);
      }
    }

    return [...ids];
  }

  public getVisibleCarriedItem(): ItemDefinition | null {
    for (const itemId of this.quantities.keys()) {
      const definition = this.requireDefinition(itemId);

      if (definition.carryVisual) {
        return definition;
      }
    }

    return null;
  }

  private requireDefinition(itemId: string): ItemDefinition {
    const definition = this.definitions.get(itemId);

    if (!definition) {
      throw new Error(`Unknown inventory item: ${itemId}`);
    }

    return definition;
  }
}
