import Phaser from 'phaser';

const WIDTH = 26;
const HEIGHT = 4;
const OFFSET_Y = -30;

/** Small breath bar over Herbi's head; only shown while it is not full. */
export class StaminaBar {
  private readonly graphics: Phaser.GameObjects.Graphics;

  public constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(95_500);
  }

  public update(x: number, y: number, level: number, exhausted: boolean): void {
    this.graphics.clear();
    if (level >= 0.999) return;
    const left = Math.round(x - WIDTH / 2);
    const top = Math.round(y + OFFSET_Y);
    this.graphics.fillStyle(0x111820, 0.85).fillRect(left - 1, top - 1, WIDTH + 2, HEIGHT + 2);
    const color = exhausted ? 0xe63946 : level < 0.35 ? 0xf4a261 : 0x90be6d;
    this.graphics.fillStyle(color, 1).fillRect(left, top, Math.round(WIDTH * level), HEIGHT);
  }

  public destroy(): void {
    this.graphics.destroy();
  }
}
