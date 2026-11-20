import Phaser from 'phaser';
import type { PhoneCaller, PhoneSnapshot } from '../domain/phone/phone-types';
import { UI_FONT_FAMILY } from './text-style';

/** Phone body in screen space (960×540): a smartphone on the right edge. */
const PHONE = { x: 772, y: 132, width: 172, height: 320, radius: 22 } as const;
const SCREEN = { x: PHONE.x + 9, y: PHONE.y + 26, width: PHONE.width - 18, height: PHONE.height - 46 } as const;
const CENTER_X = SCREEN.x + SCREEN.width / 2;
const AVATAR_Y = 46;
const HIDDEN_OFFSET_X = 210;
const DEPTH = 100_009;

const CALLERS: Readonly<Record<PhoneCaller, { name: string; role: string; initials: string; color: number }>> = {
  manager: { name: 'Kierownik', role: 'Szef zmiany · BoltTEK', initials: 'K', color: 0xe76f51 },
};

interface CallButton {
  circle: Phaser.GameObjects.Arc;
  icon: Phaser.GameObjects.Text;
  label: Phaser.GameObjects.Text;
}

/**
 * The work phone: slides in from the right while it rings (caller card,
 * countdown ring, answer / decline / airplane buttons on keys 1-3) and while
 * airplane mode is on. A small icon in the corner shows it is in the pocket.
 */
export class PhoneHud {
  private readonly icon: Phaser.GameObjects.Text;
  private readonly root: Phaser.GameObjects.Container;
  private readonly clock: Phaser.GameObjects.Text;
  private readonly avatar: Phaser.GameObjects.Arc;
  private readonly avatarText: Phaser.GameObjects.Text;
  private readonly title: Phaser.GameObjects.Text;
  private readonly subtitle: Phaser.GameObjects.Text;
  private readonly status: Phaser.GameObjects.Text;
  private readonly timer: Phaser.GameObjects.Graphics;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly noisePill: Phaser.GameObjects.Text;
  private readonly answer: CallButton;
  private readonly decline: CallButton;
  private readonly airplane: CallButton;
  private lastState: PhoneSnapshot['state'] | null = null;
  private vibrationTween: Phaser.Tweens.Tween | null = null;
  private slideTween: Phaser.Tweens.Tween | null = null;
  private shown = false;

