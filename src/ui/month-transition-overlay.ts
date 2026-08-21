import Phaser from 'phaser';
import type { CampaignMonthDefinition } from '../domain/campaign/campaign-types';

export class MonthTransitionOverlay {
  private readonly container: Phaser.GameObjects.Container;
  private readonly heading: Phaser.GameObjects.Text;
  private readonly message: Phaser.GameObjects.Text;
  private readonly month: Phaser.GameObjects.Text;
  private readonly monthName: Phaser.GameObjects.Text;
  private readonly button: Phaser.GameObjects.Rectangle;
  private onContinue: (() => void) | null = null;

  public constructor(scene: Phaser.Scene) {
    const backdrop = scene.add.rectangle(480, 270, 960, 540, 0x06090d, 0.95);
    const panel = scene.add.rectangle(480, 270, 650, 410, 0x111820, 0.99).setStrokeStyle(5, 0xffd166);
    this.heading = scene.add.text(480, 125, '', transitionStyle(30, '#ffd166')).setOrigin(0.5);
    this.message = scene.add.text(480, 190, '', transitionStyle(22, '#ffffff')).setOrigin(0.5);
    this.month = scene.add.text(480, 270, '', transitionStyle(34, '#8ecae6')).setOrigin(0.5);
    this.monthName = scene.add.text(480, 320, '', transitionStyle(19, '#f4a261')).setOrigin(0.5);
    this.button = scene.add
      .rectangle(480, 405, 300, 56, 0xd35400)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true });
    const buttonText = scene.add
      .text(480, 405, '[E] DALEJ — WRÓĆ DO MIESZKANIA', transitionStyle(15, '#ffffff'))
      .setOrigin(0.5);

    this.container = scene.add
      .container(0, 0, [backdrop, panel, this.heading, this.message, this.month, this.monthName, this.button, buttonText])
      .setScrollFactor(0)
      .setDepth(210_000)
      .setVisible(false);
    this.button.on('pointerdown', () => this.onContinue?.());
  }

  public show(month: CampaignMonthDefinition, completedDays: number, onContinue: () => void): void {
    this.heading.setText(month.transition?.heading ?? `${completedDays} DNI ZA TOBĄ`);
    this.message.setText(month.transition?.message ?? 'L4 PRZEDŁUŻONE');
    this.month.setText(`MIESIĄC ${month.id}`);
    this.monthName.setText(month.name);
    this.onContinue = onContinue;
    this.container.setVisible(true);
  }

  public hide(): void {
    this.container.setVisible(false);
    this.onContinue = null;
  }

  public destroy(): void {
    this.container.destroy(true);
  }
}

function transitionStyle(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: 'Courier New, monospace',
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    color,
    stroke: '#06090d',
    strokeThickness: 4,
    align: 'center',
  };
}
