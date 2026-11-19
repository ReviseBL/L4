import type { CampaignMonthDefinition, CampaignMonthId } from '../domain/campaign/campaign-types';
import type {
  CompanySuspicionLevel,
  DetectionEvent,
  DetectionResult,
  StealthRewardResult,
  SuspicionEvent,
  SuspicionEventResult,
  SuspicionChangeResult,
  SuspicionConfig,
  SuspicionThresholdDefinition,
  MissionSuspicionResolution,
} from '../domain/suspicion/suspicion-types';

export class SuspicionSystem {
  private value: number;
  private currentMissionId: string | null = null;
  private missionDetectionCount = 0;

  public constructor(
    initialValue: number,
    private readonly config: SuspicionConfig,
    private readonly campaignMonths: readonly CampaignMonthDefinition[],
  ) {
    validateSuspicionConfig(config);
    this.value = this.clamp(initialValue);
  }

  public getValue(): number {
    return this.value;
  }

  public getLevel(): CompanySuspicionLevel {
    return this.getThreshold().level;
  }

  public getThreshold(): SuspicionThresholdDefinition {
    return findThreshold(this.value, this.config.thresholds);
  }

  public startMission(missionId: string | null): void {
    this.currentMissionId = missionId;
    this.missionDetectionCount = 0;
  }

  public getMissionDetectionCount(): number {
    return this.missionDetectionCount;
  }

  public registerDetection(event: DetectionEvent): DetectionResult {
    if (this.currentMissionId !== event.missionId) {
      this.startMission(event.missionId);
    }

    this.missionDetectionCount += 1;
    const basePoints = this.config.baseDetectionPoints[event.source];
    const monthMultiplier = this.requireMonth(event.month).difficulty.suspicionMultiplier;
    const escalationMultiplier = 1 + (this.missionDetectionCount - 1) * this.config.detectionEscalation;
    const points = Math.round(basePoints * monthMultiplier * escalationMultiplier);
    const change = this.applyDelta(points);

    return {
      ...change,
      source: event.source,
      detectionNumber: this.missionDetectionCount,
      basePoints,
      monthMultiplier,
      escalationMultiplier,
    };
  }

  public registerEvent(event: SuspicionEvent): SuspicionEventResult {
    const basePoints = this.config.suspicionEvents[event.type];
    const monthMultiplier = this.requireMonth(event.month).difficulty.suspicionMultiplier;
    const change = this.applyDelta(Math.round(basePoints * monthMultiplier));
    return {
      ...change,
      type: event.type,
      missionId: event.missionId,
      basePoints,
      monthMultiplier,
    };
  }

  public applyStealthReward(detectionCount: number): StealthRewardResult {
    const configuredBonus =
      detectionCount === 0
        ? this.config.stealthRewards.noDetections
        : detectionCount === 1
          ? this.config.stealthRewards.oneDetection
          : this.config.stealthRewards.multipleDetections;
    const change = this.applyDelta(configuredBonus);

    return {
      ...change,
      configuredBonus,
      message:
        detectionCount === 0
          ? ['PERFEKCYJNE L4', 'NIKT CIĘ NIE ZAUWAŻYŁ']
          : detectionCount === 1
            ? ['PREMIA ZA DYSKRECJĘ']
            : [],
    };
  }

  public resolveMissionCompletion(
    detectionCount: number,
    criticalIncidentOccurred: boolean,
  ): MissionSuspicionResolution {
    if (!criticalIncidentOccurred) {
      return { ...this.applyStealthReward(detectionCount), criticalIncident: false };
    }

    const change = this.setValue(this.config.criticalSuspicion.missionEndReset);
    return {
      ...change,
      configuredBonus: 0,
      message: [],
      criticalIncident: true,
    };
  }

  public setValue(value: number): SuspicionChangeResult {
    return this.applyDelta(value - this.value);
  }

  /** Flat penalty (e.g. a bad excuse when caught), reported like any other change. */
  public applyPenalty(amount: number): SuspicionChangeResult {
    return this.applyDelta(Math.abs(amount));
  }

  public increase(amount: number): number {
    return this.applyDelta(Math.abs(amount)).currentValue;
  }

  public decrease(amount: number): number {
    return this.applyDelta(-Math.abs(amount)).currentValue;
  }

  public reset(): void {
    this.value = 0;
    this.startMission(null);
  }

  private applyDelta(delta: number): SuspicionChangeResult {
    const previousValue = this.value;
    const previousLevel = findThreshold(previousValue, this.config.thresholds).level;
    this.value = this.clamp(this.value + delta);
    const currentLevel = findThreshold(this.value, this.config.thresholds).level;

    return {
      previousValue,
      currentValue: this.value,
      appliedDelta: this.value - previousValue,
      previousLevel,
      currentLevel,
      events: previousValue < 100 && this.value === 100 ? ['SUSPICION_MAX_REACHED'] : [],
    };
  }

  private requireMonth(monthId: CampaignMonthId): CampaignMonthDefinition {
    const month = this.campaignMonths.find((candidate) => candidate.id === monthId);
    if (!month) {
      throw new Error(`Missing suspicion multiplier for campaign month ${monthId}.`);
    }
    return month;
  }

  private clamp(value: number): number {
    return Math.min(100, Math.max(0, value));
  }
}

function findThreshold(
  value: number,
  thresholds: readonly SuspicionThresholdDefinition[],
): SuspicionThresholdDefinition {
  const threshold = [...thresholds]
    .sort((a, b) => b.minValue - a.minValue)
    .find((candidate) => value >= candidate.minValue);

  if (!threshold) {
    throw new Error(`No suspicion threshold configured for value ${value}.`);
  }
  return threshold;
}

function validateSuspicionConfig(config: SuspicionConfig): void {
  if (
    config.detectionEscalation < 0 ||
    config.thresholds.length === 0 ||
    Object.values(config.suspicionEvents).some((value) => value < 0)
    || config.criticalSuspicion.missionEndReset < 0
    || config.criticalSuspicion.missionEndReset > 100
    || config.criticalSuspicion.credibilityPenaltyPerIncident < 0
    || config.criticalSuspicion.credibilityPenaltyCap < 0
    || config.criticalSuspicion.scorePenaltyPerIncident < 0
    || config.criticalSuspicion.scorePenaltyCap < 0
  ) {
    throw new Error('Invalid suspicion configuration.');
  }

  const levels = new Set<CompanySuspicionLevel>();
  for (const threshold of config.thresholds) {
    if (levels.has(threshold.level)) {
      throw new Error(`Duplicate suspicion threshold: ${threshold.level}.`);
    }
    levels.add(threshold.level);
  }
}
