import { describe, expect, it } from 'vitest';
import { NPC_STATE } from '../src/domain/npcs/npc-types';
import { NpcStateMachine } from '../src/systems/npc-state-machine';
import { VISIBILITY_LEVEL } from '../src/systems/perception-system';

const config = {
  recognitionTimeMs: 650,
  loseSightTimeMs: 900,
  searchDurationMs: 4_500,
  detectionCooldownMs: 6_000,
};

const playerPosition = { x: 100, y: 100 };

describe('NpcStateMachine', () => {
  it('runs through suspicious, detected, searching, returning and patrol states', () => {
    const brain = new NpcStateMachine(config);

    brain.update(100, { visibility: VISIBILITY_LEVEL.Peripheral, playerPosition });
    expect(brain.getState()).toBe(NPC_STATE.Suspicious);

    const detected = brain.update(700, { visibility: VISIBILITY_LEVEL.Clear, playerPosition });
    expect(brain.getState()).toBe(NPC_STATE.Detected);
    expect(detected.detectionTriggered).toBe(true);

    brain.update(900, { visibility: VISIBILITY_LEVEL.None, playerPosition });
    expect(brain.getState()).toBe(NPC_STATE.Searching);

    brain.update(4_500, { visibility: VISIBILITY_LEVEL.None, playerPosition });
    expect(brain.getState()).toBe(NPC_STATE.Returning);

    brain.completeReturnToPatrol();
    expect(brain.getState()).toBe(NPC_STATE.Patrol);
  });

  it('does not trigger detection repeatedly during one detected state', () => {
    const brain = new NpcStateMachine(config);

    brain.update(700, { visibility: VISIBILITY_LEVEL.Clear, playerPosition });
    const repeated = brain.update(100, { visibility: VISIBILITY_LEVEL.Clear, playerPosition });

    expect(brain.getState()).toBe(NPC_STATE.Detected);
    expect(repeated.detectionTriggered).toBe(false);
  });

  it('supports a modest high-alert awareness and search-duration modifier', () => {
    const brain = new NpcStateMachine(config);
    brain.setDifficultyModifiers({
      viewDistanceMultiplier: 1.08,
      awarenessMultiplier: 1.1,
      searchDurationMultiplier: 1.18,
    });

    const detected = brain.update(600, {
      visibility: VISIBILITY_LEVEL.Clear,
      playerPosition,
    });

    expect(detected.detectionTriggered).toBe(true);
    brain.update(900, { visibility: VISIBILITY_LEVEL.None, playerPosition });
    expect(brain.getState()).toBe(NPC_STATE.Searching);
    brain.update(4_500, { visibility: VISIBILITY_LEVEL.None, playerPosition });
    expect(brain.getState()).toBe(NPC_STATE.Searching);
    brain.update(900, { visibility: VISIBILITY_LEVEL.None, playerPosition });
    expect(brain.getState()).toBe(NPC_STATE.Returning);
  });

  it('after a confrontation walks back and ignores the player during the grace period', () => {
    const brain = new NpcStateMachine(config);
    brain.update(700, { visibility: VISIBILITY_LEVEL.Clear, playerPosition });
    expect(brain.getState()).toBe(NPC_STATE.Detected);

    brain.releaseAfterConfrontation(5_000);
    expect(brain.getState()).toBe(NPC_STATE.Returning);

    const during = brain.update(4_000, { visibility: VISIBILITY_LEVEL.Clear, playerPosition });
    expect(during.state).toBe(NPC_STATE.Returning);
    expect(brain.isInGracePeriod()).toBe(true);

    brain.update(1_100, { visibility: VISIBILITY_LEVEL.None, playerPosition });
    expect(brain.isInGracePeriod()).toBe(false);
    brain.update(100, { visibility: VISIBILITY_LEVEL.Clear, playerPosition });
    expect(brain.getState()).toBe(NPC_STATE.Suspicious);
  });
});
