import type { ServiceWaitDefinition } from '../../domain/challenges/service-wait-types';

/** Pure timer for an order: progresses only while the player waits nearby. */
export class ServiceWait {
  private elapsedMs = 0;
  private ready = false;

  public constructor(private readonly definition: ServiceWaitDefinition) {
    if (definition.lineMs <= 0) throw new Error('Service wait lineMs must be positive.');
  }

  /** Returns true on the frame the order becomes ready. */
  public update(deltaMs: number, playerNear: boolean): boolean {
    if (this.ready || !playerNear) return false;
    this.elapsedMs += Math.max(0, deltaMs);
    if (this.elapsedMs < this.getDurationMs()) return false;
    this.ready = true;
    return true;
  }

  public getDurationMs(): number {
    return Math.max(1, this.definition.lines.length) * this.definition.lineMs;
  }

  public getProgress(): number {
    return Math.min(1, this.elapsedMs / this.getDurationMs());
  }

  public getCurrentLine(): string {
    if (this.ready) return this.definition.readyLine;
    const index = Math.min(this.definition.lines.length - 1, Math.floor(this.elapsedMs / this.definition.lineMs));
    return this.definition.lines[index] ?? this.definition.readyLine;
  }

  public isReady(): boolean { return this.ready; }
  public getDefinition(): ServiceWaitDefinition { return this.definition; }
}
