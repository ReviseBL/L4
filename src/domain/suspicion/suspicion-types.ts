import type { CampaignMonthId, EnemyType } from '../campaign/campaign-types';

export type CompanySuspicionLevel = 'NORMAL' | 'SUSPICIOUS' | 'HIGH_ALERT' | 'CRITICAL';

export type SuspicionDomainEvent = 'SUSPICION_MAX_REACHED';
export type SuspicionEventType =
  | 'missedWorkCall'
  | 'noisyWorkCall'
  | 'seenThroughWindow'
  | 'declinedWorkCall'
  | 'hrDialogueGettingBetter'
  | 'hrDialogueGreat';

export interface SuspicionThresholdDefinition {
  level: CompanySuspicionLevel;
  minValue: number;
  message: string | null;
  viewDistanceMultiplier: number;
  awarenessMultiplier: number;
  searchDurationMultiplier: number;
  shareApproximatePlayerPositionWithManager: boolean;
}

export interface SuspicionConfig {
  baseDetectionPoints: Readonly<Record<EnemyType, number>>;
  detectionEscalation: number;
  suspicionEvents: Readonly<Record<SuspicionEventType, number>>;
  stealthRewards: {
    noDetections: number;
    oneDetection: number;
    multipleDetections: number;
  };
  criticalSuspicion: {
    missionEndReset: number;
    credibilityPenaltyPerIncident: number;
    credibilityPenaltyCap: number;
    scorePenaltyPerIncident: number;
    scorePenaltyCap: number;
  };
  thresholds: readonly SuspicionThresholdDefinition[];
}

export interface DetectionEvent {
  source: EnemyType;
  missionId: string;
  month: CampaignMonthId;
}

export interface SuspicionEvent {
  type: SuspicionEventType;
  missionId: string;
  month: CampaignMonthId;
}

export interface SuspicionChangeResult {
  previousValue: number;
  currentValue: number;
  appliedDelta: number;
  previousLevel: CompanySuspicionLevel;
  currentLevel: CompanySuspicionLevel;
  events: readonly SuspicionDomainEvent[];
}

export interface DetectionResult extends SuspicionChangeResult {
  source: EnemyType;
  detectionNumber: number;
  basePoints: number;
  monthMultiplier: number;
  escalationMultiplier: number;
}

export interface SuspicionEventResult extends SuspicionChangeResult {
  type: SuspicionEventType;
  missionId: string;
  basePoints: number;
  monthMultiplier: number;
}

export interface StealthRewardResult extends SuspicionChangeResult {
  configuredBonus: number;
  message: readonly string[];
}

export interface MissionSuspicionResolution extends StealthRewardResult {
  criticalIncident: boolean;
}
