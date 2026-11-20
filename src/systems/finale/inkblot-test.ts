import type { InkblotAnswer, InkblotCard, InkblotTestConfig } from '../../data/finale/zus-tests';

export interface InkblotOutcome {
  credibilityDelta: number;
  reaction: string;
  answer: InkblotAnswer | null;
}

/** The psychologist's cards: one card at a time, answers on a clock. Pure logic. */
export class InkblotTest {
  private index = 0;
  private elapsedMs = 0;

  public constructor(private readonly cards: readonly InkblotCard[], private readonly config: InkblotTestConfig) {}

  public getCard(): InkblotCard | null { return this.cards[this.index] ?? null; }
  public getCardNumber(): number { return this.index + 1; }
  public getCardCount(): number { return this.cards.length; }
  public isDone(): boolean { return this.index >= this.cards.length; }
  /** 0..1 of the thinking time used (past 1 the answer costs credibility). */
  public getThinkProgress(): number { return Math.min(1.5, this.elapsedMs / this.config.thinkMs); }

  /** Advances the clock; returns an outcome when the card times out. */
  public update(deltaMs: number): InkblotOutcome | null {
    if (this.isDone()) return null;
    this.elapsedMs += Math.max(0, deltaMs);
    if (this.elapsedMs < this.config.timeoutMs) return null;
    this.next();
    return { credibilityDelta: this.config.timeoutDelta, reaction: this.config.timeoutLine, answer: null };
  }

  public choose(answerIndex: number): InkblotOutcome | null {
    const card = this.getCard();
    const answer = card?.answers[answerIndex];
    if (!card || !answer) return null;
    const hesitated = this.elapsedMs > this.config.thinkMs;
    this.next();
    return {
      credibilityDelta: answer.credibilityDelta + (hesitated ? this.config.hesitationDelta : 0),
      reaction: hesitated ? `${this.config.hesitationLine} ${answer.reaction}` : answer.reaction,
      answer,
    };
  }

  private next(): void {
    this.index += 1;
    this.elapsedMs = 0;
  }
}
