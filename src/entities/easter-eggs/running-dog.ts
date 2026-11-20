import Phaser from 'phaser';
import { DOG_SPRITE } from '../../data/easter-eggs/dog-config';
import type { DogRun } from '../../systems/easter-eggs/dog-cameo';
import { UI_FONT_FAMILY } from '../../ui/text-style';

const PLACEHOLDER_KEY = 'npc-pomeranian-placeholder';
const ANIM_KEY = 'pomeranian-run';

/** Draws the Pomeranian's dash with a "Hau hau!" bubble and a little yip. */
export class RunningDog {
  private sprite: Phaser.GameObjects.Sprite | null = null;
  private bubble: Phaser.GameObjects.Text | null = null;
  private tween: Phaser.Tweens.Tween | null = null;

  public constructor(private readonly scene: Phaser.Scene) {}

  public run(plan: DogRun): void {
    this.clear();
    const hasSheet = this.scene.textures.exists(DOG_SPRITE.key);
    if (hasSheet && !this.scene.anims.exists(ANIM_KEY)) {
      this.scene.anims.create({
        key: ANIM_KEY,
        frames: this.scene.anims.generateFrameNumbers(DOG_SPRITE.key, { start: 0, end: DOG_SPRITE.frames - 1 }),
        frameRate: DOG_SPRITE.frameRate,
        repeat: -1,
      });
    }
    const key = hasSheet ? DOG_SPRITE.key : ensurePlaceholder(this.scene);
    const sprite = this.scene.add.sprite(plan.fromX, plan.y, key).setOrigin(0.5, 1).setDepth(plan.y);
    const scale = DOG_SPRITE.displayHeight / sprite.height;
    sprite.setScale(scale).setFlipX(plan.direction === -1);
    if (hasSheet) sprite.play(ANIM_KEY);
    const bubble = this.scene.add
      .text(plan.fromX, plan.y - DOG_SPRITE.displayHeight - 6, plan.bark, {
        fontFamily: UI_FONT_FAMILY,
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#1b1b1b',
        backgroundColor: '#fff3d6',
        padding: { x: 5, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(95_000);
    this.sprite = sprite;
    this.bubble = bubble;
    this.tween = this.scene.tweens.add({
      targets: sprite,
      x: plan.toX,
      duration: plan.durationMs,
      onUpdate: () => {
        // A little hop in the stride even without the run-cycle frames.
        const hop = hasSheet ? 0 : Math.abs(Math.sin(sprite.x / 9)) * 3;
        sprite.setY(plan.y - hop);
        bubble.setPosition(Math.round(sprite.x), Math.round(plan.y - DOG_SPRITE.displayHeight - 6));
      },
      onComplete: () => this.clear(),
    });
    yip(this.scene);
    this.scene.time.delayedCall(Math.min(1_400, plan.durationMs / 2), () => yip(this.scene));
  }

  public clear(): void {
    this.tween?.stop();
    this.tween = null;
    this.sprite?.destroy();
    this.bubble?.destroy();
    this.sprite = null;
    this.bubble = null;
  }
}

/** Two short high "yip"s synthesised on the fly (the game has no audio files). */
function yip(scene: Phaser.Scene): void {
  const manager = scene.sound as Phaser.Sound.WebAudioSoundManager;
  const context = (manager as { context?: AudioContext }).context;
  if (!context || manager.mute) return;
  for (const offset of [0, 0.17]) {
    const start = context.currentTime + offset;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1_150, start);
    oscillator.frequency.exponentialRampToValueAtTime(520, start + 0.09);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.06, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.12);
  }
}

/** Fluffy cream blob with a tail, until the real sprite arrives. */
function ensurePlaceholder(scene: Phaser.Scene): string {
  if (scene.textures.exists(PLACEHOLDER_KEY)) return PLACEHOLDER_KEY;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x1b1b1b, 1).fillEllipse(15, 15, 26, 18).fillCircle(26, 9, 8).fillCircle(5, 8, 6);
  g.fillStyle(0xf3d9b1, 1).fillEllipse(15, 15, 23, 15).fillCircle(26, 9, 6.5);
  g.fillStyle(0xe8b97a, 1).fillCircle(5, 8, 4.5).fillTriangle(24, 2, 27, 6, 22, 6).fillTriangle(29, 2, 31, 6, 27, 6);
  g.fillStyle(0x1b1b1b, 1).fillCircle(31, 10, 1.3).fillCircle(28, 8, 1);
  g.fillStyle(0xf28fa2, 1).fillRect(29, 12, 2, 2);
  g.fillStyle(0xfaf3e6, 1).fillRect(9, 21, 3, 3).fillRect(20, 21, 3, 3);
  g.generateTexture(PLACEHOLDER_KEY, 34, 25);
  g.destroy();
  return PLACEHOLDER_KEY;
}
