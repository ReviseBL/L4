import Phaser from 'phaser';
import { ZUS_PIXEL_ART } from '../../data/finale/zus-art';
import type { ReflexTestConfig } from '../../data/finale/zus-tests';
import type { ReflexOutcome, ReflexTest } from '../../systems/finale/reflex-test';
import { UI_FONT_FAMILY } from '../../ui/text-style';

const KNEE = { x: 400, y: 250 } as const;
const BAR = { x: 230, y: 410, width: 500, height: 20 } as const;
const GROUND_Y = 392;
/** Close enough that the hammer reaches the knee. */
const DOCTOR_X = 560;

/** The doctor's hammer over Herbi's knee and the kick-strength bar. */
export class ReflexView {
  private readonly root: Phaser.GameObjects.Container;
  private readonly title: Phaser.GameObjects.Text;
  private readonly needle: Phaser.GameObjects.Graphics;
  /** Pixel-art version: Herbi on the couch (3 kick frames) and the doctor. */
  private readonly leg: Phaser.GameObjects.Sprite | null = null;
  private readonly doctor: Phaser.GameObjects.Image | null = null;
  /** Fallback version drawn with shapes. */
  private readonly shin: Phaser.GameObjects.Container | null = null;
  private readonly hammer: Phaser.GameObjects.Container | null = null;

  public constructor(private readonly scene: Phaser.Scene, private readonly config: ReflexTestConfig) {
    const panel = scene.add.rectangle(480, 290, 760, 400, 0x111820, 0.92).setStrokeStyle(4, 0x8ecae6);
    this.title = scene.add.text(480, 104, '', style(22, '#ffd166')).setOrigin(0.5);
    const parts: Phaser.GameObjects.GameObject[] = [panel, this.title];
    const art = scene.textures.exists(ZUS_PIXEL_ART.leg.key) && scene.textures.exists(ZUS_PIXEL_ART.doctor.key);
    if (art) {
      this.leg = scene.add.sprite(370, GROUND_Y, ZUS_PIXEL_ART.leg.key, 0).setOrigin(0.5, 1);
      this.doctor = scene.add.image(DOCTOR_X, GROUND_Y, ZUS_PIXEL_ART.doctor.key).setOrigin(0.5, 1);
      const says = scene.add.text(DOCTOR_X, 140, '„Proszę się rozluźnić.”', style(14, '#f4f1de')).setOrigin(0.5);
      parts.push(this.leg, this.doctor, says);
    } else {
      const couch = scene.add.rectangle(300, KNEE.y + 8, 260, 22, 0x5c6b73).setStrokeStyle(3, 0x2b3138);
      const thigh = scene.add.rectangle(KNEE.x - 70, KNEE.y - 12, 150, 34, 0x6c7a89).setStrokeStyle(3, 0x1b1b1b);
      const shinLeg = scene.add.rectangle(0, 52, 30, 104, 0x6c7a89).setStrokeStyle(3, 0x1b1b1b);
      const sock = scene.add.rectangle(0, 112, 32, 22, 0xe9ecef).setStrokeStyle(3, 0x1b1b1b);
      const shoe = scene.add.rectangle(10, 128, 50, 16, 0xd8d2c4).setStrokeStyle(3, 0x1b1b1b);
      this.shin = scene.add.container(KNEE.x, KNEE.y, [shinLeg, sock, shoe]);
      const handle = scene.add.rectangle(0, -40, 8, 70, 0xb08968).setStrokeStyle(2, 0x1b1b1b);
      const head = scene.add.rectangle(0, -78, 34, 18, 0xe76f51).setStrokeStyle(3, 0x1b1b1b);
      this.hammer = scene.add.container(KNEE.x + 40, KNEE.y - 10, [handle, head]).setAngle(-35);
      const doctor = scene.add.text(620, 200, 'LEKARZ ORZECZNIK\n„Proszę się rozluźnić.”', style(15, '#f4f1de')).setAlign('center').setOrigin(0.5);
      parts.push(couch, thigh, this.shin, this.hammer, doctor);
    }
    const bar = scene.add.graphics();
    const zone = (from: number, to: number, color: number) =>
      bar.fillStyle(color, 1).fillRect(BAR.x + BAR.width * from, BAR.y, BAR.width * (to - from), BAR.height);
    zone(0, config.weakFrom, 0x6c757d);
    zone(config.weakFrom, config.weakTo, 0x2a9d8f);
    zone(config.weakTo, 1, 0xd62828);
    bar.lineStyle(3, 0x0b0f14, 1).strokeRect(BAR.x, BAR.y, BAR.width, BAR.height);
    const labels = [
      scene.add.text(BAR.x + (BAR.width * config.weakFrom) / 2, BAR.y + 26, 'BRAK ODRUCHU', style(11, '#adb5bd')).setOrigin(0.5, 0),
      scene.add.text(BAR.x + (BAR.width * (config.weakFrom + config.weakTo)) / 2, BAR.y + 26, 'SŁABY', style(11, '#90be6d')).setOrigin(0.5, 0),
      scene.add.text(BAR.x + (BAR.width * (config.weakTo + 1)) / 2, BAR.y + 26, 'ZDROWY JAK KOŃ', style(11, '#ff8c69')).setOrigin(0.5, 0),
    ];
    this.needle = scene.add.graphics();
    const hint = scene.add.text(480, 470, 'E — REAGUJ, GDY WSKAŹNIK JEST W ZIELONYM  •  SŁABO, ALE NIE ZA SŁABO', style(12, '#8ecae6')).setOrigin(0.5);
    this.root = scene.add.container(0, 0, [...parts, bar, ...labels, this.needle, hint]);
  }

