import type { CampaignMonthId } from '../domain/campaign/campaign-types';
import type { PhoneCampaignStats } from '../domain/phone/phone-types';
import {
  SAVE_FORMAT_VERSION,
  type CampaignStatisticsData,
  type FinalRank,
  type FinaleEndingId,
  type GameStateDataV7,
} from '../domain/game-state/game-state-types';
import { PRINT_PROJECT_STATE, type PrintProjectState } from '../domain/printing/print-job-types';

const DEFAULT_MISSION_ID = 'medicine-run';

export class GameState {
  private data: GameStateDataV7;

  public constructor(data: GameStateDataV7 = createDefaultGameStateData()) {
    this.data = cloneGameStateData(data);
  }

  public getSnapshot(): GameStateDataV7 {
    return cloneGameStateData(this.data);
  }

  public getCurrentMissionId(): string | null {
    return this.data.currentMissionId;
  }

  public getCurrentMissionStepIndex(): number {
    return this.data.currentMissionStepIndex;
  }

  public setMissionProgress(missionId: string | null, stepIndex: number): void {
    this.data.currentMissionId = missionId;
    this.data.currentMissionStepIndex = Math.max(0, Math.floor(stepIndex));
  }

  public completeMission(missionId: string, nextMissionId: string | null): void {
    addUnique(this.data.completedMissionIds, missionId);
    this.setMissionProgress(nextMissionId, 0);
  }

  public getCompletedMissionIds(): readonly string[] {
    return this.data.completedMissionIds;
  }

  public getCurrentL4Day(): number {
    return this.data.currentL4Day;
  }

  public getCurrentMonth(): CampaignMonthId {
    return this.data.currentMonth;
  }

  public getCompletedMonths(): readonly CampaignMonthId[] {
    return this.data.completedMonths;
  }

  public setCampaignProgress(
    currentL4Day: number,
    currentMonth: CampaignMonthId,
    completedMonths: readonly CampaignMonthId[],
  ): void {
    this.data.currentL4Day = Math.max(1, Math.floor(currentL4Day));
    this.data.currentMonth = currentMonth;
    this.data.completedMonths = [...new Set(completedMonths)].sort((a, b) => a - b);
  }

  public setSuspicion(value: number): void {
    this.data.suspicion = clamp(value, 0, 100);
  }

  public setSuspicionMaxReached(reached: boolean): void {
    this.data.suspicionMaxReached = reached;
  }

  public hasSuspicionMaxReached(): boolean {
    return this.data.suspicionMaxReached;
  }

  public isPhoneUnlocked(): boolean {
    return this.data.phone.unlocked;
  }

  public unlockPhone(): void {
    this.data.phone.unlocked = true;
  }

  public getPhoneCampaignStats(): PhoneCampaignStats {
    return {
      totalAnswered: this.data.phone.totalAnswered,
      totalMissed: this.data.phone.totalMissed,
      totalDeclined: this.data.phone.totalDeclined,
    };
  }

  public setPhoneCampaignStats(stats: Readonly<PhoneCampaignStats>): void {
    this.data.phone.totalAnswered = Math.max(0, Math.floor(stats.totalAnswered));
    this.data.phone.totalMissed = Math.max(0, Math.floor(stats.totalMissed));
    this.data.phone.totalDeclined = Math.max(0, Math.floor(stats.totalDeclined));
  }

  public isHrUnlocked(): boolean {
    return this.data.hr.unlocked;
  }

  public unlockHr(): void {
    this.data.hr.unlocked = true;
  }

  public isManagerUnlocked(): boolean { return this.data.manager.unlocked; }
  public unlockManager(): void { this.data.manager.unlocked = true; }

  public recordDetection(source: 'coworker' | 'hr' | 'companyCar' | 'manager'): void {
    this.data.campaignStats.totalDetections += 1;
    const field = `${source}Detections` as const;
    this.data.campaignStats[field] += 1;
  }

  public incrementCampaignStat(stat: 'threeDShopVisits' | 'kebabsCollected', amount = 1): void {
    this.data.campaignStats[stat] = Math.max(0, this.data.campaignStats[stat] + Math.floor(amount));
  }

  public getCampaignStatistics(): CampaignStatisticsData {
    return { ...this.data.campaignStats };
  }

  public recordCriticalSuspicionIncident(missionId: string): boolean {
    if (this.data.criticalIncidentMissionIds.includes(missionId)) return false;
    this.data.criticalIncidentMissionIds.push(missionId);
    this.data.campaignStats.criticalSuspicionIncidents += 1;
    this.data.suspicionMaxReached = true;
    return true;
  }

  public hasCriticalSuspicionIncidentForMission(missionId: string): boolean {
    return this.data.criticalIncidentMissionIds.includes(missionId);
  }

  public setCriticalSuspicionIncidentsForDebug(count: number): void {
    const safeCount = Math.max(0, Math.floor(count));
    this.data.campaignStats.criticalSuspicionIncidents = safeCount;
    this.data.criticalIncidentMissionIds = Array.from(
      { length: safeCount },
      (_, index) => `debug-critical-incident-${index + 1}`,
    );
    this.data.suspicionMaxReached = safeCount > 0;
  }

