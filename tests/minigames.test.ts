import { describe, expect, it } from 'vitest';
import { threadingRules, threadingVariants } from '../src/data/minigames/threading-config';
import { timingVariants } from '../src/data/minigames/timing-config';
import { ThreadingMinigame } from '../src/systems/minigames/threading-minigame';
import { TimingMinigame } from '../src/systems/minigames/timing-minigame';

const fixed = (value: number) => () => value;

/** Steer the tip onto the hole using the public state, like a perfect player. */
function aimAndPush(game: ThreadingMinigame): ReturnType<ThreadingMinigame['push']> {
  for (let step = 0; step < 400; step += 1) {
    const error = game.getHoleX() - game.getTipX();
    if (Math.abs(error) <= game.getStage().holeRadius * 0.5) return game.push();
    game.update(10, Math.sign(error));
  }
  return game.push();
}

describe('ThreadingMinigame', () => {
  it('snaps when pushed far from the hole and starts a new attempt', () => {
    const game = new ThreadingMinigame(threadingVariants.petg, threadingRules, 0, fixed(0.95));
    game.update(16, 1);
    expect(Math.abs(game.getTipX())).toBeGreaterThan(threadingVariants.petg.stages[0].holeRadius);
    expect(game.push()).toBe('snap');
    expect(game.getAttempt()).toBe(2);
    expect(game.isFinished()).toBe(false);
  });

  it('succeeds when the tip is inside the hole', () => {
    const game = new ThreadingMinigame(threadingVariants.petg, threadingRules, 0, fixed(0.5));
    expect(aimAndPush(game)).toBe('success');
    expect(game.isFinished()).toBe(true);
  });

  it('needs both holes for the L4 project filament', () => {
    const game = new ThreadingMinigame(threadingVariants.l4, threadingRules, 0, fixed(0.5));
    expect(aimAndPush(game)).toBe('stage-cleared');
    expect(game.getStage().label).toBe('GŁOWICA');
    expect(aimAndPush(game)).toBe('success');
  });

  it('shakes less after every miss but never stops shaking', () => {
    const game = new ThreadingMinigame(threadingVariants.petg, threadingRules, 0, fixed(0.95));
    const initial = game.getTremorFactor();
    for (let miss = 0; miss < 20; miss += 1) {
      game.update(16, 1);
      game.push();
    }
    expect(game.getTremorFactor()).toBeLessThan(initial);
    expect(game.getTremorFactor()).toBeCloseTo(threadingRules.minimumMercyFactor, 5);
  });

  it('shakes more when the company suspects Herbi', () => {
    const calm = new ThreadingMinigame(threadingVariants.petg, threadingRules, 0, fixed(0.5));
    const stressed = new ThreadingMinigame(threadingVariants.petg, threadingRules, 1, fixed(0.5));
    expect(stressed.getTremorFactor()).toBeCloseTo(calm.getTremorFactor() * (1 + threadingRules.stressTremorBonus), 5);
  });

  it('moves the hole for PLA and hides it with fumes for ASA', () => {
    const pla = new ThreadingMinigame(threadingVariants.pla, threadingRules, 0, fixed(0.5));
    pla.update(600, 0);
    expect(Math.abs(pla.getHoleX())).toBeGreaterThan(1);

    const asa = new ThreadingMinigame(threadingVariants.asa, threadingRules, 0, fixed(0.5));
    asa.update(800, 0);
    expect(asa.getFumesOpacity()).toBeGreaterThan(0.5);
    asa.update(2_000, 0);
    expect(asa.getFumesOpacity()).toBe(0);
  });

  it('lets flexible TPU lag behind the hand', () => {
    const tpu = new ThreadingMinigame(threadingVariants.tpu, threadingRules, 0, fixed(0.5));
    const start = tpu.getTipX();
    tpu.update(50, 1);
    const handMoved = tpu.getHandX() - start;
    const tipMoved = tpu.getTipX() - start;
    expect(Math.abs(tipMoved)).toBeLessThan(Math.abs(handMoved) + threadingVariants.tpu.tremorAmplitude);
    expect(Math.abs(tipMoved - handMoved)).toBeGreaterThan(0);
  });
});

describe('TimingMinigame', () => {
  it('reports pressing too early as under and too late as over', () => {
    const game = new TimingMinigame(timingVariants.nozzle);
    expect(game.getNeedle()).toBe(0);
    expect(game.press()).toBe('under');

    const late = new TimingMinigame(timingVariants.nozzle);
    late.update(1000 / timingVariants.nozzle.needleCyclesPerSecond / 2);
    expect(late.getNeedle()).toBeCloseTo(1, 5);
    expect(late.press()).toBe('over');
  });

  it('completes the nozzle in one good press and widens the zone after misses', () => {
    const game = new TimingMinigame(timingVariants.nozzle);
    const before = game.getZone();
    game.press();
    const after = game.getZone();
    expect(after.end - after.start).toBeGreaterThan(before.end - before.start);

    const cycleMs = 1000 / timingVariants.nozzle.needleCyclesPerSecond;
    game.update((cycleMs / 2) * timingVariants.nozzle.zoneCenter - game.getNeedle());
    expect(game.press()).toBe('complete');
    expect(game.isFinished()).toBe(true);
  });

  it('needs three good presses to peel the L4 print', () => {
    const game = new TimingMinigame(timingVariants['print-removal']);
    const cycleMs = 1000 / timingVariants['print-removal'].needleCyclesPerSecond;
    game.update(cycleMs / 4);
    expect(game.press()).toBe('hit');
    game.update(cycleMs);
    expect(game.press()).toBe('hit');
    game.update(cycleMs);
    expect(game.press()).toBe('complete');
  });
});
