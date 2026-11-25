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
    // Seba basically lives outside.
    spawnChance: 0.8,
    placeholderColor: 0x4f6b3a,
    // Gap between block 23 and the pharmacy: turns his head left and right
    // along the bottom strip (east → south → west), never back at the tree.
    position: { x: 545, y: 1362 },
    baseFacingDegrees: 90,
    sweepDegrees: 88,
    sweepPeriodMs: 7_000,
    viewDistance: 300,
    viewHalfAngleDegrees: 70,
    focusHalfAngleDegrees: 32,
    peripheralRangeMultiplier: 0.6,
    shoutLines: ['Siema Herbi!', 'Ej, Herbi! Nie w robocie?', 'Cześć Herbi! Gramy dziś w Fifę?'],
  },
  {
    id: 'grazyna',
    displayName: 'PANI GRAŻYNA',
    textureKey: 'npc-neighbor-grazyna',
    placeholderColor: 0x9d4b73,
    // The estate's CCTV: sits on the bench in front of block 47 with her back
    // to us and scans the street 180° (west → north → east). Sharper than Seba.
    position: { x: 1170, y: 1046 },
    baseFacingDegrees: 270,
    sweepDegrees: 90,
    sweepPeriodMs: 9_000,
    viewDistance: 380,
    viewHalfAngleDegrees: 70,
    focusHalfAngleDegrees: 36,
    peripheralRangeMultiplier: 0.7,
    recognitionMs: 400,
    seatedTextureKey: 'npc-neighbor-grazyna-bench',
    // Her bench art sits over the estate bench in front of block 47.
    seatedAnchor: { x: 1170, y: 1079 },
    shoutLines: ['Cześć Herbi! Już zdrowy?', 'Herbert! A co ty tak o tej porze?', 'O, Herbi! Pozdrów mamę!'],
  },
] as const satisfies readonly WatcherDefinition[];

export const WATCHER_TEXTURES = [
  { key: 'npc-neighbor-seba', url: 'assets/characters/npc-neighbor-seba.png' },
  { key: 'npc-neighbor-seba-side', url: 'assets/characters/npc-neighbor-seba-side.png' },
  { key: 'npc-neighbor-grazyna', url: 'assets/characters/npc-neighbor-grazyna.png' },
  { key: 'npc-neighbor-grazyna-side', url: 'assets/characters/npc-neighbor-grazyna-side.png' },
  { key: 'npc-neighbor-grazyna-bench', url: 'assets/characters/npc-neighbor-grazyna-bench.png' },
] as const;
