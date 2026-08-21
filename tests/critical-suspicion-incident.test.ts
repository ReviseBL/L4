import { describe, expect, it } from 'vitest';
import { campaignMonths } from '../src/data/campaign/campaign-months';
import { suspicionConfig } from '../src/data/suspicion/suspicion-config';
import { GameState } from '../src/state/game-state';
import { SuspicionSystem } from '../src/systems/suspicion-system';

describe('critical suspicion incident', () => {
  it('records one incident when a detection raises suspicion from 99 to 100', () => {
    const state = new GameState();
    state.setMissionProgress('m4-shopping-run', 0);
    const suspicion = new SuspicionSystem(99, suspicionConfig, campaignMonths);
    suspicion.startMission('m4-shopping-run');

    const detection = suspicion.registerDetection({
      source: 'coworker',
      missionId: 'm4-shopping-run',
      month: 4,
    });

    expect(detection.currentValue).toBe(100);
    expect(detection.events).toContain('SUSPICION_MAX_REACHED');
    expect(state.recordCriticalSuspicionIncident('m4-shopping-run')).toBe(true);
    expect(state.getCampaignStatistics().criticalSuspicionIncidents).toBe(1);
  });

  it('does not duplicate an incident in the same mission at 100%', () => {
    const state = new GameState();
    expect(state.recordCriticalSuspicionIncident('m4-shopping-run')).toBe(true);
    expect(state.recordCriticalSuspicionIncident('m4-shopping-run')).toBe(false);
    expect(state.getCampaignStatistics().criticalSuspicionIncidents).toBe(1);
  });

  it('ends an incident mission at exactly 80 without a stealth reward', () => {
    const suspicion = new SuspicionSystem(100, suspicionConfig, campaignMonths);
    const resolution = suspicion.resolveMissionCompletion(0, true);

    expect(resolution.criticalIncident).toBe(true);
    expect(resolution.configuredBonus).toBe(0);
    expect(resolution.message).toEqual([]);
    expect(resolution.currentValue).toBe(80);
  });

  it('allows another incident in a later mission after the reset', () => {
    const state = new GameState();
    state.recordCriticalSuspicionIncident('m4-shopping-run');
    expect(state.recordCriticalSuspicionIncident('m5-kebab-run')).toBe(true);
    expect(state.getCampaignStatistics().criticalSuspicionIncidents).toBe(2);
  });
});
