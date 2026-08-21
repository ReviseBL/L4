import type { PlayerVisualSelection, PlayerVisualStateInput } from '../../domain/player/player-visual-types';

export function resolvePlayerVisualState(input: PlayerVisualStateInput): PlayerVisualSelection {
  if (input.interacting) {
    return { action: 'interact', direction: input.direction, hidden: input.hidden };
  }
  if (input.phoneActive) {
    return { action: 'phone', direction: input.direction, hidden: input.hidden };
  }
  if (input.carrying) {
    return {
      action: input.moving ? 'carry-walk' : 'carry-idle',
      direction: input.direction,
      hidden: input.hidden,
    };
  }
  if (input.moving) {
    return {
      action: input.sprinting ? 'sprint' : 'walk',
      direction: input.direction,
      hidden: input.hidden,
    };
  }
  return { action: 'idle', direction: input.direction, hidden: input.hidden };
}

