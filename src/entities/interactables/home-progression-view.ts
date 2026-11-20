import Phaser from 'phaser';
import { HOME_ART } from '../../data/world/world-art';
import type { HomeVisualDefinition } from '../../domain/home/home-progression-types';
import { UI_FONT_FAMILY } from '../../ui/text-style';

export class HomeProgressionView {
  private readonly objects = new Map<string, Phaser.GameObjects.Container>();

  public constructor(
    scene: Phaser.Scene,
    definitions: readonly HomeVisualDefinition[],
  ) {
    for (const definition of definitions) {
      const art = createArt(scene, definition);
      if (art) {
        const container = scene.add
          .container(definition.x, definition.y, art)
          .setDepth(definition.depth ?? Math.round(definition.y + 4))
          .setVisible(false);
        this.objects.set(definition.id, container);
        continue;
      }

      const body = scene.add
        .rectangle(0, 0, definition.width, definition.height, definition.color)
        .setStrokeStyle(2, 0x252422);
      const label = scene.add
        .text(0, 0, definition.label, {
          fontFamily: UI_FONT_FAMILY,
          fontSize: definition.kind === 'filament-spool' ? '8px' : '7px',
          fontStyle: 'bold',
          color: '#ffffff',
          align: 'center',
          stroke: '#111820',
          strokeThickness: 2,
        })
        .setOrigin(0.5);
      const parts: Phaser.GameObjects.GameObject[] = [body, label];

      if (definition.kind === 'filament-spool') {
        parts.unshift(
          scene.add
            .ellipse(0, -definition.height / 2, definition.width, 8, definition.color)
            .setStrokeStyle(2, 0x252422),
        );
      }

      const container = scene.add
        .container(definition.x, definition.y, parts)
        .setDepth(definition.depth ?? Math.round(definition.y + 4))
        .setVisible(false);

      this.objects.set(definition.id, container);
    }
  }

  public synchronize(visibleDefinitions: readonly HomeVisualDefinition[]): void {
    const visibleIds = new Set(visibleDefinitions.map((definition) => definition.id));

    for (const [id, object] of this.objects) {
      object.setVisible(visibleIds.has(id));
    }
  }

  public destroy(): void {
    for (const object of this.objects.values()) {
      object.destroy(true);
    }
    this.objects.clear();
  }
}

/** Grafika zamiast prostokąta: szpula barwiona kolorem filamentu (z małym podpisem) i wydruk L4. */
function createArt(
  scene: Phaser.Scene,
  definition: HomeVisualDefinition,
): Phaser.GameObjects.GameObject[] | null {
  if ('textureKey' in definition && definition.textureKey && scene.textures.exists(definition.textureKey)) {
    return [scene.add.image(0, 0, definition.textureKey)];
  }
  if (definition.kind === 'filament-spool' && scene.textures.exists(HOME_ART.spool.key)) {
    const spool = scene.add.image(0, 0, HOME_ART.spool.key).setTint(definition.color);
    const label = scene.add
      .text(0, HOME_ART.spool.height / 2 + 5, definition.label, {
        fontFamily: UI_FONT_FAMILY,
        fontSize: '7px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#111820',
        strokeThickness: 2,
      })
      .setOrigin(0.5);
    return [spool, label];
  }
  if (definition.id === 'l4-400-finished-print' && scene.textures.exists(HOME_ART.l4Print.key)) {
    return [scene.add.image(0, 0, HOME_ART.l4Print.key)];
  }
  return null;
}
