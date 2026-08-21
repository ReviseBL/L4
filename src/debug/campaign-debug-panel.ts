import Phaser from 'phaser';
import type { CampaignMonthId } from '../domain/campaign/campaign-types';
import type { CompanySuspicionLevel } from '../domain/suspicion/suspicion-types';

export interface CampaignDebugStatus {
  month: CampaignMonthId;
  day: number;
  suspicion: number;
  companyLevel: CompanySuspicionLevel;
}

export interface CampaignDebugActions {
  getStatus: () => CampaignDebugStatus;
  setMonth: (month: CampaignMonthId) => void;
  setDay: (day: number) => void;
  setSuspicion: (value: number) => void;
  adjustSuspicion: (delta: number) => void;
  simulatePerfectMission: () => void;
  simulateThreeDetections: () => void;
  advanceToNextMonth: () => void;
}

export class CampaignDebugPanel {
  private readonly panelText: Phaser.GameObjects.Text;
  private readonly toggleKey: Phaser.Input.Keyboard.Key;
  private readonly shiftKey: Phaser.Input.Keyboard.Key;
  private readonly monthKeys: readonly Phaser.Input.Keyboard.Key[];
  private readonly previousDayKey: Phaser.Input.Keyboard.Key;
  private readonly nextDayKey: Phaser.Input.Keyboard.Key;
  private readonly suspicionDownKey: Phaser.Input.Keyboard.Key;
  private readonly suspicionUpKey: Phaser.Input.Keyboard.Key;
  private readonly suspicionResetKey: Phaser.Input.Keyboard.Key;
  private readonly perfectMissionKey: Phaser.Input.Keyboard.Key;
  private readonly detectionsKey: Phaser.Input.Keyboard.Key;
  private readonly nextMonthKey: Phaser.Input.Keyboard.Key;
  private visible = false;

  public constructor(
    scene: Phaser.Scene,
    private readonly actions: CampaignDebugActions,
  ) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is required for the campaign debug panel.');
    }

    this.panelText = scene.add
      .text(942, 145, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#8ecae6',
        backgroundColor: '#0b0f14ee',
        padding: { x: 10, y: 8 },
        align: 'left',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(100_020)
      .setVisible(false);
    this.toggleKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F4);
    this.shiftKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.monthKeys = [
      Phaser.Input.Keyboard.KeyCodes.ONE,
      Phaser.Input.Keyboard.KeyCodes.TWO,
      Phaser.Input.Keyboard.KeyCodes.THREE,
      Phaser.Input.Keyboard.KeyCodes.FOUR,
      Phaser.Input.Keyboard.KeyCodes.FIVE,
      Phaser.Input.Keyboard.KeyCodes.SIX,
    ].map((keyCode) => keyboard.addKey(keyCode));
    this.previousDayKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.OPEN_BRACKET);
    this.nextDayKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CLOSED_BRACKET);
    this.suspicionDownKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS);
    this.suspicionUpKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS);
    this.suspicionResetKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ZERO);
    this.perfectMissionKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U);
    this.detectionsKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    this.nextMonthKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
  }

  public update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.toggleKey)) {
      this.visible = !this.visible;
      this.panelText.setVisible(this.visible);
    }
    if (!this.visible) {
      return;
    }

    if (this.shiftKey.isDown) {
      this.monthKeys.forEach((key, index) => {
        if (Phaser.Input.Keyboard.JustDown(key)) {
          this.actions.setMonth((index + 1) as CampaignMonthId);
        }
      });
    }

    const dayStep = this.shiftKey.isDown ? 10 : 1;
    if (Phaser.Input.Keyboard.JustDown(this.previousDayKey)) {
      this.actions.setDay(this.actions.getStatus().day - dayStep);
    }
    if (Phaser.Input.Keyboard.JustDown(this.nextDayKey)) {
      this.actions.setDay(this.actions.getStatus().day + dayStep);
    }
    if (Phaser.Input.Keyboard.JustDown(this.suspicionDownKey)) {
      this.actions.adjustSuspicion(-10);
    }
    if (Phaser.Input.Keyboard.JustDown(this.suspicionUpKey)) {
      this.actions.adjustSuspicion(10);
    }
    if (Phaser.Input.Keyboard.JustDown(this.suspicionResetKey)) {
      this.actions.setSuspicion(0);
    }
    if (Phaser.Input.Keyboard.JustDown(this.perfectMissionKey)) {
      this.actions.simulatePerfectMission();
    }
    if (Phaser.Input.Keyboard.JustDown(this.detectionsKey)) {
      this.actions.simulateThreeDetections();
    }
    if (Phaser.Input.Keyboard.JustDown(this.nextMonthKey)) {
      this.actions.advanceToNextMonth();
    }

    this.refresh();
  }

  public destroy(): void {
    this.panelText.destroy();
    for (const key of [
      this.toggleKey,
      this.shiftKey,
      ...this.monthKeys,
      this.previousDayKey,
      this.nextDayKey,
      this.suspicionDownKey,
      this.suspicionUpKey,
      this.suspicionResetKey,
      this.perfectMissionKey,
      this.detectionsKey,
      this.nextMonthKey,
    ]) {
      key.destroy();
    }
  }

  private refresh(): void {
    const status = this.actions.getStatus();
    this.panelText.setText(
      [
        'F4 DEBUG KAMPANII',
        `MIESIĄC: ${status.month}  DZIEŃ: ${status.day}`,
        `PODEJRZLIWOŚĆ: ${Math.round(status.suspicion)}% ${status.companyLevel}`,
        'SHIFT+1..6 — miesiąc',
        '[ / ] — dzień (SHIFT: ±10)',
        '- / + — podejrzliwość ±10 | 0 — reset',
        'U — idealna misja | T — 3 wykrycia',
        'N — następny miesiąc',
      ].join('\n'),
    );
  }
}
