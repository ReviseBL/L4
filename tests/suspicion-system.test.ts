import { describe, expect, it } from 'vitest';
import { campaignMonths } from '../src/data/campaign/campaign-months';
import { suspicionConfig } from '../src/data/suspicion/suspicion-config';
import { SuspicionSystem } from '../src/systems/suspicion-system';

function createSystem(initialValue = 0): SuspicionSystem {
  return new SuspicionSystem(initialValue, suspicionConfig, campaignMonths);
}

describe('SuspicionSystem', () => {
  it('charges the coworker base value for the first month-one detection', () => {
    const system = createSystem();
    system.startMission('medicine-run');

    const detection = system.registerDetection({
      source: 'coworker',
      missionId: 'medicine-run',
      month: 1,
    });

    expect(detection.appliedDelta).toBe(5);
    expect(detection.detectionNumber).toBe(1);
    expect(system.getValue()).toBe(5);
  });

  it('escalates three coworker detections during one mission', () => {
    const system = createSystem();
    system.startMission('milk-run');

    const deltas = [1, 2, 3].map(() =>
      system.registerDetection({ source: 'coworker', missionId: 'milk-run', month: 1 }).appliedDelta,
    );

    expect(deltas).toEqual([5, 6, 8]);
    expect(system.getValue()).toBe(19);
  });

  it('applies month scaling and resets escalation for a new mission', () => {
    const system = createSystem();
    system.startMission('first');
    system.registerDetection({ source: 'coworker', missionId: 'first', month: 1 });
    system.registerDetection({ source: 'coworker', missionId: 'first', month: 1 });

    system.startMission('second');
    const monthFive = system.registerDetection({ source: 'coworker', missionId: 'second', month: 5 });

    expect(monthFive.detectionNumber).toBe(1);
    expect(monthFive.appliedDelta).toBe(7);
  });

  it('uses central phone-event values without NPC detection escalation', () => {
    const system = createSystem(10);
    system.startMission('phone-mission');

    const missed = system.registerEvent({
      type: 'missedWorkCall',
      missionId: 'phone-mission',
      month: 2,
    });
    const anotherMissed = system.registerEvent({
      type: 'missedWorkCall',
      missionId: 'phone-mission',
      month: 2,
    });
    const declined = system.registerEvent({
      type: 'declinedWorkCall',
      missionId: 'phone-mission',
      month: 2,
    });

    expect([missed.appliedDelta, anotherMissed.appliedDelta, declined.appliedDelta]).toEqual([
      2, 2, 3,
    ]);
    expect(system.getMissionDetectionCount()).toBe(0);
  });

  it('applies the month-three multiplier to HR detection and dialogue events', () => {
    const system = createSystem();
    system.startMission('m3-medicine-run');
    const detection = system.registerDetection({
      source: 'hr', missionId: 'm3-medicine-run', month: 3,
    });
    const gettingBetter = system.registerEvent({
      type: 'hrDialogueGettingBetter', missionId: 'm3-medicine-run', month: 3,
    });
    const great = system.registerEvent({
      type: 'hrDialogueGreat', missionId: 'm3-medicine-run', month: 3,
    });
    expect(detection.appliedDelta).toBe(12);
    expect(gettingBetter.appliedDelta).toBe(3);
    expect(great.appliedDelta).toBe(9);
  });

  it('rewards a mission without detections and never drops below zero', () => {
    const system = createSystem(3);

    const reward = system.applyStealthReward(0);

    expect(reward.configuredBonus).toBe(-5);
    expect(reward.appliedDelta).toBe(-3);
    expect(reward.currentValue).toBe(0);
    expect(reward.message).toEqual(['PERFEKCYJNE L4', 'NIKT CIĘ NIE ZAUWAŻYŁ']);
  });

  it('awards -2 for one detection and nothing for multiple detections', () => {
    expect(createSystem(20).applyStealthReward(1).currentValue).toBe(18);
    expect(createSystem(20).applyStealthReward(2).currentValue).toBe(20);
  });

  it('clamps at 100 and emits SUSPICION_MAX_REACHED once', () => {
    const system = createSystem(98);

    const first = system.setValue(120);
    const repeated = system.increase(10);

    expect(first.currentValue).toBe(100);
    expect(first.events).toEqual(['SUSPICION_MAX_REACHED']);
    expect(repeated).toBe(100);
  });

  it.each([
    [0, 'NORMAL'],
    [39, 'NORMAL'],
    [40, 'SUSPICIOUS'],
    [69, 'SUSPICIOUS'],
    [70, 'HIGH_ALERT'],
    [89, 'HIGH_ALERT'],
    [90, 'CRITICAL'],
    [100, 'CRITICAL'],
  ] as const)('maps %i%% to %s', (value, level) => {
    expect(createSystem(value).getLevel()).toBe(level);
  });

  it('resets suspicion and mission escalation', () => {
    const system = createSystem(42);
    system.startMission('mission');
    system.registerDetection({ source: 'coworker', missionId: 'mission', month: 1 });

    system.reset();

    expect(system.getValue()).toBe(0);
    expect(system.getMissionDetectionCount()).toBe(0);
  });
});
