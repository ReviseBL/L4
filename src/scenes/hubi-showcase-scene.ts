import Phaser from 'phaser';
import { PLAYER_DIRECTIONS } from '../data/player/player-animation-config';
import type { CarryVisualDefinition } from '../domain/items/item-types';
import type { PlayerDirection, PlayerVisualAction } from '../domain/player/player-visual-types';
import { Player } from '../entities/player/player';

const SHOWCASE_ROWS: readonly {
  label: string;
  action: PlayerVisualAction;
  carryVisual?: CarryVisualDefinition;
}[] = [
  { label: 'IDLE', action: 'idle' },
  { label: 'WALK', action: 'walk' },
  { label: 'SPRINT', action: 'sprint' },
  { label: 'CARRY', action: 'carry-walk', carryVisual: { label: 'PACZKA', color: 0x9c6644, size: 'large' } },
  { label: 'PHONE', action: 'phone' },
];

export class HubiShowcaseScene extends Phaser.Scene {
  private exitKey!: Phaser.Input.Keyboard.Key;
  private escapeKey!: Phaser.Input.Keyboard.Key;

  public constructor() {
    super('HubiShowcaseScene');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#111820');
    this.add.rectangle(480, 270, 920, 500, 0x18232c).setStrokeStyle(3, 0x8ecae6);
    this.add.text(480, 26, 'HUBI ANIMATION SHOWCASE', style(22, '#f0ede4')).setOrigin(0.5);
    this.add.text(480, 54, 'F2 / ESC — POWRÓT DO GRY', style(12, '#8ecae6')).setOrigin(0.5);

    PLAYER_DIRECTIONS.forEach((direction, column) => {
      this.add.text(210 + column * 180, 78, direction.toUpperCase(), style(13, '#ffd166')).setOrigin(0.5);
    });

    SHOWCASE_ROWS.forEach((row, rowIndex) => {
      const y = 120 + rowIndex * 82;
      this.add.text(42, y, row.label, style(13, '#f0ede4')).setOrigin(0, 0.5);
      PLAYER_DIRECTIONS.forEach((direction, column) => {
        this.createPreviewPlayer(210 + column * 180, y, row.action, direction, row.carryVisual);
      });
    });

    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is required for the Hubi showcase.');
    this.exitKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2);
    this.escapeKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.exitKey.destroy();
      this.escapeKey.destroy();
    });
  }

  public update(): void {
    if (
      Phaser.Input.Keyboard.JustDown(this.exitKey) ||
      Phaser.Input.Keyboard.JustDown(this.escapeKey)
    ) {
      this.scene.start('GameScene');
    }
  }

  private createPreviewPlayer(
    x: number,
    y: number,
    action: PlayerVisualAction,
    direction: PlayerDirection,
    carryVisual?: CarryVisualDefinition,
  ): void {
    const player = new Player(this, x, y);
    player.setCollideWorldBounds(false);
    if (carryVisual) player.setCarriedItemVisual(carryVisual);
    player.setForcedVisualState(action, direction);
    player.setScale(2);
  }
}

function style(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: 'Courier New, monospace',
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    color,
    stroke: '#02070b',
    strokeThickness: 3,
  };
}
