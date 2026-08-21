import type {
  MissionDefinition,
  MissionEvent,
  MissionEventResult,
  MissionRunContext,
  MissionProgressSnapshot,
  MissionStartResult,
  MissionStepDefinition,
} from '../domain/missions/mission-types';

export class MissionSystem {
  private missionIndex = -1;
  private stepIndex = 0;
  private missionStartedAtMs = 0;
  private startingSuspicion = 0;
  private detectionCount = 0;
  private currentCompleted = false;

  public constructor(private readonly missions: readonly MissionDefinition[]) {
    if (missions.length === 0) {
      throw new Error('MissionSystem requires at least one mission definition.');
    }

    validateMissionDefinitions(missions);
  }

  public startFirst(context: MissionRunContext): MissionStartResult {
    this.missionIndex = 0;
    return this.startCurrent(context);
  }

  public startAt(
    missionId: string,
    stepIndex: number,
    context: MissionRunContext,
  ): MissionStartResult {
    const missionIndex = this.missions.findIndex((mission) => mission.id === missionId);

    if (missionIndex < 0) {
      throw new Error(`Unknown mission id: ${missionId}.`);
    }
    if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= this.missions[missionIndex].steps.length) {
      throw new Error(`Invalid step index ${stepIndex} for mission ${missionId}.`);
    }

    this.missionIndex = missionIndex;
    return this.startCurrent(context, stepIndex);
  }

  public startNext(context: MissionRunContext): MissionStartResult | null {
    if (!this.hasNextMission()) {
      return null;
    }

    this.missionIndex += 1;
    return this.startCurrent(context);
  }

  public handleEvent(event: MissionEvent, context: MissionRunContext): MissionEventResult {
    const step = this.getCurrentStep();

    if (!step || !eventsMatch(step.trigger, event)) {
      return { matched: false, completedStepId: null, effects: [], summary: null };
    }

    this.stepIndex += 1;
    const mission = this.getCurrentMission();
    const completed = mission !== null && this.stepIndex >= mission.steps.length;
    this.currentCompleted = completed;

    return {
      matched: true,
      completedStepId: step.id,
      effects: completed
        ? [...(step.effects ?? []), ...(mission?.completionEffects ?? [])]
        : (step.effects ?? []),
      summary:
        completed && mission
          ? {
              missionId: mission.id,
              title: mission.title,
              elapsedMs: Math.max(0, context.nowMs - this.missionStartedAtMs),
              detectionCount: this.detectionCount,
              suspicionBeforeMission: this.startingSuspicion,
              suspicionBeforeReward: context.suspicion,
              suspicionGained: context.suspicion - this.startingSuspicion,
              daysPassed: mission.daysPassed,
            }
          : null,
    };
  }

  public recordDetection(): void {
    if (this.getCurrentMission() && !this.currentCompleted) {
      this.detectionCount += 1;
    }
  }

  public getCurrentMission(): MissionDefinition | null {
    return this.missions[this.missionIndex] ?? null;
  }

  public getCurrentStep(): MissionStepDefinition | null {
    return this.getCurrentMission()?.steps[this.stepIndex] ?? null;
  }

  public getCurrentMissionTitle(): string {
    return this.getCurrentMission()?.title ?? 'BRAK AKTYWNEJ MISJI';
  }

  public getCurrentObjectiveText(): string {
    return this.getCurrentStep()?.objective ?? 'Misja ukończona.';
  }

  public getInteractionPrompt(targetId: string): string | null {
    const step = this.getCurrentStep();

    return step?.trigger.type === 'interaction' && step.trigger.targetId === targetId
      ? (step.interactionPrompt ?? null)
      : null;
  }

  public getCurrentInteractionTargetId(): string | null {
    const trigger = this.getCurrentStep()?.trigger;
    return trigger?.type === 'interaction' ? trigger.targetId : null;
  }

  public hasNextMission(): boolean {
    return this.missionIndex >= 0 && this.missionIndex + 1 < this.missions.length;
  }

  public getNextMissionId(): string | null {
    return this.missions[this.missionIndex + 1]?.id ?? null;
  }

  public getProgress(): MissionProgressSnapshot | null {
    const mission = this.getCurrentMission();
    return mission ? { missionId: mission.id, stepIndex: this.stepIndex } : null;
  }

  private startCurrent(context: MissionRunContext, stepIndex = 0): MissionStartResult {
    const mission = this.getCurrentMission();

    if (!mission) {
      throw new Error(`Missing mission definition at index ${this.missionIndex}.`);
    }

    this.stepIndex = stepIndex;
    this.missionStartedAtMs = context.nowMs;
    this.startingSuspicion = context.suspicion;
    this.detectionCount = 0;
    this.currentCompleted = false;

    return { mission, effects: mission.intro ?? [] };
  }
}

function validateMissionDefinitions(missions: readonly MissionDefinition[]): void {
  const missionIds = new Set<string>();

  for (const mission of missions) {
    if (
      !mission.id ||
      !Number.isInteger(mission.campaignMonth) ||
      mission.campaignMonth < 1 ||
      mission.campaignMonth > 6 ||
      !mission.title ||
      !mission.goal ||
      !Number.isInteger(mission.daysPassed) ||
      mission.daysPassed < 0 ||
      mission.steps.length === 0
    ) {
      throw new Error(`Invalid mission definition: ${mission.id || '<missing id>'}.`);
    }

    if (missionIds.has(mission.id)) {
      throw new Error(`Duplicate mission id: ${mission.id}.`);
    }

    missionIds.add(mission.id);
    if (mission.managerInterestPoints) {
      const interestPointIds = new Set<string>();
      for (const point of mission.managerInterestPoints) {
        if (!point.id || !Number.isFinite(point.x) || !Number.isFinite(point.y) || interestPointIds.has(point.id)) {
          throw new Error(`Invalid manager interest point in mission ${mission.id}: ${point.id || '<missing id>'}.`);
        }
        interestPointIds.add(point.id);
      }
    }
    const stepIds = new Set<string>();

    for (const step of mission.steps) {
      if (!step.id || !step.objective) {
        throw new Error(`Invalid step in mission: ${mission.id}.`);
      }

      if (stepIds.has(step.id)) {
        throw new Error(`Duplicate step id ${step.id} in mission ${mission.id}.`);
      }

      stepIds.add(step.id);
    }
  }
}

function eventsMatch(trigger: MissionEvent, event: MissionEvent): boolean {
  if (trigger.type !== event.type) {
    return false;
  }

  return trigger.type === 'interaction'
    ? trigger.targetId === (event as Extract<MissionEvent, { type: 'interaction' }>).targetId
    : trigger.areaId === (event as Extract<MissionEvent, { type: 'area-entered' }>).areaId;
}
