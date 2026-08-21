import { describe, expect, it } from 'vitest';
import { homeVisualDefinitions } from '../src/data/home/home-progression';
import { GameState } from '../src/state/game-state';
import { HomeProgressionSystem } from '../src/systems/home-progression-system';

describe('HomeProgressionSystem', () => {
  it('derives visible apartment objects from progression data', () => {
    const state = new GameState();
    const system = new HomeProgressionSystem(state, homeVisualDefinitions);

    expect(system.getVisibleDefinitions()).toEqual([]);

    system.addFilamentSpool('petg');
    expect(system.getVisibleDefinitions().map(({ id }) => id)).toEqual(['petg-spool-on-shelf']);

    system.completePrint('cable-holder');
    expect(system.getVisibleDefinitions().map(({ id }) => id)).toEqual([
      'petg-spool-on-shelf',
      'cable-holder-on-desk',
    ]);

    system.addDeskItem('nozzle-0-6-installed');
    expect(system.getVisibleDefinitions().map(({ id }) => id)).toEqual([
      'petg-spool-on-shelf',
      'nozzle-box-by-printer',
      'cable-holder-on-desk',
    ]);
  });

  it('resets only the apartment progression state', () => {
    const state = new GameState();
    state.setSuspicion(35);
    const system = new HomeProgressionSystem(state, homeVisualDefinitions);
    system.addFilamentSpool('petg');
    system.completePrint('cable-holder');

    system.reset();

    expect(system.getVisibleDefinitions()).toEqual([]);
    expect(state.getSnapshot().suspicion).toBe(35);
  });

  it('keeps the completed L4 400% print visible in the apartment', () => {
    const state = new GameState();
    const system = new HomeProgressionSystem(state, homeVisualDefinitions);
    state.startPrint('l4-400');
    system.completePrint('l4-400');
    expect(state.getPrintProjectState('l4-400')).toBe('COMPLETED');
    expect(system.getVisibleDefinitions().map(({ id }) => id)).toContain('l4-400-finished-print');
  });
});
