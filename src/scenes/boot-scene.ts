import Phaser from 'phaser';
import { TITLE_KEY_ART } from '../data/branding/brand-config';
import { openingPanels } from '../data/narrative/opening-sequence';
import {
  HUBI_FRAME_HEIGHT,
  HUBI_FRAME_WIDTH,
  HUBI_SPRITESHEET_URL,
  HUBI_TEXTURE_KEY,
} from '../data/player/player-animation-config';
import { createPlaceholderTextures } from '../game/create-placeholder-textures';
import { registerPlayerAnimations } from '../game/register-player-animations';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('BootScene');
  }

  public preload(): void {
    if (TITLE_KEY_ART.available) {
      this.load.image(TITLE_KEY_ART.key, TITLE_KEY_ART.url);
    }
    for (const panel of openingPanels) {
      this.load.image(panel.assetKey, panel.assetUrl);
    }
    this.load.spritesheet(HUBI_TEXTURE_KEY, HUBI_SPRITESHEET_URL, {
      frameWidth: HUBI_FRAME_WIDTH,
      frameHeight: HUBI_FRAME_HEIGHT,
    });
  }

  public create(): void {
    createPlaceholderTextures(this);
    registerPlayerAnimations(this);
    void this.startInitialSceneAfterFontsLoad();
  }

  private async startInitialSceneAfterFontsLoad(): Promise<void> {
    await Promise.all([
      document.fonts.load('700 32px "Hubi Display"'),
      document.fonts.load('400 16px "Hubi Tagline"'),
    ]).catch(() => undefined);

    if (
      import.meta.env.DEV &&
      new URLSearchParams(window.location.search).get('hubi-showcase') === '1'
    ) {
      this.scene.start('HubiShowcaseScene');
      return;
    }
    this.scene.start('MenuScene');
  }
}
