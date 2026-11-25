export interface StaminaConfig {
  /** Full tank → empty while sprinting. */
  sprintMs: number;
  /** Empty → full while walking, and while standing still. */
  recoverWalkingMs: number;
  recoverStandingMs: number;
  /** After running dry, sprint stays locked until the tank is back to this fraction. */
  exhaustedUntil: number;
}

export type StaminaEvent = 'exhausted' | 'recovered' | null;

/** Pure sprint stamina: drains while sprinting, refills otherwise. */
export class Stamina {
  private level = 1;
  private exhausted = false;

  public constructor(private readonly config: StaminaConfig) {}

  /** Can Herbi sprint this frame (call before update)? */
  public canSprint(): boolean {
    return !this.exhausted && this.level > 0;
  }

  public update(deltaMs: number, sprinting: boolean, moving: boolean): StaminaEvent {
    const delta = Math.max(0, deltaMs);
    if (sprinting && !this.exhausted) {
      this.level = Math.max(0, this.level - delta / this.config.sprintMs);
      if (this.level === 0) {
        this.exhausted = true;
        return 'exhausted';
      }
      return null;
    }
    const refillMs = moving ? this.config.recoverWalkingMs : this.config.recoverStandingMs;
    this.level = Math.min(1, this.level + delta / refillMs);
    if (this.exhausted && this.level >= this.config.exhaustedUntil) {
      this.exhausted = false;
      return 'recovered';
    }
    return null;
  }

  public getLevel(): number { return this.level; }
  public isExhausted(): boolean { return this.exhausted; }
  public reset(): void { this.level = 1; this.exhausted = false; }
}
