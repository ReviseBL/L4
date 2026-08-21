import type { DebugRuntimeState } from '../domain/debug/debug-test-types';
import { SAVE_FORMAT_VERSION, type StorageLike } from '../domain/game-state/game-state-types';

export const DEBUG_ACTIVE_STATE_KEY = 'l4-office-escape.debug-active';
export const DEBUG_STATE_SLOT_KEYS = [
  'l4-office-escape.debug-state-1',
  'l4-office-escape.debug-state-2',
] as const;

export class DebugStateService {
  public constructor(private readonly storage: StorageLike) {}

  public loadActive(): DebugRuntimeState | null {
    return this.read(DEBUG_ACTIVE_STATE_KEY);
  }

  public saveActive(state: DebugRuntimeState): void {
    this.storage.setItem(DEBUG_ACTIVE_STATE_KEY, JSON.stringify(state));
  }

  public clearActive(): void {
    this.storage.removeItem(DEBUG_ACTIVE_STATE_KEY);
  }

  public saveSlot(slot: 1 | 2, state: DebugRuntimeState): void {
    this.storage.setItem(DEBUG_STATE_SLOT_KEYS[slot - 1], JSON.stringify(state));
  }

  public loadSlot(slot: 1 | 2): DebugRuntimeState | null {
    return this.read(DEBUG_STATE_SLOT_KEYS[slot - 1]);
  }

  public hasSlot(slot: 1 | 2): boolean {
    return this.loadSlot(slot) !== null;
  }

  private read(key: string): DebugRuntimeState | null {
    const serialized = this.storage.getItem(key);
    if (!serialized) return null;
    try {
      const value = JSON.parse(serialized) as Partial<DebugRuntimeState>;
      if (
        value.version !== 1 ||
        !value.gameState ||
        value.gameState.version !== SAVE_FORMAT_VERSION ||
        !value.selection ||
        typeof value.selection.managerEnabled !== 'boolean' ||
        !value.playerStart
      ) return null;
      return value as DebugRuntimeState;
    } catch {
      return null;
    }
  }
}
