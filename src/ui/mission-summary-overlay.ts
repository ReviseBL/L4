import Phaser from 'phaser';
import type { MissionCompletionSummary } from '../domain/missions/mission-types';

export class MissionSummaryOverlay {
  private readonly container: Phaser.GameObjects.Container;
  private readonly titleText: Phaser.GameObjects.Text;
  /** Left column: time, detections, phone. */
  private readonly statsText: Phaser.GameObjects.Text;
  /** Right column: suspicion and days. */
  private readonly suspicionText: Phaser.GameObjects.Text;
  private readonly stealthText: Phaser.GameObjects.Text;
  private readonly button: Phaser.GameObjects.Rectangle;
  private readonly buttonText: Phaser.GameObjects.Text;
  private onContinue: (() => void) | null = null;

  public constructor(scene: Phaser.Scene) {
    const backdrop = scene.add.rectangle(480, 270, 960, 540, 0x06090d, 0.88);
    const panel = scene.add.rectangle(480, 270, 700, 470, 0x111820, 0.98).setStrokeStyle(5, 0xffd166);
    const heading = scene.add
      .text(480, 65, 'MISJA WYKONANA', summaryStyle(31, '#ffd166'))
      .setOrigin(0.5);
    this.titleText = scene.add.text(480, 112, '', summaryStyle(21, '#ffffff')).setOrigin(0.5);
    this.statsText = scene.add.text(170, 148, '', summaryStyle(15, '#8ecae6')).setLineSpacing(4);
    this.suspicionText = scene.add.text(470, 148, '', summaryStyle(15, '#8ecae6')).setLineSpacing(4);
    // Placed under the taller column in show(), so nothing overlaps.
    this.stealthText = scene.add
      .text(480, 330, '', summaryStyle(16, '#90be6d'))
      .setOrigin(0.5, 0)
      .setAlign('center')
      .setLineSpacing(4)
      .setWordWrapWidth(640);
    this.button = scene.add
      .rectangle(480, 470, 330, 54, 0xd35400)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.buttonText = scene.add
      .text(480, 470, '', summaryStyle(18, '#ffffff'))
      .setOrigin(0.5);

    this.container = scene.add
      .container(0, 0, [
        backdrop,
        panel,
        heading,
        this.titleText,
        this.statsText,
        this.suspicionText,
        this.stealthText,
        this.button,
        this.buttonText,
      ])
      .setScrollFactor(0)
      .setDepth(200_000)
      .setVisible(false);

    this.button.on('pointerover', () => this.button.setFillStyle(0xe76f51));
    this.button.on('pointerout', () => this.button.setFillStyle(0xd35400));
    this.button.on('pointerdown', () => this.onContinue?.());
  }

  public show(
    summary: MissionCompletionSummary,
    hasNextMission: boolean,
    onContinue: () => void,
    continueLabel?: string,
    notes: readonly string[] = [],
  ): void {
    this.titleText.setText(summary.title);
    this.statsText.setText(
      [
        `CZAS: ${formatDuration(summary.elapsedMs)}`,
        `WYKRYCIA: ${summary.detectionCount}`,
        ...(summary.phoneStats
          ? [
              '',
              'TELEFON:',
              `ODEBRANE: ${summary.phoneStats.callsAnswered}`,
              `NIEODEBRANE: ${summary.phoneStats.callsMissed}`,
              `ODRZUCONE: ${summary.phoneStats.callsDeclined}`,
            ]
          : []),
      ].join('\n'),
    );
    this.suspicionText.setText(
      [
        `PODEJRZLIWOŚĆ PRZED: ${Math.round(summary.suspicionBeforeMission)}%`,
        `ZDOBYTE W MISJI: ${formatSigned(summary.suspicionGained)}`,
        ...(summary.criticalSuspicionIncident
          ? [`PO INCYDENCIE: ${Math.round(summary.suspicionAfterMission)}%`]
          : [`PREMIA STEALTH: ${formatSigned(summary.stealthBonus)}`]),
        `PODEJRZLIWOŚĆ: ${Math.round(summary.suspicionBeforeMission)}% → ${Math.round(summary.suspicionAfterMission)}%`,
        '',
        `MINĘŁO: ${summary.daysPassed} DNI`,
        `DZIEŃ L4: ${summary.currentL4Day}`,
      ].join('\n'),
    );
    this.stealthText
      .setColor(summary.criticalSuspicionIncident ? '#ff6b6b' : '#90be6d')
      .setText(
        summary.criticalSuspicionIncident
          ? 'INCYDENT KRYTYCZNY\nPODEJRZLIWOŚĆ OSIĄGNĘŁA 100%\nFIRMA ŻĄDA WYJAŚNIEŃ'
          : [...summary.stealthMessage, ...notes].join('\n'),
      );
    const columnsBottom = Math.max(
      this.statsText.y + this.statsText.height,
      this.suspicionText.y + this.suspicionText.height,
    );
    this.stealthText.setY(columnsBottom + 22);
    this.buttonText.setText(
      continueLabel ?? (hasNextMission ? '[E] NASTĘPNA MISJA' : '[E] WRÓĆ DO MENU'),
    );
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

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatSigned(delta: number): string {
  const rounded = Math.round(delta);
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

function summaryStyle(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: 'Courier New, monospace',
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    color,
    stroke: '#06090d',
    strokeThickness: 4,
  };
}
