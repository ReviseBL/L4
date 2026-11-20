import Phaser from 'phaser';
import { HOW_TO_PLAY, type HowToPlaySection } from '../data/tutorial/how-to-play';
import { UI_FONT_FAMILY } from '../ui/text-style';

export const HOW_TO_PLAY_SCENE_KEY = 'HowToPlayScene';

export interface HowToPlaySceneData {
  onClose: () => void;
}

const PANEL = { x: 40, y: 28, width: 880, height: 484 } as const;
const COLUMN_WIDTH = 400;

/** Overlay board with the controls and the main rules. Closed with E, H, Esc or Enter. */
export class HowToPlayScene extends Phaser.Scene {
  private onClose: (() => void) | null = null;
  private openedAt = 0;

  public constructor() {
    super(HOW_TO_PLAY_SCENE_KEY);
  }

  public init(data: HowToPlaySceneData): void {
    this.onClose = data.onClose;
  }

  public create(): void {
    this.openedAt = this.time.now;
    this.add.rectangle(480, 270, 960, 540, 0x05080c, 0.72);
    this.add
      .rectangle(PANEL.x + PANEL.width / 2, PANEL.y + PANEL.height / 2, PANEL.width, PANEL.height, 0x111820, 0.97)
      .setStrokeStyle(4, 0xffd166);
    this.add.text(480, PANEL.y + 14, HOW_TO_PLAY.title, style(26, '#ffd166')).setOrigin(0.5, 0);
    this.add
      .text(PANEL.x + PANEL.width - 16, PANEL.y + 12, '❚❚ PAUZA', style(14, '#111820'))
      .setOrigin(1, 0)
      .setBackgroundColor('#ffd166')
      .setPadding(6, 3);
    this.add
      .text(480, PANEL.y + 60, HOW_TO_PLAY.goal, style(14, '#f4f1de'))
      .setOrigin(0.5, 0)
      .setAlign('center')
      .setWordWrapWidth(PANEL.width - 80);
    this.drawColumn(HOW_TO_PLAY.left, PANEL.x + 30, PANEL.y + 112);
    this.drawColumn(HOW_TO_PLAY.right, PANEL.x + PANEL.width / 2 + 10, PANEL.y + 112);
    this.add
      .text(480, PANEL.y + PANEL.height - 52, HOW_TO_PLAY.pauseNote, style(13, '#ffd166'))
      .setOrigin(0.5, 0);
    this.add
      .text(480, PANEL.y + PANEL.height - 30, HOW_TO_PLAY.footer, style(14, '#8ecae6'))
      .setOrigin(0.5, 0);

    const keyboard = this.input.keyboard;
    keyboard?.on('keydown', this.handleKey, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => keyboard?.off('keydown', this.handleKey, this));
  }

  private drawColumn(sections: readonly HowToPlaySection[], x: number, startY: number): void {
    let y = startY;
    for (const section of sections) {
      this.add.text(x, y, section.title, style(16, '#f4a261'));
      y += 26;
      for (const line of section.lines) {
        const text = this.add
          .text(x + 10, y, `• ${line}`, style(14, '#e9ecef'))
          .setWordWrapWidth(COLUMN_WIDTH - 20)
          .setLineSpacing(2);
        y += text.height + 6;
      }
      y += 16;
    }
  }

  private handleKey(event: KeyboardEvent): void {
    // Ignore the key press that opened the board.
    if (this.time.now - this.openedAt < 250) return;
    if (!['e', 'E', 'h', 'H', 'Escape', 'Enter', ' '].includes(event.key)) return;
    const onClose = this.onClose;
    this.onClose = null;
    this.scene.stop();
    onClose?.();
  }
}

function style(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: UI_FONT_FAMILY, fontSize: `${fontSize}px`, fontStyle: 'bold', color };
}
