import type {
  RandomSource,
  ThreadingPushOutcome,
  ThreadingRules,
  ThreadingStageConfig,
  ThreadingVariantConfig,
} from '../../domain/minigames/minigame-types';

/**
 * Thread the filament tip into a tiny hole while the hand shakes.
 * Pure logic in pixels relative to the hole's resting position (x = 0).
 * A miss snaps the filament and starts a new attempt with a bit less tremor,
 * so nobody gets stuck; there is no limit and no material cost.
 */
export class ThreadingMinigame {
  private elapsedMs = 0;
  private handX: number;
  private tipX: number;
  private stageIndex = 0;
  private misses = 0;
  private phaseA = 0;
  private phaseB = 0;
  private finished = false;

  public constructor(
    private readonly variant: ThreadingVariantConfig,
    private readonly rules: ThreadingRules,
    /** 0..1, e.g. current suspicion / 100: nervous Hubi shakes more. */
    private readonly stress: number,
    private readonly random: RandomSource = Math.random,
  ) {
    if (variant.stages.length === 0) throw new Error(`Threading variant ${variant.id} has no stages.`);
    this.handX = this.randomStart();
    this.tipX = this.handX;
    this.rollPhases();
  }

  /** steer: -1 (left) .. 1 (right). */
  public update(deltaMs: number, steer: number): void {
    if (this.finished) return;
    this.elapsedMs += deltaMs;
    const limit = this.variant.steerLimit;
    this.handX = clamp(this.handX + clamp(steer, -1, 1) * this.variant.steerSpeed * (deltaMs / 1000), -limit, limit);

    const target = this.handX + this.getTremorOffset();
    const lag = this.variant.flexLagMs;
    if (lag && lag > 0) {
      const blend = 1 - Math.exp(-deltaMs / lag);
      this.tipX += (target - this.tipX) * blend;
    } else {
      this.tipX = target;
    }
  }

  public push(): ThreadingPushOutcome {
    if (this.finished) return 'success';
    const distance = Math.abs(this.tipX - this.getHoleX());
    if (distance <= this.getStage().holeRadius) {
      this.stageIndex += 1;
      if (this.stageIndex >= this.variant.stages.length) {
        this.finished = true;
        return 'success';
      }
      return 'stage-cleared';
    }
    this.misses += 1;
    this.handX = this.randomStart();
    this.tipX = this.handX;
    this.rollPhases();
    return 'snap';
  }

  public getTipX(): number { return this.tipX; }
  public getHandX(): number { return this.handX; }

  public getHoleX(): number {
    const stage = this.getStage();
    if (stage.holeDriftAmplitude <= 0) return 0;
    return Math.sin((this.elapsedMs / 1000) * stage.holeDriftSpeed) * stage.holeDriftAmplitude;
  }

  public getStage(): ThreadingStageConfig {
    return this.variant.stages[Math.min(this.stageIndex, this.variant.stages.length - 1)]!;
  }

  public getStageIndex(): number { return this.stageIndex; }
  public getStageCount(): number { return this.variant.stages.length; }
  /** Attempt number shown to the player (1 for the first try). */
  public getAttempt(): number { return this.misses + 1; }
  public getMisses(): number { return this.misses; }
  public isFinished(): boolean { return this.finished; }

  /** 0..1 opacity of fumes covering the hole (ASA only). */
  public getFumesOpacity(): number {
    const fumes = this.variant.fumes;
    if (!fumes) return 0;
    const cycle = this.elapsedMs % fumes.intervalMs;
    if (cycle > fumes.durationMs) return 0;
    return Math.sin((cycle / fumes.durationMs) * Math.PI);
  }

  /** Current tremor strength factor (stress × mercy), for UI/debug. */
  public getTremorFactor(): number {
    const mercy = Math.max(this.rules.minimumMercyFactor, Math.pow(1 - this.rules.mercyPerMiss, this.misses));
    const stress = 1 + clamp(this.stress, 0, 1) * this.rules.stressTremorBonus;
    return mercy * stress;
  }

  private getTremorOffset(): number {
    const t = (this.elapsedMs / 1000) * this.variant.tremorSpeed;
    const wave = 0.65 * Math.sin(t + this.phaseA) + 0.35 * Math.sin(2.7 * t + this.phaseB);
    return wave * this.variant.tremorAmplitude * this.getTremorFactor();
  }

  private randomStart(): number {
    return (this.random() * 2 - 1) * this.variant.steerLimit * 0.6;
  }

  private rollPhases(): void {
    this.phaseA = this.random() * Math.PI * 2;
    this.phaseB = this.random() * Math.PI * 2;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
