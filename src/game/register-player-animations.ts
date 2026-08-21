import Phaser from 'phaser';
import {
  getHubiAnimationKey,
  HUBI_ANIMATION_DEFINITIONS,
  HUBI_TEXTURE_KEY,
} from '../data/player/player-animation-config';

export function registerPlayerAnimations(scene: Phaser.Scene): boolean {
  if (!scene.textures.exists(HUBI_TEXTURE_KEY)) return false;

  for (const definition of HUBI_ANIMATION_DEFINITIONS) {
    const key = getHubiAnimationKey(definition.action, definition.direction);
    if (scene.anims.exists(key)) continue;
    scene.anims.create({
      key,
      frames: definition.frames.map((frame) => ({ key: HUBI_TEXTURE_KEY, frame })),
      frameRate: definition.frameRate,
      repeat: definition.repeat,
    });
  }
  return true;
}

