import type { WatcherConfig, WatcherDefinition } from '../../domain/watchers/watcher-types';

export const watcherConfig = {
  spawnChance: 0.5,
  recognitionMs: 700,
  cooldownMs: 9_000,
  shoutDisplayMs: 2_600,
} as const satisfies WatcherConfig;

/** Friendly neighbours guarding the bottom of the estate. */
export const neighborWatchers = [
  {
    id: 'seba',
    displayName: 'SĄSIAD SEBA',
    textureKey: 'npc-neighbor-seba',
    placeholderColor: 0x4f6b3a,
    // Gap between block 23 and the pharmacy, looking along the bottom strip.
    position: { x: 545, y: 1362 },
    baseFacingDegrees: 0,
    sweepDegrees: 75,
    sweepPeriodMs: 7_000,
    viewDistance: 300,
    viewHalfAngleDegrees: 70,
    focusHalfAngleDegrees: 32,
    peripheralRangeMultiplier: 0.6,
    shoutLines: ['Siema Hubi!', 'Ej, Hubi! Nie w robocie?', 'Cześć Hubi! Gramy dziś w Fifę?'],
  },
  {
    id: 'grazyna',
    displayName: 'PANI GRAŻYNA',
    textureKey: 'npc-neighbor-grazyna',
    placeholderColor: 0x9d4b73,
    // Bench in front of block 47, watching the strip by the pharmacy.
    position: { x: 1170, y: 1048 },
    baseFacingDegrees: 180,
    sweepDegrees: 60,
    sweepPeriodMs: 8_500,
    viewDistance: 320,
    viewHalfAngleDegrees: 70,
    focusHalfAngleDegrees: 32,
    peripheralRangeMultiplier: 0.6,
    shoutLines: ['Cześć Hubi! Już zdrowy?', 'Hubert! A co ty tak o tej porze?', 'O, Hubi! Pozdrów mamę!'],
  },
] as const satisfies readonly WatcherDefinition[];

export const WATCHER_TEXTURES = [
  { key: 'npc-neighbor-seba', url: 'assets/characters/npc-neighbor-seba.png' },
  { key: 'npc-neighbor-seba-side', url: 'assets/characters/npc-neighbor-seba-side.png' },
] as const;
