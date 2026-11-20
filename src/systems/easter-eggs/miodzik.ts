import type { MiodzikConfig, MiodzikSpot } from '../../data/easter-eggs/dog-config';

export type MiodzikPose = 'stand' | 'sit' | 'pee';

export interface MiodzikFrame {
  pose: MiodzikPose;
  /** A new bark line this frame (show a bubble), or null. */
  bark: string | null;
  /** True on the frame he finishes peeing (leave a puddle). */
  puddle: boolean;
}

/** Who is out today and what he is doing: pure logic with an injected RNG. */
export class Miodzik {
  private spot: MiodzikSpot | null = null;
  private pose: MiodzikPose = 'stand';
  private poseMs = 0;
  private untilBarkMs = 0;

  public constructor(
    private readonly config: MiodzikConfig,
    private readonly spots: readonly MiodzikSpot[],
    private readonly random: () => number,
  ) {}

  /** Rolls for a new mission; returns his spot, or null when he stays home. */
  public startMission(): MiodzikSpot | null {
    this.spot = this.random() < this.config.chancePerMission && this.spots.length > 0
      ? this.spots[Math.min(this.spots.length - 1, Math.floor(this.random() * this.spots.length))] ?? null
      : null;
    this.enter('stand');
    this.untilBarkMs = this.between(this.config.barkEveryMs);
    return this.spot;
  }

  public update(deltaMs: number): MiodzikFrame {
    if (!this.spot) return { pose: 'stand', bark: null, puddle: false };
    const delta = Math.max(0, deltaMs);
    let puddle = false;
    this.poseMs -= delta;
    if (this.poseMs <= 0) {
      if (this.pose === 'stand') this.enter(this.random() < this.config.peeChance ? 'pee' : 'sit');
      else {
        puddle = this.pose === 'pee';
        this.enter('stand');
      }
    }
    let bark: string | null = null;
    this.untilBarkMs -= delta;
    if (this.untilBarkMs <= 0 && this.pose !== 'pee') {
      const lines = this.config.barkLines;
      bark = lines[Math.floor(this.random() * lines.length)] ?? lines[0] ?? 'Hau!';
      this.untilBarkMs = this.between(this.config.barkEveryMs);
    }
    return { pose: this.pose, bark, puddle };
  }

  public getSpot(): MiodzikSpot | null { return this.spot; }
  public getPose(): MiodzikPose { return this.pose; }

  private enter(pose: MiodzikPose): void {
    this.pose = pose;
    this.poseMs = pose === 'stand' ? this.between(this.config.standMs)
      : pose === 'sit' ? this.between(this.config.sitMs)
        : this.config.peeMs;
  }

  private between(range: readonly [number, number]): number {
    return range[0] + this.random() * (range[1] - range[0]);
  }
}
