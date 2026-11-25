import { describe, expect, it } from 'vitest';
import { pharmacyQueueConfig, pharmacyQueues } from '../src/data/challenges/pharmacy-queues';
import { PharmacyQueue } from '../src/systems/challenges/pharmacy-queue';
import { verticalSliceMissions } from '../src/data/missions/vertical-slice-missions';
import { getPharmacyQueue } from '../src/data/challenges/pharmacy-queues';

describe('PharmacyQueue', () => {
  it('only moves while Herbi stands in the queue', () => {
    const queue = new PharmacyQueue(pharmacyQueues['m1-pharmacy'], pharmacyQueueConfig.lineMs);
    expect(queue.update(10_000, false)).toEqual([]);
    expect(queue.getPeopleAhead()).toBe(2);
    queue.update(8_000, true);
    expect(queue.getServiceProgress()).toBeGreaterThan(0.4);
  });

  it('serves every senior in order, then it is Herbi\'s turn', () => {
    const queue = new PharmacyQueue(pharmacyQueues['m1-pharmacy'], pharmacyQueueConfig.lineMs);
    const first = queue.getServiceMs(pharmacyQueues['m1-pharmacy'].customers[0]);
    expect(queue.update(first, true)).toEqual([{ type: 'served', customerIndex: 0 }]);
    expect(queue.getServingCustomer()?.seniorId).toBe('zdzislaw');
    const second = queue.getServiceMs(pharmacyQueues['m1-pharmacy'].customers[1]);
    expect(queue.update(second, true)).toEqual([{ type: 'served', customerIndex: 1 }, { type: 'your-turn' }]);
    expect(queue.isDone()).toBe(true);
    expect(queue.getPeopleAhead()).toBe(0);
  });

  it('alternates the senior and the pharmacist in the small talk', () => {
    const queue = new PharmacyQueue(pharmacyQueues['m3-pharmacy'], pharmacyQueueConfig.lineMs);
    expect(queue.getCurrentLine()?.speaker).toBe('senior');
    queue.update(pharmacyQueueConfig.lineMs, true);
    expect(queue.getCurrentLine()?.speaker).toBe('pharmacist');
  });

  it('is slow on purpose: every senior takes at least 15 seconds', () => {
    const queue = new PharmacyQueue(pharmacyQueues['m1-pharmacy'], pharmacyQueueConfig.lineMs);
    for (const customer of pharmacyQueues['m1-pharmacy'].customers) {
      expect(queue.getServiceMs(customer)).toBeGreaterThanOrEqual(15_000);
    }
  });

  it('month 3 has a longer queue than month 1 and enough spots for everyone', () => {
    expect(pharmacyQueues['m3-pharmacy'].customers.length).toBeGreaterThan(pharmacyQueues['m1-pharmacy'].customers.length);
    for (const queue of Object.values(pharmacyQueues)) {
      expect(queue.customers.length).toBeLessThanOrEqual(pharmacyQueueConfig.spots.length);
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
