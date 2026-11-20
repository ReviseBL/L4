import Phaser from 'phaser';
import type { PlayerDirection } from '../../domain/player/player-visual-types';
import { Player } from './player';
import { Stamina, type StaminaEvent } from '../../systems/player/stamina';
import { staminaConfig } from '../../data/player/stamina-config';

// 150 = tempo pogoni kolegi z pracy: do oderwania się potrzebny jest sprint lub osłona.
const WALK_SPEED = 150;
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
  private walkSpeedMultiplier = 1;
  private sprintAllowed = true;
  private readonly stamina = new Stamina(staminaConfig);
  private lastStaminaEvent: StaminaEvent = null;
  /**
   * Shift as the browser last reported it. Phaser misses the key-up when it
   * happens while the scene is paused (minigame, overlay), which left Hubi
   * sprinting on his own afterwards; the raw modifier state fixes that.
   */
  private shiftHeld = false;
  private readonly onRawKey = (event: KeyboardEvent): void => {
    this.shiftHeld = event.shiftKey;
    if (!event.shiftKey) this.keys.sprint.reset();
  };
  private readonly onBlur = (): void => {
    this.shiftHeld = false;
    this.keys.sprint.reset();
  };

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
    window.addEventListener('keydown', this.onRawKey, true);
    window.addEventListener('keyup', this.onRawKey, true);
    window.addEventListener('blur', this.onBlur);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.onRawKey, true);
    window.removeEventListener('keyup', this.onRawKey, true);
    window.removeEventListener('blur', this.onBlur);
  }

  public update(deltaMs = 16): void {
    if (!this.movementEnabled) {
      this.lastStaminaEvent = this.stamina.update(deltaMs, false, false);
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

    const moving = this.direction.lengthSq() > 0;
    const shiftDown = this.shiftHeld && (this.keys.sprint.isDown || this.cursors.shift?.isDown === true);
    this.sprinting = this.sprintAllowed && moving && shiftDown && this.stamina.canSprint();
    this.lastStaminaEvent = this.stamina.update(deltaMs, this.sprinting, moving);
    const speed = this.sprinting
      ? SPRINT_SPEED * this.sprintSpeedMultiplier
      : WALK_SPEED * this.walkSpeedMultiplier;

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

  /** 0..1 sprint stamina, and whether Hubi is out of breath. */
  public getStamina(): { level: number; exhausted: boolean } {
    return { level: this.stamina.getLevel(), exhausted: this.stamina.isExhausted() };
  }

  /** Stamina change from the last update ('exhausted' once when he runs dry). */
  public takeStaminaEvent(): StaminaEvent {
    const event = this.lastStaminaEvent;
    this.lastStaminaEvent = null;
    return event;
  }

  public setSprintSpeedMultiplier(multiplier: number): void {
    this.sprintSpeedMultiplier = Phaser.Math.Clamp(multiplier, 0.5, 1);
  }

  /** Heavy items slow the walk down and block sprinting entirely. */
  public setCarryMovement(movement: { walkMultiplier: number; sprintAllowed: boolean }): void {
    this.walkSpeedMultiplier = Phaser.Math.Clamp(movement.walkMultiplier, 0.4, 1);
    this.sprintAllowed = movement.sprintAllowed;
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
