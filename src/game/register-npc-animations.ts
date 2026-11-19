import Phaser from 'phaser';
import { getNpcAnimationDefinitions, NPC_SPRITES } from '../data/npcs/npc-sprite-config';

export function registerNpcAnimations(scene: Phaser.Scene): void {
  for (const sprite of Object.values(NPC_SPRITES)) {
    if (!scene.textures.exists(sprite.textureKey)) continue;

    for (const definition of getNpcAnimationDefinitions(sprite)) {
      if (scene.anims.exists(definition.key)) continue;
      scene.anims.create({
        key: definition.key,
        frames: definition.frames.map((frame) => ({ key: sprite.textureKey, frame })),
        frameRate: definition.frameRate,
        repeat: definition.repeat,
      });
    }
  }
}
