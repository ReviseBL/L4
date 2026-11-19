import { describe, expect, it } from 'vitest';
import { homeVisualDefinitions } from '../src/data/home/home-progression';
import { worldInteractionTargets } from '../src/data/world/interaction-targets';
import { InteractionSystem, type InteractionTarget } from '../src/systems/interaction-system';

const display: InteractionTarget = {
  id: 'l4-display',
  x: 100,
  y: 100,
  radius: 50,
  prompt: '[E] OBEJRZYJ L4 400%',
  message: 'BOHATER: Piękne.',
  requiresHomeVisualId: 'l4-400-finished-print',
};

describe('Interaction availability', () => {
  it('hides a target whose home visual is not unlocked yet', () => {
    const interactions = new InteractionSystem([display], () => false);
    expect(interactions.findNearby(100, 100)).toBeNull();
    expect(interactions.findNearby(100, 100, 'l4-display')).toBeNull();
    expect(interactions.interact(100, 100)).toBeNull();
  });

  it('offers the target once its home visual is visible', () => {
    const interactions = new InteractionSystem([display], () => true);
    expect(interactions.findNearby(100, 100)?.id).toBe('l4-display');
  });

  it('falls back to a closer available target when the nearest one is locked', () => {
    const shelf: InteractionTarget = { id: 'shelf', x: 120, y: 100, radius: 50, prompt: '[E] PÓŁKA', message: 'Półka.' };
    const interactions = new InteractionSystem([display, shelf], (target) => !target.requiresHomeVisualId);
    expect(interactions.findNearby(100, 100)?.id).toBe('shelf');
  });

  it('gates the L4 400% display on the finished print shown in the apartment', () => {
    const targets: readonly InteractionTarget[] = worldInteractionTargets;
    const target = targets.find((candidate) => candidate.id === 'l4-display');
    expect(target?.requiresHomeVisualId).toBe('l4-400-finished-print');
    const visual = homeVisualDefinitions.find((definition) => definition.id === target?.requiresHomeVisualId);
    expect(visual?.unlock).toEqual({ type: 'print-completed', printJobId: 'l4-400' });
  });
});
