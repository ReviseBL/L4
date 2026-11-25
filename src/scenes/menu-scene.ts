import Phaser from 'phaser';
import { GAME_BRAND } from '../data/branding/brand-config';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/game-config';
import { DebugStateService } from '../services/debug-state-service';
import { SaveGameService } from '../services/save-game-service';
import { resolveTitleFlowScene, type TitleFlowAction } from '../systems/title-flow-system';
import {
  BRAND_DISPLAY_FONT,
  createTitleLogoLockup,
  createTitleTagline,
} from '../ui/title-logo-lockup';
import { createTitlePresentation } from '../ui/title-presentation';

export class MenuScene extends Phaser.Scene {
  private readonly saveGameService = new SaveGameService(window.localStorage);
  private readonly debugStateService = new DebugStateService(window.localStorage);
  private confirmationVisible = false;
  private confirmationContainer: Phaser.GameObjects.Container | null = null;
  private creditsContainer: Phaser.GameObjects.Container | null = null;
  private primaryAction: TitleFlowAction = 'new-game';

  public constructor() {
    super('MenuScene');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#060708');
    createTitlePresentation(this);
    this.createBranding();

    const unreadableSave = this.saveGameService.hasUnreadableSave();
    const hasSave = this.saveGameService.hasSave();
    const snapshot = hasSave ? this.saveGameService.loadGame().getSnapshot() : null;
    const campaignCompleted = snapshot?.finale.campaignCompleted ?? false;

    if (campaignCompleted) {
      this.add
        .text(
          72,
          252,
          `CAMPAIGN COMPLETE\nRANK: ${snapshot?.finale.finalRank ?? '-'}   L4 SCORE: ${(snapshot?.finale.finalScore ?? 0).toLocaleString('pl-PL')}`,
          menuTextStyle(14, '#d4d0c6'),
        )
        .setLineSpacing(5);
      this.primaryAction = 'new-game';
      this.createButton(72, 335, 'NEW GAME', () => this.requestNewGame(), true);
      this.createButton(72, 405, 'CREDITS', () => this.showCredits());
    } else if (hasSave) {
      this.primaryAction = 'continue';
      this.createButton(72, 298, 'CONTINUE', () => this.startFlow('continue'), true);
      this.createButton(72, 368, 'NEW GAME', () => this.requestNewGame());
      this.createButton(72, 438, 'CREDITS', () => this.showCredits());
    } else {
      this.primaryAction = 'new-game';
      this.createButton(72, 330, 'NEW GAME', () => this.startNewGame(), true);
      this.createButton(72, 400, 'CREDITS', () => this.showCredits());
    }

    if (unreadableSave) {
      this.add
        .text(
          72,
          475,
          'SAVE INCOMPATIBLE — SAFE NEW GAME STATE LOADED',
          menuTextStyle(10, '#ef4055'),
        );
    }

    this.add.text(72, GAME_HEIGHT - 34, 'ENTER — SELECT', menuTextStyle(10, '#707176'));
    this.add
      .text(GAME_WIDTH - 28, GAME_HEIGHT - 34, 'A NOIR COMEDY ABOUT INFRASTRUCTURE', menuTextStyle(9, '#707176'))
      .setOrigin(1, 0);

    this.input.keyboard?.on('keydown-ENTER', this.handleEnter, this);
    this.input.keyboard?.on('keydown-ESC', this.handleEscape, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
  }

  private createBranding(): void {
    createTitleLogoLockup(this, 70, 36);
    createTitleTagline(this, 73, 228, GAME_BRAND.tagline);
  }

  private startFlow(action: TitleFlowAction): void {
    this.debugStateService.clearActive();
    this.scene.start(resolveTitleFlowScene(action));
  }

  private startNewGame(): void {
    this.saveGameService.resetGame();
    this.startFlow('new-game');
  }

  private requestNewGame(): void {
    if (this.confirmationVisible) return;
    if (!this.saveGameService.hasSave()) {
      this.startNewGame();
      return;
    }

    this.confirmationVisible = true;
    const backdrop = this.add.rectangle(480, 270, 960, 540, 0x030405, 0.9).setInteractive();
    const panel = this.add.rectangle(480, 270, 590, 245, 0x0c0e11, 0.99).setStrokeStyle(3, 0xdf293f);
    const prompt = this.add
      .text(480, 218, 'START A NEW L4?\nCURRENT CAMPAIGN PROGRESS WILL BE RESET.', menuTextStyle(19, '#f2efe8'))
      .setOrigin(0.5)
      .setAlign('center');
    const yes = this.createModalButton(400, 325, 'YES', () => this.startNewGame());
    const no = this.createModalButton(560, 325, 'BACK', () => this.hideConfirmation());
    this.confirmationContainer = this.add
      .container(0, 0, [backdrop, panel, prompt, ...yes, ...no])
      .setDepth(200_000);
  }

  private showCredits(): void {
    if (this.creditsContainer) return;
    const backdrop = this.add.rectangle(480, 270, 960, 540, 0x030405, 0.93).setInteractive();
    const panel = this.add.rectangle(480, 270, 650, 360, 0x0c0e11, 0.99).setStrokeStyle(3, 0xdf293f);
    const title = this.add.text(480, 140, GAME_BRAND.title, titleStyle(30, '#f2efe8')).setOrigin(0.5);
    const tagline = this.add.text(480, 184, GAME_BRAND.tagline, creditStyle(16, '#c7c3ba')).setOrigin(0.5);
    const body = this.add
      .text(480, 270, 'GAMEPLAY BETA\n\nDESIGN, CODE & PLACEHOLDER ART\nIN DEVELOPMENT\n\nALL CHARACTERS AND EVENTS ARE FICTIONAL', menuTextStyle(15, '#dedbd2'))
      .setOrigin(0.5)
      .setAlign('center')
      .setLineSpacing(7);
    const back = this.createModalButton(480, 390, 'BACK', () => this.hideCredits());
    this.creditsContainer = this.add
      .container(0, 0, [backdrop, panel, title, tagline, body, ...back])
      .setDepth(200_000);
  }

  private hideConfirmation(): void {
    this.confirmationVisible = false;
    this.confirmationContainer?.destroy(true);
    this.confirmationContainer = null;
  }

  private hideCredits(): void {
    this.creditsContainer?.destroy(true);
    this.creditsContainer = null;
  }

  private handleEnter(): void {
    if (this.confirmationVisible || this.creditsContainer) return;
    if (this.primaryAction === 'new-game' && this.saveGameService.hasSave()) this.requestNewGame();
    else if (this.primaryAction === 'new-game') this.startNewGame();
    else this.startFlow('continue');
  }

  private handleEscape(): void {
    if (this.confirmationVisible) this.hideConfirmation();
    else if (this.creditsContainer) this.hideCredits();
  }

  private createButton(x: number, y: number, label: string, onClick: () => void, pulse = false): void {
    const hitArea = this.add
      .zone(x, y, 300, 42)
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    const marker = this.add
      .rectangle(x, y, 4, 28, 0xdf293f, pulse ? 1 : 0.14)
      .setOrigin(0, 0.5);
    const buttonLabel = this.add
      .text(x + 20, y, label, menuTextStyle(20, pulse ? '#f2efe8' : '#8d8e91'))
      .setOrigin(0, 0.5)
      .setLetterSpacing(1);
    const underline = this.add.rectangle(x + 20, y + 17, 178, 1, 0xdf293f, 0).setOrigin(0, 0.5);

    hitArea.on('pointerover', () => {
      marker.setFillStyle(0xdf293f);
      marker.setAlpha(1);
      buttonLabel.setColor('#f2efe8');
      buttonLabel.setX(x + 23);
      underline.setAlpha(0.34);
    });
    hitArea.on('pointerout', () => {
      marker.setAlpha(pulse ? 1 : 0.14);
      buttonLabel.setColor(pulse ? '#f2efe8' : '#8d8e91');
      buttonLabel.setX(x + 20);
      underline.setAlpha(0);
    });
    hitArea.on('pointerdown', onClick);

    if (pulse) {
      this.tweens.add({ targets: marker, alpha: { from: 0.55, to: 1 }, duration: 820, yoyo: true, repeat: -1 });
    }
  }

  private createModalButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ): [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Text] {
    const button = this.add
      .rectangle(x, y, 130, 46, 0x16191d)
      .setStrokeStyle(2, 0xdf293f)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, menuTextStyle(15, '#f2efe8')).setOrigin(0.5);
    button.on('pointerover', () => button.setFillStyle(0x2b2e33));
    button.on('pointerout', () => button.setFillStyle(0x16191d));
    button.on('pointerdown', onClick);
    return [button, text];
  }

  private handleShutdown(): void {
    this.input.keyboard?.off('keydown-ENTER', this.handleEnter, this);
    this.input.keyboard?.off('keydown-ESC', this.handleEscape, this);
    this.confirmationContainer = null;
    this.creditsContainer = null;
    this.confirmationVisible = false;
  }
}

function titleStyle(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: BRAND_DISPLAY_FONT,
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    color,
    stroke: '#030405',
    strokeThickness: 5,
  };
}

function menuTextStyle(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: BRAND_DISPLAY_FONT,
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    color,
    stroke: '#030405',
    strokeThickness: 3,
  };
}

function creditStyle(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: 'Georgia, Times New Roman, serif',
    fontSize: `${fontSize}px`,
    fontStyle: 'italic',
    color,
  };
}
