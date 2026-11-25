import { describe, expect, it } from 'vitest';
import { confrontationConfig } from '../src/data/confrontation/confrontation-config';
import { confrontationScenarios } from '../src/data/confrontation/confrontation-scenarios';
import { dialogueConfig } from '../src/data/dialogue/dialogue-config';
import { ConfrontationSystem } from '../src/systems/confrontation-system';
import type { ConfrontationScenario } from '../src/domain/confrontation/confrontation-types';

function sequence(...values: number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length]!;
}

describe('confrontation scenarios data', () => {
  it('has enough scenes for every NPC that can catch the player', () => {
    const count = (source: string) => confrontationScenarios.filter((s) => s.source === source).length;
    expect(count('coworker')).toBeGreaterThanOrEqual(10);
    expect(count('manager')).toBeGreaterThanOrEqual(8);
    expect(count('hr')).toBeGreaterThanOrEqual(6);
  });

  it('keeps every opening on a single dialogue page', () => {
    for (const scenario of confrontationScenarios) {
      expect(scenario.opening.length).toBeLessThanOrEqual(dialogueConfig.maxCharactersPerPage);
    }
  });

  it('passes validation (one good excuse each, unique ids)', () => {
    expect(() => new ConfrontationSystem(confrontationScenarios, confrontationConfig)).not.toThrow();
  });
});

describe('ConfrontationSystem', () => {
  it('rejects a scenario without exactly one good excuse', () => {
    const broken: ConfrontationScenario = {
      id: 'broken',
      source: 'coworker',
      opening: '?',
      excuses: [
        { id: 'a', quality: 'bad', text: 'a', reply: 'a' },
        { id: 'b', quality: 'bad', text: 'b', reply: 'b' },
      ],
    };
    expect(() => new ConfrontationSystem([broken], confrontationConfig)).toThrow();
  });

  it('only draws scenarios for the NPC that caught the player', () => {
    const system = new ConfrontationSystem(confrontationScenarios, confrontationConfig, sequence(0.3, 0.7, 0.1));
    for (let index = 0; index < 20; index += 1) {
      expect(system.prepare('manager').scenario.source).toBe('manager');
    }
  });

  it('does not repeat a recent scenario', () => {
    const system = new ConfrontationSystem(confrontationScenarios, confrontationConfig, () => 0);
    const seen: string[] = [];
    for (let index = 0; index < confrontationConfig.recentMemory + 1; index += 1) {
      seen.push(system.prepare('coworker').scenario.id);
    }
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('shuffles excuses but keeps all of them', () => {
    const system = new ConfrontationSystem(confrontationScenarios, confrontationConfig, sequence(0, 0.99, 0, 0.5));
    const prepared = system.prepare('hr');
    expect(prepared.excuses).toHaveLength(prepared.scenario.excuses.length);
    const ids = prepared.excuses.map((excuse) => excuse.id).sort();
    expect(ids).toEqual(prepared.scenario.excuses.map((excuse) => excuse.id).sort());
  });

  it('a good excuse costs nothing extra', () => {
    const system = new ConfrontationSystem(confrontationScenarios, confrontationConfig, () => 0);
    const prepared = system.prepare('coworker');
    const good = prepared.scenario.excuses.find((excuse) => excuse.quality === 'good')!;
    const outcome = system.resolve(prepared, good.id);
    expect(outcome.quality).toBe('good');
    expect(outcome.penalty).toBe(0);
  });

  it('a bad excuse adds the NPC-specific penalty', () => {
    const system = new ConfrontationSystem(confrontationScenarios, confrontationConfig, () => 0);
    for (const source of ['coworker', 'hr', 'manager'] as const) {
      const prepared = system.prepare(source);
      const bad = prepared.scenario.excuses.find((excuse) => excuse.quality === 'bad')!;
      const outcome = system.resolve(prepared, bad.id);
      expect(outcome.penalty).toBe(confrontationConfig.badExcusePenalty[source]);
      expect(outcome.reply).toBe(bad.reply);
    }
  });

  it('never asks about carried items when Herbi carries nothing', () => {
    const system = new ConfrontationSystem(confrontationScenarios, confrontationConfig, sequence(0, 0.4, 0.8, 0.2));
    for (let index = 0; index < 40; index += 1) {
      for (const source of ['coworker', 'hr', 'manager'] as const) {
        expect(system.prepare(source).scenario.requires).toBeUndefined();
      }
    }
  });

  it('prefers a heavy-load scene while lugging something heavy', () => {
    const system = new ConfrontationSystem(confrontationScenarios, confrontationConfig, () => 0);
    const prepared = system.prepare('coworker', { carrying: true, heavy: true });
    expect(prepared.scenario.requires).toBeDefined();
  });

  it('does not use heavy scenes for a light carried item', () => {
    const system = new ConfrontationSystem(confrontationScenarios, confrontationConfig, sequence(0, 0.3, 0.9));
    for (let index = 0; index < 30; index += 1) {
      expect(system.prepare('coworker', { carrying: true, heavy: false }).scenario.requires).not.toBe('heavy');
    }
  });
});
