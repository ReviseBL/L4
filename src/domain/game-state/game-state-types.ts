import type { CampaignMonthId } from '../campaign/campaign-types';
import type { PrintProjectState } from '../printing/print-job-types';

export const SAVE_FORMAT_VERSION = 7 as const;

export type FinaleEndingId = 'extended' | 'back-to-work' | 'hr-meeting' | 'waiting-forever';
export type FinalRank = 'S' | 'A' | 'B' | 'C' | 'D';

export interface CampaignStatisticsData {
  totalDetections: number;
  coworkerDetections: number;
  hrDetections: number;
  managerDetections: number;
  companyCarDetections: number;
  threeDShopVisits: number;
  kebabsCollected: number;
  criticalSuspicionIncidents: number;
}

type CampaignStatisticsDataV6 = Omit<CampaignStatisticsData, 'criticalSuspicionIncidents'>;

export interface FinaleProgressStateData {
  campaignCompleted: boolean;
  endingId: FinaleEndingId | null;
  finalScore: number | null;
  finalRank: FinalRank | null;
  highestLocalScore: number;
  bestLocalRank: FinalRank | null;
}

export interface PhoneProgressStateData {
  unlocked: boolean;
  totalAnswered: number;
  totalMissed: number;
  totalDeclined: number;
}

export interface HomeProgressionStateData {
  filamentSpoolIds: string[];
  completedPrintIds: string[];
  deskItemIds: string[];
  decorationIds: string[];
  currentPrintId: string | null;
  printProjectStates?: Record<string, PrintProjectState>;
}

export interface GameStateDataV1 {
  version: 1;
  currentMissionId: string | null;
  currentMissionStepIndex: number;
  completedMissionIds: string[];
  suspicion: number;
  inventory: Record<string, number>;
  home: HomeProgressionStateData;
  currentDay: number;
  currentMonth: number;
}

export interface GameStateDataV2 {
  version: 2;
  currentMissionId: string | null;
  currentMissionStepIndex: number;
  completedMissionIds: string[];
  suspicion: number;
  suspicionMaxReached: boolean;
  inventory: Record<string, number>;
  home: HomeProgressionStateData;
  currentL4Day: number;
  currentMonth: CampaignMonthId;
  completedMonths: CampaignMonthId[];
}

export interface GameStateDataV3 extends Omit<GameStateDataV2, 'version'> {
  version: 3;
  phone: PhoneProgressStateData;
}

export interface HrProgressStateData {
  unlocked: boolean;
  dialogueChoices: Record<string, string>;
}

export interface GameStateDataV4 extends Omit<GameStateDataV3, 'version'> {
  version: 4;
  hr: HrProgressStateData;
}

export interface ManagerProgressStateData {
  unlocked: boolean;
}

export interface GameStateDataV5 extends Omit<GameStateDataV4, 'version' | 'home'> {
  version: 5;
  home: HomeProgressionStateData & { printProjectStates: Record<string, PrintProjectState> };
  manager: ManagerProgressStateData;
}

export interface GameStateDataV6 extends Omit<GameStateDataV5, 'version'> {
  version: 6;
  campaignStats: CampaignStatisticsDataV6;
  finale: FinaleProgressStateData;
}

export interface GameStateDataV7 extends Omit<GameStateDataV6, 'version' | 'campaignStats'> {
  version: typeof SAVE_FORMAT_VERSION;
  campaignStats: CampaignStatisticsData;
  criticalIncidentMissionIds: string[];
}

export type SaveGameData = GameStateDataV7;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
