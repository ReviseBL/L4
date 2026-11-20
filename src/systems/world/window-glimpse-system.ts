import type { Point2D } from '../../core/math/geometry-types';
import type {
  BuildingWindow,
  GlimpseObserver,
  GlimpseRoom,
  WindowGlimpse,
  WindowGlimpseConfig,
} from '../../domain/world/window-types';

/**
 * Chasers outside a shop can glimpse Hubi through its clear windows. A
 * glimpse is only a hint: the NPC comes over to look around the shop for a
 * while and leaves, it does not start a chase. Pure logic.
 */
export class WindowGlimpseSystem {
  private readonly cooldowns = new Map<string, number>();

  public constructor(
    private readonly windows: readonly BuildingWindow[],
    private readonly rooms: readonly GlimpseRoom[],
    private readonly config: WindowGlimpseConfig,
  ) {}

  public update(deltaMs: number, player: Point2D, hidden: boolean, observers: readonly GlimpseObserver[]): WindowGlimpse[] {
    for (const [id, remaining] of this.cooldowns) this.cooldowns.set(id, Math.max(0, remaining - deltaMs));
    if (hidden) return [];
    const room = this.rooms.find((candidate) => inside(candidate, player));
    if (!room) return [];
    const glass = this.windows.filter((window) => window.buildingId === room.buildingId && !window.safe);
    if (glass.length === 0) return [];

    const glimpses: WindowGlimpse[] = [];
    for (const observer of observers) {
      if ((this.cooldowns.get(observer.id) ?? 0) > 0 || inside(room, observer.position)) continue;
      if (!inCone(observer, player)) continue;
      const window = glass.find((candidate) => lineCrossesWindow(observer.position, player, candidate, this.config.halfWidth));
      if (!window) continue;
      this.cooldowns.set(observer.id, this.config.cooldownMs);
      const outward = window.facing === 'down' ? 1 : -1;
      glimpses.push({
        observerId: observer.id,
        window,
        lookFrom: { x: window.x, y: window.wallY + outward * this.config.lookFromDistance },
      });
    }
    return glimpses;
  }
}

function inside(room: GlimpseRoom, point: Point2D): boolean {
  return point.x > room.left && point.x < room.right && point.y > room.top && point.y < room.bottom;
}

function inCone(observer: GlimpseObserver, target: Point2D): boolean {
  const dx = target.x - observer.position.x;
  const dy = target.y - observer.position.y;
  if (Math.hypot(dx, dy) > observer.range) return false;
  const angle = Math.atan2(dy, dx) - observer.facingRadians;
  const wrapped = Math.atan2(Math.sin(angle), Math.cos(angle));
  return Math.abs(wrapped) <= observer.halfAngleRadians;
}

/** Does the sight line cross the wall right at the glass? */
function lineCrossesWindow(from: Point2D, to: Point2D, window: BuildingWindow, halfWidth: number): boolean {
  if ((from.y - window.wallY) * (to.y - window.wallY) >= 0) return false;
  const t = (window.wallY - from.y) / (to.y - from.y);
  const x = from.x + t * (to.x - from.x);
  return Math.abs(x - window.x) <= halfWidth;
}
