import type { TimingPressOutcome, TimingVariantConfig } from '../../domain/minigames/minigame-types';

/**
 * Needle sweeps across a scale; press in the green zone. Pressing too early
 * ("under") or too late ("over") only costs a retry, and every miss widens
 * the zone a little. Pure logic, needle position on a 0..1 scale.
 */
export class TimingMinigame {
  private elapsedMs = 0;
  private hits = 0;
  private misses = 0;
  private zoneWidth: number;

  public constructor(private readonly variant: TimingVariantConfig) {
    this.zoneWidth = variant.zoneWidth;
  }

  public update(deltaMs: number): void {
    if (this.isFinished()) return;
    this.elapsedMs += deltaMs;
  }

  /** 0..1 ping-pong. */
  public getNeedle(): number {
    const cycles = (this.elapsedMs / 1000) * this.variant.needleCyclesPerSecond;
    const phase = cycles % 1;
    return phase < 0.5 ? phase * 2 : 2 - phase * 2;
  }

  public getZone(): { start: number; end: number } {
    const half = this.zoneWidth / 2;
    return {
      start: Math.max(0, this.variant.zoneCenter - half),
      end: Math.min(1, this.variant.zoneCenter + half),
    };
  }

  public press(): TimingPressOutcome {
    if (this.isFinished()) return 'complete';
    const needle = this.getNeedle();
    const zone = this.getZone();
    if (needle >= zone.start && needle <= zone.end) {
      this.hits += 1;
      return this.isFinished() ? 'complete' : 'hit';
    }
    this.misses += 1;
    this.zoneWidth = Math.min(this.variant.maxZoneWidth, this.zoneWidth + this.variant.zoneGrowthPerMiss);
    return needle < zone.start ? 'under' : 'over';
  }

  public getHits(): number { return this.hits; }
  public getMisses(): number { return this.misses; }
  public getAttempts(): number { return this.hits + this.misses; }
  public isFinished(): boolean { return this.hits >= this.variant.requiredHits; }
}
