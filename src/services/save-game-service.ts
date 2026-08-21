import type { CampaignMonthId } from '../domain/campaign/campaign-types';
import {
  SAVE_FORMAT_VERSION,
  type GameStateDataV1,
  type GameStateDataV2,
  type GameStateDataV3,
  type GameStateDataV4,
  type GameStateDataV5,
  type GameStateDataV6,
  type GameStateDataV7,
  type HomeProgressionStateData,
  type PhoneProgressStateData,
  type StorageLike,
} from '../domain/game-state/game-state-types';
import { createDefaultGameStateData, GameState } from '../state/game-state';

export const SAVE_GAME_STORAGE_KEY = 'l4-office-escape.save';

export class SaveGameService {
  public constructor(private readonly storage: StorageLike) {}

  public hasSave(): boolean {
    return this.readSaveData() !== null;
  }

  public hasUnreadableSave(): boolean {
    const serialized = this.storage.getItem(SAVE_GAME_STORAGE_KEY);
    if (serialized === null) return false;

    try {
      migrateAndValidateSave(JSON.parse(serialized) as unknown);
      return false;
    } catch {
      return true;
    }
  }

  public saveGame(gameState: GameState): void {
    this.storage.setItem(SAVE_GAME_STORAGE_KEY, JSON.stringify(gameState.getSnapshot()));
  }

  public loadGame(): GameState {
    return new GameState(this.readSaveData() ?? createDefaultGameStateData());
  }

  public resetGame(): GameState {
    const previous = this.readSaveData();
    this.storage.removeItem(SAVE_GAME_STORAGE_KEY);
    const fresh = createDefaultGameStateData();
    if (previous) {
      fresh.finale.highestLocalScore = previous.finale.highestLocalScore;
      fresh.finale.bestLocalRank = previous.finale.bestLocalRank;
      if (fresh.finale.highestLocalScore > 0 || fresh.finale.bestLocalRank !== null) {
        this.storage.setItem(SAVE_GAME_STORAGE_KEY, JSON.stringify(fresh));
      }
    }
    return new GameState(fresh);
  }

  private readSaveData(): GameStateDataV7 | null {
    const serialized = this.storage.getItem(SAVE_GAME_STORAGE_KEY);

    if (serialized === null) {
      return null;
    }

    try {
      return migrateAndValidateSave(JSON.parse(serialized) as unknown);
    } catch {
      return null;
    }
  }
}

function migrateAndValidateSave(value: unknown): GameStateDataV7 {
  if (!isRecord(value) || typeof value.version !== 'number') {
    throw new Error('Save game has no valid version.');
  }

  switch (value.version) {
    case 1:
      return migrateV6(migrateV5(migrateV4(migrateV3(migrateV2(migrateV1(validateV1(value)))))));
    case 2:
      return migrateV6(migrateV5(migrateV4(migrateV3(migrateV2(validateV2(value))))));
    case 3:
      return migrateV6(migrateV5(migrateV4(migrateV3(validateV3(value)))));
    case 4:
      return migrateV6(migrateV5(migrateV4(validateV4(value))));
    case 5:
      return migrateV6(migrateV5(validateV5(value)));
    case 6:
      return migrateV6(validateV6(value));
    case SAVE_FORMAT_VERSION:
      return validateV7(value);
    default:
      throw new Error(`Unsupported save format version: ${value.version}`);
  }
}

function migrateV1(value: GameStateDataV1): GameStateDataV2 {
  const currentL4Day = clamp(Math.floor(value.currentDay), 1, 180);
  const currentMonth = monthForDay(currentL4Day);

  return {
    version: 2,
    currentMissionId: value.currentMissionId,
    currentMissionStepIndex: value.currentMissionStepIndex,
    completedMissionIds: value.completedMissionIds,
    suspicion: value.suspicion,
    suspicionMaxReached: value.suspicion >= 100,
    inventory: value.inventory,
    home: value.home,
    currentL4Day,
    currentMonth,
    completedMonths: completedMonthsForDay(currentL4Day),
  };
}

