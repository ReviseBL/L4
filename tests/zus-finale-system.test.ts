import { describe, expect, it } from 'vitest';
import { zusDocumentChoices } from '../src/data/finale/zus-finale-data';
import type { FinaleCampaignContext } from '../src/domain/finale/zus-finale-types';
import {
  calculateCriticalIncidentCredibilityPenalty,
  calculateCriticalIncidentScorePenalty,
  calculateInitialCredibility,
  ZusFinaleSystem,
} from '../src/systems/zus-finale-system';

function context(overrides: Partial<FinaleCampaignContext> = {}): FinaleCampaignContext {
  return {
    suspicion: 35,
    hrFirstMeetingChoice: 'still_sick',
    l4PrintCompleted: true,
    completedMissionCount: 17,
    acquiredFilamentCount: 5,
    completedPrintCount: 2,
    phoneStats: { totalAnswered: 4, totalMissed: 2, totalDeclined: 1 },
    campaignStats: {
      totalDetections: 4,
      coworkerDetections: 2,
      hrDetections: 1,
      managerDetections: 1,
      companyCarDetections: 0,
      threeDShopVisits: 5,
      kebabsCollected: 2,
      criticalSuspicionIncidents: 0,
    },
    ...overrides,
  };
}

describe('ZusFinaleSystem', () => {
  it('derives a bounded starting credibility from the campaign', () => {
    expect(calculateInitialCredibility(context())).toBe(79);
    expect(calculateInitialCredibility(context({ suspicion: 100, hrFirstMeetingChoice: 'great', campaignStats: { ...context().campaignStats, managerDetections: 20 } }))).toBe(35);
  });

  it('scores correct and absurd documents only once', () => {
    const system = new ZusFinaleSystem(context(), 60);
    expect(system.selectDocument(zusDocumentChoices[0])).toBe(true);
    expect(system.selectDocument(zusDocumentChoices[0])).toBe(false);
    expect(system.selectDocument(zusDocumentChoices[3])).toBe(true);
    expect(system.getSnapshot().credibility).toBe(62);
  });

  it('penalizes repeated sprinting and returns a local score and rank', () => {
    const system = new ZusFinaleSystem(context(), 80);
    system.recordSprintIncident();
    system.recordSprintIncident();
    system.recordSprintIncident();
    const result = system.calculateResult();
    expect(result.credibility).toBe(73);
    expect(result.endingId).toBe('extended');
    expect(result.score).toBeGreaterThan(0);
    expect(['S', 'A', 'B', 'C', 'D']).toContain(result.rank);
  });

  it('supports all forced endings for deterministic debug scenarios', () => {
    const system = new ZusFinaleSystem(context(), 50);
    expect(system.calculateResult('extended').endingId).toBe('extended');
    expect(system.calculateResult('back-to-work').endingId).toBe('back-to-work');
    expect(system.calculateResult('hr-meeting').endingId).toBe('hr-meeting');
    expect(system.calculateResult('waiting-forever').endingId).toBe('waiting-forever');
  });

  it('unlocks the hidden ending only for an exceptional stealth campaign', () => {
    const excellent = context({
      suspicion: 8,
      campaignStats: { ...context().campaignStats, totalDetections: 1, managerDetections: 0 },
    });
    expect(new ZusFinaleSystem(excellent, 95).calculateResult().endingId).toBe('waiting-forever');
    expect(new ZusFinaleSystem({ ...excellent, suspicion: 40 }, 95).calculateResult().endingId).toBe('extended');
  });

  it('applies a capped credibility penalty for critical suspicion incidents', () => {
    expect(calculateCriticalIncidentCredibilityPenalty(0)).toBe(0);
    expect(calculateCriticalIncidentCredibilityPenalty(1)).toBe(5);
    expect(calculateCriticalIncidentCredibilityPenalty(3)).toBe(15);
    expect(calculateCriticalIncidentCredibilityPenalty(99)).toBe(20);
    expect(calculateInitialCredibility(context({
      campaignStats: { ...context().campaignStats, criticalSuspicionIncidents: 3 },
    }))).toBe(64);
  });

  it('applies a capped score penalty without imposing a hard rank rule', () => {
    expect(calculateCriticalIncidentScorePenalty(1)).toBe(1_250);
    expect(calculateCriticalIncidentScorePenalty(99)).toBe(5_000);
    const clean = new ZusFinaleSystem(context(), 80).calculateResult();
    const incident = new ZusFinaleSystem(context({
      campaignStats: { ...context().campaignStats, criticalSuspicionIncidents: 1 },
    }), 80).calculateResult();
    expect(clean.score - incident.score).toBe(1_250);
    expect(['S', 'A', 'B', 'C', 'D']).toContain(incident.rank);
  });
});
