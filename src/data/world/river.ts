import { CARRY_TEXTURES, HOME_PROP_TEXTURES } from '../art/round4-art';

/**
 * The estate now ends with a lawn and a dirty river instead of a wall of
 * blocks. Herbi can walk on the muddy bank but not into the water.
 */
export const RIVER = {
  bankTop: 1588,
  waterTop: 1612,
  bottom: 1720,
  /** Flow speed of the water texture, px/s (to the right). */
  flowSpeed: 14,
} as const;

/** Sewage outfalls under the two blocks: brown plumes drifting downstream. */
export const SEWAGE_OUTFALLS = [
  { x: 275, label: 'BLOK 23' },
  { x: 1280, label: 'BLOK 47' },
] as const;

export interface RiverTrashConfig {
  textureKeys: readonly string[];
  minIntervalMs: number;
  maxIntervalMs: number;
  minSpeed: number;
  maxSpeed: number;
  laneTop: number;
  laneBottom: number;
  initialCount: number;
}

/** Rubbish floating past now and then: cups, cartons, a kebab wrapper… */
export const RIVER_TRASH: RiverTrashConfig = {
  textureKeys: [CARRY_TEXTURES.coffee.key, HOME_PROP_TEXTURES.milk.key, HOME_PROP_TEXTURES.kebabWrapper.key, CARRY_TEXTURES.parcelSmall.key],
  minIntervalMs: 5_000,
  maxIntervalMs: 12_000,
  minSpeed: 18,
  maxSpeed: 32,
  laneTop: RIVER.waterTop + 14,
  laneBottom: RIVER.bottom - 14,
  initialCount: 3,
};
