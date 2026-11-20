import type { RiverTrashConfig } from '../../data/world/river';

export interface FloatingTrash {
  key: string;
  x: number;
  y: number;
  speed: number;
  /** Phase for the bobbing / tilting animation. */
  phase: number;
}

/**
 * Decides when a piece of rubbish floats past and moves it downstream.
 * Pure logic with an injected RNG; the view only draws what it returns.
 */
export class RiverTrashDrift {
  private readonly items: FloatingTrash[] = [];
  private untilNextMs: number;

  public constructor(
    private readonly config: RiverTrashConfig,
    private readonly worldWidth: number,
    private readonly random: () => number,
  ) {
    this.untilNextMs = this.nextInterval();
    for (let index = 0; index < config.initialCount; index += 1) {
      this.items.push(this.makeItem(this.random() * worldWidth));
    }
  }

  public update(deltaMs: number): readonly FloatingTrash[] {
    const seconds = Math.max(0, deltaMs) / 1_000;
    for (const item of this.items) item.x += item.speed * seconds;
    for (let index = this.items.length - 1; index >= 0; index -= 1) {
      if ((this.items[index]?.x ?? 0) > this.worldWidth + 40) this.items.splice(index, 1);
    }
    this.untilNextMs -= deltaMs;
    if (this.untilNextMs <= 0) {
      this.items.push(this.makeItem(-30));
      this.untilNextMs = this.nextInterval();
    }
    return this.items;
  }

  public getItems(): readonly FloatingTrash[] { return this.items; }

  private makeItem(x: number): FloatingTrash {
    const { textureKeys, minSpeed, maxSpeed, laneTop, laneBottom } = this.config;
    return {
      key: textureKeys[Math.floor(this.random() * textureKeys.length)] ?? textureKeys[0] ?? '',
      x,
      y: Math.round(laneTop + this.random() * (laneBottom - laneTop)),
      speed: minSpeed + this.random() * (maxSpeed - minSpeed),
      phase: this.random() * Math.PI * 2,
    };
  }

  private nextInterval(): number {
    return this.config.minIntervalMs + this.random() * (this.config.maxIntervalMs - this.config.minIntervalMs);
  }
}
