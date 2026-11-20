import type { Point2D } from '../../core/math/geometry-types';
import type { BuildingWindow, WindowWatchConfig, WindowWatchEvent } from '../../domain/world/window-types';

/**
 * Standing still right outside an unsafe shop window gets Hubi noticed.
 * Pure logic: the scene feeds position, movement and hiding every frame.
 */
export class WindowWatchSystem {
  private stillMs = 0;
  private cooldownMs = 0;
  private currentWindowId: string | null = null;

  public constructor(
    private readonly windows: readonly BuildingWindow[],
    private readonly config: WindowWatchConfig,
  ) {}

  public update(deltaMs: number, player: Point2D, moving: boolean, hidden: boolean): WindowWatchEvent | null {
    this.cooldownMs = Math.max(0, this.cooldownMs - deltaMs);
    const window = hidden ? null : this.findWindowInFront(player);
    if (!window || moving || window.id !== this.currentWindowId) {
      this.stillMs = 0;
      this.currentWindowId = window?.id ?? null;
      return null;
    }
    if (window.safe || this.cooldownMs > 0) return null;
    this.stillMs += deltaMs;
    if (this.stillMs < this.config.noticeAfterMs) return null;
    this.stillMs = 0;
    this.cooldownMs = this.config.cooldownMs;
    return { window };
  }

  /** The window Hubi is standing in front of (on the street side), if any. */
  public findWindowInFront(player: Point2D): BuildingWindow | null {
    const { halfWidth, depth, wallHalfThickness } = this.config;
    return this.windows.find((window) => {
      if (Math.abs(player.x - window.x) > halfWidth) return false;
      const distance = window.facing === 'down'
        ? player.y - (window.wallY + wallHalfThickness)
        : window.wallY - wallHalfThickness - player.y;
      return distance >= 0 && distance <= depth;
    }) ?? null;
  }

  public reset(): void {
    this.stillMs = 0;
    this.cooldownMs = 0;
    this.currentWindowId = null;
  }
}
