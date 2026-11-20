import Phaser from 'phaser';
import { BootScene } from '../scenes/boot-scene';
import { GameScene } from '../scenes/game-scene';
import { MenuScene } from '../scenes/menu-scene';
import { OpeningScene } from '../scenes/opening-scene';
import { HubiShowcaseScene } from '../scenes/hubi-showcase-scene';
import { ZusScene } from '../scenes/zus-scene';
import { MinigameScene } from '../scenes/minigame-scene';
import { resolveDeveloperToolsEnabled } from '../config/developer-tools';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const WORLD_WIDTH = 2200;
// 1400 for the estate, then a strip of lawn and the river along the bottom.
export const WORLD_HEIGHT = 1720;
export const DEVELOPER_TOOLS_ENABLED = resolveDeveloperToolsEnabled(
  import.meta.env.DEV,
  import.meta.env.VITE_ENABLE_DEBUG,
);
export const STEALTH_DEBUG_DEFAULT = DEVELOPER_TOOLS_ENABLED;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#111820',
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 },
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: DEVELOPER_TOOLS_ENABLED
    ? [BootScene, MenuScene, OpeningScene, GameScene, MinigameScene, ZusScene, HubiShowcaseScene]
    : [BootScene, MenuScene, OpeningScene, GameScene, MinigameScene, ZusScene],
};
