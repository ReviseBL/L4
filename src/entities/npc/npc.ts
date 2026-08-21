import Phaser from 'phaser';
import type { Point2D } from '../../core/math/geometry-types';
import { NPC_STATE, type NpcState } from '../../domain/npcs/npc-types';
import { WORK_COLLEAGUE_TEXTURE_KEY } from '../../game/create-placeholder-textures';

export type NpcPresentationState = NpcState | 'APPROACHING' | 'CONVERSATION';

export class Npc extends Phaser.Physics.Arcade.Sprite {
  private readonly visionGraphics: Phaser.GameObjects.Graphics;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly statusText: Phaser.GameObjects.Text;

  public constructor(scene: Phaser.Scene, x: number, y: number, displayName: string, textureKey = WORK_COLLEAGUE_TEXTURE_KEY) {
    super(scene, x, y, textureKey);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setSize(24, 25);
    this.setOffset(4, 17);

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
