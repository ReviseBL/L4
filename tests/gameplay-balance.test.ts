import { describe, expect, it } from 'vitest';
import { campaignMonths } from '../src/data/campaign/campaign-months';
import { verticalSliceMissions } from '../src/data/missions/vertical-slice-missions';
import { suspicionConfig } from '../src/data/suspicion/suspicion-config';
import { SuspicionSystem } from '../src/systems/suspicion-system';

describe('gameplay beta suspicion simulations', () => {
  it('keeps a clean stealth campaign at zero suspicion', () => {
    const system = new SuspicionSystem(0, suspicionConfig, campaignMonths);
    for (const mission of verticalSliceMissions) {
      system.startMission(mission.id);
      system.applyStealthReward(0);
    }
    expect(system.getValue()).toBe(0);
  });

  it('lets an average player reach month six without hitting the hard cap', () => {
    const system = new SuspicionSystem(0, suspicionConfig, campaignMonths);
    for (const [index, mission] of verticalSliceMissions.entries()) {
      system.startMission(mission.id);
      system.registerDetection({ source: 'coworker', missionId: mission.id, month: mission.campaignMonth });
      if (mission.campaignMonth >= 2 && index % 3 === 0) {
        system.registerEvent({ type: 'missedWorkCall', missionId: mission.id, month: mission.campaignMonth });
      }
      system.applyStealthReward(1);
    }

    expect(system.getValue()).toBeGreaterThanOrEqual(40);
    expect(system.getValue()).toBeLessThan(100);
  });

  it('caps a chaotic campaign at 100 without preventing later reductions', () => {
    const system = new SuspicionSystem(0, suspicionConfig, campaignMonths);
    for (const mission of verticalSliceMissions) {
      system.startMission(mission.id);
      const source = mission.campaignMonth >= 5 ? 'manager' : mission.campaignMonth >= 3 ? 'hr' : 'coworker';
      for (let detection = 0; detection < 3; detection += 1) {
        system.registerDetection({ source, missionId: mission.id, month: mission.campaignMonth });
      }
    }
    expect(system.getValue()).toBe(100);
    expect(system.decrease(10)).toBe(90);
  });
});
