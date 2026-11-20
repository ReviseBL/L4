import type { ReflexTestConfig } from '../../data/finale/zus-tests';

export type ReflexResult = 'weak' | 'none' | 'strong';

export interface ReflexOutcome {
  result: ReflexResult;
  strength: number;
  credibilityDelta: number;
  line: string;
}

/**
 * The doctor's hammer: a needle sweeps a kick-strength bar and the player
 * picks the moment. A weak-but-alive kick is believable; no reaction looks
 * faked and a strong kick looks healthy. Pure logic with an injected RNG.
 */
export class ReflexTest {
  private round = 0;
  private elapsedMs = 0;

  public constructor(private readonly config: ReflexTestConfig, private readonly random: () => number) {}

  public update(deltaMs: number): void {
    if (!this.isDone()) this.elapsedMs += Math.max(0, deltaMs);
  }

  /** Needle position 0..1, bouncing between the ends. */
  public getStrength(): number {
    const speed = this.config.speeds[Math.min(this.round, this.config.speeds.length - 1)] ?? 1;
    const travel = (this.elapsedMs / 1_000) * speed * 2;
    const phase = travel % 2;
    return phase <= 1 ? phase : 2 - phase;
  }

  public press(): ReflexOutcome | null {
    if (this.isDone()) return null;
    const strength = this.getStrength();
    const result: ReflexResult = strength < this.config.weakFrom ? 'none' : strength > this.config.weakTo ? 'strong' : 'weak';
    const lines = this.config.lines[result];
    const outcome: ReflexOutcome = {
      result,
      strength,
      credibilityDelta: result === 'weak' ? this.config.weakDelta : result === 'none' ? this.config.noneDelta : this.config.strongDelta,
      line: lines[Math.floor(this.random() * lines.length)] ?? lines[0] ?? '',
    };
    this.round += 1;
    this.elapsedMs = 0;
    return outcome;
  }

  public getRound(): number { return this.round + 1; }
  public isDone(): boolean { return this.round >= this.config.rounds; }
}
