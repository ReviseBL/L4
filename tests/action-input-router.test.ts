import { describe, expect, it } from 'vitest';
import { ActionInputRouter } from '../src/systems/action-input-router';

describe('ActionInputRouter', () => {
  const router = new ActionInputRouter();

  it('routes E to gameplay when no dialogue or overlay is active', () => {
    expect(router.resolve({
      dialogueActive: false,
      summaryVisible: false,
      monthTransitionVisible: false,
    })).toBe('GAMEPLAY');
  });

  it('gives an active dialogue priority over gameplay', () => {
    expect(router.resolve({
      dialogueActive: true,
      summaryVisible: false,
      monthTransitionVisible: false,
    })).toBe('DIALOGUE');
  });

  it('keeps the same physical action owned by the dialogue that it closes', () => {
    let dialogueActive = true;
    const ownerForPressedFrame = router.resolve({
      dialogueActive,
      summaryVisible: false,
      monthTransitionVisible: false,
    });

    if (ownerForPressedFrame === 'DIALOGUE') dialogueActive = false;

    expect(ownerForPressedFrame).toBe('DIALOGUE');
    expect(dialogueActive).toBe(false);
  });

  it('routes the next new action to gameplay after dialogue completion', () => {
    expect(router.resolve({
      dialogueActive: false,
      summaryVisible: false,
      monthTransitionVisible: false,
    })).toBe('GAMEPLAY');
  });

  it('keeps choice confirmation owned by the active dialogue', () => {
    expect(router.resolve({
      dialogueActive: true,
      summaryVisible: true,
      monthTransitionVisible: true,
    })).toBe('DIALOGUE');
  });
});
