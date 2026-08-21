import type { PlayerDirection, PlayerVisualAction } from '../../domain/player/player-visual-types';

export const HUBI_TEXTURE_KEY = 'hubi-spritesheet';
export const HUBI_SPRITESHEET_URL = 'assets/characters/hubi-spritesheet.png';
export const HUBI_FRAME_WIDTH = 32;
export const HUBI_FRAME_HEIGHT = 44;
export const HUBI_ORIGIN = { x: 0.5, y: 0.5 } as const;
export const HUBI_PHYSICS_BODY = { width: 24, height: 25, offsetX: 4, offsetY: 17 } as const;

export const PLAYER_DIRECTIONS = ['down', 'up', 'left', 'right'] as const satisfies readonly PlayerDirection[];

interface AnimationDefinition {
  action: PlayerVisualAction;
  direction: PlayerDirection;
  frames: readonly number[];
  frameRate: number;
  repeat: number;
}

const directionOrder: Readonly<Record<PlayerDirection, number>> = {
  down: 0,
  up: 1,
  left: 2,
  right: 3,
};

const actionLayout: Readonly<Record<PlayerVisualAction, { start: number; count: number; frameRate: number; repeat: number }>> = {
  idle: { start: 0, count: 2, frameRate: 3, repeat: -1 },
  walk: { start: 8, count: 6, frameRate: 8, repeat: -1 },
  sprint: { start: 32, count: 6, frameRate: 12, repeat: -1 },
  'carry-idle': { start: 56, count: 2, frameRate: 3, repeat: -1 },
  'carry-walk': { start: 64, count: 4, frameRate: 7, repeat: -1 },
  phone: { start: 80, count: 3, frameRate: 3, repeat: -1 },
  interact: { start: 92, count: 3, frameRate: 10, repeat: 0 },
};

export const HUBI_ANIMATION_DEFINITIONS: readonly AnimationDefinition[] = (
  Object.entries(actionLayout) as [PlayerVisualAction, (typeof actionLayout)[PlayerVisualAction]][]
).flatMap(([action, layout]) =>
  PLAYER_DIRECTIONS.map((direction) => {
    const start = layout.start + directionOrder[direction] * layout.count;
    return {
      action,
      direction,
      frames: Array.from({ length: layout.count }, (_, index) => start + index),
      frameRate: layout.frameRate,
      repeat: layout.repeat,
    };
  }),
);

export function getHubiAnimationKey(action: PlayerVisualAction, direction: PlayerDirection): string {
  return `hubi-${action}-${direction}`;
}

