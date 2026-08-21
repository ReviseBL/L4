import Phaser from 'phaser';
import type { PhoneSnapshot } from '../domain/phone/phone-types';

export class PhoneHud {
  private readonly icon: Phaser.GameObjects.Text;
  private readonly panel: Phaser.GameObjects.Container;
  private readonly heading: Phaser.GameObjects.Text;
  private readonly caller: Phaser.GameObjects.Text;
  private readonly body: Phaser.GameObjects.Text;
  private readonly controls: Phaser.GameObjects.Text;
  private lastState: PhoneSnapshot['state'] | null = null;
  private vibrationTween: Phaser.Tweens.Tween | null = null;

  public constructor(private readonly scene: Phaser.Scene) {
    this.icon = scene.add
      .text(930, 20, '📱', phoneStyle(24, '#f4f1de'))
      .setOrigin(1, 0)
      .setPadding(8, 5)
      .setBackgroundColor('#0b0f14dd')
      .setScrollFactor(0)
      .setDepth(100_010)
      .setVisible(false);

    const background = scene.add
      .rectangle(0, 0, 320, 230, 0x111820, 0.95)
      .setOrigin(0)
      .setStrokeStyle(4, 0x8ecae6);
    this.heading = scene.add.text(16, 14, 'TELEFON SŁUŻBOWY', phoneStyle(17, '#8ecae6'));
    this.caller = scene.add.text(16, 48, '', phoneStyle(17, '#ffd166'));
    this.body = scene.add
      .text(16, 82, '', phoneStyle(12, '#f4f1de'))
      .setWordWrapWidth(288)
      .setLineSpacing(5);
    this.controls = scene.add
      .text(16, 160, '', phoneStyle(13, '#ffffff'))
      .setLineSpacing(6);
    this.panel = scene.add
      .container(620, 120, [background, this.heading, this.caller, this.body, this.controls])
      .setScrollFactor(0)
      .setDepth(100_009)
      .setVisible(false);
  }

  public update(snapshot: PhoneSnapshot): void {
    this.icon.setVisible(snapshot.unlocked && snapshot.enabled);
    this.icon.setText(snapshot.state === 'RINGING' ? '📞' : '📱');

    if (this.lastState !== snapshot.state) {
      this.handleStateChanged(snapshot);
      this.lastState = snapshot.state;
    }

    if (snapshot.state === 'RINGING' && snapshot.activeCall) {
      this.panel.setVisible(true);
      this.caller.setText('KIEROWNIK DZWONI...');
      this.body.setText(
        snapshot.activeCall.tutorial
          ? `Pierwsze połączenie — wybierz reakcję.\nDZWONI: ${formatSeconds(snapshot.stateRemainingMs)}`
          : `DZWONI: ${formatSeconds(snapshot.stateRemainingMs)}`,
      );
      this.controls.setText(
        [
          '[1] ODBIERZ',
          '[2] ODRZUĆ',
          snapshot.airplaneModeAvailable
            ? '[3] TRYB SAMOLOTOWY'
            : '[3] TRYB SAMOLOTOWY — WYKORZYSTANY',
        ].join('\n'),
      );
      return;
    }

    if (snapshot.state === 'ANSWERED' && snapshot.activeCall) {
      this.panel.setVisible(false);
      return;
    }

    if (snapshot.state === 'AIRPLANE_MODE') {
      this.panel.setVisible(true);
      this.caller.setText('TRYB SAMOLOTOWY');
      this.body.setText(`${formatSeconds(snapshot.stateRemainingMs)}\nNowe połączenia są blokowane.`);
      this.controls.setText('TRYB SAMOLOTOWY — WYKORZYSTANY');
      return;
    }

    this.panel.setVisible(false);
  }

  public destroy(): void {
    this.vibrationTween?.stop();
    this.vibrationTween = null;
    this.icon.destroy();
    this.panel.destroy(true);
  }

  private handleStateChanged(snapshot: PhoneSnapshot): void {
    this.vibrationTween?.stop();
    this.vibrationTween = null;
    this.icon.setX(930);
    if (snapshot.state === 'RINGING') {
      this.vibrationTween = this.scene.tweens.add({
        targets: this.icon,
        x: { from: 925, to: 935 },
        duration: 70,
        yoyo: true,
        repeat: -1,
      });
    }
  }
}

function formatSeconds(milliseconds: number): string {
  return `${Math.max(0, Math.ceil(milliseconds / 1_000))} SEK.`;
}

function phoneStyle(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: 'Courier New, monospace',
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    color,
    stroke: '#06090d',
    strokeThickness: 3,
  };
}
