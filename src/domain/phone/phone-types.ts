export type PhoneState =
  | 'DISABLED'
  | 'IDLE'
  | 'RINGING'
  | 'ANSWERED'
  | 'COOLDOWN'
  | 'AIRPLANE_MODE';

export type PhoneCaller = 'manager';

export interface PhoneDialogueDefinition {
  lines: readonly DialogueLine[];
  responses?: readonly DialogueChoice[];
}

export type PhoneCallTrigger =
  | { type: 'elapsedTime'; seconds: number }
  | { type: 'enterZone'; zoneId: string; delaySeconds?: number }
  | { type: 'objectiveCompleted'; stepId: string; delaySeconds?: number }
  | { type: 'itemPickedUp'; itemId: string; delaySeconds?: number }
  | { type: 'returningHome'; afterStepId: string; delaySeconds?: number };

export type PhoneTriggerSignal =
  | { type: 'enterZone'; zoneId: string }
  | { type: 'objectiveCompleted'; stepId: string }
  | { type: 'itemPickedUp'; itemId: string }
  | { type: 'returningHome'; afterStepId: string };

export interface PhoneCallDefinition {
  id: string;
  caller: PhoneCaller;
  trigger: PhoneCallTrigger;
  ringDuration: number;
  answerDuration: number;
  dialogue: PhoneDialogueDefinition;
  tutorial?: boolean;
}

export interface PhoneSystemConfig {
  minimumCallCooldownSeconds: number;
  airplaneModeDurationSeconds: number;
  maximumCallsPerMission: number;
}

export interface PhoneMissionStats {
  callsReceived: number;
  callsAnswered: number;
  callsMissed: number;
  callsDeclined: number;
  airplaneModeUsed: boolean;
}

export interface PhoneCampaignStats {
  totalAnswered: number;
  totalMissed: number;
  totalDeclined: number;
}

export type PhoneSuspicionEventType = 'missedWorkCall' | 'declinedWorkCall';

export interface PhoneSuspicionEvent {
  type: PhoneSuspicionEventType;
  missionId: string;
}

export type PhoneOutcome = 'ANSWERED' | 'MISSED' | 'DECLINED' | 'CANCELLED_BY_AIRPLANE_MODE';

export interface PhoneSystemCallbacks {
  onSuspicionEvent?: (event: PhoneSuspicionEvent) => void;
  onOutcome?: (outcome: PhoneOutcome, call: PhoneCallDefinition) => void;
  onStatsChanged?: (
    missionStats: Readonly<PhoneMissionStats>,
    campaignStats: Readonly<PhoneCampaignStats>,
  ) => void;
}

export interface PhoneSnapshot {
  state: PhoneState;
  enabled: boolean;
  unlocked: boolean;
  activeCall: PhoneCallDefinition | null;
  stateRemainingMs: number;
  missionStats: Readonly<PhoneMissionStats>;
  campaignStats: Readonly<PhoneCampaignStats>;
  airplaneModeAvailable: boolean;
  missionElapsedMs: number;
  pendingCalls: number;
}
import type { DialogueChoice, DialogueLine } from '../dialogue/dialogue-types';