  public completeCampaign(endingId: FinaleEndingId, finalScore: number, finalRank: FinalRank): void {
    const rankOrder: readonly FinalRank[] = ['S', 'A', 'B', 'C', 'D'];
    this.data.finale.campaignCompleted = true;
    this.data.finale.endingId = endingId;
    this.data.finale.finalScore = Math.max(0, Math.round(finalScore));
    this.data.finale.finalRank = finalRank;
    this.data.finale.highestLocalScore = Math.max(this.data.finale.highestLocalScore, finalScore);
    if (
      this.data.finale.bestLocalRank === null ||
      rankOrder.indexOf(finalRank) < rankOrder.indexOf(this.data.finale.bestLocalRank)
    ) {
      this.data.finale.bestLocalRank = finalRank;
    }
  }

  public getDialogueChoice(dialogueId: string): string | null {
    return this.data.hr.dialogueChoices[dialogueId] ?? null;
  }

  public recordDialogueChoice(dialogueId: string, choiceId: string): boolean {
    if (this.data.hr.dialogueChoices[dialogueId] !== undefined) return false;
    this.data.hr.dialogueChoices[dialogueId] = choiceId;
    return true;
  }

  public setDialogueChoiceForDebug(dialogueId: string, choiceId: string): void {
    this.data.hr.dialogueChoices[dialogueId] = choiceId;
  }

  public setInventory(inventory: Readonly<Record<string, number>>): void {
    this.data.inventory = Object.fromEntries(
      Object.entries(inventory).filter(([, quantity]) => Number.isInteger(quantity) && quantity > 0),
    );
  }

  public addFilamentSpool(spoolId: string): void {
    addUnique(this.data.home.filamentSpoolIds, spoolId);
  }

  public addDeskItem(itemId: string): void {
    addUnique(this.data.home.deskItemIds, itemId);
  }

  public completePrint(printJobId: string): void {
    addUnique(this.data.home.completedPrintIds, printJobId);
    if (this.data.home.currentPrintId === printJobId) {
      this.data.home.currentPrintId = null;
    }
    this.data.home.printProjectStates[printJobId] = PRINT_PROJECT_STATE.Completed;
  }

  public startPrint(printJobId: string): void {
    this.data.home.currentPrintId = printJobId;
    this.data.home.printProjectStates[printJobId] = PRINT_PROJECT_STATE.Printing;
  }

  public setPrintProjectState(printJobId: string, state: PrintProjectState): void {
    this.data.home.printProjectStates[printJobId] = state;
    if (state !== PRINT_PROJECT_STATE.Printing && this.data.home.currentPrintId === printJobId) {
      this.data.home.currentPrintId = null;
    }
  }

  public getPrintProjectState(printJobId: string): PrintProjectState {
    return this.data.home.printProjectStates[printJobId] ?? PRINT_PROJECT_STATE.Locked;
  }

  public resetHomeProgression(): void {
    this.data.home = createDefaultHomeProgression();
  }
}

export function createDefaultGameStateData(): GameStateDataV7 {
  return {
    version: SAVE_FORMAT_VERSION,
    currentMissionId: DEFAULT_MISSION_ID,
    currentMissionStepIndex: 0,
    completedMissionIds: [],
    suspicion: 0,
    suspicionMaxReached: false,
    criticalIncidentMissionIds: [],
    inventory: {},
    home: createDefaultHomeProgression(),
    currentL4Day: 23,
    currentMonth: 1,
    completedMonths: [],
    phone: {
      unlocked: false,
      totalAnswered: 0,
      totalMissed: 0,
      totalDeclined: 0,
    },
    hr: { unlocked: false, dialogueChoices: {} },
    manager: { unlocked: false },
    campaignStats: createDefaultCampaignStatistics(),
    finale: {
      campaignCompleted: false,
      endingId: null,
      finalScore: null,
      finalRank: null,
      highestLocalScore: 0,
      bestLocalRank: null,
    },
  };
}

function createDefaultHomeProgression(): GameStateDataV7['home'] {
  return {
    filamentSpoolIds: [],
    completedPrintIds: [],
    deskItemIds: [],
    decorationIds: [],
    currentPrintId: null,
    printProjectStates: {},
  };
}

function cloneGameStateData(data: GameStateDataV7): GameStateDataV7 {
  return {
    ...data,
    completedMissionIds: [...data.completedMissionIds],
    completedMonths: [...data.completedMonths],
    criticalIncidentMissionIds: [...data.criticalIncidentMissionIds],
    inventory: { ...data.inventory },
    home: {
      filamentSpoolIds: [...data.home.filamentSpoolIds],
      completedPrintIds: [...data.home.completedPrintIds],
      deskItemIds: [...data.home.deskItemIds],
      decorationIds: [...data.home.decorationIds],
      currentPrintId: data.home.currentPrintId,
      printProjectStates: { ...data.home.printProjectStates },
    },
    phone: { ...data.phone },
    hr: { unlocked: data.hr.unlocked, dialogueChoices: { ...data.hr.dialogueChoices } },
    manager: { ...data.manager },
    campaignStats: { ...data.campaignStats },
    finale: { ...data.finale },
  };
}

function createDefaultCampaignStatistics(): CampaignStatisticsData {
  return {
    totalDetections: 0,
    coworkerDetections: 0,
    hrDetections: 0,
    managerDetections: 0,
    companyCarDetections: 0,
    threeDShopVisits: 0,
    kebabsCollected: 0,
    criticalSuspicionIncidents: 0,
  };
}

function addUnique(target: string[], value: string): void {
  if (!target.includes(value)) {
    target.push(value);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
