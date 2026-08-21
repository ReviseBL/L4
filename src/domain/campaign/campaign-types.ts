export type CampaignMonthId = 1 | 2 | 3 | 4 | 5 | 6;

export type EnemyType = 'coworker' | 'hr' | 'companyCar' | 'manager' | 'zus';

export interface CampaignDifficultyDefinition {
  level: number;
  suspicionMultiplier: number;
  npcAwarenessMultiplier: number;
  npcSearchDurationMultiplier: number;
}

export interface CampaignMonthTransitionDefinition {
  heading: string;
  message: string;
}

export interface CampaignMonthDefinition {
  id: CampaignMonthId;
  name: string;
  startDay: number;
  endDay: number;
  difficulty: CampaignDifficultyDefinition;
  activeEnemyTypes: readonly EnemyType[];
  transition: CampaignMonthTransitionDefinition | null;
}

export interface CampaignMonthTransition {
  fromMonth: CampaignMonthId;
  toMonth: CampaignMonthId;
  completedDays: number;
  definition: CampaignMonthTransitionDefinition;
}

export interface CampaignAdvanceResult {
  previousDay: number;
  currentDay: number;
  daysPassed: number;
  previousMonth: CampaignMonthId;
  currentMonth: CampaignMonthId;
  completedMonths: readonly CampaignMonthId[];
  transition: CampaignMonthTransition | null;
}
