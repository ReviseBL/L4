import type { PlayerDirection, PlayerVisualAction } from '../../domain/player/player-visual-types';

export const HUBI_TEXTURE_KEY = 'hubi-spritesheet';
export const HUBI_SPRITESHEET_URL = 'assets/characters/hubi-spritesheet.png';
// Character Pass 1.2: 6 kolumn × 16 wierszy (idle / walk / sprint / phone × down, up, left, right).
// Szersza klatka mieści sprint z boku; Herbi ma na ekranie tę samą wysokość co poprzedni draft.
export const HUBI_FRAME_WIDTH = 64;
export const HUBI_FRAME_HEIGHT = 48;
export const HUBI_ORIGIN = { x: 0.5, y: 0.5 } as const;
// Rozmiar ciała bez zmian (24×25); offset przeliczony tak, by ciało zostało w tym samym miejscu
// względem środka sprite'a co przy klatce 32×44 (środek −12…+12 w poziomie, −5…+20 w pionie).
export const HUBI_PHYSICS_BODY = { width: 24, height: 25, offsetX: 20, offsetY: 19 } as const;

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
  idle: { start: 0, count: 6, frameRate: 3, repeat: -1 },
  walk: { start: 24, count: 6, frameRate: 12, repeat: -1 },
  sprint: { start: 48, count: 6, frameRate: 12, repeat: -1 },
  // Carry and interact still reuse idle/walk; the carried item is a separate overlay.
  'carry-idle': { start: 0, count: 6, frameRate: 3, repeat: -1 },
  'carry-walk': { start: 24, count: 6, frameRate: 12, repeat: -1 },
  // Rows 12-15: Herbi standing with the phone at his ear (art round 4).
  phone: { start: 72, count: 6, frameRate: 3, repeat: -1 },
  interact: { start: 0, count: 6, frameRate: 10, repeat: 0 },
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

