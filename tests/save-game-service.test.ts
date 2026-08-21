import { describe, expect, it } from 'vitest';
import { SAVE_GAME_STORAGE_KEY, SaveGameService } from '../src/services/save-game-service';
import type { StorageLike } from '../src/domain/game-state/game-state-types';

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  public removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('SaveGameService', () => {
  it('creates a default game when no save exists', () => {
    const service = new SaveGameService(new MemoryStorage());

    expect(service.hasSave()).toBe(false);
    expect(service.loadGame().getSnapshot()).toMatchObject({
      version: 7,
      currentMissionId: 'medicine-run',
      suspicion: 0,
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
      campaignStats: { totalDetections: 0 },
      finale: { campaignCompleted: false, highestLocalScore: 0 },
    });
  });

  it('persists campaign and home progression across service instances', () => {
    const storage = new MemoryStorage();
    const firstService = new SaveGameService(storage);
    const state = firstService.loadGame();
    state.setMissionProgress('filament-run', 2);
    state.completeMission('medicine-run', 'filament-run');
    state.setMissionProgress('filament-run', 2);
    state.setSuspicion(15);
    state.setSuspicionMaxReached(true);
    state.setCampaignProgress(37, 2, [1]);
    state.setInventory({ milk: 1 });
    state.addFilamentSpool('petg');
    state.startPrint('cable-holder');
    state.completePrint('cable-holder');
    state.addDeskItem('nozzle-0-6-installed');
    state.unlockPhone();
    state.setPhoneCampaignStats({ totalAnswered: 3, totalMissed: 2, totalDeclined: 1 });
    state.unlockHr();
    state.recordDialogueChoice('hrFirstMeeting', 'great');
    state.unlockManager();
    state.setPrintProjectState('l4-400', 'PLANNED');
    state.startPrint('l4-400');
    state.recordDetection('manager');
    state.recordCriticalSuspicionIncident('filament-run');
    state.incrementCampaignStat('threeDShopVisits');
    state.completeCampaign('extended', 84_250, 'A');
    expect(state.recordDialogueChoice('hrFirstMeeting', 'getting_better')).toBe(false);
    firstService.saveGame(state);

    const restored = new SaveGameService(storage).loadGame().getSnapshot();

    expect(restored).toMatchObject({
      currentMissionId: 'filament-run',
      currentMissionStepIndex: 2,
      completedMissionIds: ['medicine-run'],
      suspicion: 15,
      suspicionMaxReached: true,
      currentL4Day: 37,
      currentMonth: 2,
      completedMonths: [1],
      inventory: { milk: 1 },
      home: {
        filamentSpoolIds: ['petg'],
        completedPrintIds: ['cable-holder'],
        deskItemIds: ['nozzle-0-6-installed'],
        currentPrintId: 'l4-400',
        printProjectStates: { 'cable-holder': 'COMPLETED', 'l4-400': 'PRINTING' },
      },
      phone: {
        unlocked: true,
        totalAnswered: 3,
        totalMissed: 2,
        totalDeclined: 1,
      },
      hr: { unlocked: true, dialogueChoices: { hrFirstMeeting: 'great' } },
      manager: { unlocked: true },
      campaignStats: { totalDetections: 1, managerDetections: 1, threeDShopVisits: 1, criticalSuspicionIncidents: 1 },
      criticalIncidentMissionIds: ['filament-run'],
      finale: { campaignCompleted: true, endingId: 'extended', finalScore: 84250, finalRank: 'A', highestLocalScore: 84250, bestLocalRank: 'A' },
    });
  });

  it('resets the saved game and its home progression', () => {
    const storage = new MemoryStorage();
    const service = new SaveGameService(storage);
    const state = service.loadGame();
    state.addFilamentSpool('petg');
    service.saveGame(state);

    expect(service.hasSave()).toBe(true);
    const reset = service.resetGame().getSnapshot();

    expect(service.hasSave()).toBe(false);
    expect(reset.home.filamentSpoolIds).toEqual([]);
    expect(storage.getItem(SAVE_GAME_STORAGE_KEY)).toBeNull();
  });

  it('keeps the local best score when starting a new campaign after the finale', () => {
    const storage = new MemoryStorage();
    const service = new SaveGameService(storage);
    const state = service.loadGame();
    state.completeCampaign('extended', 91_000, 'S');
    service.saveGame(state);
    const fresh = service.resetGame().getSnapshot();
    expect(fresh.finale).toMatchObject({
      campaignCompleted: false,
      finalScore: null,
      highestLocalScore: 91000,
      bestLocalRank: 'S',
    });
    expect(service.hasSave()).toBe(true);
  });

  it('falls back safely when stored JSON is corrupted', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_GAME_STORAGE_KEY, '{not-json');
    const service = new SaveGameService(storage);

    expect(service.hasSave()).toBe(false);
    expect(service.hasUnreadableSave()).toBe(true);
    expect(service.loadGame().getCurrentMissionId()).toBe('medicine-run');
  });

  it('migrates a version-one save without losing home progression', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      SAVE_GAME_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        currentMissionId: 'filament-run',
        currentMissionStepIndex: 2,
        completedMissionIds: ['medicine-run', 'milk-run'],
        suspicion: 43,
        inventory: { 'petg-spool': 1 },
        home: {
          filamentSpoolIds: ['petg'],
          completedPrintIds: ['cable-holder'],
          deskItemIds: [],
          decorationIds: [],
          currentPrintId: null,
        },
        currentDay: 37,
        currentMonth: 2,
      }),
    );

    const migrated = new SaveGameService(storage).loadGame().getSnapshot();

    expect(migrated).toMatchObject({
      version: 7,
      currentL4Day: 37,
      currentMonth: 2,
      completedMonths: [1],
      suspicion: 43,
      home: {
        filamentSpoolIds: ['petg'],
        completedPrintIds: ['cable-holder'],
      },
      phone: {
        unlocked: true,
        totalAnswered: 0,
        totalMissed: 0,
        totalDeclined: 0,
      },
      hr: { unlocked: false, dialogueChoices: {} },
      manager: { unlocked: false },
    });
  });

  it('migrates a version-two campaign save and unlocks the phone from month two', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      SAVE_GAME_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        currentMissionId: 'm2-coffee-run',
        currentMissionStepIndex: 0,
        completedMissionIds: ['medicine-run', 'milk-run', 'filament-run'],
        suspicion: 18,
        suspicionMaxReached: false,
        inventory: {},
        home: {
          filamentSpoolIds: ['petg'],
          completedPrintIds: ['cable-holder'],
          deskItemIds: [],
          decorationIds: [],
          currentPrintId: null,
        },
        currentL4Day: 31,
        currentMonth: 2,
        completedMonths: [1],
      }),
    );

    expect(new SaveGameService(storage).loadGame().getSnapshot()).toMatchObject({
      version: 7,
      currentL4Day: 31,
      currentMonth: 2,
      phone: {
        unlocked: true,
        totalAnswered: 0,
        totalMissed: 0,
        totalDeclined: 0,
      },
      home: {
        filamentSpoolIds: ['petg'],
        completedPrintIds: ['cable-holder'],
      },
      hr: { unlocked: false, dialogueChoices: {} },
      manager: { unlocked: false },
    });
  });

  it('migrates version three and unlocks HR in month three without losing phone stats', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_GAME_STORAGE_KEY, JSON.stringify({
      version: 3, currentMissionId: 'm3-medicine-run', currentMissionStepIndex: 0,
      completedMissionIds: [], suspicion: 24, suspicionMaxReached: false, inventory: {},
      home: { filamentSpoolIds: ['petg'], completedPrintIds: ['cable-holder'], deskItemIds: [], decorationIds: [], currentPrintId: null },
      currentL4Day: 61, currentMonth: 3, completedMonths: [1, 2],
      phone: { unlocked: true, totalAnswered: 4, totalMissed: 1, totalDeclined: 2 },
    }));
    expect(new SaveGameService(storage).loadGame().getSnapshot()).toMatchObject({
      version: 7, currentMonth: 3,
      phone: { totalAnswered: 4, totalMissed: 1, totalDeclined: 2 },
      hr: { unlocked: true, dialogueChoices: {} },
      manager: { unlocked: false },
    });
  });

  it('migrates version four and unlocks the manager in month five', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_GAME_STORAGE_KEY, JSON.stringify({
      version: 4, currentMissionId: 'm5-shopping-run', currentMissionStepIndex: 0,
      completedMissionIds: [], suspicion: 62, suspicionMaxReached: false, inventory: {},
      home: { filamentSpoolIds: ['petg'], completedPrintIds: ['cable-holder'], deskItemIds: [], decorationIds: [], currentPrintId: null },
      currentL4Day: 121, currentMonth: 5, completedMonths: [1, 2, 3, 4],
      phone: { unlocked: true, totalAnswered: 1, totalMissed: 0, totalDeclined: 0 },
      hr: { unlocked: true, dialogueChoices: { hrFirstMeeting: 'great' } },
    }));
    expect(new SaveGameService(storage).loadGame().getSnapshot()).toMatchObject({
      version: 7,
      currentMonth: 5,
      manager: { unlocked: true },
      home: { printProjectStates: {} },
    });
  });

  it('migrates version five saves and safely initializes finale data', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_GAME_STORAGE_KEY, JSON.stringify({
      version: 5, currentMissionId: 'm6-final-spool-run', currentMissionStepIndex: 0,
      completedMissionIds: [], suspicion: 88, suspicionMaxReached: false, inventory: {},
      home: { filamentSpoolIds: ['petg', 'asa-black'], completedPrintIds: ['l4-400'], deskItemIds: [], decorationIds: [], currentPrintId: null, printProjectStates: { 'l4-400': 'COMPLETED' } },
      currentL4Day: 151, currentMonth: 6, completedMonths: [1, 2, 3, 4, 5],
      phone: { unlocked: true, totalAnswered: 3, totalMissed: 2, totalDeclined: 1 },
      hr: { unlocked: true, dialogueChoices: {} }, manager: { unlocked: true },
    }));
    expect(new SaveGameService(storage).loadGame().getSnapshot()).toMatchObject({
      version: 7, currentMonth: 6,
      campaignStats: { totalDetections: 0, managerDetections: 0 },
      finale: { campaignCompleted: false, endingId: null, highestLocalScore: 0 },
    });
  });

  it('migrates a version-six save and marks an active 100% mission once', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_GAME_STORAGE_KEY, JSON.stringify({
      version: 6,
      currentMissionId: 'm4-large-package-run',
      currentMissionStepIndex: 1,
      completedMissionIds: [],
      suspicion: 100,
      suspicionMaxReached: true,
      inventory: { 'large-package': 1 },
      home: { filamentSpoolIds: [], completedPrintIds: [], deskItemIds: [], decorationIds: [], currentPrintId: null, printProjectStates: {} },
      currentL4Day: 101,
      currentMonth: 4,
      completedMonths: [1, 2, 3],
      phone: { unlocked: true, totalAnswered: 1, totalMissed: 1, totalDeclined: 0 },
      hr: { unlocked: true, dialogueChoices: {} },
      manager: { unlocked: false },
      campaignStats: { totalDetections: 2, coworkerDetections: 1, hrDetections: 0, managerDetections: 0, companyCarDetections: 1, threeDShopVisits: 0, kebabsCollected: 0 },
      finale: { campaignCompleted: false, endingId: null, finalScore: null, finalRank: null, highestLocalScore: 0, bestLocalRank: null },
    }));

    const state = new SaveGameService(storage).loadGame();
    expect(state.getSnapshot()).toMatchObject({
      version: 7,
      criticalIncidentMissionIds: ['m4-large-package-run'],
      campaignStats: { criticalSuspicionIncidents: 1 },
    });
    expect(state.recordCriticalSuspicionIncident('m4-large-package-run')).toBe(false);
  });
});
