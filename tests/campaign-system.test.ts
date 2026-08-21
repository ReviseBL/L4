import { describe, expect, it } from 'vitest';
import { campaignMonths } from '../src/data/campaign/campaign-months';
import { GameState } from '../src/state/game-state';
import { CampaignSystem } from '../src/systems/campaign-system';
import { verticalSliceMissions } from '../src/data/missions/vertical-slice-missions';

describe('CampaignSystem', () => {
  it('advances L4 days after a mission without changing month prematurely', () => {
    const state = new GameState();
    const campaign = new CampaignSystem(state, campaignMonths);

    const result = campaign.advanceDays(7);

    expect(result.currentDay).toBe(30);
    expect(result.currentMonth).toBe(1);
    expect(result.transition).toBeNull();
    expect(result.completedMonths).toEqual([1]);
  });

  it('crosses day 30 into month two and creates a transition', () => {
    const state = new GameState();
    const campaign = new CampaignSystem(state, campaignMonths);
    campaign.setDay(30);

    const result = campaign.advanceDays(7);

    expect(result.currentDay).toBe(37);
    expect(result.currentMonth).toBe(2);
    expect(result.transition).toMatchObject({
      fromMonth: 1,
      toMonth: 2,
      completedDays: 30,
      definition: { heading: '30 DNI ZA TOBĄ', message: 'L4 PRZEDŁUŻONE' },
    });
  });

  it('crosses into month two after the final month-one mission', () => {
    const campaign = new CampaignSystem(new GameState(), campaignMonths);
    const monthOneMissions = verticalSliceMissions.filter((mission) => mission.campaignMonth === 1);
    const results = monthOneMissions.map((mission) => campaign.advanceDays(mission.daysPassed));

    expect(results.at(-1)).toMatchObject({ currentDay: 31, currentMonth: 2 });
    expect(results.at(-1)?.transition).toMatchObject({ fromMonth: 1, toMonth: 2 });
  });

  it('finishes all three month-two missions around day 60 and enters month three', () => {
    const campaign = new CampaignSystem(new GameState(), campaignMonths);
    campaign.setDay(31);
    const monthTwoMissions = verticalSliceMissions.filter((mission) => mission.campaignMonth === 2);
    const results = monthTwoMissions.map((mission) => campaign.advanceDays(mission.daysPassed));

    expect(monthTwoMissions).toHaveLength(3);
    expect(results.at(-1)).toMatchObject({ currentDay: 61, currentMonth: 3 });
    expect(results.at(-1)?.transition).toMatchObject({ fromMonth: 2, toMonth: 3 });
  });

  it('supports all six configured months and future enemy types without spawning them', () => {
    const state = new GameState();
    const campaign = new CampaignSystem(state, campaignMonths);
    campaign.setMonth(6);

    expect(campaign.getCurrentMonth()).toMatchObject({
      id: 6,
      startDay: 151,
      endDay: 180,
      activeEnemyTypes: ['coworker', 'hr', 'companyCar', 'manager', 'zus'],
    });
  });

  it('clamps progression at day 180', () => {
    const campaign = new CampaignSystem(new GameState(), campaignMonths);
    campaign.setDay(179);

    expect(campaign.advanceDays(20).currentDay).toBe(180);
    expect(campaign.getCurrentMonth().id).toBe(6);
  });
});
