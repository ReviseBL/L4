import Phaser from 'phaser';
import type { DialogueSnapshot, DialogueTone } from '../domain/dialogue/dialogue-types';

const DIALOGUE_DEPTH = 150_000;
const BOX_WIDTH = 720;
const BOX_LEFT = (960 - BOX_WIDTH) / 2;
const BOX_BOTTOM = 530;
const PAD_X = 16;
const PAD_TOP = 10;
const SPEAKER_GAP = 6;
const FOOTER_HEIGHT = 16;
const MIN_HEIGHT = 56;
const ACCENT_WIDTH = 3;
const TEXT_LEFT = BOX_LEFT + PAD_X + ACCENT_WIDTH;
const TEXT_WIDTH = BOX_WIDTH - PAD_X * 2 - ACCENT_WIDTH;

export class DialogueBox {
  private readonly container: Phaser.GameObjects.Container;
  private readonly shadow: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly accent: Phaser.GameObjects.Rectangle;
  private readonly speakerText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly choicesText: Phaser.GameObjects.Text;
  private readonly continueText: Phaser.GameObjects.Text;
  private readonly pageText: Phaser.GameObjects.Text;
  private readonly pulseTween: Phaser.Tweens.Tween;
  private layoutKey = '';

  public constructor(scene: Phaser.Scene) {
    this.shadow = scene.add.rectangle(BOX_LEFT + 3, 0, BOX_WIDTH, MIN_HEIGHT, 0x000000, 0.35).setOrigin(0);
    this.panel = scene.add
      .rectangle(BOX_LEFT, 0, BOX_WIDTH, MIN_HEIGHT, 0x0b0f14, 0.9)
      .setOrigin(0)
      .setStrokeStyle(2, 0xf4a261, 0.85);
    this.accent = scene.add
      .rectangle(BOX_LEFT + 6, 0, ACCENT_WIDTH, MIN_HEIGHT - 12, 0x8ecae6, 0.9)
      .setOrigin(0);

    this.speakerText = scene.add
      .text(BOX_LEFT + 14, 0, '', dialogueStyle(12, '#ffd166'))
      .setPadding(6, 2)
      .setBackgroundColor('#264653')
      .setVisible(false);
    this.bodyText = scene.add
      .text(TEXT_LEFT, 0, '', dialogueStyle(14, '#f4f1de'))
      .setWordWrapWidth(TEXT_WIDTH, true)
      .setLineSpacing(4);
    this.choicesText = scene.add
      .text(TEXT_LEFT + 8, 0, '', dialogueStyle(13, '#ffffff'))
      .setWordWrapWidth(TEXT_WIDTH - 8, true)
      .setLineSpacing(4);
    this.continueText = scene.add
      .text(BOX_LEFT + BOX_WIDTH - PAD_X, BOX_BOTTOM - 5, '[E] DALEJ ▼', dialogueStyle(11, '#8ecae6'))
      .setOrigin(1, 1);
    this.pageText = scene.add
      .text(TEXT_LEFT, BOX_BOTTOM - 5, '', dialogueStyle(10, '#6c8295'))
      .setOrigin(0, 1);

    this.container = scene.add
      .container(0, 0, [
        this.shadow,
        this.panel,
        this.accent,
        this.speakerText,
        this.bodyText,
        this.choicesText,
        this.continueText,
        this.pageText,
      ])
      .setScrollFactor(0)
      .setDepth(DIALOGUE_DEPTH)
      .setVisible(false);

    this.pulseTween = scene.tweens.add({
      targets: this.continueText,
      alpha: { from: 0.45, to: 1 },
      duration: 520,
      yoyo: true,
      repeat: -1,
      paused: true,
    });
  }

  public update(snapshot: DialogueSnapshot): void {
    this.container.setVisible(snapshot.active);
    if (!snapshot.active) {
      this.pulseTween.pause();
      this.layoutKey = '';
      return;
    }

    const color = toneColor(snapshot.tone);
    const hasChoices = snapshot.choices.length > 0;
    const choiceLines = snapshot.choices
      .map((choice, index) => `${index === snapshot.selectedChoiceIndex ? '▶' : ' '} ${choice.text}`)
      .join('\n');

    // Layout is measured on the full page text so the box does not grow while typing.
    const key = `${snapshot.speaker ?? ''}|${snapshot.fullText}|${choiceLines}`;
    if (key !== this.layoutKey) {
      this.layoutKey = key;
      this.applyLayout(snapshot.speaker, snapshot.fullText, choiceLines, hasChoices);
    }

    this.speakerText.setColor(color);
    this.accent.setFillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.9);
    this.bodyText.setText(snapshot.text).setColor(color);
    this.choicesText.setVisible(!snapshot.isTyping && hasChoices);
    this.continueText
      .setText(hasChoices && !snapshot.isTyping ? '[W/S] WYBÓR  [E] OK ▼' : '[E] DALEJ ▼')
      .setVisible(!snapshot.isTyping);
    this.pageText.setText(
      snapshot.pageCount > 1 ? `${snapshot.pageIndex + 1}/${snapshot.pageCount}` : '',
    );

    if (snapshot.isTyping) this.pulseTween.pause();
    else if (!this.pulseTween.isPlaying()) this.pulseTween.resume();
  }

  public destroy(): void {
    this.pulseTween.stop();
    this.container.destroy(true);
  }

  private applyLayout(
    speaker: string | null,
    fullText: string,
    choiceLines: string,
    hasChoices: boolean,
  ): void {
    this.bodyText.setText(fullText);
    this.choicesText.setText(choiceLines);
    const bodyHeight = this.bodyText.height;
    const choicesHeight = hasChoices ? this.choicesText.height + 6 : 0;
    const speakerOffset = speaker ? SPEAKER_GAP : 0;
    const height = Math.max(
      MIN_HEIGHT,
      PAD_TOP + speakerOffset + bodyHeight + choicesHeight + FOOTER_HEIGHT + 4,
    );
    const top = BOX_BOTTOM - height;

    this.shadow.setY(top + 3).setSize(BOX_WIDTH, height);
    this.panel.setY(top).setSize(BOX_WIDTH, height);
    this.accent.setY(top + 6).setSize(ACCENT_WIDTH, height - 12);
    this.speakerText
      .setText(speaker ?? '')
      .setVisible(speaker !== null)
      .setY(top - 9);
    this.bodyText.setY(top + PAD_TOP + speakerOffset);
    this.choicesText.setY(this.bodyText.y + bodyHeight + 6);
  }
}

function toneColor(tone: DialogueTone): string {
  switch (tone) {
    case 'system':
      return '#8ecae6';
    case 'speech':
      return '#f4f1de';
    case 'success':
      return '#90be6d';
    case 'warning':
      return '#ff8c69';
    case 'neutral':
      return '#ffffff';
  }
}

function dialogueStyle(
  fontSize: number,
  color: string,
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: 'Courier New, monospace',
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    color,
    stroke: '#06090d',
    strokeThickness: 2,
  };
}