  public constructor(private readonly scene: Phaser.Scene) {
    this.icon = scene.add
      .text(950, 14, '📱', textStyle(18, '#f4f1de'))
      .setOrigin(1, 0)
      .setPadding(6, 3)
      .setBackgroundColor('#0b0f14dd')
      .setScrollFactor(0)
      .setDepth(DEPTH + 1)
      .setVisible(false);

    const frame = scene.add.graphics();
    drawPhoneFrame(frame);
    this.clock = scene.add.text(SCREEN.x + 10, PHONE.y + 9, '09:41', textStyle(10, '#e9ecef')).setOrigin(0, 0);
    const statusIcons = scene.add.text(SCREEN.x + SCREEN.width - 10, PHONE.y + 9, '▂▄▆  5G  ▮▮▮▯', textStyle(9, '#e9ecef')).setOrigin(1, 0);

    this.avatar = scene.add.circle(CENTER_X, SCREEN.y + AVATAR_Y, 28, 0xe76f51).setStrokeStyle(3, 0xffffff, 0.85);
    this.avatarText = scene.add.text(CENTER_X, SCREEN.y + AVATAR_Y, 'K', textStyle(26, '#ffffff')).setOrigin(0.5);
    this.title = scene.add.text(CENTER_X, SCREEN.y + 86, '', textStyle(16, '#ffffff')).setOrigin(0.5, 0);
    this.subtitle = scene.add.text(CENTER_X, SCREEN.y + 106, '', textStyle(10, '#adb5bd')).setOrigin(0.5, 0);
    this.status = scene.add.text(CENTER_X, SCREEN.y + 123, '', textStyle(12, '#ffd166')).setOrigin(0.5, 0);
    this.timer = scene.add.graphics();
    this.hint = scene.add
      .text(CENTER_X, SCREEN.y + 143, '', textStyle(9, '#ced4da'))
      .setOrigin(0.5, 0)
      .setAlign('center')
      .setWordWrapWidth(SCREEN.width - 16);
    this.answer = makeButton(scene, CENTER_X - 52, '1', '📞', 0x2a9d8f, 'ODBIERZ');
    this.decline = makeButton(scene, CENTER_X, '2', '✕', 0xd62828, 'ODRZUĆ');
    this.airplane = makeButton(scene, CENTER_X + 52, '3', '✈', 0xf4a261, 'SAMOLOT');
    this.noisePill = scene.add
      .text(CENTER_X, SCREEN.y + SCREEN.height - 4, '', textStyle(9, '#0b0f14'))
      .setOrigin(0.5, 1)
      .setAlign('center')
      .setPadding(6, 2)
      .setWordWrapWidth(SCREEN.width - 20);

    this.root = scene.add
      .container(HIDDEN_OFFSET_X, 0, [
        frame, this.clock, statusIcons, this.avatar, this.avatarText, this.title, this.subtitle, this.status,
        this.timer, this.hint, ...buttonParts(this.answer), ...buttonParts(this.decline), ...buttonParts(this.airplane),
        this.noisePill,
      ])
      .setScrollFactor(0)
      .setDepth(DEPTH)
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
      const caller = CALLERS[snapshot.activeCall.caller];
      this.setShown(true);
      this.showCaller(caller.initials, caller.color);
      this.title.setText(caller.name);
      this.subtitle.setText(caller.role);
      this.status.setText(`dzwoni… ${Math.max(0, Math.ceil(snapshot.stateRemainingMs / 1_000))} s`).setColor('#ffd166');
      const totalMs = Math.max(1, snapshot.activeCall.ringDuration * 1_000);
      this.drawTimer(snapshot.stateRemainingMs / totalMs, 0xffd166);
      this.hint.setText(snapshot.activeCall.tutorial ? 'Pierwsze połączenie — wybierz reakcję klawiszem 1-3.' : '');
      this.setButtons(true, snapshot.airplaneModeAvailable);
      return;
    }

    if (snapshot.state === 'AIRPLANE_MODE') {
      this.setShown(true);
      this.showCaller('✈', 0xf4a261);
      this.title.setText('Tryb samolotowy');
      this.subtitle.setText('Nikt się nie dodzwoni');
      this.status.setText(`${Math.max(0, Math.ceil(snapshot.stateRemainingMs / 1_000))} s`).setColor('#f4a261');
      this.drawTimer(null, 0xf4a261);
      this.hint.setText('Nowe połączenia są blokowane.\nRaz na misję.');
      this.setButtons(false, false);
      return;
    }

