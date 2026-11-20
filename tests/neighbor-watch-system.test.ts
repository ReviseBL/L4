import { describe, expect, it } from 'vitest';
import { neighborWatchers, watcherConfig } from '../src/data/watchers/neighbor-watchers';
import { NeighborWatchSystem } from '../src/systems/watchers/neighbor-watch-system';

function sequence(...values: number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length]!;
}

const seen = (id: string, level: 'CLEAR' | 'PERIPHERAL' | 'NONE') => new Map([[id, level]]);

describe('NeighborWatchSystem', () => {
  it('rolls who is outside per mission, so some runs are clear and some are not', () => {
    const system = new NeighborWatchSystem(neighborWatchers, watcherConfig, sequence(0.1, 0.9, 0.9, 0.9, 0.2, 0.3));
    expect(system.rollPresence().map((w) => w.id)).toEqual(['seba']);
    expect(system.rollPresence()).toEqual([]);
    expect(system.rollPresence().map((w) => w.id)).toEqual(['seba', 'grazyna']);
  });

  it('shouts once Hubi stays in clear view long enough, then goes quiet', () => {
    const system = new NeighborWatchSystem(neighborWatchers, watcherConfig, () => 0);
    system.rollPresence();
    expect(system.update(watcherConfig.recognitionMs / 2, seen('seba', 'CLEAR'))).toEqual([]);
    expect(system.update(watcherConfig.recognitionMs / 2, seen('seba', 'CLEAR'))).toEqual([
      { watcherId: 'seba', line: neighborWatchers[0].shoutLines[0] },
    ]);
    expect(system.update(watcherConfig.recognitionMs * 2, seen('seba', 'CLEAR'))).toEqual([]);
  });

  it('a short glimpse is forgiven', () => {
    const system = new NeighborWatchSystem(neighborWatchers, watcherConfig, () => 0);
    system.rollPresence();
    system.update(watcherConfig.recognitionMs * 0.8, seen('grazyna', 'CLEAR'));
    system.update(1_000, seen('grazyna', 'NONE'));
    expect(system.update(watcherConfig.recognitionMs * 0.5, seen('grazyna', 'CLEAR'))).toEqual([]);
  });

  it('absent neighbours never shout', () => {
    const system = new NeighborWatchSystem(neighborWatchers, watcherConfig, () => 0.99);
    system.rollPresence();
    expect(system.update(10_000, seen('seba', 'CLEAR'))).toEqual([]);
  });

  it('sweeps the head around the base direction', () => {
    const system = new NeighborWatchSystem(neighborWatchers, watcherConfig, () => 0);
    system.rollPresence();
    const seba = neighborWatchers[0];
    const start = system.getFacingRadians(seba);
    system.update(seba.sweepPeriodMs / 4, new Map());
    expect(system.getFacingRadians(seba)).not.toBeCloseTo(start, 3);
  });

  it('lets the bench grandma recognise Hubi faster than Seba and scan 180° without looking at the blocks', () => {
    const grazyna = neighborWatchers.find((watcher) => watcher.id === 'grazyna')!;
    const seba = neighborWatchers.find((watcher) => watcher.id === 'seba')!;
    expect(grazyna.recognitionMs).toBeLessThan(watcherConfig.recognitionMs);
    const system = new NeighborWatchSystem(neighborWatchers, watcherConfig, () => 0);
    system.rollPresence();
    expect(system.update(grazyna.recognitionMs! + 10, seen('grazyna', 'CLEAR'))).toHaveLength(1);
    // Seba never looks north (back at the tree and the block): sin(angle) stays >= 0.
    for (let t = 0; t < seba.sweepPeriodMs; t += 250) {
      system.update(250, new Map());
      expect(Math.sin(system.getFacingRadians(seba))).toBeGreaterThanOrEqual(-0.05);
      expect(Math.sin(system.getFacingRadians(grazyna))).toBeLessThanOrEqual(0.05);
    }
  });
});
