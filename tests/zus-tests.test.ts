import { describe, expect, it } from 'vitest';
import { INKBLOT_CARDS, inkblotTestConfig, reflexTestConfig } from '../src/data/finale/zus-tests';
import { InkblotTest } from '../src/systems/finale/inkblot-test';
import { ReflexTest } from '../src/systems/finale/reflex-test';

describe('InkblotTest', () => {
  it('gives every card one believable, one workaholic and one 3D-printing answer', () => {
    for (const card of INKBLOT_CARDS) {
      expect(card.answers.map((answer) => answer.kind).sort()).toEqual(['printer', 'sick', 'work']);
      const sick = card.answers.find((answer) => answer.kind === 'sick')!;
      expect(card.answers.every((answer) => answer.credibilityDelta <= sick.credibilityDelta)).toBe(true);
    }
  });

  it('charges for hesitating and for running out of time', () => {
    const test = new InkblotTest(INKBLOT_CARDS, inkblotTestConfig);
    const quick = test.choose(0);
    expect(quick?.credibilityDelta).toBe(INKBLOT_CARDS[0]!.answers[0]!.credibilityDelta);
    test.update(inkblotTestConfig.thinkMs + 1);
    const slow = test.choose(0);
    expect(slow?.credibilityDelta).toBe(INKBLOT_CARDS[1]!.answers[0]!.credibilityDelta + inkblotTestConfig.hesitationDelta);
    expect(slow?.reaction).toContain(inkblotTestConfig.hesitationLine);
    const timeout = test.update(inkblotTestConfig.timeoutMs);
    expect(timeout?.credibilityDelta).toBe(inkblotTestConfig.timeoutDelta);
    expect(test.getCardNumber()).toBe(4);
    test.choose(2);
    expect(test.isDone()).toBe(true);
    expect(test.choose(0)).toBeNull();
  });
});

describe('ReflexTest', () => {
  it('rates the kick by where the needle is', () => {
    const test = new ReflexTest(reflexTestConfig, () => 0);
    expect(test.press()?.result).toBe('none');
    const speed = reflexTestConfig.speeds[1]!;
    test.update(((reflexTestConfig.weakFrom + reflexTestConfig.weakTo) / 2 / (speed * 2)) * 1_000);
    expect(test.press()).toMatchObject({ result: 'weak', credibilityDelta: reflexTestConfig.weakDelta });
    const fast = reflexTestConfig.speeds[2]!;
    test.update((0.9 / (fast * 2)) * 1_000);
    expect(test.press()).toMatchObject({ result: 'strong', credibilityDelta: reflexTestConfig.strongDelta });
    expect(test.isDone()).toBe(true);
    expect(test.press()).toBeNull();
  });

  it('bounces the needle between the ends of the bar', () => {
    const test = new ReflexTest(reflexTestConfig, () => 0);
    const speed = reflexTestConfig.speeds[0]!;
    test.update((1 / (speed * 2)) * 1_000);
    expect(test.getStrength()).toBeCloseTo(1, 5);
    test.update((0.5 / (speed * 2)) * 1_000);
    expect(test.getStrength()).toBeCloseTo(0.5, 5);
  });
});