    this.setShown(false);
  }

  /** Background noise hint while ringing: answer only where it is quiet. */
  public setBackgroundNoise(label: string | null, loud: boolean): void {
    this.noisePill
      .setText(label ? `TŁO: ${label}` : '')
      .setBackgroundColor(loud ? '#ff8c69' : '#90be6d')
      .setVisible(label !== null);
  }

  public destroy(): void {
    this.vibrationTween?.stop();
    this.slideTween?.stop();
    this.vibrationTween = null;
    this.slideTween = null;
    this.icon.destroy();
    this.root.destroy(true);
  }

  private showCaller(initials: string, color: number): void {
    this.avatar.setFillStyle(color);
    this.avatarText.setText(initials);
  }

  private drawTimer(fraction: number | null, color: number): void {
    this.timer.clear();
    if (fraction === null) return;
    const clamped = Math.max(0, Math.min(1, fraction));
    const start = -Math.PI / 2;
    this.timer.lineStyle(4, 0xffffff, 0.15).strokeCircle(CENTER_X, SCREEN.y + AVATAR_Y, 36);
    this.timer.lineStyle(4, color, 1).beginPath()
      .arc(CENTER_X, SCREEN.y + AVATAR_Y, 36, start, start + Math.PI * 2 * clamped, false)
      .strokePath();
  }

  private setButtons(visible: boolean, airplaneAvailable: boolean): void {
    for (const button of [this.answer, this.decline, this.airplane]) {
      for (const part of buttonParts(button)) part.setVisible(visible);
    }
    const alpha = airplaneAvailable ? 1 : 0.3;
    this.airplane.circle.setAlpha(alpha);
    this.airplane.icon.setAlpha(alpha);
    this.airplane.label.setAlpha(alpha).setText(airplaneAvailable ? '3 · SAMOLOT' : '3 · ZUŻYTY');
  }

  private setShown(shown: boolean): void {
    if (this.shown === shown) return;
    this.shown = shown;
    this.slideTween?.stop();
    if (shown) this.root.setVisible(true);
    this.slideTween = this.scene.tweens.add({
      targets: this.root,
      x: shown ? 0 : HIDDEN_OFFSET_X,
      duration: shown ? 220 : 180,
      ease: shown ? 'Back.easeOut' : 'Quad.easeIn',
      onComplete: () => { if (!this.shown) this.root.setVisible(false); },
    });
  }

  private handleStateChanged(snapshot: PhoneSnapshot): void {
    this.vibrationTween?.stop();
    this.vibrationTween = null;
    this.icon.setX(950);
    if (snapshot.state === 'RINGING') {
      this.vibrationTween = this.scene.tweens.add({
        targets: this.icon,
        x: { from: 946, to: 954 },
        duration: 70,
        yoyo: true,
        repeat: -1,
      });
    }
  }
}

function drawPhoneFrame(g: Phaser.GameObjects.Graphics): void {
  // Shadow, body, screen, camera notch and home bar.
  g.fillStyle(0x000000, 0.35).fillRoundedRect(PHONE.x + 5, PHONE.y + 6, PHONE.width, PHONE.height, PHONE.radius);
  g.fillStyle(0x1c1f24, 1).fillRoundedRect(PHONE.x, PHONE.y, PHONE.width, PHONE.height, PHONE.radius);
  g.lineStyle(2, 0x495057, 1).strokeRoundedRect(PHONE.x, PHONE.y, PHONE.width, PHONE.height, PHONE.radius);
  g.fillStyle(0x0d1b2a, 1).fillRoundedRect(SCREEN.x, PHONE.y + 7, SCREEN.width, PHONE.height - 14, 16);
  g.fillGradientStyle(0x1b263b, 0x1b263b, 0x0d1b2a, 0x0d1b2a, 1).fillRect(SCREEN.x, SCREEN.y, SCREEN.width, SCREEN.height - 8);
  g.fillStyle(0x000000, 1).fillRoundedRect(CENTER_X - 26, PHONE.y + 9, 52, 13, 6);
  g.fillStyle(0xadb5bd, 0.7).fillRoundedRect(CENTER_X - 30, PHONE.y + PHONE.height - 13, 60, 4, 2);
}

function makeButton(scene: Phaser.Scene, x: number, key: string, glyph: string, color: number, label: string): CallButton {
  const y = SCREEN.y + 194;
  return {
    circle: scene.add.circle(x, y, 19, color).setStrokeStyle(2, 0xffffff, 0.6),
    icon: scene.add.text(x, y, glyph, textStyle(16, '#ffffff')).setOrigin(0.5),
    label: scene.add.text(x, y + 23, `${key} · ${label}`, textStyle(8, '#e9ecef')).setOrigin(0.5, 0),
  };
}

function buttonParts(button: CallButton): (Phaser.GameObjects.Arc | Phaser.GameObjects.Text)[] {
  return [button.circle, button.icon, button.label];
}

function textStyle(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: UI_FONT_FAMILY,
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    color,
  };
}
