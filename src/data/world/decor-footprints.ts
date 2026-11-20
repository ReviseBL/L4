/**
 * Collision footprints for world decor, keyed by the art name without its
 * size suffix ("world-bench-56x44" → "bench"). The box sits on the image's
 * bottom edge and covers only the part a person would bump into (a trunk,
 * bench legs), so characters still walk "behind" the tall top of the art.
 * Missing entries (flowerbeds, leaf piles, the carpet-beater) stay walk-through.
 */
export interface DecorFootprint {
  width: number;
  height: number;
}

export const DECOR_FOOTPRINTS: Readonly<Record<string, DecorFootprint>> = {
  tree: { width: 18, height: 10 },
  birch: { width: 14, height: 10 },
  poplar: { width: 12, height: 10 },
  chestnut: { width: 18, height: 10 },
  spruce: { width: 18, height: 10 },
  'dead-tree': { width: 14, height: 10 },
  'young-tree': { width: 10, height: 8 },
  'planter-tree': { width: 28, height: 12 },
  bench: { width: 46, height: 14 },
  'trash-bin': { width: 16, height: 10 },
  lamp: { width: 10, height: 8 },
  'bike-rack': { width: 56, height: 12 },
  bollard: { width: 8, height: 6 },
  sandbox: { width: 40, height: 18 },
  swing: { width: 60, height: 10 },
  boxwood: { width: 24, height: 12 },
  hedge: { width: 64, height: 20 },
  lilac: { width: 38, height: 14 },
  kiosk: { width: 66, height: 26 },
  'waste-shelter': { width: 66, height: 24 },
  'play-fence': { width: 92, height: 12 },
  'bus-stop': { width: 92, height: 14 },
  'ad-column': { width: 22, height: 12 },
  hydrant: { width: 12, height: 8 },
  pallets: { width: 32, height: 12 },
  cart: { width: 24, height: 10 },
};

export interface DecorBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Collision box (centre + size) for a decor image, or null when it is walk-through. */
export function decorCollisionBox(key: string, x: number, y: number, scale = 1): DecorBox | null {
  const match = /^world-(.+)-(\d+)x(\d+)$/.exec(key);
  if (!match) return null;
  const footprint = DECOR_FOOTPRINTS[match[1] ?? ''];
  if (!footprint) return null;
  const imageHeight = Number(match[3]) * scale;
  const width = footprint.width * scale;
  const height = footprint.height * scale;
  const bottom = y + imageHeight / 2;
  return { x, y: bottom - height / 2, width, height };
}
