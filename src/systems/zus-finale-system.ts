import type {
  DocumentChoiceDefinition,
  FinaleCampaignContext,
  FinaleResult,
  ZusFinalePhase,
  ZusFinaleSnapshot,
} from '../domain/finale/zus-finale-types';
import { ZUS_FINALE_PHASE } from '../domain/finale/zus-finale-types';
import { suspicionConfig } from '../data/suspicion/suspicion-config';

export class ZusFinaleSystem {
  private phase: ZusFinalePhase = ZUS_FINALE_PHASE.Documents;
  private credibility: number;
  private readonly selectedDocumentIds = new Set<string>();
  private sprintIncidents = 0;

  public constructor(private readonly context: FinaleCampaignContext, initialCredibility?: number) {
    this.credibility = clamp(initialCredibility ?? calculateInitialCredibility(context), 0, 100);
  }

  public getSnapshot(): ZusFinaleSnapshot {
    return {
      phase: this.phase,
      credibility: this.credibility,
      selectedDocumentIds: [...this.selectedDocumentIds],
      sprintIncidents: this.sprintIncidents,
    };
  }

  public setPhase(phase: ZusFinalePhase): void { this.phase = phase; }
  public setCredibility(value: number): void { this.credibility = clamp(value, 0, 100); }

  public selectDocument(document: DocumentChoiceDefinition): boolean {
    if (this.selectedDocumentIds.has(document.id) || this.selectedDocumentIds.size >= 3) return false;
    this.selectedDocumentIds.add(document.id);
    this.applyCredibility(document.credibilityDelta);
    return true;
  }

  public applyAnswer(delta: number): void { this.applyCredibility(delta); }

  public recordSprintIncident(): void {
    this.sprintIncidents += 1;
    this.applyCredibility(this.sprintIncidents <= 2 ? -2 : -3);
  }

  public calculateResult(forcedEnding?: FinaleResult['endingId']): FinaleResult {
    const endingId = forcedEnding ?? selectEnding(this.credibility, this.context);
    const stealthScore = Math.max(0, 35_000 - this.context.campaignStats.totalDetections * 1_250);
    const suspicionScore = Math.max(0, 25_000 - this.context.suspicion * 250);
    const finaleScore = this.credibility * 300;
    const completionScore = this.context.completedMissionCount * 650;
    const hobbyScore = this.context.acquiredFilamentCount * 450 + this.context.completedPrintCount * 1_100;
    const criticalIncidentPenalty = calculateCriticalIncidentScorePenalty(
      this.context.campaignStats.criticalSuspicionIncidents,
    );
    const score = Math.max(0, Math.round(
      stealthScore + suspicionScore + finaleScore + completionScore + hobbyScore
      - criticalIncidentPenalty,
    ));
    return { credibility: this.credibility, endingId, score, rank: rankForScore(score) };
  }

  private applyCredibility(delta: number): void {
    this.credibility = clamp(this.credibility + delta, 0, 100);
  }
}

export function calculateInitialCredibility(context: FinaleCampaignContext): number {
  let value = 70;
  if (context.suspicion < 40) value += 10;
  else if (context.suspicion >= 90) value -= 20;
  else if (context.suspicion >= 70) value -= 10;
  value -= Math.min(12, context.campaignStats.managerDetections * 3);
  value -= calculateCriticalIncidentCredibilityPenalty(
    context.campaignStats.criticalSuspicionIncidents,
  );
  if (context.hrFirstMeetingChoice === 'still_sick') value += 2;
  if (context.hrFirstMeetingChoice === 'great') value -= 3;
  return clamp(value, 0, 100);
}

export function calculateCriticalIncidentCredibilityPenalty(incidentCount: number): number {
  const balance = suspicionConfig.criticalSuspicion;
  return Math.min(
    balance.credibilityPenaltyCap,
    Math.max(0, Math.floor(incidentCount)) * balance.credibilityPenaltyPerIncident,
  );
}

export function calculateCriticalIncidentScorePenalty(incidentCount: number): number {
  const balance = suspicionConfig.criticalSuspicion;
  return Math.min(
    balance.scorePenaltyCap,
    Math.max(0, Math.floor(incidentCount)) * balance.scorePenaltyPerIncident,
  );
}

function selectEnding(credibility: number, context: FinaleCampaignContext): FinaleResult['endingId'] {
  const hidden = credibility >= 92 && context.suspicion <= 20 && context.l4PrintCompleted && context.campaignStats.managerDetections <= 1;
  if (hidden) return 'waiting-forever';
  if (credibility >= 72) return 'extended';
  if (credibility >= 38 && context.suspicion < 95) return 'back-to-work';
  return 'hr-meeting';
}

function rankForScore(score: number): FinaleResult['rank'] {
  if (score >= 90_000) return 'S';
  if (score >= 75_000) return 'A';
  if (score >= 60_000) return 'B';
  if (score >= 45_000) return 'C';
  return 'D';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}
