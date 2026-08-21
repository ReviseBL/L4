import Phaser from 'phaser';
import type { DialogueSnapshot, DialogueTone } from '../domain/dialogue/dialogue-types';

const DIALOGUE_DEPTH = 150_000;

export class DialogueBox {
  private readonly container: Phaser.GameObjects.Container;
  private readonly speakerText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly choicesText: Phaser.GameObjects.Text;
  private readonly continueText: Phaser.GameObjects.Text;
  private readonly pageText: Phaser.GameObjects.Text;
  private readonly pulseTween: Phaser.Tweens.Tween;

  public constructor(scene: Phaser.Scene) {
    const shadow = scene.add.rectangle(480, 460, 932, 150, 0x000000, 0.52).setOrigin(0.5);
    const panel = scene.add
      .rectangle(480, 456, 924, 148, 0x0b0f14, 0.98)
      .setOrigin(0.5)
      .setStrokeStyle(5, 0xf4f1de);
    const innerFrame = scene.add
      .rectangle(480, 456, 910, 134, 0x111820, 0.98)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0x8ecae6);

    this.speakerText = scene.add
      .text(42, 390, '', dialogueStyle(17, '#ffd166'))
      .setPadding(8, 3)
      .setBackgroundColor('#264653')
      .setVisible(false);
    this.bodyText = scene.add
      .text(44, 426, '', dialogueStyle(18, '#f4f1de'))
      .setWordWrapWidth(860, true)
      .setLineSpacing(5);
    this.choicesText = scene.add
      .text(54, 452, '', dialogueStyle(16, '#ffffff'))
      .setWordWrapWidth(820, true)
      .setLineSpacing(3);
    this.continueText = scene.add
      .text(914, 506, '[E] DALEJ  ▼', dialogueStyle(13, '#8ecae6'))
      .setOrigin(1, 1);
    this.pageText = scene.add
      .text(46, 510, '', dialogueStyle(11, '#6c8295'))
      .setOrigin(0, 1);

    this.container = scene.add
      .container(0, 0, [
        shadow,
        panel,
        innerFrame,
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
      return;
    }

    this.speakerText
      .setText(snapshot.speaker ?? '')
      .setVisible(snapshot.speaker !== null)
      .setColor(toneColor(snapshot.tone));
    this.bodyText
      .setY(snapshot.speaker ? 426 : 404)
      .setText(snapshot.text)
      .setColor(toneColor(snapshot.tone));
    this.choicesText
      .setVisible(!snapshot.isTyping && snapshot.choices.length > 0)
      .setText(
        snapshot.choices
          .map((choice, index) => `${index === snapshot.selectedChoiceIndex ? '▶' : ' '} ${choice.text}`)
          .join('\n'),
      );
    this.continueText
      .setText(snapshot.choices.length > 0 && !snapshot.isTyping ? '[E] WYBIERZ  ▼' : '[E] DALEJ  ▼')
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
    strokeThickness: 3,
  };
}
