import Phaser from 'phaser';
import type { CampaignMonthId } from '../domain/campaign/campaign-types';
import type { CompanySuspicionLevel } from '../domain/suspicion/suspicion-types';
import { UI_FONT_FAMILY } from './text-style';

/** Kompaktowy HUD: lewy górny róg, ~370×50 px zamiast 610×154, żeby nie zasłaniać mapy. */
const PANEL_X = 10;
const PANEL_Y = 10;
const PANEL_WIDTH = 372;
const PANEL_PADDING = 8;
const SUSPICION_BAR_WIDTH = 96;
const SUSPICION_BAR_HEIGHT = 8;

export class GameHud {
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly dayText: Phaser.GameObjects.Text;
  private readonly suspicionText: Phaser.GameObjects.Text;
  private readonly suspicionBarFill: Phaser.GameObjects.Rectangle;
  private readonly companyStatusText: Phaser.GameObjects.Text;
  private readonly objectiveText: Phaser.GameObjects.Text;
  private readonly missionText: Phaser.GameObjects.Text;
  private readonly inventoryText: Phaser.GameObjects.Text;
  private readonly interactionText: Phaser.GameObjects.Text;
  private readonly messageText: Phaser.GameObjects.Text;
  private readonly alertText: Phaser.GameObjects.Text;
  private readonly hiddenText: Phaser.GameObjects.Text;
  private readonly managerNearbyText: Phaser.GameObjects.Text;
  private messageTimer: Phaser.Time.TimerEvent | null = null;
  private alertTimer: Phaser.Time.TimerEvent | null = null;
  private dialogueActive = false;

  public constructor(private readonly scene: Phaser.Scene) {
    const left = PANEL_X + PANEL_PADDING;
    const right = PANEL_X + PANEL_WIDTH - PANEL_PADDING;
    const fixed = <T extends Phaser.GameObjects.Components.ScrollFactor & Phaser.GameObjects.Components.Depth>(
      object: T,
      depth = 100_001,
    ): T => object.setScrollFactor(0).setDepth(depth);

    this.panel = fixed(
      scene.add
        .rectangle(PANEL_X, PANEL_Y, PANEL_WIDTH, 48, 0x0b0f14, 0.78)
        .setOrigin(0)
        .setStrokeStyle(2, 0xf4a261, 0.9),
      100_000,
    );

    this.dayText = fixed(scene.add.text(left, PANEL_Y + 6, 'M1 · DZIEŃ 23', hudStyle(13, '#f4f1de')));
    this.suspicionText = fixed(
      scene.add.text(right, PANEL_Y + 6, '0%', hudStyle(13, '#8ecae6')).setOrigin(1, 0),
    );
    const barX = right - 34 - SUSPICION_BAR_WIDTH;
    fixed(
      scene.add
        .rectangle(barX, PANEL_Y + 10, SUSPICION_BAR_WIDTH, SUSPICION_BAR_HEIGHT, 0x22303a)
        .setOrigin(0)
        .setStrokeStyle(1, 0x8ecae6, 0.6),
    );
    this.suspicionBarFill = fixed(
      scene.add.rectangle(barX, PANEL_Y + 10, 0, SUSPICION_BAR_HEIGHT, 0x90be6d).setOrigin(0),
      100_002,
    );
    fixed(scene.add.text(barX - 6, PANEL_Y + 7, 'PODEJRZ.', hudStyle(11, '#8ecae6')).setOrigin(1, 0));

    this.missionText = fixed(scene.add.text(left, PANEL_Y + 22, '', hudStyle(11, '#f4a261')));
    this.objectiveText = fixed(
      scene.add
        .text(left, PANEL_Y + 34, '', hudStyle(12, '#ffd166'))
        .setWordWrapWidth(PANEL_WIDTH - PANEL_PADDING * 2, true),
    );
    this.inventoryText = fixed(scene.add.text(left, PANEL_Y + 48, '', hudStyle(11, '#8ecae6')));

    this.companyStatusText = fixed(
      scene.add
        .text(950, 100, 'FIRMA: NORMAL', hudStyle(12, '#90be6d'))
        .setOrigin(1, 0)
        .setPadding(6, 4)
        .setBackgroundColor('#0b0f14cc'),
    );

    this.interactionText = fixed(
      scene.add
        .text(480, 512, '', hudStyle(14, '#ffffff'))
        .setOrigin(0.5)
        .setPadding(10, 5)
        .setBackgroundColor('#111820cc'),
    );

    this.messageText = fixed(
      scene.add
        .text(480, 440, '', hudStyle(13, '#f4f1de'))
        .setOrigin(0.5)
        .setPadding(10, 6)
        .setBackgroundColor('#264653e6')
        .setVisible(false),
    );

    this.alertText = fixed(
      scene.add
        .text(480, 96, '', hudStyle(16, '#ffffff'))
        .setOrigin(0.5)
        .setPadding(12, 7)
        .setBackgroundColor('#b00020e6')
        .setVisible(false),
      100_005,
    );

    this.hiddenText = fixed(
      scene.add
        .text(950, 74, 'STATUS: UKRYTY', hudStyle(12, '#8ecae6'))
        .setOrigin(1, 0)
        .setPadding(6, 4)
        .setBackgroundColor('#0b0f14cc')
        .setVisible(false),
    );

    this.managerNearbyText = fixed(
      scene.add
        .text(950, 126, 'KIEROWNIK W POBLIŻU', hudStyle(12, '#ffb703'))
        .setOrigin(1, 0)
        .setPadding(6, 4)
        .setBackgroundColor('#0b0f14cc')
        .setVisible(false),
    );
  }

