import Phaser from 'phaser';
import type { PlayerDirection } from '../../domain/player/player-visual-types';
import { Player } from './player';

const WALK_SPEED = 175;
const SPRINT_SPEED = 285;

interface MovementKeys {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  sprint: Phaser.Input.Keyboard.Key;
}

export class PlayerController {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly keys: MovementKeys;
  private readonly direction = new Phaser.Math.Vector2();
  private movementEnabled = true;
  private sprinting = false;
  private sprintSpeedMultiplier = 1;

  public constructor(
    scene: Phaser.Scene,
    private readonly player: Player,
  ) {
    const keyboard = scene.input.keyboard;

    if (!keyboard) {
      throw new Error('Keyboard input is required to control the player.');
    }

    this.cursors = keyboard.createCursorKeys();
    this.keys = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      sprint: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
    };
  }

  public update(): void {
    if (!this.movementEnabled) {
      this.sprinting = false;
      this.player.setVelocity(0, 0);
      this.player.setMovementVisual(null, false, false);
      return;
    }

    const horizontal = this.getAxis(this.keys.left, this.cursors.left, this.keys.right, this.cursors.right);
    const vertical = this.getAxis(this.keys.up, this.cursors.up, this.keys.down, this.cursors.down);

    this.direction.set(horizontal, vertical);

    if (this.direction.lengthSq() > 0) {
      this.direction.normalize();
    }

    this.sprinting =
      this.direction.lengthSq() > 0 && (this.keys.sprint.isDown || this.cursors.shift?.isDown === true);
    const speed = this.sprinting ? SPRINT_SPEED * this.sprintSpeedMultiplier : WALK_SPEED;

    this.player.setVelocity(this.direction.x * speed, this.direction.y * speed);
    this.player.setMovementVisual(
      resolveVisualDirection(horizontal, vertical),
      this.direction.lengthSq() > 0,
      this.sprinting,
    );
  }

  public setMovementEnabled(enabled: boolean): void {
    this.movementEnabled = enabled;

    if (!enabled) {
      this.sprinting = false;
      this.player.setVelocity(0, 0);
      this.player.setMovementVisual(null, false, false);
    }
  }

  public isSprinting(): boolean {
    return this.sprinting;
  }

  public setSprintSpeedMultiplier(multiplier: number): void {
    this.sprintSpeedMultiplier = Phaser.Math.Clamp(multiplier, 0.5, 1);
  }

  private getAxis(
    negativePrimary: Phaser.Input.Keyboard.Key,
    negativeSecondary: Phaser.Input.Keyboard.Key,
    positivePrimary: Phaser.Input.Keyboard.Key,
    positiveSecondary: Phaser.Input.Keyboard.Key,
  ): number {
    const negative = negativePrimary.isDown || negativeSecondary.isDown;
    const positive = positivePrimary.isDown || positiveSecondary.isDown;

    return Number(positive) - Number(negative);
  }
}

function resolveVisualDirection(horizontal: number, vertical: number): PlayerDirection | null {
  if (horizontal < 0) return 'left';
  if (horizontal > 0) return 'right';
  if (vertical < 0) return 'up';
  if (vertical > 0) return 'down';
  return null;
}
