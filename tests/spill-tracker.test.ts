import { describe, expect, it } from 'vitest';
import { getCoffeeDeliveryComment } from '../src/data/items/spill-comments';
import { itemDefinitions } from '../src/data/items/items';
import { InventorySystem } from '../src/systems/inventory-system';
import { SpillTracker } from '../src/systems/spill-tracker';

const coffee = { id: 'coffee', sprintDrainPerSecond: 0.25 };

describe('SpillTracker', () => {
  it('walking keeps the cup full, sprinting spills it', () => {
    const tracker = new SpillTracker();
    expect(tracker.update(5_000, coffee, false)).toEqual([]);
    expect(tracker.getFullness()).toBe(1);
    expect(tracker.update(1_000, coffee, true)).toEqual(['started-spilling']);
    expect(tracker.getFullness()).toBeCloseTo(0.75, 5);
  });

  it('reports an empty cup once and never goes below zero', () => {
    const tracker = new SpillTracker();
    tracker.update(1_000, coffee, true);
    expect(tracker.update(10_000, coffee, true)).toEqual(['emptied']);
    expect(tracker.update(1_000, coffee, true)).toEqual([]);
    expect(tracker.getFullness()).toBe(0);
  });

  it('remembers how full the cup was when it was delivered', () => {
    const tracker = new SpillTracker();
    tracker.update(1_000, coffee, true);
    tracker.update(16, null, false);
    expect(tracker.takeDelivered()).toEqual({ itemId: 'coffee', fullness: 0.75 });
    expect(tracker.takeDelivered()).toBeNull();
  });

  it('only coffee is spillable and every fullness gets a comment', () => {
    const inventory = new InventorySystem(itemDefinitions);
    inventory.add('milk');
    expect(inventory.getCarriedSpillable()).toBeNull();
    inventory.add('coffee');
    expect(inventory.getCarriedSpillable()?.id).toBe('coffee');
    expect(getCoffeeDeliveryComment(1)).toContain('Barista');
    expect(getCoffeeDeliveryComment(0.7)).toContain('Da się pić');
    expect(getCoffeeDeliveryComment(0.2)).toContain('dnie');
    expect(getCoffeeDeliveryComment(0)).toContain('Pusty');
  });
});
