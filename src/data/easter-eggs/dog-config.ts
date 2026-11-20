/**
 * Easter egg: now and then a runaway Pomeranian dashes across the screen,
 * barks and is gone. It does nothing else (no detection, no collision).
 */
export interface DogCameoConfig {
  /** Chance that the dog shows up in a given mission. */
  chancePerMission: number;
  /** When in the mission it runs past (ms after the start), picked at random. */
  earliestMs: number;
  latestMs: number;
  /** Running speed, px/s. */
  speed: number;
  /** How far from Hubi (vertically) its run line may be. */
  laneSpread: number;
  /** Open strips it prefers to run along (sidewalks, street, lawn), so it does not cut through walls. */
  lanes: readonly number[];
  barkLines: readonly string[];
}

export const dogCameoConfig: DogCameoConfig = {
  chancePerMission: 0.4,
  earliestMs: 15_000,
  latestMs: 75_000,
  speed: 250,
  laneSpread: 70,
  lanes: [583, 735, 878, 1480],
  barkLines: ['Hau hau!', 'Hau!', 'Hau hau hau!', 'Wrrr… hau!'],
};

/** Run-cycle sheet: 6 frames in one row (picked up when the file exists). */
export const DOG_SPRITE = {
  key: 'npc-pomeranian-run',
  url: 'assets/characters/npc-pomeranian-run.png',
  frames: 6,
  frameWidth: 38,
  frameHeight: 29,
  frameRate: 14,
  // Drawn 1:1 so the pixels stay crisp.
  displayHeight: 29,
} as const;
