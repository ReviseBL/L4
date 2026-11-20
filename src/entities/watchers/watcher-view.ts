import Phaser from 'phaser';
import type { Point2D } from '../../core/math/geometry-types';
import type { WatcherDefinition } from '../../domain/watchers/watcher-types';

interface WatcherActor {
  definition: WatcherDefinition;
  sprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  cone: Phaser.GameObjects.Graphics;
  bubble: Phaser.GameObjects.Text;
  bubbleUntilMs: number;
}

/** Draws the neighbours that are outside this mission, their gaze and shouts. */
export class WatcherView {
  private actors = new Map<string, WatcherActor>();

  public constructor(private readonly scene: Phaser.Scene) {}

  public sync(active: readonly WatcherDefinition[]): void {
    this.clear();
    for (const definition of active) {
      const { x, y } = definition.position;
      const key = this.scene.textures.exists(definition.textureKey)
        ? definition.textureKey
        : ensurePlaceholder(this.scene, definition);
      const sprite = this.scene.add.image(x, y, key).setOrigin(0.5, 0.9).setDepth(y);
      const label = this.scene.add.text(x, y - 50, definition.displayName, textStyle(8, '#f4f1de')).setOrigin(0.5).setDepth(y + 1);
      const cone = this.scene.add.graphics().setDepth(y - 2);
      const bubble = this.scene.add
        .text(x, y - 60, '', textStyle(11, '#1b1b1b', '#fff3b0'))
        .setBackgroundColor('#fff3b0')
        .setPadding(5, 3)
        .setOrigin(0.5, 1)
        .setDepth(99_600)
        .setVisible(false);
      this.actors.set(definition.id, { definition, sprite, label, cone, bubble, bubbleUntilMs: 0 });
    }
  }

  public render(id: string, facingRadians: number, visionPoints: readonly Point2D[], nowMs: number): void {
    const actor = this.actors.get(id);
    if (!actor) return;
    const { x, y } = actor.definition.position;
    // Side sprite when looking left/right, front sprite otherwise.
    const sideKey = `${actor.definition.textureKey}-side`;
    const horizontal = Math.cos(facingRadians);
    if (Math.abs(horizontal) > 0.5 && this.scene.textures.exists(sideKey)) {
      actor.sprite.setTexture(sideKey).setFlipX(horizontal < 0);
    } else if (this.scene.textures.exists(actor.definition.textureKey)) {
      actor.sprite.setTexture(actor.definition.textureKey).setFlipX(false);
    }
    actor.cone.clear();
    actor.cone.fillStyle(0xffd166, 0.16).fillPoints([{ x, y }, ...visionPoints], true);
    actor.cone.lineStyle(2, 0xffd166, 0.65).strokePoints([{ x, y }, ...visionPoints], true);
    actor.bubble.setVisible(nowMs < actor.bubbleUntilMs);
  }

  public shout(id: string, line: string, nowMs: number, displayMs: number): void {
    const actor = this.actors.get(id);
    if (!actor) return;
    actor.bubble.setText(line).setVisible(true);
    actor.bubbleUntilMs = nowMs + displayMs;
  }

  public clear(): void {
    for (const actor of this.actors.values()) {
      actor.sprite.destroy();
      actor.label.destroy();
      actor.cone.destroy();
      actor.bubble.destroy();
    }
    this.actors.clear();
  }
}

function ensurePlaceholder(scene: Phaser.Scene, definition: WatcherDefinition): string {
  const key = `${definition.textureKey}-placeholder`;
  if (scene.textures.exists(key)) return key;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(definition.placeholderColor, 1).fillRoundedRect(4, 16, 20, 26, 5);
  g.fillStyle(0xf2c9a0, 1).fillCircle(14, 11, 8);
  g.fillStyle(0x8d6e63, 1).fillEllipse(14, 6, 18, 8);
  g.lineStyle(2, 0x1b1b1b, 1).strokeRoundedRect(4, 16, 20, 26, 5).strokeCircle(14, 11, 8);
  g.generateTexture(key, 28, 48);
  g.destroy();
  return key;
}

function textStyle(fontSize: number, color: string, stroke = '#06090d'): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: 'Courier New, monospace', fontSize: `${fontSize}px`, fontStyle: 'bold', color, stroke, strokeThickness: 2 };
}
