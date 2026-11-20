import type { Point2D } from '../../core/math/geometry-types';

export interface ScatterZone { left: number; top: number; right: number; bottom: number }
export interface GreeneryKind { key: string; weight: number; height: number; flat?: boolean }
export interface GreeneryPlacement { key: string; x: number; y: number; flipX: boolean; depth: number }

export interface ScatterOptions {
  zones: readonly ScatterZone[];
  kinds: readonly GreeneryKind[];
  /** Things to keep clear of: existing decor, hide spots, counters… */
  blockers: readonly (Point2D & { radius: number })[];
  /** Rectangles nothing may land in (kebab yard, parking…). */
  keepOut: readonly ScatterZone[];
  count: number;
  minSpacing: number;
  maxAttempts?: number;
}

/**
 * Scatters small greenery over the grass zones: random positions (from the
 * injected RNG, so a fixed seed gives a stable map) that keep their distance
 * from each other and from everything listed as a blocker.
 */
export function scatterGreenery(random: () => number, options: ScatterOptions): GreeneryPlacement[] {
  const placed: GreeneryPlacement[] = [];
  const totalWeight = options.kinds.reduce((sum, kind) => sum + kind.weight, 0);
  const totalArea = options.zones.reduce((sum, zone) => sum + area(zone), 0);
  if (totalWeight <= 0 || totalArea <= 0) return placed;
  const maxAttempts = options.maxAttempts ?? options.count * 40;

  for (let attempt = 0; attempt < maxAttempts && placed.length < options.count; attempt += 1) {
    const zone = pickZone(random() * totalArea, options.zones);
    const x = Math.round(zone.left + random() * (zone.right - zone.left));
    const y = Math.round(zone.top + random() * (zone.bottom - zone.top));
    const kind = pickKind(random() * totalWeight, options.kinds);
    const flipX = random() < 0.5;
    if (options.keepOut.some((rect) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)) continue;
    if (options.blockers.some((blocker) => Math.hypot(blocker.x - x, blocker.y - y) < blocker.radius)) continue;
    if (placed.some((other) => Math.hypot(other.x - x, other.y - y) < options.minSpacing)) continue;
    placed.push({ key: kind.key, x, y, flipX, depth: kind.flat ? 2 : Math.round(y + kind.height / 2) });
  }
  return placed;
}

function area(zone: ScatterZone): number {
  return Math.max(0, zone.right - zone.left) * Math.max(0, zone.bottom - zone.top);
}

function pickZone(value: number, zones: readonly ScatterZone[]): ScatterZone {
  let rest = value;
  for (const zone of zones) {
    rest -= area(zone);
    if (rest <= 0) return zone;
  }
  return zones[zones.length - 1]!;
}

function pickKind(value: number, kinds: readonly GreeneryKind[]): GreeneryKind {
  let rest = value;
  for (const kind of kinds) {
    rest -= kind.weight;
    if (rest <= 0) return kind;
  }
  return kinds[kinds.length - 1]!;
}
