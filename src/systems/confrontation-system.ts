import type {
  ConfrontationConfig,
  ConfrontationContext,
  ConfrontationOutcome,
  ConfrontationScenario,
  ConfrontationSource,
  PreparedConfrontation,
} from '../domain/confrontation/confrontation-types';

export type RandomSource = () => number;

/**
 * Picks "caught red-handed" conversations and scores the excuse the player chose.
 * Pure logic: no Phaser, deterministic with an injected random source.
 */
export class ConfrontationSystem {
  private readonly recent = new Map<ConfrontationSource, string[]>();

  public constructor(
    private readonly scenarios: readonly ConfrontationScenario[],
    private readonly config: ConfrontationConfig,
    private readonly random: RandomSource = Math.random,
  ) {
    validateScenarios(scenarios);
  }

  public hasScenarios(source: ConfrontationSource): boolean {
    return this.scenarios.some((scenario) => scenario.source === source);
  }

  public prepare(
    source: ConfrontationSource,
    context: ConfrontationContext = NO_CONTEXT,
  ): PreparedConfrontation {
    const pool = this.scenarios.filter(
      (scenario) => scenario.source === source && fitsContext(scenario, context),
    );
    if (pool.length === 0) throw new Error(`No confrontation scenarios for ${source}.`);

    const recent = this.recent.get(source) ?? [];
    const fresh = pool.filter((scenario) => !recent.includes(scenario.id));
    const available = fresh.length > 0 ? fresh : pool;
    const situational = available.filter((scenario) => scenario.requires !== undefined);
    const general = available.filter((scenario) => scenario.requires === undefined);
    const preferSituational =
      situational.length > 0 &&
      (general.length === 0 || this.random() < this.config.situationalPreference);
    const candidates = preferSituational ? situational : general;
    const scenario = candidates[this.pickIndex(candidates.length)]!;

    const memory = Math.min(this.config.recentMemory, pool.length - 1);
    const nextRecent = [...recent.filter((id) => id !== scenario.id), scenario.id];
    this.recent.set(source, memory > 0 ? nextRecent.slice(-memory) : []);

    return { scenario, excuses: this.shuffle(scenario.excuses) };
  }

  public resolve(prepared: PreparedConfrontation, excuseId: string): ConfrontationOutcome {
    const excuse = prepared.scenario.excuses.find((candidate) => candidate.id === excuseId);
    if (!excuse) throw new Error(`Unknown excuse ${excuseId} in ${prepared.scenario.id}.`);
    const source = prepared.scenario.source;

    return {
      scenarioId: prepared.scenario.id,
      source,
      excuseId,
      quality: excuse.quality,
      penalty: excuse.quality === 'good' ? 0 : this.config.badExcusePenalty[source],
      reply: excuse.reply,
    };
  }

  private shuffle<T>(items: readonly T[]): T[] {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swap = this.pickIndex(index + 1);
      [result[index], result[swap]] = [result[swap]!, result[index]!];
    }
    return result;
  }

  private pickIndex(length: number): number {
    return Math.min(length - 1, Math.floor(this.random() * length));
  }
}

const NO_CONTEXT: ConfrontationContext = { carrying: false, heavy: false };

function fitsContext(scenario: ConfrontationScenario, context: ConfrontationContext): boolean {
  if (scenario.requires === 'heavy') return context.heavy;
  if (scenario.requires === 'carrying') return context.carrying;
  return true;
}

function validateScenarios(scenarios: readonly ConfrontationScenario[]): void {
  const scenarioIds = new Set<string>();
  for (const scenario of scenarios) {
    if (scenarioIds.has(scenario.id)) throw new Error(`Duplicate confrontation scenario ${scenario.id}.`);
    scenarioIds.add(scenario.id);

    const good = scenario.excuses.filter((excuse) => excuse.quality === 'good').length;
    if (good !== 1 || scenario.excuses.length < 2) {
      throw new Error(`Scenario ${scenario.id} needs exactly one good excuse and at least one bad.`);
    }
    const excuseIds = new Set(scenario.excuses.map((excuse) => excuse.id));
    if (excuseIds.size !== scenario.excuses.length) {
      throw new Error(`Scenario ${scenario.id} has duplicate excuse ids.`);
    }
  }
}
