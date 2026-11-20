import Phaser from 'phaser';
import type { ServiceWait } from '../../systems/challenges/service-wait';
import { UI_FONT_FAMILY } from '../../ui/text-style';

const BAR_WIDTH = 70;

/** The vendor's speech bubble and a small progress bar above the counter. */
export class ServiceWaitView {
  private readonly bubble: Phaser.GameObjects.Text;
  private readonly bar: Phaser.GameObjects.Graphics;

  public constructor(scene: Phaser.Scene) {
    this.bubble = scene.add
      .text(0, 0, '', {
        fontFamily: UI_FONT_FAMILY,
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#1b1b1b',
        backgroundColor: '#fff3d6',
        padding: { x: 6, y: 3 },
        align: 'center',
        wordWrap: { width: 190 },
      })
      .setOrigin(0.5, 1)
      .setDepth(95_000)
      .setVisible(false);
    this.bar = scene.add.graphics().setDepth(95_001).setVisible(false);
  }

  public render(wait: ServiceWait, playerNear: boolean): void {
    const definition = wait.getDefinition();
    const { x, y } = definition.bubbleAt;
    this.bubble
      .setText(`${definition.vendorName}: „${wait.getCurrentLine()}”`)
      .setPosition(x, y)
      .setAlpha(playerNear || wait.isReady() ? 1 : 0.6)
      .setVisible(true);
    const barY = y + 6;
    this.bar.clear().setVisible(true);
    this.bar.fillStyle(0x1b1b1b, 0.85).fillRect(x - BAR_WIDTH / 2 - 1, barY - 1, BAR_WIDTH + 2, 7);
    this.bar.fillStyle(wait.isReady() ? 0x90be6d : 0xf4a261, 1).fillRect(x - BAR_WIDTH / 2, barY, BAR_WIDTH * wait.getProgress(), 5);
  }

  public hide(): void {
    this.bubble.setVisible(false);
    this.bar.clear().setVisible(false);
  }

  public destroy(): void {
    this.bubble.destroy();
    this.bar.destroy();
  }
}
