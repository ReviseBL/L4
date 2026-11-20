import Phaser from 'phaser';
import { createSeededRandom } from '../../core/math/seeded-random';
import type { InkblotCard } from '../../data/finale/zus-tests';
import type { InkblotTest } from '../../systems/finale/inkblot-test';
import { UI_FONT_FAMILY } from '../../ui/text-style';

const CARD = { x: 480, y: 205, width: 230, height: 160 } as const;

/** The psychologist's desk: a mirrored ink blot, the question, three answers and a thinking clock. */
export class InkblotView {
  private readonly root: Phaser.GameObjects.Container;
  private readonly title: Phaser.GameObjects.Text;
  private readonly blot: Phaser.GameObjects.Image;
  private readonly answers: Phaser.GameObjects.Text;
  private readonly clock: Phaser.GameObjects.Graphics;
  private shownCardId: string | null = null;

  public constructor(private readonly scene: Phaser.Scene) {
    const panel = scene.add.rectangle(480, 290, 760, 400, 0x111820, 0.92).setStrokeStyle(4, 0x8ecae6);
    this.title = scene.add.text(480, 104, '', style(22, '#ffd166')).setOrigin(0.5);
    const cardBack = scene.add.rectangle(CARD.x, CARD.y, CARD.width + 16, CARD.height + 16, 0xf3ead2).setStrokeStyle(3, 0x5a4a36);
    this.blot = scene.add.image(CARD.x, CARD.y, '__DEFAULT');
    const question = scene.add.text(480, 306, 'PSYCHOLOG: „Co pan widzi?”', style(17, '#f4f1de')).setOrigin(0.5);
    this.answers = scene.add.text(250, 334, '', style(16, '#e9ecef')).setLineSpacing(10);
    this.clock = scene.add.graphics();
    const hint = scene.add.text(480, 470, 'W/S LUB ↑/↓  •  E — ODPOWIEDZ  •  NIE ZASTANAWIAJ SIĘ ZBYT DŁUGO', style(12, '#8ecae6')).setOrigin(0.5);
    this.root = scene.add.container(0, 0, [panel, this.title, cardBack, this.blot, question, this.answers, this.clock, hint]);
  }

  public render(test: InkblotTest, selected: number): void {
    const card = test.getCard();
    if (!card) return;
    if (card.id !== this.shownCardId) {
      this.blot.setTexture(ensureBlotTexture(this.scene, card));
      this.shownCardId = card.id;
    }
    this.title.setText(`TEST PSYCHOLOGICZNY — KARTA ${test.getCardNumber()}/${test.getCardCount()}`);
    this.answers.setText(card.answers.map((answer, index) => `${index === selected ? '▶' : '  '} ${answer.text}`).join('\n'));
    const progress = test.getThinkProgress();
    const width = 460;
    const left = 480 - width / 2;
    const color = progress < 0.6 ? 0x90be6d : progress < 1 ? 0xf4a261 : 0xe63946;
    this.clock.clear();
    this.clock.fillStyle(0x0b0f14, 1).fillRect(left - 2, 436, width + 4, 10);
    this.clock.fillStyle(color, 1).fillRect(left, 438, width * Math.max(0, 1 - Math.min(1, progress)), 6);
  }

  public destroy(): void {
    this.root.destroy(true);
  }
}

/** A Rorschach-style blot: random ink drops on one half, mirrored onto the other. */
function ensureBlotTexture(scene: Phaser.Scene, card: InkblotCard): string {
  const key = `inkblot-${card.id}`;
  if (scene.textures.exists(key)) return key;
  const texture = scene.textures.createCanvas(key, CARD.width, CARD.height);
  if (!texture) return '__DEFAULT';
  const ctx = texture.getContext();
  const random = createSeededRandom(card.seed);
  const half = CARD.width / 2;
  const drops: { x: number; y: number; rx: number; ry: number }[] = [];
  for (let index = 0; index < 34; index += 1) {
    const spread = random();
    drops.push({
      x: half - 4 - spread * spread * (half - 18),
      y: 18 + random() * (CARD.height - 36),
      rx: 4 + random() * 20 * (1 - spread * 0.6),
      ry: 3 + random() * 16,
    });
  }
  ctx.fillStyle = '#1d1a2b';
  for (const drop of drops) {
    for (const x of [drop.x, CARD.width - drop.x]) {
      ctx.beginPath();
      ctx.ellipse(x, drop.y, drop.rx, drop.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // A few splatters and a spine along the fold.
  for (let index = 0; index < 14; index += 1) {
    const x = half - random() * (half - 8);
    const y = 8 + random() * (CARD.height - 16);
    const r = 1 + random() * 2.5;
    for (const mx of [x, CARD.width - x]) {
      ctx.beginPath();
      ctx.arc(mx, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillRect(half - 3, 24, 6, CARD.height - 48);
  texture.refresh();
  return key;
}

function style(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: UI_FONT_FAMILY, fontSize: `${fontSize}px`, fontStyle: 'bold', color, stroke: '#02070b', strokeThickness: 3 };
}
