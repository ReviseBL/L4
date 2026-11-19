import { describe, expect, it } from 'vitest';
import { parcelCodeConfig } from '../src/data/challenges/parcel-code-config';
import { ParcelCodeChallenge } from '../src/systems/challenges/parcel-code-challenge';

function sequence(...values: number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length]!;
}

describe('ParcelCodeChallenge', () => {
  it('shows the code first, then hides it for typing', () => {
    const challenge = new ParcelCodeChallenge(4, parcelCodeConfig, sequence(0.41, 0.82, 0.15, 0.73));
    expect(challenge.getVisibleCode()).toBe('4817');
    expect(challenge.typeDigit('4')).toBe('ignored');
    challenge.update(parcelCodeConfig.revealMs);
    expect(challenge.getPhase()).toBe('input');
    expect(challenge.getVisibleCode()).toBeNull();
  });

  it('accepts the right code', () => {
    const challenge = new ParcelCodeChallenge(4, parcelCodeConfig, sequence(0.41, 0.82, 0.15, 0.73));
    challenge.update(parcelCodeConfig.revealMs);
    for (const digit of '481') expect(challenge.typeDigit(digit)).toBe('typed');
    expect(challenge.typeDigit('7')).toBe('correct');
    expect(challenge.getPhase()).toBe('done');
  });

  it('a wrong code clears the input and briefly locks the keypad', () => {
    const challenge = new ParcelCodeChallenge(4, parcelCodeConfig, sequence(0.41, 0.82, 0.15, 0.73));
    challenge.update(parcelCodeConfig.revealMs);
    for (const digit of '481') challenge.typeDigit(digit);
    expect(challenge.typeDigit('0')).toBe('wrong');
    expect(challenge.getEntered()).toBe('');
    expect(challenge.typeDigit('4')).toBe('ignored');
    challenge.update(parcelCodeConfig.wrongCodeLockMs);
    expect(challenge.getPhase()).toBe('input');
    expect(challenge.getMistakes()).toBe(1);
  });

  it('peeking shows the SMS again at the cost of time', () => {
    const challenge = new ParcelCodeChallenge(6, parcelCodeConfig, sequence(0.5));
    challenge.update(parcelCodeConfig.revealMs);
    challenge.typeDigit('5');
    expect(challenge.peek()).toBe(true);
    expect(challenge.getVisibleCode()).toBe('555555');
    expect(challenge.getEntered()).toBe('');
    expect(challenge.getPeeks()).toBe(1);
    challenge.backspace();
    challenge.update(parcelCodeConfig.peekRevealMs);
    expect(challenge.getPhase()).toBe('input');
  });

  it('rejects silly code lengths', () => {
    expect(() => new ParcelCodeChallenge(2, parcelCodeConfig)).toThrow();
  });
});
