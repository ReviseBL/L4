import { describe, expect, it } from 'vitest';
import { itemDefinitions } from '../src/data/items/items';
import { InventorySystem } from '../src/systems/inventory-system';

describe('InventorySystem', () => {
  it('applies PETG carry penalties and removes them after unloading', () => {
    const inventory = new InventorySystem(itemDefinitions);

    inventory.add('petg-spool');

    expect(inventory.has('petg-spool')).toBe(true);
    expect(inventory.getSprintMultiplier()).toBe(0.86);
    expect(inventory.getUnavailableHideSpotIds()).toEqual(['hedge-hide', 'parking-hide']);
    expect(inventory.getVisibleCarriedItem()?.displayName).toBe('SZPULA PETG');

    inventory.remove('petg-spool');

    expect(inventory.getSprintMultiplier()).toBe(1);
    expect(inventory.getVisibleCarriedItem()).toBeNull();
  });
});
