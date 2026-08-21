import Phaser from 'phaser';
import type { CarryVisualDefinition } from '../../domain/items/item-types';
import type { PlayerDirection, PlayerVisualAction } from '../../domain/player/player-visual-types';
import {
  getHubiAnimationKey,
  HUBI_ORIGIN,
  HUBI_PHYSICS_BODY,
  HUBI_TEXTURE_KEY,
} from '../../data/player/player-animation-config';
import { PLAYER_TEXTURE_KEY } from '../../game/create-placeholder-textures';
import { resolvePlayerVisualState } from './player-visual-state';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly carriedBox: Phaser.GameObjects.Rectangle;
  private readonly carriedLabel: Phaser.GameObjects.Text;
  private readonly animatedTextureAvailable: boolean;
  private carriedVisual: CarryVisualDefinition | null = null;
  private hiddenState = false;
  private phoneActive = false;
  private interacting = false;
  private moving = false;
  private sprinting = false;
  private lastDirection: PlayerDirection = 'down';
  private currentAnimationKey: string | null = null;
  private forcedVisual: { action: PlayerVisualAction; direction: PlayerDirection } | null = null;

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    const animatedTextureAvailable = scene.textures.exists(HUBI_TEXTURE_KEY);
    super(scene, x, y, animatedTextureAvailable ? HUBI_TEXTURE_KEY : PLAYER_TEXTURE_KEY);
    this.animatedTextureAvailable = animatedTextureAvailable;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setOrigin(HUBI_ORIGIN.x, HUBI_ORIGIN.y);
    this.setSize(HUBI_PHYSICS_BODY.width, HUBI_PHYSICS_BODY.height);
    this.setOffset(HUBI_PHYSICS_BODY.offsetX, HUBI_PHYSICS_BODY.offsetY);
    this.setDepth(this.y);

    this.carriedBox = scene.add
      .rectangle(x + 23, y + 8, 34, 28, 0x2a9d8f)
      .setStrokeStyle(3, 0xffffff)
      .setVisible(false);
    this.carriedLabel = scene.add
      .text(x + 23, y + 8, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#111820',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.updatePresentation();
  }

  public updatePresentation(): void {
    const depth = Math.round(this.y);
    this.setDepth(depth);
    const carryOffset = getCarryOffset(this.lastDirection);
    const carryInFront = this.lastDirection !== 'up';
    this.carriedBox
      .setPosition(this.x + carryOffset.x, this.y + carryOffset.y)
      .setDepth(depth + (carryInFront ? 1 : -1));
    this.carriedLabel.setPosition(this.carriedBox.x, this.carriedBox.y).setDepth(depth + 2);
    this.applyVisualState();
  }

  public setMovementVisual(
    direction: PlayerDirection | null,
    moving: boolean,
    sprinting: boolean,
  ): void {
    if (direction) this.lastDirection = direction;
    this.moving = moving;
    this.sprinting = sprinting;
    this.updatePresentation();
  }

  public setPhoneActive(active: boolean): void {
    if (this.phoneActive === active) return;
    this.phoneActive = active;
    this.updatePresentation();
  }

  public playInteractionVisual(): void {
    this.interacting = true;
    this.updatePresentation();
    if (!this.animatedTextureAvailable) {
      this.interacting = false;
      return;
    }
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.interacting = false;
      this.updatePresentation();
    });
  }

  public setForcedVisualState(
    action: PlayerVisualAction | null,
    direction: PlayerDirection = this.lastDirection,
  ): void {
    this.forcedVisual = action ? { action, direction } : null;
    if (action) this.lastDirection = direction;
    this.updatePresentation();
  }

  public setHiddenState(isHidden: boolean): void {
    this.hiddenState = isHidden;
    this.setAlpha(isHidden ? 0.28 : 1);
    this.setTint(isHidden ? 0x8ecae6 : 0xffffff);
    this.carriedBox.setAlpha(isHidden ? 0.28 : 1);
    this.carriedLabel.setAlpha(isHidden ? 0.28 : 1);
    this.setVelocity(0, 0);
    this.updatePresentation();
  }

  public setCarriedItemVisual(visual: CarryVisualDefinition | null): void {
    this.carriedVisual = visual;
    const dimensions = getCarryDimensions(visual);
    this.carriedBox
      .setSize(dimensions.width, dimensions.height)
      .setDisplaySize(dimensions.width, dimensions.height)
      .setFillStyle(visual?.color ?? 0xffffff);
    this.carriedLabel.setText(visual?.label ?? '');
    this.carriedBox.setAlpha(this.hiddenState ? 0.28 : 1);
    this.carriedLabel.setAlpha(this.hiddenState ? 0.28 : 1);
    this.updatePresentation();
  }

  public getLastDirection(): PlayerDirection {
    return this.lastDirection;
  }

  public isUsingAnimatedTexture(): boolean {
    return this.animatedTextureAvailable;
  }

  private applyVisualState(): void {
    const resolved = resolvePlayerVisualState({
      direction: this.lastDirection,
      moving: this.moving,
      sprinting: this.sprinting,
      carrying: this.carriedVisual !== null,
      phoneActive: this.phoneActive,
      hidden: this.hiddenState,
      interacting: this.interacting,
    });
    const selection = this.forcedVisual ?? resolved;
    const itemVisible = this.carriedVisual !== null && selection.action !== 'phone';
    this.carriedBox.setVisible(itemVisible);
    this.carriedLabel.setVisible(itemVisible);

    if (!this.animatedTextureAvailable) {
      if (selection.direction === 'left' || selection.direction === 'right') {
        this.setFlipX(selection.direction === 'left');
      }
      return;
    }

    this.setFlipX(false);
    const animationKey = getHubiAnimationKey(selection.action, selection.direction);
    if (this.currentAnimationKey === animationKey && this.anims.isPlaying) return;
    this.currentAnimationKey = animationKey;
    this.play(animationKey, true);
  }
}

function getCarryOffset(direction: PlayerDirection): { x: number; y: number } {
  if (direction === 'up') return { x: 0, y: -8 };
  if (direction === 'left') return { x: -13, y: 4 };
  if (direction === 'right') return { x: 13, y: 4 };
  return { x: 0, y: 9 };
}

function getCarryDimensions(visual: CarryVisualDefinition | null): { width: number; height: number } {
  if (visual?.size === 'large') return { width: 30, height: 24 };
  return { width: 24, height: 18 };
}
