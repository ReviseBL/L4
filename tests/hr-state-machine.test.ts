import { describe, expect, it } from 'vitest';
import { hrDefinition } from '../src/data/npcs/hr';
import { HR_STATE } from '../src/domain/npcs/hr-types';
import { HrStateMachine } from '../src/systems/hr-state-machine';
import { VISIBILITY_LEVEL } from '../src/systems/perception-system';

const player = { x: 100, y: 100 };

describe('HrStateMachine', () => {
  it('approaches, requests a nearby conversation and returns to patrol', () => {
    const brain = new HrStateMachine(hrDefinition);
    brain.update(100, VISIBILITY_LEVEL.Peripheral, player, 200);
    expect(brain.getState()).toBe(HR_STATE.Suspicious);
    const detected = brain.update(600, VISIBILITY_LEVEL.Clear, player, 180);
    expect(detected.detectionTriggered).toBe(true);
    expect(brain.getState()).toBe(HR_STATE.Approaching);
    const conversation = brain.update(16, VISIBILITY_LEVEL.Clear, player, 40);
    expect(conversation.conversationRequested).toBe(true);
    expect(brain.getState()).toBe(HR_STATE.Conversation);
    brain.completeConversation();
    brain.completeReturnToPatrol();
    expect(brain.getState()).toBe(HR_STATE.Patrol);
  });

  it('leaves Hubi alone for a while after a talk so he can walk away', () => {
    const brain = new HrStateMachine(hrDefinition);
    brain.update(16, VISIBILITY_LEVEL.Clear, player, 200);
    brain.update(600, VISIBILITY_LEVEL.Clear, player, 200);
    brain.update(16, VISIBILITY_LEVEL.Clear, player, 40);
    expect(brain.getState()).toBe(HR_STATE.Conversation);
    brain.completeConversation();
    for (let t = 0; t < hrDefinition.postConversationGraceMs - 100; t += 100) {
      const snapshot = brain.update(100, VISIBILITY_LEVEL.Clear, player, 40);
      expect(snapshot.conversationRequested).toBe(false);
    }
    expect(brain.getState()).toBe(HR_STATE.Returning);
    brain.update(200, VISIBILITY_LEVEL.Clear, player, 40);
    expect(brain.getState()).toBe(HR_STATE.Suspicious);
  });

  it('searches the last known position after an escape and then returns', () => {
    const brain = new HrStateMachine(hrDefinition);
    brain.update(16, VISIBILITY_LEVEL.Clear, player, 200);
    brain.update(600, VISIBILITY_LEVEL.Clear, player, 200);
    brain.update(hrDefinition.loseSightTimeMs, VISIBILITY_LEVEL.None, player, 300);
    expect(brain.getState()).toBe(HR_STATE.Searching);
    expect(brain.getLastKnownPosition()).toEqual(player);
    brain.update(hrDefinition.searchDurationMs, VISIBILITY_LEVEL.None, player, 300);
    expect(brain.getState()).toBe(HR_STATE.Returning);
  });

  it('does not charge detection every frame', () => {
    const brain = new HrStateMachine(hrDefinition);
    brain.update(16, VISIBILITY_LEVEL.Clear, player, 180);
    const first = brain.update(600, VISIBILITY_LEVEL.Clear, player, 180);
    const repeated = brain.update(100, VISIBILITY_LEVEL.Clear, player, 170);
    expect(first.detectionTriggered).toBe(true);
    expect(repeated.detectionTriggered).toBe(false);
  });
});
