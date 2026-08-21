import type {
  CampaignAdvanceResult,
  CampaignMonthDefinition,
  CampaignMonthId,
  CampaignMonthTransition,
  EnemyType,
} from '../domain/campaign/campaign-types';
import type { GameState } from '../state/game-state';

export class CampaignSystem {
  private readonly byId = new Map<CampaignMonthId, CampaignMonthDefinition>();

  public constructor(
    private readonly gameState: GameState,
    private readonly months: readonly CampaignMonthDefinition[],
  ) {
    validateCampaignMonths(months);
    for (const month of months) {
      this.byId.set(month.id, month);
    }
    this.setDay(gameState.getCurrentL4Day());
  }

  public getCurrentMonth(): CampaignMonthDefinition {
    return this.requireMonth(this.gameState.getCurrentMonth());
  }

  public getCurrentDay(): number {
    return this.gameState.getCurrentL4Day();
  }

  public isEnemyConfigured(enemyType: EnemyType): boolean {
    return this.getCurrentMonth().activeEnemyTypes.includes(enemyType);
  }

  public advanceDays(daysPassed: number): CampaignAdvanceResult {
    if (!Number.isInteger(daysPassed) || daysPassed < 0) {
      throw new Error(`Campaign daysPassed must be a non-negative integer: ${daysPassed}.`);
    }

    const previousDay = this.getCurrentDay();
    const previousMonth = this.getCurrentMonth().id;
    const lastDay = this.months[this.months.length - 1].endDay;
    const currentDay = Math.min(lastDay, previousDay + daysPassed);
    this.setDay(currentDay);
    const currentMonth = this.getCurrentMonth().id;

    return {
      previousDay,
      currentDay,
      daysPassed: currentDay - previousDay,
      previousMonth,
      currentMonth,
      completedMonths: this.gameState.getCompletedMonths(),
      transition: this.createTransition(previousMonth, currentMonth),
    };
  }

  public setMonth(monthId: CampaignMonthId): void {
    this.setDay(this.requireMonth(monthId).startDay);
  }

  public setDay(day: number): void {
    const firstDay = this.months[0].startDay;
    const lastDay = this.months[this.months.length - 1].endDay;
    const clampedDay = Math.min(lastDay, Math.max(firstDay, Math.floor(day)));
    const month = this.months.find(
      (candidate) => clampedDay >= candidate.startDay && clampedDay <= candidate.endDay,
    );

    if (!month) {
      throw new Error(`No campaign month configured for L4 day ${clampedDay}.`);
    }

    const completedMonths = this.months
      .filter((candidate) => candidate.endDay <= clampedDay)
      .map((candidate) => candidate.id);
    this.gameState.setCampaignProgress(clampedDay, month.id, completedMonths);
  }

  public advanceToNextMonth(): CampaignAdvanceResult {
    const current = this.getCurrentMonth();
    const next = this.byId.get((current.id + 1) as CampaignMonthId);
    return this.advanceDays(next ? next.startDay - this.getCurrentDay() : 0);
  }

  private createTransition(
    previousMonth: CampaignMonthId,
    currentMonth: CampaignMonthId,
  ): CampaignMonthTransition | null {
    if (previousMonth === currentMonth) {
      return null;
    }

    const current = this.requireMonth(currentMonth);
    if (!current.transition) {
      return null;
    }

    return {
      fromMonth: previousMonth,
      toMonth: currentMonth,
      completedDays: current.startDay - 1,
      definition: current.transition,
    };
  }

  private requireMonth(monthId: CampaignMonthId): CampaignMonthDefinition {
    const month = this.byId.get(monthId);
    if (!month) {
      throw new Error(`Unknown campaign month: ${monthId}.`);
    }
    return month;
  }
}

function validateCampaignMonths(months: readonly CampaignMonthDefinition[]): void {
  if (months.length !== 6) {
    throw new Error(`Campaign requires exactly 6 months; received ${months.length}.`);
  }

  for (const [index, month] of months.entries()) {
    const expectedId = (index + 1) as CampaignMonthId;
    const expectedStart = index * 30 + 1;
    const expectedEnd = expectedStart + 29;

    if (month.id !== expectedId || month.startDay !== expectedStart || month.endDay !== expectedEnd) {
      throw new Error(`Invalid campaign boundaries for month ${month.id}.`);
    }
    if (month.difficulty.suspicionMultiplier <= 0 || month.activeEnemyTypes.length === 0) {
      throw new Error(`Invalid campaign difficulty for month ${month.id}.`);
    }
  }
}
