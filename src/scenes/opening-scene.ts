import Phaser from 'phaser';
import { dialogueConfig } from '../data/dialogue/dialogue-config';
import { openingPanels } from '../data/narrative/opening-sequence';
import { DialogueSystem } from '../systems/dialogue-system';
import { NoirNarrativeView } from '../ui/noir-narrative-view';

export class OpeningScene extends Phaser.Scene {
  private dialogueSystem!: DialogueSystem;
  private narrativeView!: NoirNarrativeView;
  private advanceKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private escapeKey!: Phaser.Input.Keyboard.Key;
  private transitioning = false;

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

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdown());
  }

  public update(_time: number, delta: number): void {
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
    this.dialogueSystem.clear();
    this.narrativeView.destroy();
    this.advanceKey.destroy();
    this.spaceKey.destroy();
    this.escapeKey.destroy();
  }
}
