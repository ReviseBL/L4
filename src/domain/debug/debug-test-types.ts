import type { Point2D } from '../../core/math/geometry-types';
import type { CampaignMonthId } from '../campaign/campaign-types';
import type { FinaleEndingId, GameStateDataV7 } from '../game-state/game-state-types';
import type { ZusFinalePhase } from '../finale/zus-finale-types';
import type { HrState } from '../npcs/hr-types';
import type { CompanyCarState } from '../npcs/company-car-types';
import type { ManagerState } from '../npcs/manager-types';

export const DEBUG_MISSION_STAGES = [
  'MISSION_START',
  'AFTER_INTRO',
  'ON_ROUTE_TO_OBJECTIVE',
  'OBJECTIVE_READY',
  'OBJECTIVE_COLLECTED',
  'RETURNING_HOME',
  'FINAL_INTERACTION_READY',
] as const;

export type DebugMissionStage = (typeof DEBUG_MISSION_STAGES)[number];
export type DebugHomePreset = 'month1' | 'month2' | 'month3' | 'month4' | 'month5' | 'month6';

export interface DebugMissionCheckpointDefinition {
  stage: DebugMissionStage;
  stepIndex: number;
  playerStart: Point2D;
  inventory?: Readonly<Record<string, number>>;
}

export interface DebugMissionTestDefinition {
  missionId: string;
  label: string;
  month: CampaignMonthId;
  day: number;
  phoneEnabled: boolean;
  coworkerEnabled: boolean;
  hrEnabled: boolean;
  companyCarEnabled: boolean;
  managerEnabled: boolean;
  checkpoints: readonly DebugMissionCheckpointDefinition[];
}

export interface DebugTestSelection {
  missionId: string;
  stage: DebugMissionStage;
  day: number;
  suspicion: number;
  phoneEnabled: boolean;
  coworkerEnabled: boolean;
  hrEnabled: boolean;
  companyCarEnabled: boolean;
  managerEnabled: boolean;
  homePreset: DebugHomePreset;
}

export interface DebugRuntimeState {
  version: 1;
  label: string;
  selection: DebugTestSelection;
  gameState: GameStateDataV7;
  playerStart: Point2D;
  forcePhoneCall: boolean;
  hrStart?: Point2D;
  hrState?: HrState;
  triggerHrConversation?: boolean;
  companyCarStart?: Point2D;
  companyCarState?: CompanyCarState;
  forceCompanyCarDetection?: boolean;
  forcePositionReport?: boolean;
  managerStart?: Point2D;
  managerState?: ManagerState;
  forceManagerDetection?: boolean;
  triggerZusSummons?: boolean;
  finalePhase?: ZusFinalePhase;
  finaleCredibility?: number;
  forcedEnding?: FinaleEndingId;
  triggerCriticalSuspicionIncident?: boolean;
  criticalSuspicionIncidents?: number;
  currentMissionCriticalIncident?: boolean;
}

export interface DebugScenarioDefinition {
  id: string;
  label: string;
  selection: DebugTestSelection;
  runtimeOverrides?: Partial<Pick<
    DebugRuntimeState,
    'forcePhoneCall' | 'hrStart' | 'hrState' | 'triggerHrConversation' | 'companyCarStart' | 'companyCarState' | 'forceCompanyCarDetection' | 'forcePositionReport' | 'managerStart' | 'managerState' | 'forceManagerDetection' | 'triggerZusSummons' | 'finalePhase' | 'finaleCredibility' | 'forcedEnding' | 'triggerCriticalSuspicionIncident' | 'criticalSuspicionIncidents' | 'currentMissionCriticalIncident'
  >>;
}
