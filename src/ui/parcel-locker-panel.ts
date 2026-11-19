import Phaser from 'phaser';
import type { ParcelCodeChallenge } from '../systems/challenges/parcel-code-challenge';

const PANEL_X = 16;
const PANEL_Y = 132;
const WIDTH = 300;
const HEIGHT = 250;
/** Optional ChatGPT art for the locker front. */
export const PARCEL_PANEL_TEXTURE = 'mg-locker-panel';

/**
 * Small in-world overlay for the parcel locker. The estate stays live behind
 * it, so the player sees NPCs approaching while trying to remember the code.
 */
export class ParcelLockerPanel {
  private readonly container: Phaser.GameObjects.Container;
  private readonly smsBox: Phaser.GameObjects.Rectangle;
  private readonly smsText: Phaser.GameObjects.Text;
  private readonly smsCode: Phaser.GameObjects.Text;
  private readonly screenText: Phaser.GameObjects.Text;
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly helpText: Phaser.GameObjects.Text;

  public constructor(scene: Phaser.Scene) {
    const background = scene.add.rectangle(0, 0, WIDTH, HEIGHT, 0x0b0f14, 0.9).setOrigin(0).setStrokeStyle(2, 0xe9c46a, 0.9);
    const children: Phaser.GameObjects.GameObject[] = [background];
    if (scene.textures.exists(PARCEL_PANEL_TEXTURE)) {
      const art = scene.add.image(WIDTH / 2, HEIGHT / 2, PARCEL_PANEL_TEXTURE);
      art.setScale(Math.min(WIDTH / art.width, HEIGHT / art.height)).setAlpha(0.35);
      children.push(art);
    }
    const heading = scene.add.text(12, 9, 'AUTOMAT PACZKOWY', style(12, '#e9c46a'));
    this.smsBox = scene.add.rectangle(12, 32, WIDTH - 24, 70, 0x264653, 0.95).setOrigin(0).setStrokeStyle(1, 0x8ecae6, 0.8);
    this.smsText = scene.add.text(20, 37, '', style(11, '#f4f1de')).setLineSpacing(30);
    this.smsCode = scene.add.text(WIDTH / 2, 66, '', style(22, '#ffd166')).setOrigin(0.5);
    const screen = scene.add.rectangle(12, 112, WIDTH - 24, 44, 0x10261a, 1).setOrigin(0).setStrokeStyle(1, 0x90be6d, 0.8);
    this.screenText = scene.add.text(WIDTH / 2, 134, '', style(20, '#90be6d')).setOrigin(0.5);
    this.statusText = scene.add.text(12, 164, '', style(11, '#ffd166')).setWordWrapWidth(WIDTH - 24);
    this.helpText = scene.add.text(12, 196, '', style(10, '#8ecae6')).setWordWrapWidth(WIDTH - 24).setLineSpacing(2);
    children.push(heading, this.smsBox, this.smsText, this.smsCode, screen, this.screenText, this.statusText, this.helpText);
    this.container = scene.add.container(PANEL_X, PANEL_Y, children).setScrollFactor(0).setDepth(100_020).setVisible(false);
  }

  public show(): void { this.container.setVisible(true); }
  public hide(): void { this.container.setVisible(false); }

  public render(challenge: ParcelCodeChallenge, phoneRinging: boolean): void {
    const phase = challenge.getPhase();
    const seconds = Math.ceil(challenge.getRemainingMs() / 1000);
    const visibleCode = challenge.getVisibleCode();

    if (visibleCode) {
      this.smsBox.setVisible(true);
      this.smsText.setText(`SMS: Twój kod odbioru:\nZAPAMIĘTAJ! Znika za ${seconds} s`);
      this.smsCode.setText(visibleCode.split('').join(' '));
    } else {
      this.smsBox.setVisible(false);
      this.smsText.setText('');
      this.smsCode.setText('');
    }

    const length = challenge.getCodeLength();
    const entered = challenge.getEntered();
    this.screenText.setText(
      phase === 'done' ? 'OTWARTE ✓' : phase === 'wrong' ? 'BŁĘDNY KOD' : `${entered}${'_'.repeat(length - entered.length)}`.split('').join(' '),
    ).setColor(phase === 'wrong' ? '#ff8c69' : '#90be6d');

    this.statusText.setText(
      phase === 'reveal'
        ? 'Zapamiętaj kod. Zaraz zniknie z ekranu telefonu.'
        : phase === 'wrong'
          ? 'Zły kod. Automat ocenia. Stoisz na widoku!'
          : phase === 'done'
            ? 'Skrytka otwarta!'
            : phoneRinging
              ? 'Telefon dzwoni! Najpierw [1]/[2]/[3].'
              : 'Wpisz kod z pamięci. Stoisz na widoku!',
    );
    this.helpText.setText(
      phase === 'input'
        ? '[0-9] wpisz   [⌫] cofnij\n[Q] zerknij w SMS (kosztuje czas)\n[ESC] odejdź od automatu'
        : '[ESC] odejdź od automatu',
    );
  }

  public destroy(): void {
    this.container.destroy(true);
  }
}

function style(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: 'Courier New, monospace',
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    color,
    stroke: '#06090d',
    strokeThickness: 2,
  };
}
