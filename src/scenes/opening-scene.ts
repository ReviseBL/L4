import Phaser from 'phaser';
import { dialogueConfig } from '../data/dialogue/dialogue-config';
import { FICTION_DISCLAIMER } from '../data/narrative/fiction-disclaimer';
import { openingPanels } from '../data/narrative/opening-sequence';
import { DialogueSystem } from '../systems/dialogue-system';
import { NoirNarrativeView } from '../ui/noir-narrative-view';
import { UI_FONT_FAMILY } from '../ui/text-style';

export class OpeningScene extends Phaser.Scene {
  private dialogueSystem!: DialogueSystem;
  private narrativeView!: NoirNarrativeView;
  private advanceKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private escapeKey!: Phaser.Input.Keyboard.Key;
  private transitioning = false;
  /** The fiction disclaimer card, shown before the first panel; null once dismissed. */
  private disclaimer: Phaser.GameObjects.Container | null = null;
  private disclaimerShownAtMs = 0;

  public constructor() {
    super('OpeningScene');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#050607');
    this.dialogueSystem = new DialogueSystem(dialogueConfig);
    this.narrativeView = new NoirNarrativeView(
      this,
      openingPanels,
      () => this.dialogueSystem.advance(),
      () => this.finishOpening(),
    );
    this.createInput();

    this.dialogueSystem.showSequence(
      {
        id: 'opening-hubi-l4',
        pauseWorld: true,
        lockPlayerMovement: true,
        lines: openingPanels.map((panel) => ({
          speaker: panel.speaker,
          text: panel.text,
          tone: panel.accent === 'red' ? 'warning' : 'speech',
        })),
      },
      { onComplete: () => this.finishOpening() },
    );

    this.showDisclaimer();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdown());
  }

  public update(time: number, delta: number): void {
    if (this.disclaimer) {
      if (!this.disclaimerShownAtMs) this.disclaimerShownAtMs = time;
      const pressed = [this.advanceKey, this.spaceKey, this.escapeKey].some((key) => Phaser.Input.Keyboard.JustDown(key));
      if (pressed || time - this.disclaimerShownAtMs > FICTION_DISCLAIMER.autoContinueMs) this.hideDisclaimer();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
      this.finishOpening();
      return;
    }
    if (
      Phaser.Input.Keyboard.JustDown(this.advanceKey) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey)
    ) {
      this.dialogueSystem.advance();
    }
    this.dialogueSystem.update(delta);
    this.narrativeView.update(this.dialogueSystem.getSnapshot());
  }

  private showDisclaimer(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x050607, 1).setInteractive();
    backdrop.on('pointerdown', () => this.hideDisclaimer());
    const title = this.add
      .text(width / 2, 84, FICTION_DISCLAIMER.title, { fontFamily: UI_FONT_FAMILY, fontSize: '22px', fontStyle: 'bold', color: '#df293f' })
      .setOrigin(0.5);
    const body = this.add
      .text(width / 2, 280, FICTION_DISCLAIMER.paragraphs.join('\n\n'), {
        fontFamily: UI_FONT_FAMILY,
        fontSize: '16px',
        color: '#dedbd2',
        align: 'center',
        wordWrap: { width: 640 },
        lineSpacing: 4,
      })
      .setOrigin(0.5);
    const hint = this.add
      .text(width / 2, height - 54, FICTION_DISCLAIMER.continueHint, { fontFamily: UI_FONT_FAMILY, fontSize: '12px', fontStyle: 'bold', color: '#707176' })
      .setOrigin(0.5);
    this.disclaimer = this.add.container(0, 0, [backdrop, title, body, hint]).setDepth(1_000_000).setAlpha(0);
    this.tweens.add({ targets: this.disclaimer, alpha: 1, duration: 450 });
  }

  private hideDisclaimer(): void {
    const card = this.disclaimer;
    if (!card) return;
    this.disclaimer = null;
    this.tweens.add({ targets: card, alpha: 0, duration: 350, onComplete: () => card.destroy() });
  }

  private createInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is required for OpeningScene.');
    this.advanceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.escapeKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  private finishOpening(): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.dialogueSystem.clear();
    // GameScene owns the incoming fade. Starting it directly also guarantees
    // that Skip Intro cannot leave the outgoing camera at full black. Defer
    // one frame so a pointer event can finish before its source view is torn down.
    this.time.delayedCall(16, () => this.scene.start('GameScene'));
  }

  private shutdown(): void {
    this.disclaimer?.destroy();
    this.disclaimer = null;
    this.dialogueSystem.clear();
    this.narrativeView.destroy();
    this.advanceKey.destroy();
    this.spaceKey.destroy();
    this.escapeKey.destroy();
  }
}
