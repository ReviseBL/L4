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

  it('heavy items slow the walk and block sprint until unloaded', () => {
    const inventory = new InventorySystem(itemDefinitions);
    expect(inventory.getCarryMovement()).toEqual({ walkMultiplier: 1, sprintAllowed: true });

    inventory.add('medicine');
    expect(inventory.getCarryMovement().sprintAllowed).toBe(true);

    inventory.add('l4-print-filament');
    expect(inventory.getCarryMovement()).toEqual({ walkMultiplier: 0.7, sprintAllowed: false });

    inventory.remove('l4-print-filament');
    expect(inventory.getCarryMovement()).toEqual({ walkMultiplier: 1, sprintAllowed: true });
  });
});
