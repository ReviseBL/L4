import { describe, expect, it } from 'vitest';
import {
  managerCallPools,
  quickQuestionDialogue,
  recoveryCheckDialogue,
  statusUpdateDialogue,
} from '../src/data/phone/manager-call-dialogues';
import { CallDialoguePicker } from '../src/systems/call-dialogue-picker';

describe('CallDialoguePicker', () => {
  it('has several variants for every call type used by missions', () => {
    for (const base of [quickQuestionDialogue, statusUpdateDialogue, recoveryCheckDialogue]) {
      expect(managerCallPools.get(base)?.length ?? 0).toBeGreaterThanOrEqual(5);
    }
  });

  it('does not repeat the Wi-Fi question back to back', () => {
    const picker = new CallDialoguePicker(managerCallPools, 3, () => 0);
    const picked = [1, 2, 3, 4].map(() => picker.pick(quickQuestionDialogue));
    expect(new Set(picked).size).toBe(4);
  });

  it('falls back to the base dialogue when there is no pool', () => {
    const picker = new CallDialoguePicker(new Map());
    expect(picker.pick(quickQuestionDialogue)).toBe(quickQuestionDialogue);
  });
});
