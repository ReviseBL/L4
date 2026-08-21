import { describe, expect, it } from 'vitest';
import type { MissionDefinition } from '../src/domain/missions/mission-types';
import { MissionSystem } from '../src/systems/mission-system';

const mission: MissionDefinition = {
  id: 'test-mission',
  campaignMonth: 1,
  title: 'Test mission',
  goal: 'Complete a test interaction and return.',
  daysPassed: 8,
  steps: [
    {
      id: 'collect',
      objective: 'Collect item.',
      trigger: { type: 'interaction', targetId: 'counter' },
      interactionPrompt: '[E] COLLECT',
      effects: [{ type: 'add-item', itemId: 'test-item' }],
    },
    {
      id: 'return',
      objective: 'Return home.',
      trigger: { type: 'area-entered', areaId: 'home' },
    },
  ],
};

describe('MissionSystem', () => {
  it('advances from data-defined events and returns a summary', () => {
    const system = new MissionSystem([mission]);
    system.startFirst({ nowMs: 1_000, suspicion: 10 });

    expect(system.getInteractionPrompt('counter')).toBe('[E] COLLECT');
    const collect = system.handleEvent(
      { type: 'interaction', targetId: 'counter' },
      { nowMs: 2_000, suspicion: 10 },
    );

    expect(collect.matched).toBe(true);
    expect(collect.effects).toEqual([{ type: 'add-item', itemId: 'test-item' }]);
    expect(system.getCurrentObjectiveText()).toBe('Return home.');

    system.recordDetection();
    const complete = system.handleEvent(
      { type: 'area-entered', areaId: 'home' },
      { nowMs: 6_000, suspicion: 15 },
    );

    expect(complete.summary).toMatchObject({
      elapsedMs: 5_000,
      detectionCount: 1,
      suspicionBeforeMission: 10,
      suspicionBeforeReward: 15,
      suspicionGained: 5,
      daysPassed: 8,
    });
  });

  it('ignores events that do not match the active step', () => {
    const system = new MissionSystem([mission]);
    system.startFirst({ nowMs: 0, suspicion: 0 });

    const result = system.handleEvent(
      { type: 'interaction', targetId: 'wrong-counter' },
      { nowMs: 100, suspicion: 0 },
    );

    expect(result.matched).toBe(false);
    expect(system.getCurrentObjectiveText()).toBe('Collect item.');
  });

  it('rejects duplicate mission ids', () => {
    expect(() => new MissionSystem([mission, mission])).toThrow('Duplicate mission id');
  });

  it('restores a saved mission step without hard-coded scene logic', () => {
    const system = new MissionSystem([mission]);
    system.startAt('test-mission', 1, { nowMs: 10_000, suspicion: 5 });

    expect(system.getCurrentObjectiveText()).toBe('Return home.');
    expect(system.getProgress()).toEqual({ missionId: 'test-mission', stepIndex: 1 });
  });
});
