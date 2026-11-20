import Phaser from 'phaser';
import type { PrintJobDefinition } from '../../domain/printing/print-job-types';
import { UI_FONT_FAMILY } from '../../ui/text-style';

export class Printer3DView {
  private readonly glow: Phaser.GameObjects.Rectangle;
  private readonly printHead: Phaser.GameObjects.Rectangle;
  private readonly statusText: Phaser.GameObjects.Text;
  private printHeadTween: Phaser.Tweens.Tween | null = null;
  private glowTween: Phaser.Tweens.Tween | null = null;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly x: number,
    private readonly y: number,
  ) {
    this.glow = scene.add
      .rectangle(x, y, 62, 37, 0x00f5d4, 0.08)
      .setDepth(Math.round(y + 2));
    this.printHead = scene.add
      .rectangle(x - 18, y - 4, 12, 8, 0xffd166)
      .setDepth(Math.round(y + 3))
      .setVisible(false);
    this.statusText = scene.add
      .text(x, y + 36, '', {
        fontFamily: UI_FONT_FAMILY,
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#00f5d4',
        stroke: '#111820',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(Math.round(y + 4));
  }

  public startPrinting(job: PrintJobDefinition): void {
    this.printHeadTween?.stop();
    this.glowTween?.stop();
    this.printHead.setPosition(this.x - 18, this.y - 4).setVisible(true);
    this.statusText.setText(`DRUK: ${job.displayName}\nCZAS DRUKU: ${job.durationLabel}`);

    this.printHeadTween = this.scene.tweens.add({
      targets: this.printHead,
      x: this.x + 18,
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.glowTween = this.scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.12, to: 0.55 },
      duration: 420,
      yoyo: true,
      repeat: -1,
    });
  }

  public completePrinting(job: PrintJobDefinition): void {
    this.printHeadTween?.stop();
    this.glowTween?.stop();
    this.printHeadTween = null;
    this.glowTween = null;
    this.printHead.setVisible(false);
    this.glow.setAlpha(0.08);
    this.statusText.setText(`GOTOWE: ${job.displayName}`);
  }

  public reset(): void {
    this.printHeadTween?.stop();
    this.glowTween?.stop();
    this.printHeadTween = null;
    this.glowTween = null;
    this.printHead.setVisible(false);
    this.glow.setAlpha(0.08);
    this.statusText.setText('');
  }

  public destroy(): void {
    this.printHeadTween?.stop();
    this.glowTween?.stop();
    this.glow.destroy();
    this.printHead.destroy();
    this.statusText.destroy();
  }
}
