import { describe, expect, it } from 'vitest';
import { managerDefinition } from '../src/data/npcs/manager';
import { MANAGER_STATE } from '../src/domain/npcs/manager-types';
import { ManagerStateMachine } from '../src/systems/manager-state-machine';
import { VISIBILITY_LEVEL } from '../src/systems/perception-system';

const PLAYER = { x: 400, y: 300 };

function createBrain(): ManagerStateMachine {
  const brain = new ManagerStateMachine(managerDefinition);
  brain.setInterestPoints([
    { id: 'shop', x: 200, y: 200 },
    { id: 'parking', x: 500, y: 500 },
  ]);
  return brain;
}

describe('ManagerStateMachine', () => {
  it('recognizes once, chases, searches three local points and returns', () => {
    const brain = createBrain();
    brain.update(100, VISIBILITY_LEVEL.Peripheral, PLAYER, false);
    expect(brain.getState()).toBe(MANAGER_STATE.Suspicious);
    const detected = brain.update(500, VISIBILITY_LEVEL.Clear, PLAYER, false);
    expect(detected.state).toBe(MANAGER_STATE.Chase);
    expect(detected.detectionTriggered).toBe(true);
    expect(brain.update(100, VISIBILITY_LEVEL.Clear, PLAYER, false).detectionTriggered).toBe(false);

    brain.update(1_100, VISIBILITY_LEVEL.None, PLAYER, false);
    expect(brain.getState()).toBe(MANAGER_STATE.Searching);
    brain.update(100, VISIBILITY_LEVEL.None, PLAYER, true);
    expect(brain.getState()).toBe(MANAGER_STATE.CheckingLocation);
    brain.update(100, VISIBILITY_LEVEL.None, PLAYER, true);
    brain.update(100, VISIBILITY_LEVEL.None, PLAYER, true);
    brain.update(100, VISIBILITY_LEVEL.None, PLAYER, true);
    expect(brain.getState()).toBe(MANAGER_STATE.Returning);
    brain.update(100, VISIBILITY_LEVEL.None, PLAYER, true);
    expect(brain.getState()).toBe(MANAGER_STATE.PatrolArea);
  });

  it('investigates an approximate company-car report without teleporting state', () => {
    const brain = createBrain();
    brain.investigate({ x: 650, y: 740 });
    expect(brain.getState()).toBe(MANAGER_STATE.Investigating);
    expect(brain.getMovementTarget()).toEqual({ x: 650, y: 740 });
    brain.update(100, VISIBILITY_LEVEL.None, PLAYER, true);
    expect(brain.getState()).toBe(MANAGER_STATE.CheckingLocation);
  });

  it('uses threshold difficulty modifiers for longer searching without changing detection points', () => {
    const brain = createBrain();
    brain.setDifficultyModifiers({ viewDistanceMultiplier: 1.1, awarenessMultiplier: 1.13, searchDurationMultiplier: 1.25 });
    brain.forceState(MANAGER_STATE.Searching, PLAYER);
    brain.update(managerDefinition.searchMemoryDurationMs, VISIBILITY_LEVEL.None, PLAYER, false);
    expect(brain.getState()).toBe(MANAGER_STATE.Searching);
    brain.update(3_000, VISIBILITY_LEVEL.None, PLAYER, false);
    expect(brain.getState()).toBe(MANAGER_STATE.CheckingLocation);
  });

  it('abandons a blocked patrol target instead of camping forever', () => {
    const brain = createBrain();
    expect(brain.getMovementTarget()).toEqual({ id: 'shop', x: 200, y: 200 });

    brain.handleMovementBlocked();

    expect(brain.getState()).toBe(MANAGER_STATE.PatrolArea);
    expect(brain.getMovementTarget()).toEqual({ id: 'parking', x: 500, y: 500 });
  });
});
