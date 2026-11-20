import Phaser from 'phaser';
import { UI_FONT_FAMILY } from '../../ui/text-style';

export interface StandingNpcOptions {
  x: number;
  y: number;
  label: string;
  /** Real sprite (loaded when the art exists). */
  textureKey: string;
  /** Coat/clothes colour of the placeholder figure. */
  placeholderColor: number;
  apronColor?: number;
}

/**
 * A non-patrolling character (shop assistant, pharmacist) standing in place.
 * Uses its sprite when loaded, otherwise a simple placeholder figure.
 */
export function addStandingNpc(scene: Phaser.Scene, options: StandingNpcOptions): Phaser.GameObjects.Image {
  const key = scene.textures.exists(options.textureKey) ? options.textureKey : ensurePlaceholder(scene, options);
  const sprite = scene.add.image(options.x, options.y, key).setOrigin(0.5, 0.9).setDepth(options.y);
  scene.add
    .text(options.x, options.y - 50, options.label, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#f4f1de',
      stroke: '#06090d',
      strokeThickness: 2,
    })
    .setOrigin(0.5)
    .setDepth(options.y + 1);
  return sprite;
}

function ensurePlaceholder(scene: Phaser.Scene, options: StandingNpcOptions): string {
  const key = `${options.textureKey}-placeholder`;
  if (scene.textures.exists(key)) return key;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(options.placeholderColor, 1).fillRoundedRect(4, 16, 20, 26, 5);
  if (options.apronColor !== undefined) g.fillStyle(options.apronColor, 1).fillRect(8, 22, 12, 20);
  g.fillStyle(0xf2c9a0, 1).fillCircle(14, 11, 8);
  g.fillStyle(0x5c3d2e, 1).fillEllipse(14, 6, 18, 8);
  g.lineStyle(2, 0x1b1b1b, 1).strokeRoundedRect(4, 16, 20, 26, 5).strokeCircle(14, 11, 8);
  g.generateTexture(key, 28, 48);
  g.destroy();
  return key;
}
