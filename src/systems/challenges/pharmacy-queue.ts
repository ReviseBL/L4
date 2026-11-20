import type {
  PharmacyQueueDefinition,
  PharmacyQueueEvent,
  QueueCustomer,
} from '../../domain/challenges/pharmacy-queue-types';

/**
 * Seniors ahead of Hubi are served one by one, but only while he actually
 * stands in the queue: stepping out pauses it. Pure logic.
 */
export class PharmacyQueue {
  private servingIndex = 0;
  private servedMs = 0;
  private done: boolean;

  public constructor(private readonly definition: PharmacyQueueDefinition, private readonly lineMs: number) {
    if (lineMs <= 0) throw new Error('Pharmacy queue lineMs must be positive.');
    this.done = definition.customers.length === 0;
  }

  public update(deltaMs: number, playerInQueue: boolean): PharmacyQueueEvent[] {
    if (this.done || !playerInQueue) return [];
    const events: PharmacyQueueEvent[] = [];
    this.servedMs += deltaMs;
    const current = this.getServingCustomer();
    if (current && this.servedMs >= current.serviceMs) {
      events.push({ type: 'served', customerIndex: this.servingIndex });
      this.servingIndex += 1;
      this.servedMs = 0;
      if (this.servingIndex >= this.definition.customers.length) {
        this.done = true;
        events.push({ type: 'your-turn' });
      }
    }
    return events;
  }

  public getServingCustomer(): QueueCustomer | null {
    return this.definition.customers[this.servingIndex] ?? null;
  }

  public getServingIndex(): number { return this.servingIndex; }

  /** People still ahead of the player. */
  public getPeopleAhead(): number {
    return Math.max(0, this.definition.customers.length - this.servingIndex);
  }

  /** 0..1 progress of the customer at the counter. */
  public getServiceProgress(): number {
    const current = this.getServingCustomer();
    return current ? Math.min(1, this.servedMs / current.serviceMs) : 1;
  }

  /** The line the serving senior is saying right now. */
  public getCurrentLine(): string | null {
    const current = this.getServingCustomer();
    if (!current || current.lines.length === 0) return null;
    const index = Math.min(current.lines.length - 1, Math.floor(this.servedMs / this.lineMs));
    return current.lines[index] ?? null;
  }

  public isDone(): boolean { return this.done; }
  public getDefinition(): PharmacyQueueDefinition { return this.definition; }
}
