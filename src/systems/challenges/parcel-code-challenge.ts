import type { ParcelCodeConfig, ParcelCodePhase } from '../../domain/challenges/parcel-code-types';

export type RandomSource = () => number;

/**
 * The pickup code arrives by SMS, stays visible for a moment and disappears;
 * the player types it from memory. Looking at the SMS again is allowed but
 * costs time standing at the locker in plain sight. Pure logic.
 */
export class ParcelCodeChallenge {
  private readonly code: string;
  private phase: ParcelCodePhase = 'reveal';
  private phaseRemainingMs: number;
  private entered = '';
  private peeks = 0;
  private mistakes = 0;

  public constructor(
    codeLength: number,
    private readonly config: ParcelCodeConfig,
    random: RandomSource = Math.random,
  ) {
    if (!Number.isInteger(codeLength) || codeLength < 3 || codeLength > 8) {
      throw new Error(`Parcel code length must be 3..8, got ${codeLength}.`);
    }
    let code = '';
    for (let index = 0; index < codeLength; index += 1) {
      code += String(Math.min(9, Math.floor(random() * 10)));
    }
    this.code = code;
    this.phaseRemainingMs = config.revealMs;
  }

  public update(deltaMs: number): void {
    if (this.phase !== 'reveal' && this.phase !== 'wrong') return;
    this.phaseRemainingMs = Math.max(0, this.phaseRemainingMs - deltaMs);
    if (this.phaseRemainingMs === 0) this.phase = 'input';
  }

  public typeDigit(digit: string): 'typed' | 'correct' | 'wrong' | 'ignored' {
    if (this.phase !== 'input' || !/^[0-9]$/.test(digit)) return 'ignored';
    this.entered += digit;
    if (this.entered.length < this.code.length) return 'typed';
    if (this.entered === this.code) {
      this.phase = 'done';
      return 'correct';
    }
    this.mistakes += 1;
    this.entered = '';
    this.phase = 'wrong';
    this.phaseRemainingMs = this.config.wrongCodeLockMs;
    return 'wrong';
  }

  public backspace(): void {
    if (this.phase === 'input') this.entered = this.entered.slice(0, -1);
  }

  /** Show the SMS again (only while typing). */
  public peek(): boolean {
    if (this.phase !== 'input') return false;
    this.peeks += 1;
    this.entered = '';
    this.phase = 'reveal';
    this.phaseRemainingMs = this.config.peekRevealMs;
    return true;
  }

  public getPhase(): ParcelCodePhase { return this.phase; }
  /** Visible only while the SMS is on screen. */
  public getVisibleCode(): string | null { return this.phase === 'reveal' ? this.code : null; }
  public getEntered(): string { return this.entered; }
  public getCodeLength(): number { return this.code.length; }
  public getRemainingMs(): number { return this.phaseRemainingMs; }
  public getPeeks(): number { return this.peeks; }
  public getMistakes(): number { return this.mistakes; }
}
