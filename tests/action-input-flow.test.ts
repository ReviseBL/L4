import { describe, expect, it } from 'vitest';
import { medicineMission } from '../src/data/missions/medicine-mission';
import { ActionInputRouter } from '../src/systems/action-input-router';
import { HidingSystem } from '../src/systems/hiding-system';
import { InteractionSystem } from '../src/systems/interaction-system';
import { MissionSystem } from '../src/systems/mission-system';

describe('action input regression flow', () => {
  const router = new ActionInputRouter();

  it('requires a new action edge after closing dialogue before toggling a hide spot', () => {
    const hiding = new HidingSystem([
      { id: 'test-hide', x: 10, y: 10, radius: 24, label: 'Test hide spot' },
    ]);
    const position = { x: 10, y: 10 };

    const closingDialogueOwner = router.resolve({
      dialogueActive: true,
      summaryVisible: false,
      monthTransitionVisible: false,
    });
    if (closingDialogueOwner === 'GAMEPLAY') {
      hiding.toggle(position);
    }
    expect(hiding.isHidden()).toBe(false);

    const nextActionOwner = router.resolve({
      dialogueActive: false,
      summaryVisible: false,
      monthTransitionVisible: false,
    });
    if (nextActionOwner === 'GAMEPLAY') {
      hiding.toggle(position);
    }
    expect(hiding.isHidden()).toBe(true);

    if (nextActionOwner === 'GAMEPLAY') {
      hiding.toggle(position);
    }
    expect(hiding.isHidden()).toBe(false);
  });

  it('routes one gameplay action to the pharmacy and advances M1-01 exactly once', () => {
    const interactions = new InteractionSystem([
      {
        id: 'pharmacy-counter',
        x: 100,
        y: 200,
        radius: 48,
        prompt: '[E] KUP LEKI',
        message: 'Kupiono leki.',
      },
    ]);
    const missions = new MissionSystem([medicineMission]);
    missions.startFirst({ nowMs: 0, suspicion: 0 });

    const owner = router.resolve({
      dialogueActive: false,
      summaryVisible: false,
      monthTransitionVisible: false,
    });
    const interaction = owner === 'GAMEPLAY' ? interactions.interact(100, 200) : null;
    expect(interaction?.target.id).toBe('pharmacy-counter');

    const purchase = missions.handleEvent(
      { type: 'interaction', targetId: interaction?.target.id ?? '' },
      { nowMs: 1_000, suspicion: 0 },
    );
    expect(purchase.matched).toBe(true);
    expect(purchase.effects).toContainEqual({ type: 'add-item', itemId: 'medicine' });
    expect(missions.getCurrentObjectiveText()).toBe('Wróć z lekami do mieszkania.');

    const duplicatePurchase = missions.handleEvent(
      { type: 'interaction', targetId: 'pharmacy-counter' },
      { nowMs: 1_001, suspicion: 0 },
    );
    expect(duplicatePurchase.matched).toBe(false);
  });
});
