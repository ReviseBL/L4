import Phaser from 'phaser';
import type { HomeVisualDefinition } from '../../domain/home/home-progression-types';

export class HomeProgressionView {
  private readonly objects = new Map<string, Phaser.GameObjects.Container>();

  public constructor(
    scene: Phaser.Scene,
    definitions: readonly HomeVisualDefinition[],
  ) {
    for (const definition of definitions) {
      const body = scene.add
        .rectangle(0, 0, definition.width, definition.height, definition.color)
        .setStrokeStyle(2, 0x252422);
      const label = scene.add
        .text(0, 0, definition.label, {
          fontFamily: 'Courier New, monospace',
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