  public update(
    month: CampaignMonthId,
    day: number,
    suspicion: number,
    companyLevel: CompanySuspicionLevel,
    missionTitle: string,
    objective: string,
    inventory: string,
    interactionPrompt: string | null,
    isHidden: boolean,
  ): void {
    const suspicionPercent = Phaser.Math.Clamp(Math.round(suspicion), 0, 100);
    this.dayText.setText(`M${month} · DZIEŃ L4: ${day}`);
    this.suspicionText.setText(`${suspicionPercent}%`).setColor(levelColor(companyLevel));
    this.suspicionBarFill
      .setSize((SUSPICION_BAR_WIDTH * suspicionPercent) / 100, SUSPICION_BAR_HEIGHT)
      .setFillStyle(Phaser.Display.Color.HexStringToColor(levelColor(companyLevel)).color);
    this.companyStatusText
      .setText(`FIRMA: ${companyLevel}`)
      .setColor(levelColor(companyLevel))
      .setVisible(companyLevel !== 'NORMAL');
    this.missionText.setText(`MISJA: ${missionTitle}`);
    this.objectiveText.setText(`CEL: ${objective}`);

    // Ekwipunek tylko, gdy coś jest niesione; panel dopasowuje wysokość do treści.
    const showInventory = inventory.trim() !== '' && inventory.trim().toUpperCase() !== 'PUSTO';
    const inventoryY = this.objectiveText.y + this.objectiveText.height + 2;
    this.inventoryText
      .setText(showInventory ? `NIESIESZ: ${inventory}` : '')
      .setY(inventoryY)
      .setVisible(showInventory);
    const contentBottom = showInventory ? inventoryY + this.inventoryText.height : inventoryY;
    this.panel.setSize(PANEL_WIDTH, contentBottom - PANEL_Y + PANEL_PADDING - 2);

    this.interactionText.setText(interactionPrompt ?? '').setVisible(interactionPrompt !== null);
    this.hiddenText.setVisible(isHidden);
  }

  public showAlert(message: string): void {
    this.alertTimer?.remove(false);
    this.alertText.setText(message).setVisible(true);
    this.camerasFlash();
    this.alertTimer = this.scene.time.delayedCall(2_400, () => {
      this.alertText.setVisible(false);
      this.alertTimer = null;
    });
  }

  public showMessage(message: string): void {
    this.messageTimer?.remove(false);
    this.messageText.setText(message).setVisible(!this.dialogueActive);
    this.messageTimer = this.scene.time.delayedCall(2300, () => {
      this.messageText.setVisible(false);
      this.messageTimer = null;
    });
  }

  public setDialogueActive(active: boolean): void {
    this.dialogueActive = active;
    if (active) this.messageText.setVisible(false);
  }

  public setManagerNearby(nearby: boolean): void {
    this.managerNearbyText.setVisible(nearby);
  }

  public destroy(): void {
    this.messageTimer?.remove(false);
    this.messageTimer = null;
    this.alertTimer?.remove(false);
    this.alertTimer = null;
  }

  private camerasFlash(): void {
    this.scene.cameras.main.flash(140, 180, 0, 32, false);
  }
}

function levelColor(level: CompanySuspicionLevel): string {
  switch (level) {
    case 'NORMAL':
      return '#90be6d';
    case 'SUSPICIOUS':
      return '#ffd166';
    case 'HIGH_ALERT':
      return '#f4a261';
    case 'CRITICAL':
      return '#ff595e';
  }
}

function hudStyle(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: UI_FONT_FAMILY,
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    color,
    stroke: '#0b0f14',
    strokeThickness: 2,
  };
}
