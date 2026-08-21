import Phaser from 'phaser';
import type { CampaignMonthId } from '../domain/campaign/campaign-types';
import type { CompanySuspicionLevel } from '../domain/suspicion/suspicion-types';

export class GameHud {
  private readonly dayText: Phaser.GameObjects.Text;
  private readonly suspicionText: Phaser.GameObjects.Text;
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
    const panel = scene.add
      .rectangle(18, 18, 610, 154, 0x0b0f14, 0.88)
      .setOrigin(0)
      .setStrokeStyle(3, 0xf4a261)
      .setScrollFactor(0)
      .setDepth(100_000);

    this.dayText = scene.add
      .text(panel.x + 18, panel.y + 14, 'DZIEŃ L4: 23', hudStyle(21, '#f4f1de'))
      .setScrollFactor(0)
      .setDepth(100_001);

    this.suspicionText = scene.add
      .text(panel.x + 285, panel.y + 14, 'PODEJRZLIWOŚĆ: 0%', hudStyle(19, '#8ecae6'))
      .setScrollFactor(0)
      .setDepth(100_001);

    this.companyStatusText = scene.add
      .text(942, 102, 'FIRMA: NORMAL', hudStyle(14, '#90be6d'))
      .setOrigin(1, 0)
      .setPadding(8, 6)
      .setBackgroundColor('#0b0f14dd')
      .setScrollFactor(0)
      .setDepth(100_001);

    this.missionText = scene.add
      .text(panel.x + 18, panel.y + 50, '', hudStyle(15, '#f4a261'))
      .setScrollFactor(0)
      .setDepth(100_001);

    this.objectiveText = scene.add
      .text(panel.x + 18, panel.y + 78, '', hudStyle(15, '#ffd166'))
      .setWordWrapWidth(570)
      .setScrollFactor(0)
      .setDepth(100_001);

    this.inventoryText = scene.add
      .text(panel.x + 18, panel.y + 122, '', hudStyle(13, '#8ecae6'))
      .setScrollFactor(0)
      .setDepth(100_001);

    this.interactionText = scene.add
      .text(480, 486, '', hudStyle(18, '#ffffff'))
      .setOrigin(0.5)
      .setPadding(14, 8)
      .setBackgroundColor('#111820dd')
      .setScrollFactor(0)
      .setDepth(100_001);

    this.messageText = scene.add
      .text(480, 350, '', hudStyle(16, '#f4f1de'))
      .setOrigin(0.5)
      .setPadding(16, 10)
      .setBackgroundColor('#264653ee')
      .setScrollFactor(0)
      .setDepth(100_001)
      .setVisible(false);

    this.alertText = scene.add
      .text(480, 165, '', hudStyle(24, '#ffffff'))
      .setOrigin(0.5)
      .setPadding(20, 13)
      .setBackgroundColor('#b00020ee')
      .setScrollFactor(0)
      .setDepth(100_005)
      .setVisible(false);

    this.hiddenText = scene.add
      .text(942, 62, 'STATUS: UKRYTY', hudStyle(15, '#8ecae6'))
      .setOrigin(1, 0)
      .setPadding(8, 6)
      .setBackgroundColor('#0b0f14dd')
      .setScrollFactor(0)
      .setDepth(100_001)
      .setVisible(false);

    this.managerNearbyText = scene.add
      .text(942, 142, 'KIEROWNIK W POBLIŻU', hudStyle(15, '#ffb703'))
      .setOrigin(1, 0)
      .setPadding(8, 6)
      .setBackgroundColor('#0b0f14dd')
      .setScrollFactor(0)
      .setDepth(100_001)
      .setVisible(false);
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
    this.dayText.setText(`MIESIĄC ${month} | DZIEŃ L4: ${day}`).setFontSize(18);
    this.suspicionText.setText(`PODEJRZLIWOŚĆ: ${Math.round(suspicion)}%`);
    this.companyStatusText
      .setText(`FIRMA: ${companyLevel}`)
      .setColor(levelColor(companyLevel))
      .setVisible(companyLevel !== 'NORMAL');
    this.missionText.setText(`MISJA: ${missionTitle}`);
    this.objectiveText.setText(`CEL: ${objective}`);
    this.inventoryText.setText(`EKWIPUNEK: ${inventory}`);
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
    fontFamily: 'Courier New, monospace',
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    color,
    stroke: '#0b0f14',
    strokeThickness: 3,
  };
}