  public render(test: ReflexTest): void {
    this.title.setText(`BADANIE ODRUCHÓW — UDERZENIE ${Math.min(test.getRound(), this.config.rounds)}/${this.config.rounds}`);
    const x = BAR.x + BAR.width * test.getStrength();
    this.needle.clear().fillStyle(0xffd166, 1).fillTriangle(x - 8, BAR.y - 14, x + 8, BAR.y - 14, x, BAR.y - 2);
    this.needle.lineStyle(3, 0xffd166, 1).lineBetween(x, BAR.y - 2, x, BAR.y + BAR.height + 2);
  }

  /** Hammer tap, then the leg kicks as hard as the reflex was. */
  public playKick(outcome: ReflexOutcome, onDone: () => void): void {
    if (this.leg && this.doctor) {
      const leg = this.leg;
      this.scene.tweens.add({
        targets: this.doctor,
        angle: { from: 0, to: -7 },
        x: { from: DOCTOR_X, to: DOCTOR_X - 10 },
        duration: 130,
        yoyo: true,
        onComplete: () => {
          leg.setFrame(outcome.result === 'none' ? 0 : outcome.result === 'weak' ? 1 : 2);
          if (outcome.result === 'strong') this.scene.cameras.main.shake(140, 0.004);
          this.scene.time.delayedCall(outcome.result === 'none' ? 450 : 600, () => {
            leg.setFrame(0);
            onDone();
          });
        },
      });
      return;
    }
    if (!this.hammer || !this.shin) { onDone(); return; }
    const shin = this.shin;
    this.scene.tweens.add({
      targets: this.hammer,
      angle: { from: -35, to: 10 },
      duration: 140,
      yoyo: true,
      onComplete: () => {
        this.scene.tweens.add({
          targets: shin,
          angle: { from: 0, to: -12 - outcome.strength * 75 },
          duration: 160 + outcome.strength * 120,
          yoyo: true,
          ease: 'Quad.easeOut',
          onComplete: onDone,
        });
      },
    });
  }

  public destroy(): void {
    this.root.destroy(true);
  }
}

function style(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: UI_FONT_FAMILY, fontSize: `${fontSize}px`, fontStyle: 'bold', color, stroke: '#02070b', strokeThickness: 3 };
}
