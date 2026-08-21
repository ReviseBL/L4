import { describe, expect, it } from 'vitest';
import { verticalSliceMissions } from '../src/data/missions/vertical-slice-missions';
import type { StorageLike } from '../src/domain/game-state/game-state-types';
import { DEBUG_ACTIVE_STATE_KEY, DEBUG_STATE_SLOT_KEYS, DebugStateService } from '../src/services/debug-state-service';
import { SAVE_GAME_STORAGE_KEY } from '../src/services/save-game-service';
import { DebugTestStateSystem } from '../src/systems/debug-test-state-system';

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

describe('DebugStateService', () => {
  it('uses separate active and slot keys without overwriting the campaign save', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_GAME_STORAGE_KEY, 'NORMAL-SAVE');
    const service = new DebugStateService(storage);
    const runtime = new DebugTestStateSystem(verticalSliceMissions).buildScenario('phone-hr-conflict');
    service.saveActive(runtime);
    service.saveSlot(1, runtime);
    expect(storage.getItem(SAVE_GAME_STORAGE_KEY)).toBe('NORMAL-SAVE');
    expect(storage.getItem(DEBUG_ACTIVE_STATE_KEY)).not.toBeNull();
    expect(storage.getItem(DEBUG_STATE_SLOT_KEYS[0])).not.toBeNull();
  });

  it('quick loads a complete state after a simulated page reload', () => {
    const storage = new MemoryStorage();
    const first = new DebugStateService(storage);
    const runtime = new DebugTestStateSystem(verticalSliceMissions).buildScenario('return-home-double-npc');
    first.saveSlot(2, runtime);
    const restored = new DebugStateService(storage).loadSlot(2);
    expect(restored).toMatchObject({
      version: 1,
      selection: { missionId: 'm3-orange-filament-run', stage: 'RETURNING_HOME' },
      gameState: { inventory: { 'pla-orange-spool': 1 } },
    });
  });

  it('ignores malformed debug state without crashing', () => {
    const storage = new MemoryStorage();
    storage.setItem(DEBUG_ACTIVE_STATE_KEY, '{bad-json');
    expect(new DebugStateService(storage).loadActive()).toBeNull();
  });
});
