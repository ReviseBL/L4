import { describe, expect, it } from 'vitest';
import { staminaConfig } from '../src/data/player/stamina-config';
import { Stamina } from '../src/systems/player/stamina';

describe('Stamina', () => {
  it('runs dry after the sprint budget and locks sprinting', () => {
    const stamina = new Stamina(staminaConfig);
    let event = null;
    for (let t = 0; t < staminaConfig.sprintMs && !event; t += 50) event = stamina.update(50, true, true);
    expect(event).toBe('exhausted');
    expect(stamina.canSprint()).toBe(false);
  });

  it('unlocks again once a part of the tank is back', () => {
    const stamina = new Stamina(staminaConfig);
    stamina.update(staminaConfig.sprintMs, true, true);
    stamina.update(staminaConfig.recoverStandingMs * (staminaConfig.exhaustedUntil - 0.05), false, false);
    expect(stamina.canSprint()).toBe(false);
    expect(stamina.update(staminaConfig.recoverStandingMs * 0.1, false, false)).toBe('recovered');
    expect(stamina.canSprint()).toBe(true);
  });

  it('refills faster standing than walking', () => {
    const standing = new Stamina(staminaConfig);
    const walking = new Stamina(staminaConfig);
    standing.update(1_000, true, true);
    walking.update(1_000, true, true);
    standing.update(1_000, false, false);
    walking.update(1_000, false, true);
    expect(standing.getLevel()).toBeGreaterThan(walking.getLevel());
  });
});
