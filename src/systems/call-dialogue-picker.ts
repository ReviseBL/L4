import type { PhoneDialogueDefinition } from '../domain/phone/phone-types';

export type RandomSource = () => number;

/**
 * Picks a variant of a phone conversation so the same call type sounds
 * different each time, avoiding the most recent ones. Pure logic.
 */
export class CallDialoguePicker {
  private readonly recent = new Map<PhoneDialogueDefinition, PhoneDialogueDefinition[]>();

  public constructor(
    private readonly pools: ReadonlyMap<PhoneDialogueDefinition, readonly PhoneDialogueDefinition[]>,
    private readonly memory = 3,
    private readonly random: RandomSource = Math.random,
  ) {}

  public pick(base: PhoneDialogueDefinition): PhoneDialogueDefinition {
    const pool = this.pools.get(base);
    if (!pool || pool.length === 0) return base;
    const recent = this.recent.get(base) ?? [];
    const fresh = pool.filter((variant) => !recent.includes(variant));
    const candidates = fresh.length > 0 ? fresh : pool;
    const choice = candidates[Math.min(candidates.length - 1, Math.floor(this.random() * candidates.length))]!;
    const keep = Math.min(this.memory, pool.length - 1);
    this.recent.set(base, keep > 0 ? [...recent, choice].slice(-keep) : []);
    return choice;
  }
}
