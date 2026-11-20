import { describe, expect, it } from 'vitest';
import { pharmacyQueueConfig, pharmacyQueues } from '../src/data/challenges/pharmacy-queues';
import { PharmacyQueue } from '../src/systems/challenges/pharmacy-queue';
import { verticalSliceMissions } from '../src/data/missions/vertical-slice-missions';
import { getPharmacyQueue } from '../src/data/challenges/pharmacy-queues';

describe('PharmacyQueue', () => {
  it('only moves while Hubi stands in the queue', () => {
    const queue = new PharmacyQueue(pharmacyQueues['m1-pharmacy'], pharmacyQueueConfig.lineMs);
    expect(queue.update(10_000, false)).toEqual([]);
    expect(queue.getPeopleAhead()).toBe(2);
    queue.update(3_000, true);
    expect(queue.getServiceProgress()).toBeGreaterThan(0.4);
  });

  it('serves every senior in order, then it is Hubi\'s turn', () => {
    const queue = new PharmacyQueue(pharmacyQueues['m1-pharmacy'], pharmacyQueueConfig.lineMs);
    expect(queue.update(6_000, true)).toEqual([{ type: 'served', customerIndex: 0 }]);
    expect(queue.getServingCustomer()?.seniorId).toBe('zdzislaw');
    expect(queue.update(6_000, true)).toEqual([{ type: 'served', customerIndex: 1 }, { type: 'your-turn' }]);
    expect(queue.isDone()).toBe(true);
    expect(queue.getPeopleAhead()).toBe(0);
  });

  it('cycles the senior\'s lines while she is at the counter', () => {
    const queue = new PharmacyQueue(pharmacyQueues['m3-pharmacy'], pharmacyQueueConfig.lineMs);
    const first = queue.getCurrentLine();
    queue.update(pharmacyQueueConfig.lineMs, true);
    expect(queue.getCurrentLine()).not.toBe(first);
  });

  it('month 3 has a longer queue than month 1 and enough spots for everyone', () => {
    const total = (id: keyof typeof pharmacyQueues) => pharmacyQueues[id].customers.reduce((sum, c) => sum + c.serviceMs, 0);
    expect(total('m3-pharmacy')).toBeGreaterThan(total('m1-pharmacy'));
    for (const queue of Object.values(pharmacyQueues)) {
      expect(queue.customers.length).toBeLessThanOrEqual(pharmacyQueueConfig.spots.length);
      for (const customer of queue.customers) {
        expect(customer.lines.length * pharmacyQueueConfig.lineMs).toBeLessThanOrEqual(customer.serviceMs + pharmacyQueueConfig.lineMs);
      }
    }
  });

  it('every mission queue challenge points at an existing queue (M1 and M3)', () => {
    const ids = verticalSliceMissions.flatMap((mission) =>
      mission.steps.flatMap((step) => (step.challenge?.type === 'pharmacy-queue' ? [step.challenge.queueId] : [])),
    );
    expect(ids).toEqual(['m1-pharmacy', 'm3-pharmacy']);
    for (const id of ids) expect(getPharmacyQueue(id)).not.toBeNull();
  });
});
