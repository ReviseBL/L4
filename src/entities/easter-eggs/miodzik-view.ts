import Phaser from 'phaser';
import { DOG_SPRITE, MIODZIK_SPRITE, type MiodzikSpot } from '../../data/easter-eggs/dog-config';
import type { MiodzikFrame, MiodzikPose } from '../../systems/easter-eggs/miodzik';
import { UI_FONT_FAMILY } from '../../ui/text-style';

const PUDDLE_MS = 9_000;
const ANIM_FRAME_MS = 450;
const BUBBLE_MS = 1_800;

/** Miodzik by his bench: pose frames, name tag, bark bubble (text only, the game is silent) and short-lived puddles. */
export class MiodzikView {
  private sprite: Phaser.GameObjects.Sprite | null = null;
  private label: Phaser.GameObjects.Text | null = null;
  private bubble: Phaser.GameObjects.Text | null = null;
  private bubbleUntilMs = 0;
  private readonly puddles: { shape: Phaser.GameObjects.Ellipse; bornMs: number }[] = [];
  private spot: MiodzikSpot | null = null;
  private clockMs = 0;

  public constructor(private readonly scene: Phaser.Scene) {}

  public show(spot: MiodzikSpot | null): void {
    this.clear();
    this.spot = spot;
    if (!spot) return;
    const key = this.scene.textures.exists(MIODZIK_SPRITE.key) ? MIODZIK_SPRITE.key : DOG_SPRITE.key;
    if (!this.scene.textures.exists(key)) return;
    this.sprite = this.scene.add.sprite(spot.x, spot.y, key, 0).setOrigin(0.5, 1).setDepth(spot.y).setFlipX(!spot.facingRight);
    this.label = this.scene.add
      .text(spot.x, spot.y + 8, 'MIODZIK', {
        fontFamily: UI_FONT_FAMILY,
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#ffe8b0',
        stroke: '#1a1d21',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(spot.y + 1);
    this.bubble = this.scene.add
      .text(spot.x, spot.y - 47, '', {
        fontFamily: UI_FONT_FAMILY,
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#1b1b1b',
        backgroundColor: '#fff3d6',
        padding: { x: 5, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(95_000)
      .setVisible(false);
  }

  public update(deltaMs: number, frame: MiodzikFrame): void {
    this.clockMs += deltaMs;
    for (let index = this.puddles.length - 1; index >= 0; index -= 1) {
      const puddle = this.puddles[index]!;
      const age = this.clockMs - puddle.bornMs;
      if (age >= PUDDLE_MS) {
        puddle.shape.destroy();
        this.puddles.splice(index, 1);
      } else {
        puddle.shape.setAlpha(0.55 * (1 - age / PUDDLE_MS));
      }
    }
    if (!this.sprite || !this.spot) return;
    this.sprite.setFrame(this.frameFor(frame.pose));
    if (frame.puddle) {
      const shape = this.scene.add.ellipse(this.spot.puddle.x, this.spot.puddle.y - 1, 12, 5, 0xe9d46a, 0.55).setDepth(3);
      this.puddles.push({ shape, bornMs: this.clockMs });
    }
    if (frame.bark && this.bubble) {
      this.bubble.setText(frame.bark).setVisible(true);
      this.bubbleUntilMs = this.clockMs + BUBBLE_MS;
    }
    if (this.bubble && this.clockMs > this.bubbleUntilMs) this.bubble.setVisible(false);
  }

  public clear(): void {
    this.sprite?.destroy();
    this.label?.destroy();
    this.bubble?.destroy();
    for (const puddle of this.puddles) puddle.shape.destroy();
    this.puddles.length = 0;
    this.sprite = null;
    this.label = null;
    this.bubble = null;
    this.spot = null;
  }

  /** Two frames per pose, alternating slowly; the run sheet's first frame as a stand-in. */
  private frameFor(pose: MiodzikPose): number {
    if (!this.sprite || this.sprite.texture.key !== MIODZIK_SPRITE.key) return 0;
    const frames = MIODZIK_SPRITE.frames[pose];
    return frames[Math.floor(this.clockMs / ANIM_FRAME_MS) % frames.length] ?? frames[0];
  }
}
