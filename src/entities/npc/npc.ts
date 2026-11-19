import Phaser from 'phaser';
import type { Point2D } from '../../core/math/geometry-types';
import {
  getNpcAnimationKey,
  NPC_PHYSICS_BODY,
  NPC_SPRITES,
  type NpcSpriteDefinition,
  type NpcSpriteId,
} from '../../data/npcs/npc-sprite-config';
import { NPC_STATE, type NpcState } from '../../domain/npcs/npc-types';
import type { PlayerDirection } from '../../domain/player/player-visual-types';
import { WORK_COLLEAGUE_TEXTURE_KEY } from '../../game/create-placeholder-textures';
import { NPC_MOVING_SPEED_THRESHOLD, resolveNpcDirection } from './npc-visual-direction';

export type NpcPresentationState = NpcState | 'APPROACHING' | 'CONVERSATION';

export class Npc extends Phaser.Physics.Arcade.Sprite {
  private readonly visionGraphics: Phaser.GameObjects.Graphics;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly statusText: Phaser.GameObjects.Text;
  /** Animowany arkusz NPC; null = statyczny placeholder (stare zachowanie z flipX). */
  private readonly sprite: NpcSpriteDefinition | null;
  private lastDirection: PlayerDirection = 'down';
  private currentAnimationKey: string | null = null;

  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    displayName: string,
    textureKey = WORK_COLLEAGUE_TEXTURE_KEY,
    spriteId: NpcSpriteId | null = null,
  ) {
    const spriteDefinition = spriteId ? NPC_SPRITES[spriteId] : null;
    const animated = spriteDefinition !== null && scene.textures.exists(spriteDefinition.textureKey);
    super(scene, x, y, animated && spriteDefinition ? spriteDefinition.textureKey : textureKey);
    this.sprite = animated ? spriteDefinition : null;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    if (this.sprite) {
      this.setSize(NPC_PHYSICS_BODY.width, NPC_PHYSICS_BODY.height);
      this.setOffset(NPC_PHYSICS_BODY.offsetX, NPC_PHYSICS_BODY.offsetY);
    } else {
      this.setSize(24, 25);
      this.setOffset(4, 17);
    }

    this.visionGraphics = scene.add.graphics();
    this.nameText = scene.add
      .text(x, y - 46, displayName, {
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#111820',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(99_000);
    this.statusText = scene.add
      .text(x, y - 72, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '34px',
        fontStyle: 'bold',
        color: '#ffd166',
        stroke: '#111820',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(99_001);
  }

  public updatePresentation(state: NpcPresentationState, visionPoints: readonly Point2D[]): void {
    this.refreshAnimation(visionPoints);
    this.setDepth(Math.round(this.y));
    this.nameText.setPosition(this.x, this.y - 46);
    this.statusText.setPosition(this.x, this.y - 76);

    const indicator =
      state === NPC_STATE.Detected || state === 'APPROACHING'
        ? '!'
        : state === NPC_STATE.Suspicious || state === NPC_STATE.Searching
          ? '?'
          : '';
    const indicatorColor = state === NPC_STATE.Detected || state === 'APPROACHING' ? '#ff3b30' : '#ffd166';
    this.statusText.setText(indicator).setColor(indicatorColor);

    const coneColor = getConeColor(state);
    const polygon = [{ x: this.x, y: this.y }, ...visionPoints];
    this.visionGraphics.clear();
    this.visionGraphics.fillStyle(coneColor, state === NPC_STATE.Detected || state === 'APPROACHING' ? 0.22 : 0.14);
    this.visionGraphics.fillPoints(polygon, true);
    this.visionGraphics.lineStyle(2, coneColor, 0.55);
    this.visionGraphics.strokePoints(polygon, true);
    this.visionGraphics.setDepth(Math.round(this.y - 2));
  }

  /**
   * Wybiera animację z bieżącej prędkości (chód) albo kierunku patrzenia (postój).
   * Bez animowanego arkusza nic nie robi.
   */
  public refreshAnimation(visionPoints: readonly Point2D[] = []): void {
    if (!this.sprite) return;

    const body = this.body as Phaser.Physics.Arcade.Body | null;
    const vx = body?.velocity.x ?? 0;
    const vy = body?.velocity.y ?? 0;
    const speed = Math.hypot(vx, vy);
    const moving = speed > NPC_MOVING_SPEED_THRESHOLD;

    if (moving) {
      this.lastDirection = resolveNpcDirection(vx, vy, this.lastDirection);
    } else if (visionPoints.length > 0) {
      const lookX = visionPoints.reduce((sum, point) => sum + point.x, 0) / visionPoints.length - this.x;
      const lookY = visionPoints.reduce((sum, point) => sum + point.y, 0) / visionPoints.length - this.y;
      this.lastDirection = resolveNpcDirection(lookX, lookY, this.lastDirection);
    }

    const key = getNpcAnimationKey(this.sprite.id, moving ? 'walk' : 'idle', this.lastDirection);
    if (this.currentAnimationKey !== key || !this.anims.isPlaying) {
      this.currentAnimationKey = key;
      this.play(key, true);
    }
    this.anims.timeScale = moving ? Phaser.Math.Clamp(speed / this.sprite.referenceSpeed, 0.7, 2) : 1;
  }

  /** Animowany NPC ma osobne klatki dla lewo/prawo, więc lustrzane odbicie jest wyłączone. */
  public override setFlipX(value: boolean): this {
    return super.setFlipX(this.sprite ? false : value);
  }

  public setNpcVisible(visible: boolean): void {
    this.setActive(visible).setVisible(visible);
    this.nameText.setVisible(visible);
    this.statusText.setVisible(visible);
    this.visionGraphics.setVisible(visible);
    if (this.body) this.body.enable = visible;
  }

  public setVisionVisible(visible: boolean): void { this.visionGraphics.setVisible(visible && this.visible); }

  public setStatusIndicator(indicator: string, color: string): void {
    this.statusText.setText(indicator).setColor(color);
  }

  public destroyNpc(): void {
    this.visionGraphics.destroy();
    this.nameText.destroy();
    this.statusText.destroy();
    this.destroy();
  }
}

function getConeColor(state: NpcPresentationState): number {
  if (state === 'APPROACHING') return 0xef233c;
  if (state === 'CONVERSATION') return 0x8338ec;
  switch (state) {
    case NPC_STATE.Suspicious:
      return 0xffb703;
    case NPC_STATE.Detected:
      return 0xef233c;
    case NPC_STATE.Searching:
      return 0x8ecae6;
    case NPC_STATE.Returning:
      return 0x90be6d;
    case NPC_STATE.Patrol:
      return 0xffd166;
  }
}
