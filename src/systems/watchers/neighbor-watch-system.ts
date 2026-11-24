import type {
  WatcherConfig,
  WatcherDefinition,
  WatcherShout,
  WatcherVisibility,
} from '../../domain/watchers/watcher-types';

export type RandomSource = () => number;

interface WatcherState {
  awarenessMs: number;
  cooldownMs: number;
  lineIndex: number;
}

/**
 * Neighbours who may or may not be outside this mission. Pure logic: the
 * scene supplies what each one sees; the system decides presence, the head
 * sweep and when someone shouts "Cześć Hubi!".
 */
export class NeighborWatchSystem {
  private readonly states = new Map<string, WatcherState>();
  private active: readonly WatcherDefinition[] = [];
  private elapsedMs = 0;

  public constructor(
    private readonly definitions: readonly WatcherDefinition[],
    private readonly config: WatcherConfig,
    private readonly random: RandomSource = Math.random,
  ) {
    const ids = new Set(definitions.map((definition) => definition.id));
    if (ids.size !== definitions.length) throw new Error('Duplicate watcher id.');
    if (config.spawnChance < 0 || config.spawnChance > 1) throw new Error('Watcher spawnChance must be 0..1.');
  }

  /** New mission: each neighbour is outside or not, independently. */
  public rollPresence(): readonly WatcherDefinition[] {
    this.active = this.definitions.filter((watcher) => this.random() < (watcher.spawnChance ?? this.config.spawnChance));
    this.states.clear();
    for (const watcher of this.active) this.states.set(watcher.id, { awarenessMs: 0, cooldownMs: 0, lineIndex: 0 });
    this.elapsedMs = 0;
    return this.active;
  }

  public getActive(): readonly WatcherDefinition[] {
    return this.active;
  }

  /** Current facing in radians (slow head sweep). */
  public getFacingRadians(watcher: WatcherDefinition): number {
    const phase = (this.elapsedMs / watcher.sweepPeriodMs) * Math.PI * 2;
    const degrees = watcher.baseFacingDegrees + Math.sin(phase) * watcher.sweepDegrees;
    return (degrees * Math.PI) / 180;
  }

  public update(deltaMs: number, visibility: ReadonlyMap<string, WatcherVisibility>): WatcherShout[] {
    this.elapsedMs += deltaMs;
    const shouts: WatcherShout[] = [];
    for (const watcher of this.active) {
      const state = this.states.get(watcher.id)!;
      state.cooldownMs = Math.max(0, state.cooldownMs - deltaMs);
      const seen = visibility.get(watcher.id) ?? 'NONE';
      if (seen === 'NONE' || state.cooldownMs > 0) {
        state.awarenessMs = Math.max(0, state.awarenessMs - deltaMs);
        continue;
      }
      state.awarenessMs += deltaMs * (seen === 'CLEAR' ? 1 : 0.4);
      if (state.awarenessMs >= (watcher.recognitionMs ?? this.config.recognitionMs)) {
        const line = watcher.shoutLines[state.lineIndex % watcher.shoutLines.length] ?? 'Cześć Hubi!';
        state.lineIndex += 1;
        state.awarenessMs = 0;
        state.cooldownMs = this.config.cooldownMs;
        shouts.push({ watcherId: watcher.id, line });
      }
    }
    return shouts;
  }
}
