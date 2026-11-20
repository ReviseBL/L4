import Phaser from 'phaser';
import { UI_TEXT_RESOLUTION } from '../ui/text-style';

let installed = false;

/**
 * Makes every `scene.add.text(...)` crisp: higher raster resolution and
 * linear filtering for the text texture only (sprites stay pixel-sharp).
 * Installed once before the game boots, so no scene needs to remember it.
 */
export function installCrispText(): void {
  if (installed) return;
  installed = true;
  const factory = Phaser.GameObjects.GameObjectFactory.prototype;
  const originalText = factory.text;
  factory.text = function crispText(
    this: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    text: string | string[],
    style?: Phaser.Types.GameObjects.Text.TextStyle,
  ): Phaser.GameObjects.Text {
    const created = originalText.call(this, x, y, text, { resolution: UI_TEXT_RESOLUTION, ...style });
    created.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    return created;
  };
}
