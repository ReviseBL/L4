import { describe, expect, it, vi } from 'vitest';
import { phoneConfig } from '../src/data/phone/phone-config';
import type { PhoneCallDefinition } from '../src/domain/phone/phone-types';
import { PhoneSystem } from '../src/systems/phone-system';

const firstCall: PhoneCallDefinition = {
  id: 'first',
  caller: 'manager',
  trigger: { type: 'elapsedTime', seconds: 5 },
  ringDuration: 6,
  answerDuration: 4,
  dialogue: { lines: [{ speaker: 'KIEROWNIK', text: 'Jak zdrowie?' }] },
};

const secondCall: PhoneCallDefinition = {
  ...firstCall,
  id: 'second',
  trigger: { type: 'returningHome', afterStepId: 'pickup', delaySeconds: 2 },
};

function createSystem(callbacks = {}) {
  return new PhoneSystem(
    true,
    { totalAnswered: 0, totalMissed: 0, totalDeclined: 0 },
    phoneConfig,
    callbacks,
  );
}

describe('PhoneSystem', () => {
  it('keeps an answered call active until the dialogue is completed manually', () => {
    const system = createSystem();
    system.startMission('m2-test', [firstCall]);

    system.update(5_000);
    expect(system.getSnapshot().state).toBe('RINGING');
    expect(system.getSnapshot().missionStats.callsReceived).toBe(1);

    expect(system.answer()).toBe(true);
    expect(system.isConversationActive()).toBe(true);
    expect(system.getSnapshot().missionStats.callsAnswered).toBe(1);

    system.update(4_000);
    expect(system.isConversationActive()).toBe(true);

    expect(system.completeAnsweredCall()).toBe(true);
    expect(system.isConversationActive()).toBe(false);
    expect(system.getSnapshot().state).toBe('COOLDOWN');
    expect(system.getSnapshot().campaignStats.totalAnswered).toBe(1);
  });

  it('reports missed and declined work calls without owning suspicion values', () => {
    const onSuspicionEvent = vi.fn();
    const system = createSystem({ onSuspicionEvent });
    system.startMission('m2-test', [firstCall, secondCall]);

    system.update(11_000);
    expect(system.getSnapshot().state).toBe('RINGING');
    system.forceMissedCall();
    expect(onSuspicionEvent).toHaveBeenLastCalledWith({
      type: 'missedWorkCall',
      missionId: 'm2-test',
    });

    system.notify({ type: 'returningHome', afterStepId: 'pickup' });
    system.update(15_000);
    expect(system.getSnapshot().state).toBe('RINGING');
    system.decline();
    expect(onSuspicionEvent).toHaveBeenLastCalledWith({
      type: 'declinedWorkCall',
      missionId: 'm2-test',
    });
    expect(system.getSnapshot().campaignStats).toEqual({
      totalAnswered: 0,
      totalMissed: 1,
      totalDeclined: 1,
    });
  });

  it('allows airplane mode once per mission, suppresses due calls, and resets next mission', () => {
    const system = createSystem();
    system.startMission('first-mission', [firstCall]);

    expect(system.activateAirplaneMode()).toBe(true);
    expect(system.activateAirplaneMode()).toBe(false);
    system.update(30_000);
    expect(system.getSnapshot().state).toBe('IDLE');
    expect(system.getSnapshot().missionStats.callsReceived).toBe(0);
    system.update(20_000);
    expect(system.getSnapshot().missionStats.callsReceived).toBe(0);

    system.startMission('second-mission', [firstCall]);
    expect(system.getSnapshot().airplaneModeAvailable).toBe(true);
    expect(system.activateAirplaneMode()).toBe(true);
  });

  it('enforces the global cooldown before another eligible call', () => {
    const simultaneous = { ...firstCall, id: 'simultaneous', trigger: { type: 'elapsedTime', seconds: 5 } } as const;
    const system = createSystem();
    system.startMission('cooldown', [firstCall, simultaneous]);
    system.update(5_000);
    system.forceMissedCall();

    system.update(14_999);
    expect(system.getSnapshot().state).toBe('COOLDOWN');
    expect(system.getSnapshot().missionStats.callsReceived).toBe(1);

    system.update(1);
    expect(system.getSnapshot().state).toBe('RINGING');
    expect(system.getSnapshot().missionStats.callsReceived).toBe(2);
  });

  it('cancels transient calls safely when a mission or page session ends', () => {
    const system = createSystem();
    system.startMission('reload', [firstCall]);
    system.update(5_000);
    expect(system.getSnapshot().state).toBe('RINGING');

    system.endMission();
    expect(system.getSnapshot().state).toBe('DISABLED');
    expect(system.getSnapshot().activeCall).toBeNull();

    const restored = new PhoneSystem(
      true,
      system.getSnapshot().campaignStats,
      phoneConfig,
    );
    restored.startMission('reload', [firstCall]);
    expect(restored.getSnapshot().state).toBe('IDLE');
  });
});