function migrateV2(value: GameStateDataV2): GameStateDataV3 {
  return {
    ...value,
    version: 3,
    phone: {
      unlocked: value.currentMonth >= 2,
      totalAnswered: 0,
      totalMissed: 0,
      totalDeclined: 0,
    },
  };
}

function migrateV3(value: GameStateDataV3): GameStateDataV4 {
  return {
    ...value,
    version: 4,
    hr: { unlocked: value.currentMonth >= 3, dialogueChoices: {} },
  };
}

function migrateV4(value: GameStateDataV4): GameStateDataV5 {
  return {
    ...value,
    version: 5,
    home: { ...value.home, printProjectStates: {} },
    manager: { unlocked: value.currentMonth >= 5 },
  };
}

function migrateV5(value: GameStateDataV5): GameStateDataV6 {
  return {
    ...value,
    version: 6,
    campaignStats: {
      totalDetections: 0,
      coworkerDetections: 0,
      hrDetections: 0,
      managerDetections: 0,
      companyCarDetections: 0,
      threeDShopVisits: 0,
      kebabsCollected: 0,
    },
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

function migrateV6(value: GameStateDataV6): GameStateDataV7 {
  const activeCriticalMission = value.suspicion >= 100 && value.currentMissionId !== null
    ? [value.currentMissionId]
    : [];
  return {
    ...value,
    version: SAVE_FORMAT_VERSION,
    campaignStats: {
      ...value.campaignStats,
      criticalSuspicionIncidents: activeCriticalMission.length,
    },
    criticalIncidentMissionIds: activeCriticalMission,
  };
}

function validateV1(value: Record<string, unknown>): GameStateDataV1 {
  return {
    version: 1,
    ...validateSharedFields(value),
    currentDay: requirePositiveInteger(value.currentDay, 'currentDay'),
    currentMonth: requirePositiveInteger(value.currentMonth, 'currentMonth'),
  };
}

function validateV2(value: Record<string, unknown>): GameStateDataV2 {
  const currentL4Day = clamp(requirePositiveInteger(value.currentL4Day, 'currentL4Day'), 1, 180);
  const currentMonth = requireCampaignMonth(value.currentMonth, 'currentMonth');
  const expectedMonth = monthForDay(currentL4Day);

  return {
    version: 2,
    ...validateSharedFields(value),
    suspicionMaxReached: requireBoolean(value.suspicionMaxReached, 'suspicionMaxReached'),
    currentL4Day,
    currentMonth: currentMonth === expectedMonth ? currentMonth : expectedMonth,
    completedMonths: requireCampaignMonths(value.completedMonths, 'completedMonths'),
  };
}

function validateV3(value: Record<string, unknown>): GameStateDataV3 {
  const v2 = validateV2({ ...value, version: 2 });
  return {
    ...v2,
    version: 3,
    phone: requirePhoneProgress(value.phone),
  };
}

function validateV4(value: Record<string, unknown>): GameStateDataV4 {
  const v3 = validateV3({ ...value, version: 3 });
  const hr = requireRecord(value.hr, 'hr');
  return {
    ...v3,
    version: 4,
    hr: {
      unlocked: requireBoolean(hr.unlocked, 'hr.unlocked'),
      dialogueChoices: requireStringRecord(hr.dialogueChoices, 'hr.dialogueChoices'),
    },
  };
}

function validateV5(value: Record<string, unknown>): GameStateDataV5 {
  const v4 = validateV4({ ...value, version: 4 });
  const manager = requireRecord(value.manager, 'manager');
  const home = requireRecord(value.home, 'home');
  return {
    ...v4,
    version: 5,
    home: {
      ...v4.home,
      printProjectStates: requirePrintProjectStates(home.printProjectStates),
    },
    manager: { unlocked: requireBoolean(manager.unlocked, 'manager.unlocked') },
  };
}

function validateV6(value: Record<string, unknown>): GameStateDataV6 {
  const v5 = validateV5({ ...value, version: 5 });
  const stats = requireRecord(value.campaignStats, 'campaignStats');
  const finale = requireRecord(value.finale, 'finale');
  return {
    ...v5,
    version: 6,
    campaignStats: {
      totalDetections: requireNonNegativeInteger(stats.totalDetections, 'campaignStats.totalDetections'),
      coworkerDetections: requireNonNegativeInteger(stats.coworkerDetections, 'campaignStats.coworkerDetections'),
      hrDetections: requireNonNegativeInteger(stats.hrDetections, 'campaignStats.hrDetections'),
      managerDetections: requireNonNegativeInteger(stats.managerDetections, 'campaignStats.managerDetections'),
      companyCarDetections: requireNonNegativeInteger(stats.companyCarDetections, 'campaignStats.companyCarDetections'),
      threeDShopVisits: requireNonNegativeInteger(stats.threeDShopVisits, 'campaignStats.threeDShopVisits'),
      kebabsCollected: requireNonNegativeInteger(stats.kebabsCollected, 'campaignStats.kebabsCollected'),
    },
    finale: {
      campaignCompleted: requireBoolean(finale.campaignCompleted, 'finale.campaignCompleted'),
      endingId: requireNullableEnum(finale.endingId, ['extended', 'back-to-work', 'hr-meeting', 'waiting-forever'], 'finale.endingId'),
      finalScore: requireNullableNonNegativeInteger(finale.finalScore, 'finale.finalScore'),
      finalRank: requireNullableEnum(finale.finalRank, ['S', 'A', 'B', 'C', 'D'], 'finale.finalRank'),
      highestLocalScore: requireNonNegativeInteger(finale.highestLocalScore, 'finale.highestLocalScore'),
      bestLocalRank: requireNullableEnum(finale.bestLocalRank, ['S', 'A', 'B', 'C', 'D'], 'finale.bestLocalRank'),
    },
  };
}

function validateV7(value: Record<string, unknown>): GameStateDataV7 {
  const v6 = validateV6({ ...value, version: 6 });
  const stats = requireRecord(value.campaignStats, 'campaignStats');
  return {
    ...v6,
    version: SAVE_FORMAT_VERSION,
    campaignStats: {
      ...v6.campaignStats,
      criticalSuspicionIncidents: requireNonNegativeInteger(
        stats.criticalSuspicionIncidents,
        'campaignStats.criticalSuspicionIncidents',
      ),
    },
    criticalIncidentMissionIds: requireStringArray(
      value.criticalIncidentMissionIds,
      'criticalIncidentMissionIds',
    ),
  };
}

function requireNullableEnum<T extends string>(value: unknown, allowed: readonly T[], field: string): T | null {
  if (value === null) return null;
  if (typeof value !== 'string' || !allowed.includes(value as T)) throw new Error(`Invalid save field: ${field}`);
  return value as T;
}

function requireNullableNonNegativeInteger(value: unknown, field: string): number | null {
  if (value === null) return null;
  return requireNonNegativeInteger(value, field);
}

function requirePrintProjectStates(value: unknown): GameStateDataV5['home']['printProjectStates'] {
  const states = requireStringRecord(value, 'home.printProjectStates');
  const allowed = new Set(['LOCKED', 'PLANNED', 'MATERIALS_READY', 'PRINTING', 'COMPLETED']);
  if (!Object.values(states).every((state) => allowed.has(state))) {
    throw new Error('Invalid save field: home.printProjectStates');
  }
  return states as GameStateDataV5['home']['printProjectStates'];
}

function requireStringRecord(value: unknown, field: string): Record<string, string> {
  const record = requireRecord(value, field);
  if (!Object.values(record).every((entry) => typeof entry === 'string')) {
    throw new Error(`Invalid save field: ${field}`);
  }
  return { ...record } as Record<string, string>;
}

function requirePhoneProgress(value: unknown): PhoneProgressStateData {
  const phone = requireRecord(value, 'phone');
  return {
    unlocked: requireBoolean(phone.unlocked, 'phone.unlocked'),
    totalAnswered: requireNonNegativeInteger(phone.totalAnswered, 'phone.totalAnswered'),
    totalMissed: requireNonNegativeInteger(phone.totalMissed, 'phone.totalMissed'),
    totalDeclined: requireNonNegativeInteger(phone.totalDeclined, 'phone.totalDeclined'),
  };
}

function validateSharedFields(
  value: Record<string, unknown>,
): Omit<GameStateDataV1, 'version' | 'currentDay' | 'currentMonth'> {
  return {
    currentMissionId: requireNullableString(value.currentMissionId, 'currentMissionId'),
    currentMissionStepIndex: requireNonNegativeInteger(
      value.currentMissionStepIndex,
      'currentMissionStepIndex',
    ),
    completedMissionIds: requireStringArray(value.completedMissionIds, 'completedMissionIds'),
    suspicion: clamp(requireFiniteNumber(value.suspicion, 'suspicion'), 0, 100),
    inventory: requireInventory(value.inventory),
    home: requireHomeProgression(value.home),
  };
}

function requireHomeProgression(value: unknown): HomeProgressionStateData {
  const home = requireRecord(value, 'home');
  return {
    filamentSpoolIds: requireStringArray(home.filamentSpoolIds, 'home.filamentSpoolIds'),
    completedPrintIds: requireStringArray(home.completedPrintIds, 'home.completedPrintIds'),
    deskItemIds: requireStringArray(home.deskItemIds, 'home.deskItemIds'),
    decorationIds: requireStringArray(home.decorationIds, 'home.decorationIds'),
    currentPrintId: requireNullableString(home.currentPrintId, 'home.currentPrintId'),
  };
}

function requireInventory(value: unknown): Record<string, number> {
  const record = requireRecord(value, 'inventory');
  const inventory: Record<string, number> = {};

  for (const [itemId, quantity] of Object.entries(record)) {
    if (Number.isInteger(quantity) && (quantity as number) > 0) {
      inventory[itemId] = quantity as number;
    }
  }

  return inventory;
}

function requireCampaignMonths(value: unknown, field: string): CampaignMonthId[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid save field: ${field}`);
  }
  return [...new Set(value.map((entry) => requireCampaignMonth(entry, field)))].sort((a, b) => a - b);
}

function requireCampaignMonth(value: unknown, field: string): CampaignMonthId {
  if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 6) {
    throw new Error(`Invalid save field: ${field}`);
  }
  return value as CampaignMonthId;
}

function requireRecord(value: unknown, field: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`Invalid save field: ${field}`);
  }
  return value;
}

function requireStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string')) {
    throw new Error(`Invalid save field: ${field}`);
  }
  return [...new Set(value)];
}

function requireNullableString(value: unknown, field: string): string | null {
  if (value !== null && typeof value !== 'string') {
    throw new Error(`Invalid save field: ${field}`);
  }
  return value;
}

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid save field: ${field}`);
  }
  return value;
}

function requireFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid save field: ${field}`);
  }
  return value;
}

function requireNonNegativeInteger(value: unknown, field: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`Invalid save field: ${field}`);
  }
  return value as number;
}

function requirePositiveInteger(value: unknown, field: string): number {
  if (!Number.isInteger(value) || (value as number) < 1) {
    throw new Error(`Invalid save field: ${field}`);
  }
  return value as number;
}

function monthForDay(day: number): CampaignMonthId {
  return Math.min(6, Math.max(1, Math.ceil(day / 30))) as CampaignMonthId;
}

function completedMonthsForDay(day: number): CampaignMonthId[] {
  return [1, 2, 3, 4, 5, 6].filter((month) => month * 30 <= day) as CampaignMonthId[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
