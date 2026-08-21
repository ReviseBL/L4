import Phaser from 'phaser';
import { TITLE_KEY_ART } from '../data/branding/brand-config';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/game-config';
import { calculateCoverPlacement } from './title-cover-layout';

export function createTitlePresentation(scene: Phaser.Scene): void {
  scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x050607).setOrigin(0);

  if (TITLE_KEY_ART.available && scene.textures.exists(TITLE_KEY_ART.key)) {
    const source = scene.textures.get(TITLE_KEY_ART.key).getSourceImage() as HTMLImageElement;
    const sourceWidth = source.naturalWidth || source.width;
    const sourceHeight = source.naturalHeight || source.height;
    const placement = calculateCoverPlacement(
      sourceWidth,
      sourceHeight,
      GAME_WIDTH,
      GAME_HEIGHT,
      TITLE_KEY_ART.focalPoint.x,
      TITLE_KEY_ART.focalPoint.y,
    );
    scene.add
      .image(
        placement.x + (sourceWidth * placement.scale) / 2,
        placement.y + (sourceHeight * placement.scale) / 2,
        TITLE_KEY_ART.key,
      )
      .setOrigin(0.5)
      .setScale(placement.scale);
  }

  createMenuContrast(scene);
  createGrain(scene);
  createRain(scene);
  createVignette(scene);
}

function createMenuContrast(scene: Phaser.Scene): void {
  const graphics = scene.add.graphics();
  graphics.fillGradientStyle(0x030405, 0x030405, 0x030405, 0x030405, 0.42, 0, 0.42, 0);
  graphics.fillRect(0, 0, 510, GAME_HEIGHT);
}

function createGrain(scene: Phaser.Scene): void {
  const grain = scene.add.graphics().setAlpha(0.08);
  for (let index = 0; index < 150; index += 1) {
    const x = (index * 137 + 29) % GAME_WIDTH;
    const y = (index * 83 + 17) % GAME_HEIGHT;
    grain.fillStyle(index % 3 === 0 ? 0xd8d4ca : 0x55575b, index % 5 === 0 ? 0.22 : 0.1);
    grain.fillRect(x, y, 1, 1);
  }
  scene.tweens.add({ targets: grain, alpha: { from: 0.05, to: 0.09 }, duration: 1_200, yoyo: true, repeat: -1 });
}

function createRain(scene: Phaser.Scene): void {
  const rain = scene.add.graphics().setAlpha(0.055);
  rain.lineStyle(1, 0xc8cbd0, 0.18);
  for (let index = 0; index < 68; index += 1) {
    const x = (index * 71 + 19) % (GAME_WIDTH + 80);
    const y = (index * 113 + 31) % (GAME_HEIGHT + 80) - 40;
    const length = 8 + (index % 4) * 3;
    rain.lineBetween(x, y, x - 3, y + length);
  }
  scene.tweens.add({ targets: rain, y: 28, duration: 4_800, ease: 'Linear', yoyo: true, repeat: -1 });
}

function createVignette(scene: Phaser.Scene): void {
  const vignette = scene.add.graphics();
  vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.5, 0.5, 0, 0);
  vignette.fillRect(0, 0, GAME_WIDTH, 105);
  vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.58, 0.58);
  vignette.fillRect(0, GAME_HEIGHT - 125, GAME_WIDTH, 125);
}
