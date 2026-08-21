import { describe, expect, it } from 'vitest';
import { NpcStateMachine } from '../src/systems/npc-state-machine';
import { PerceptionSystem } from '../src/systems/perception-system';
import { SuspicionSystem } from '../src/systems/suspicion-system';
import { campaignMonths } from '../src/data/campaign/campaign-months';
import { suspicionConfig } from '../src/data/suspicion/suspicion-config';
import { PhoneSystem } from '../src/systems/phone-system';
import { phoneConfig } from '../src/data/phone/phone-config';
import type { PhoneCallDefinition } from '../src/domain/phone/phone-types';

describe('stealth detection flow', () => {
  it('charges suspicion once, then loses a hidden player and starts searching', () => {
    const perception = new PerceptionSystem([]);
    const brain = new NpcStateMachine({
      recognitionTimeMs: 650,
      loseSightTimeMs: 900,
      searchDurationMs: 4_500,
      detectionCooldownMs: 6_000,
    });
    const suspicion = new SuspicionSystem(0, suspicionConfig, campaignMonths);
    suspicion.startMission('stealth-test');
    const query = {
      observer: { x: 0, y: 0 },
      target: { x: 100, y: 0 },
      facingRadians: 0,
      range: 200,
      halfAngleRadians: Math.PI / 4,
    };

    const visible = perception.evaluate(query);
    const firstUpdate = brain.update(700, {
      visibility: visible.visibility,
      playerPosition: query.target,
    });

    if (firstUpdate.detectionTriggered) {
      suspicion.registerDetection({
        source: 'coworker',
        missionId: 'stealth-test',
        month: 1,
      });
    }

    const continuousUpdate = brain.update(500, {
      visibility: visible.visibility,
      playerPosition: query.target,
    });

    if (continuousUpdate.detectionTriggered) {
      suspicion.registerDetection({
        source: 'coworker',
        missionId: 'stealth-test',
        month: 1,
      });
    }

    expect(suspicion.getValue()).toBe(5);

    const hidden = perception.evaluate({ ...query, targetHidden: true });
    brain.update(900, {
      visibility: hidden.visibility,
      playerPosition: query.target,
    });

    expect(brain.getState()).toBe('SEARCHING');
  });

  it('keeps coworker perception active while a phone conversation locks the player', () => {
    const call: PhoneCallDefinition = {
      id: 'stealth-call',
      caller: 'manager',
      trigger: { type: 'elapsedTime', seconds: 1 },
      ringDuration: 6,
      answerDuration: 4,
      dialogue: { lines: [{ speaker: 'KIEROWNIK', text: 'Jak zdrowie?' }] },
    };
    const phone = new PhoneSystem(
      true,
      { totalAnswered: 0, totalMissed: 0, totalDeclined: 0 },
      phoneConfig,
    );
    phone.startMission('phone-stealth', [call]);
    phone.update(1_000);
    phone.answer();
    expect(phone.isConversationActive()).toBe(true);

    const perception = new PerceptionSystem([]);
    const brain = new NpcStateMachine({
      recognitionTimeMs: 650,
      loseSightTimeMs: 900,
      searchDurationMs: 4_500,
      detectionCooldownMs: 6_000,
    });
    const visible = perception.evaluate({
      observer: { x: 0, y: 0 },
      target: { x: 100, y: 0 },
      facingRadians: 0,
      range: 200,
      halfAngleRadians: Math.PI / 4,
    });

    expect(
      brain.update(700, { visibility: visible.visibility, playerPosition: { x: 100, y: 0 } })
        .detectionTriggered,
    ).toBe(true);
  });
});
