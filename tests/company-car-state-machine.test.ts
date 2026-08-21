import { describe, expect, it } from 'vitest';
import { companyCarDefinition } from '../src/data/npcs/company-car';
import { COMPANY_CAR_STATE } from '../src/domain/npcs/company-car-types';
import { CompanyCarStateMachine } from '../src/systems/company-car-state-machine';
import { VISIBILITY_LEVEL } from '../src/systems/perception-system';

describe('CompanyCarStateMachine', () => {
  it('moves through suspicious, spotted and cooldown without repeated detection', () => {
    const machine = new CompanyCarStateMachine(companyCarDefinition);
    expect(machine.update(100, VISIBILITY_LEVEL.Peripheral, { x: 1, y: 2 }).state).toBe(COMPANY_CAR_STATE.Suspicious);
    const spotted = machine.update(700, VISIBILITY_LEVEL.Clear, { x: 3, y: 4 });
    expect(spotted).toMatchObject({ state: COMPANY_CAR_STATE.SpottedPlayer, detectionTriggered: true, lastSeenPlayer: { x: 3, y: 4 } });
    expect(machine.update(100, VISIBILITY_LEVEL.Clear, { x: 3, y: 4 }).detectionTriggered).toBe(false);
    expect(machine.update(1_000, VISIBILITY_LEVEL.None, { x: 0, y: 0 }).state).toBe(COMPANY_CAR_STATE.Cooldown);
  });

  it('does not detect a hidden/no-visibility target', () => {
    const machine = new CompanyCarStateMachine(companyCarDefinition);
    const result = machine.update(2_000, VISIBILITY_LEVEL.None, { x: 5, y: 5 });
    expect(result.state).toBe(COMPANY_CAR_STATE.Driving);
    expect(result.detectionTriggered).toBe(false);
  });
});
