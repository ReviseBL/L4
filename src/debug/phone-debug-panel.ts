import Phaser from 'phaser';
import type { PhoneState } from '../domain/phone/phone-types';

export interface PhoneDebugStatus {
  state: PhoneState;
  callsThisMission: number;
  enabled: boolean;
  airplaneModeAvailable: boolean;
  missionElapsedMs: number;
  pendingCalls: number;
}

export interface PhoneDebugActions {
  getStatus: () => PhoneDebugStatus;
  forceCall: () => void;
  answer: () => void;
  miss: () => void;
  resetAirplaneMode: () => void;
  toggleEnabled: () => void;
  jumpToMonth2: () => void;
}

export class PhoneDebugPanel {
  private readonly panel: Phaser.GameObjects.Text;
  private readonly buttons: Phaser.GameObjects.Text[];
  private readonly keys: Readonly<Record<string, Phaser.Input.Keyboard.Key>>;
  private visible = true;

  public constructor(scene: Phaser.Scene, private readonly actions: PhoneDebugActions) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is required for the phone debug panel.');
    }
    this.panel = scene.add
      .text(18, 184, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#90e0ef',
        backgroundColor: '#0b0f14ee',
        padding: { x: 10, y: 8 },
      })
      .setScrollFactor(0)
      .setDepth(100_020)
      .setVisible(true);
    this.keys = {
      toggle: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K),
      force: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
      answer: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O),
      miss: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M),
      resetAirplane: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      toggleEnabled: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
      jump: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
    };
    this.buttons = [
      this.createButton(scene, 18, 338, 'M2', () => this.actions.jumpToMonth2()),
      this.createButton(scene, 82, 338, 'CALL', () => this.actions.forceCall()),
      this.createButton(scene, 166, 338, 'ANSWER', () => this.actions.answer()),
      this.createButton(scene, 274, 338, 'MISSED', () => this.actions.miss()),
      this.createButton(scene, 18, 368, 'AIR RESET', () => this.actions.resetAirplaneMode()),
      this.createButton(scene, 152, 368, 'PHONE ON/OFF', () => this.actions.toggleEnabled()),
    ];
  }

  public update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.toggle)) {
      this.visible = !this.visible;
      this.panel.setVisible(this.visible);
      for (const button of this.buttons) button.setVisible(this.visible);
    }
    if (!this.visible) return;
    if (Phaser.Input.Keyboard.JustDown(this.keys.force)) this.actions.forceCall();
    if (Phaser.Input.Keyboard.JustDown(this.keys.answer)) this.actions.answer();
    if (Phaser.Input.Keyboard.JustDown(this.keys.miss)) this.actions.miss();
    if (Phaser.Input.Keyboard.JustDown(this.keys.resetAirplane)) this.actions.resetAirplaneMode();
    if (Phaser.Input.Keyboard.JustDown(this.keys.toggleEnabled)) this.actions.toggleEnabled();
    if (Phaser.Input.Keyboard.JustDown(this.keys.jump)) this.actions.jumpToMonth2();
    this.refresh();
  }

  public destroy(): void {
    this.panel.destroy();
    for (const button of this.buttons) button.destroy();
    for (const key of Object.values(this.keys)) key.destroy();
  }

  private refresh(): void {
    const status = this.actions.getStatus();
    this.panel.setText(
      [
        'K DEBUG TELEFONU',
        `PHONE STATE: ${status.state}`,
        `CALLS THIS MISSION: ${status.callsThisMission}`,
        `ELAPSED: ${(status.missionElapsedMs / 1_000).toFixed(1)}s | PENDING: ${status.pendingCalls}`,
        `SYSTEM: ${status.enabled ? 'ON' : 'OFF'}`,
        `AIRPLANE: ${status.airplaneModeAvailable ? 'GOTOWY' : 'WYKORZYSTANY'}`,
        'P — połączenie | O — odbierz | M — missed',
        'R — reset airplane | X — system ON/OFF',
        'J — pierwsza misja miesiąca 2',
      ].join('\n'),
    );
  }

  private createButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ): Phaser.GameObjects.Text {
    return scene.add
      .text(x, y, label, {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#264653ee',
        padding: { x: 8, y: 5 },
      })
      .setScrollFactor(0)
      .setDepth(100_021)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', onClick);
  }
}
