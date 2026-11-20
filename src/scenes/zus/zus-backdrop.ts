import Phaser from 'phaser';

const DEPTH = -100;
const FADE_MS = 450;

/**
 * Full-screen noir board behind the ZUS finale. Bright for story beats,
 * darkened behind the examination panels so they stay readable.
 */
export class ZusBackdrop {
  private image: Phaser.GameObjects.Image | null = null;
  private readonly shade: Phaser.GameObjects.Rectangle;
  private currentKey: string | null = null;

  public constructor(private readonly scene: Phaser.Scene) {
    this.shade = scene.add.rectangle(480, 270, 960, 540, 0x05080c, 0).setDepth(DEPTH + 1);
  }

  /** Shows `key` (cross-fading from the previous board) with `dim` 0..1 of darkness over it. */
  public show(key: string, dim: number): void {
    this.scene.tweens.add({ targets: this.shade, fillAlpha: dim, duration: FADE_MS });
    if (key === this.currentKey || !this.scene.textures.exists(key)) return;
    const previous = this.image;
    const image = this.scene.add.image(480, 270, key).setDepth(DEPTH).setAlpha(0);
    // Cover the 960×540 view, cropping whatever sticks out.
    const scale = Math.max(960 / image.width, 540 / image.height);
    image.setScale(scale);
    this.scene.tweens.add({ targets: image, alpha: 1, duration: FADE_MS, onComplete: () => previous?.destroy() });
    this.image = image;
    this.currentKey = key;
  }

  public destroy(): void {
    this.image?.destroy();
    this.shade.destroy();
  }
}
