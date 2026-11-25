import type { PlayerDirection } from '../../domain/player/player-visual-types';

export type NpcSpriteId = 'coworker' | 'jogger' | 'hr' | 'manager';
export type NpcSpriteAction = 'idle' | 'walk';

export interface NpcSpriteDefinition {
  id: NpcSpriteId;
  textureKey: string;
  url: string;
  frameWidth: number;
  frameHeight: number;
  /** Prędkość ruchu, przy której animacja chodu gra w bazowym tempie. */
  referenceSpeed: number;
  actions: Readonly<Record<NpcSpriteAction, { startRow: number; frameRate: number }>>;
}

export interface NpcAnimationDefinition {
  key: string;
  spriteId: NpcSpriteId;
  action: NpcSpriteAction;
  direction: PlayerDirection;
  frames: readonly number[];
  frameRate: number;
  repeat: number;
}

/** Arkusz NPC: 6 klatek w wierszu; wiersze idle ×4 kierunki, potem walk ×4 kierunki. */
export const NPC_SHEET_COLUMNS = 6;
export const NPC_SHEET_ROWS = 8;
export const NPC_DIRECTIONS = ['down', 'up', 'left', 'right'] as const satisfies readonly PlayerDirection[];

/**
 * Ciało ma ten sam rozmiar co przy placeholderze 32×44 (24×25, offset 4/17);
 * offset przeliczony na klatkę 64×48 tak, by leżało w tym samym miejscu względem środka.
 */
export const NPC_PHYSICS_BODY = { width: 24, height: 25, offsetX: 20, offsetY: 19 } as const;

export const NPC_SPRITES: Readonly<Record<NpcSpriteId, NpcSpriteDefinition>> = {
  coworker: {
    id: 'coworker',
    textureKey: 'coworker-spritesheet',
    url: 'assets/characters/coworker-spritesheet.png',
    frameWidth: 64,
    frameHeight: 48,
    referenceSpeed: 92,
    actions: {
      idle: { startRow: 0, frameRate: 3 },
      walk: { startRow: 4, frameRate: 9 },
    },
  },
  // The riverside jogger: a run cycle in every row; standing still he jogs on the spot.
  jogger: {
    id: 'jogger',
    textureKey: 'jogger-spritesheet',
    url: 'assets/characters/jogger-spritesheet.png',
    frameWidth: 64,
    frameHeight: 48,
    referenceSpeed: 128,
    actions: {
      idle: { startRow: 0, frameRate: 7 },
      walk: { startRow: 4, frameRate: 12 },
    },
  },
  hr: {
    id: 'hr',
    textureKey: 'hr-spritesheet',
    url: 'assets/characters/hr-spritesheet.png',
    frameWidth: 64,
    frameHeight: 48,
    referenceSpeed: 98,
    actions: {
      idle: { startRow: 0, frameRate: 3 },
      walk: { startRow: 4, frameRate: 9 },
    },
  },
  manager: {
    id: 'manager',
    textureKey: 'manager-spritesheet',
    url: 'assets/characters/manager-spritesheet.png',
    frameWidth: 64,
    frameHeight: 48,
    referenceSpeed: 112,
    actions: {
      idle: { startRow: 0, frameRate: 3 },
      walk: { startRow: 4, frameRate: 9 },
    },
  },
};

export function getNpcAnimationKey(
  spriteId: NpcSpriteId,
  action: NpcSpriteAction,
  direction: PlayerDirection,
): string {
  return `npc-${spriteId}-${action}-${direction}`;
}

export function getNpcAnimationDefinitions(sprite: NpcSpriteDefinition): NpcAnimationDefinition[] {
  return (Object.keys(sprite.actions) as NpcSpriteAction[]).flatMap((action) =>
    NPC_DIRECTIONS.map((direction, directionIndex) => {
      const row = sprite.actions[action].startRow + directionIndex;
      return {
        key: getNpcAnimationKey(sprite.id, action, direction),
        spriteId: sprite.id,
        action,
        direction,
        frames: Array.from({ length: NPC_SHEET_COLUMNS }, (_, column) => row * NPC_SHEET_COLUMNS + column),
        frameRate: sprite.actions[action].frameRate,
        repeat: -1,
      };
    }),
  );
}
