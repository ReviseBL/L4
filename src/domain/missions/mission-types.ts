import type {
  CampaignMonthId,
  CampaignMonthTransition,
} from '../campaign/campaign-types';
import type { PhoneCallDefinition, PhoneMissionStats } from '../phone/phone-types';
import type { DialogueTone } from '../dialogue/dialogue-types';
import type { ManagerInterestPoint } from '../npcs/manager-types';
import type { PrintProjectState } from '../printing/print-job-types';
import type { MinigameRequest } from '../minigames/minigame-types';

export interface MissionSequenceEntry {
  speaker?: string;
  text: string;
  tone?: DialogueTone;
}

export type MissionEffect =
  | { type: 'add-item'; itemId: string; quantity?: number }
  | { type: 'remove-item'; itemId: string; quantity?: number }
  | { type: 'show-sequence'; entries: readonly MissionSequenceEntry[] }
  | { type: 'start-print'; printJobId: string }
  | { type: 'complete-print'; printJobId: string }
  | { type: 'add-filament-spool'; spoolId: string }
  | { type: 'add-desk-item'; itemId: string }
  | { type: 'increment-campaign-stat'; stat: 'threeDShopVisits' | 'kebabsCollected'; amount?: number }
  | { type: 'set-print-project-state'; printJobId: string; state: PrintProjectState }
  /** Short interactive break (threading filament, tightening the nozzle...). Waits until solved. */
  | { type: 'play-minigame'; minigame: MinigameRequest };

export type MissionTrigger =
  | { type: 'interaction'; targetId: string }
  | { type: 'area-entered'; areaId: string };

export type MissionEvent = MissionTrigger;

/**
 * Something the player must get through in the world before an interaction
 * step counts (the estate keeps running meanwhile).
 */
export type MissionStepChallenge =
  | { type: 'parcel-code'; codeLength: number }
  | { type: 'pharmacy-queue'; queueId: string };

export interface MissionStepDefinition {
  id: string;
  objective: string;
  trigger: MissionTrigger;
  interactionPrompt?: string;
  effects?: readonly MissionEffect[];
  challenge?: MissionStepChallenge;
}

export interface MissionDefinition {
  id: string;
  campaignMonth: CampaignMonthId;
  title: string;
  goal: string;
  daysPassed: number;
  phoneCalls?: readonly PhoneCallDefinition[];
  coworkerPatrolRouteId?: string;
  hrPatrolRouteId?: string;
  companyCarRouteId?: string;
  managerInterestPoints?: readonly ManagerInterestPoint[];
  intro?: readonly MissionEffect[];
  completionEffects?: readonly MissionEffect[];
  steps: readonly MissionStepDefinition[];
}

export interface MissionRunContext {
  nowMs: number;
  suspicion: number;
}

export interface MissionSummary {
  missionId: string;
  title: string;
  elapsedMs: number;
  detectionCount: number;
  suspicionBeforeMission: number;
  suspicionBeforeReward: number;
  suspicionGained: number;
  daysPassed: number;
}

export interface MissionCompletionSummary extends MissionSummary {
  stealthBonus: number;
  suspicionAfterMission: number;
  currentL4Day: number;
  currentMonth: CampaignMonthId;
  stealthMessage: readonly string[];
  monthTransition: CampaignMonthTransition | null;
  phoneStats: Readonly<PhoneMissionStats> | null;
  criticalSuspicionIncident: boolean;
}

export interface MissionStartResult {
  mission: MissionDefinition;
  effects: readonly MissionEffect[];
}

export interface MissionEventResult {
  matched: boolean;
  completedStepId: string | null;
  effects: readonly MissionEffect[];
  summary: MissionSummary | null;
}

export interface MissionProgressSnapshot {
  missionId: string;
  stepIndex: number;
}
