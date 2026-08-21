import Phaser from 'phaser';
import { HR_STATE, type HrState } from '../domain/npcs/hr-types';

export interface HrDebugActions {
  getStatus: () => { enabled: boolean; state: HrState; lastKnown: { x: number; y: number } | null; visionVisible: boolean };
  toggleSpawn: () => void;
  forceDetection: () => void;
  teleportToPlayer: () => void;
  toggleVision: () => void;
  forceDialogue: () => void;
  forceState: (state: HrState) => void;
  setChoice: (choice: 'still_sick' | 'getting_better' | 'great') => void;
  jumpToMonth3: () => void;
}

export class HrDebugPanel {
  private readonly text: Phaser.GameObjects.Text;
  private readonly keys: Phaser.Input.Keyboard.Key[];
  private visible = false;
  private readonly states = Object.values(HR_STATE);
  private stateIndex = 0;

  public constructor(scene: Phaser.Scene, private readonly actions: HrDebugActions) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input required for HR debug panel.');
    this.keys = [
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F5),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Y),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.OPEN_BRACKET),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SEVEN),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.EIGHT),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NINE),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N),
    ];
    this.text = scene.add.text(520, 340, '', {
      fontFamily: 'Courier New, monospace', fontSize: '12px', color: '#e0aaff',
      backgroundColor: '#12051fdd', padding: { x: 8, y: 7 },
    }).setScrollFactor(0).setDepth(100_020).setVisible(false);
  }

  public update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys[0])) { this.visible = !this.visible; this.text.setVisible(this.visible); }
    if (!this.visible) return;
    if (Phaser.Input.Keyboard.JustDown(this.keys[1])) this.actions.toggleSpawn();
    if (Phaser.Input.Keyboard.JustDown(this.keys[2])) this.actions.forceDetection();
    if (Phaser.Input.Keyboard.JustDown(this.keys[3])) this.actions.teleportToPlayer();
    if (Phaser.Input.Keyboard.JustDown(this.keys[4])) this.actions.toggleVision();
    if (Phaser.Input.Keyboard.JustDown(this.keys[5])) this.actions.forceDialogue();
    if (Phaser.Input.Keyboard.JustDown(this.keys[6])) { this.stateIndex = (this.stateIndex + 1) % this.states.length; this.actions.forceState(this.states[this.stateIndex]); }
    if (Phaser.Input.Keyboard.JustDown(this.keys[7])) this.actions.setChoice('still_sick');
    if (Phaser.Input.Keyboard.JustDown(this.keys[8])) this.actions.setChoice('getting_better');
    if (Phaser.Input.Keyboard.JustDown(this.keys[9])) this.actions.setChoice('great');
    if (Phaser.Input.Keyboard.JustDown(this.keys[10])) this.actions.jumpToMonth3();
    const status = this.actions.getStatus();
    const point = status.lastKnown ? `${Math.round(status.lastKnown.x)} / ${Math.round(status.lastKnown.y)}` : 'NONE';
    const target = status.state === HR_STATE.Approaching || status.state === HR_STATE.Conversation ? 'PLAYER' : 'NONE';
    this.text.setText(`HR DEBUG [F5]\nHR STATE: ${status.state}\nTARGET: ${target}\nLAST KNOWN PLAYER: ${point}\nU SPAWN  I DETECT  Y TELEPORT  V VISION\nC DIALOG  [ STATE  7/8/9 CHOICE  N MONTH 3`);
  }

  public destroy(): void { this.text.destroy(); for (const key of this.keys) key.destroy(); }
}
