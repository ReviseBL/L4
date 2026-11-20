import type { DogCameoConfig } from '../../data/easter-eggs/dog-config';

export interface ViewRect { left: number; right: number; top: number; bottom: number }

export interface DogRun {
  fromX: number;
  toX: number;
  y: number;
  /** +1 runs right, -1 runs left. */
  direction: 1 | -1;
  durationMs: number;
  bark: string;
}

/**
 * Decides whether the Pomeranian appears in this mission and when, and plans
 * its dash across the visible part of the map. Pure logic, injected RNG.
 */
export class DogCameo {
  private scheduledAtMs: number | null = null;
  private elapsedMs = 0;

  public constructor(private readonly config: DogCameoConfig, private readonly random: () => number) {}

  /** Rolls the dog for a new mission (a new day). */
  public startMission(): boolean {
    this.elapsedMs = 0;
    this.scheduledAtMs = this.random() < this.config.chancePerMission
      ? this.config.earliestMs + this.random() * (this.config.latestMs - this.config.earliestMs)
      : null;
    return this.scheduledAtMs !== null;
  }

  /** True once, on the frame the dog should start running. */
  public update(deltaMs: number): boolean {
    if (this.scheduledAtMs === null) return false;
    this.elapsedMs += Math.max(0, deltaMs);
    if (this.elapsedMs < this.scheduledAtMs) return false;
    this.scheduledAtMs = null;
    return true;
  }

  /** A run from one edge of the view to the other, near Hubi's height. */
  public planRun(view: ViewRect, playerY: number): DogRun {
    const direction: 1 | -1 = this.random() < 0.5 ? 1 : -1;
    const margin = 40;
    const fromX = direction === 1 ? view.left - margin : view.right + margin;
    const toX = direction === 1 ? view.right + margin : view.left - margin;
    const offset = (this.random() * 2 - 1) * this.config.laneSpread;
    // The open strip in view closest to Hubi; his own height only as a fallback.
    const visibleLanes = this.config.lanes.filter((lane) => lane >= view.top + 30 && lane <= view.bottom - 10);
    const lane = visibleLanes.sort((a, b) => Math.abs(a - playerY) - Math.abs(b - playerY))[0];
    const y = lane !== undefined
      ? Math.round(lane + offset * 0.15)
      : Math.round(Math.min(view.bottom - 30, Math.max(view.top + 30, playerY + offset)));
    const lines = this.config.barkLines;
    return {
      fromX,
      toX,
      y,
      direction,
      durationMs: (Math.abs(toX - fromX) / this.config.speed) * 1_000,
      bark: lines[Math.floor(this.random() * lines.length)] ?? lines[0] ?? 'Hau!',
    };
  }

  public isScheduled(): boolean { return this.scheduledAtMs !== null; }
}
