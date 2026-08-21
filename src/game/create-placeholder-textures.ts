import Phaser from 'phaser';

const PLAYER_TEXTURE_KEY = 'player-placeholder';
const WORK_COLLEAGUE_TEXTURE_KEY = 'work-colleague-placeholder';
const HR_TEXTURE_KEY = 'hr-placeholder';
const COMPANY_CAR_TEXTURE_KEY = 'company-car-placeholder';
const MANAGER_TEXTURE_KEY = 'manager-placeholder';

export function createPlaceholderTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists(PLAYER_TEXTURE_KEY)) {
    return;
  }

  const graphics = scene.add.graphics();

  graphics.fillStyle(0xf0c7a5);
  graphics.fillCircle(16, 9, 8);

  graphics.lineStyle(2, 0x1b263b);
  graphics.strokeRect(9, 6, 6, 5);
  graphics.strokeRect(17, 6, 6, 5);
  graphics.lineBetween(15, 8, 17, 8);

  graphics.fillStyle(0xf2e9d8);
  graphics.fillRect(7, 17, 18, 14);

  graphics.fillStyle(0x777b84);
  graphics.fillRect(9, 31, 6, 9);
  graphics.fillRect(17, 31, 6, 9);

  graphics.fillStyle(0xf7f7f2);
  graphics.fillRect(7, 40, 9, 4);
  graphics.fillRect(17, 40, 9, 4);

  graphics.generateTexture(PLAYER_TEXTURE_KEY, 32, 44);
  graphics.clear();

  graphics.fillStyle(0xe8b98d);
  graphics.fillCircle(16, 9, 8);
  graphics.fillStyle(0x5b3a29);
  graphics.fillRect(8, 3, 16, 4);
  graphics.fillStyle(0x264653);
  graphics.fillRect(7, 17, 18, 15);
  graphics.fillStyle(0x343a40);
  graphics.fillRect(9, 32, 6, 9);
  graphics.fillRect(17, 32, 6, 9);
  graphics.fillStyle(0x1d3557);
  graphics.fillRect(7, 41, 9, 3);
  graphics.fillRect(17, 41, 9, 3);
  graphics.fillStyle(0x8d5524);
  graphics.fillRect(25, 20, 6, 14);

  graphics.generateTexture(WORK_COLLEAGUE_TEXTURE_KEY, 32, 44);
  graphics.clear();

  graphics.fillStyle(0xe2b899);
  graphics.fillCircle(16, 9, 8);
  graphics.fillStyle(0x3c096c);
  graphics.fillRect(7, 17, 18, 16);
  graphics.fillStyle(0xf8f9fa);
  graphics.fillRect(14, 18, 4, 12);
  graphics.fillStyle(0xf72585);
  graphics.fillRect(21, 19, 8, 6);
  graphics.fillStyle(0x343a40);
  graphics.fillRect(9, 33, 6, 8);
  graphics.fillRect(17, 33, 6, 8);
  graphics.fillStyle(0x8d5524);
  graphics.fillRect(25, 27, 7, 12);
  graphics.generateTexture(HR_TEXTURE_KEY, 32, 44);
  graphics.clear();
  graphics.fillStyle(0xd9a87c);
  graphics.fillCircle(16, 9, 8);
  graphics.fillStyle(0x2b2d42);
  graphics.fillRect(8, 2, 16, 5);
  graphics.fillStyle(0x6a040f);
  graphics.fillRect(6, 17, 20, 17);
  graphics.fillStyle(0xf4f1de);
  graphics.fillRect(14, 18, 4, 13);
  graphics.fillStyle(0x111820);
  graphics.fillRect(9, 34, 6, 8);
  graphics.fillRect(17, 34, 6, 8);
  graphics.fillStyle(0x7f5539);
  graphics.fillRect(25, 24, 7, 15);
  graphics.generateTexture(MANAGER_TEXTURE_KEY, 32, 44);
  graphics.clear();
  graphics.fillStyle(0x264653);
  graphics.fillRoundedRect(2, 6, 68, 32, 7);
  graphics.fillStyle(0x8ecae6);
  graphics.fillRect(18, 9, 32, 12);
  graphics.fillStyle(0xf4f1de);
  graphics.fillRect(57, 12, 10, 7);
  graphics.fillStyle(0x111820);
  graphics.fillCircle(17, 38, 7);
  graphics.fillCircle(55, 38, 7);
  graphics.generateTexture(COMPANY_CAR_TEXTURE_KEY, 72, 46);
  graphics.destroy();
}

export { COMPANY_CAR_TEXTURE_KEY, HR_TEXTURE_KEY, MANAGER_TEXTURE_KEY, PLAYER_TEXTURE_KEY, WORK_COLLEAGUE_TEXTURE_KEY };
