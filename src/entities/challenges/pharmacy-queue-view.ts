import Phaser from 'phaser';
import { PHARMACIST, pharmacyQueueConfig, seniors } from '../../data/challenges/pharmacy-queues';
import type { PharmacyQueueDefinition, SeniorDefinition } from '../../domain/challenges/pharmacy-queue-types';
import type { PharmacyQueue } from '../../systems/challenges/pharmacy-queue';

interface SeniorActor {
  sprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
}

const WALK_OUT_MS = 1_600;
const STEP_FORWARD_MS = 550;
const LABEL_OFFSET_Y = 50;

/**
 * Seniors waiting at the pharmacy counter, the speech bubble of the one being
 * served and the "end of the queue" marker where Hubi has to stand.
 */
export class PharmacyQueueView {
  private actors: (SeniorActor | null)[] = [];
  private readonly bubble: Phaser.GameObjects.Text;
  private readonly zoneMarker: Phaser.GameObjects.Ellipse;
  private readonly zoneLabel: Phaser.GameObjects.Text;
  private readonly pharmacist: Phaser.GameObjects.Image;
  private readonly pharmacistBubble: Phaser.GameObjects.Text;

  public constructor(private readonly scene: Phaser.Scene) {
    for (const senior of Object.values(seniors)) ensurePlaceholderTexture(scene, senior);
    ensurePlaceholderTexture(scene, { textureKey: PHARMACIST.textureKey, placeholderColor: PHARMACIST.placeholderColor });
    // Always behind the counter, facing the customers.
    const desk = pharmacyQueueConfig.pharmacistSpot;
    const pharmacistKey = scene.textures.exists(PHARMACIST.textureKey) ? PHARMACIST.textureKey : `${PHARMACIST.textureKey}-placeholder`;
    this.pharmacist = scene.add.image(desk.x, desk.y, pharmacistKey).setOrigin(0.5, 0.9).setDepth(desk.y);
    scene.add.text(desk.x, desk.y + 12, PHARMACIST.displayName, labelStyle(8, '#f4f1de')).setOrigin(0.5, 0).setDepth(desk.y + 1);
    this.pharmacistBubble = scene.add
      .text(desk.x, desk.y + 26, '', labelStyle(10, '#1b1b1b', '#e9f5db'))
      .setBackgroundColor('#e9f5db')
      .setPadding(5, 3)
      .setWordWrapWidth(220)
      .setOrigin(0.5, 0)
      .setDepth(99_500)
      .setVisible(false);
    const spot = pharmacyQueueConfig.playerSpot;
    this.zoneMarker = scene.add
      .ellipse(spot.x, spot.y + 14, pharmacyQueueConfig.playerZoneRadius * 1.6, pharmacyQueueConfig.playerZoneRadius * 0.7)
      .setStrokeStyle(2, 0xffd166, 0.9)
      .setFillStyle(0xffd166, 0.12)
      .setDepth(spot.y - 30)
      .setVisible(false);
    this.zoneLabel = scene.add
      .text(spot.x, spot.y + 34, 'KONIEC KOLEJKI', labelStyle(9, '#ffd166'))
      .setOrigin(0.5)
      .setDepth(spot.y + 40)
      .setVisible(false);
    this.bubble = scene.add
      .text(0, 0, '', labelStyle(10, '#1b1b1b', '#f4f1de'))
      .setBackgroundColor('#f4f1de')
      .setPadding(5, 3)
      .setWordWrapWidth(210)
      .setOrigin(0.5, 1)
      .setDepth(99_500)
      .setVisible(false);
  }

  public spawn(definition: PharmacyQueueDefinition): void {
    this.despawn();
    this.actors = definition.customers.map((customer, index) => {
      const senior = seniors[customer.seniorId];
      const spot = pharmacyQueueConfig.spots[index] ?? pharmacyQueueConfig.spots[pharmacyQueueConfig.spots.length - 1]!;
      const key = this.scene.textures.exists(senior.textureKey) ? senior.textureKey : placeholderKey(senior);
      // Art faces right; the queue faces the counter on the left.
      const sprite = this.scene.add.image(spot.x, spot.y, key).setOrigin(0.5, 0.9).setFlipX(true).setDepth(spot.y);
      const label = this.scene.add
        .text(spot.x, spot.y - LABEL_OFFSET_Y, senior.displayName, labelStyle(8, '#f4f1de'))
        .setOrigin(0.5)
        .setDepth(spot.y + 1);
      return { sprite, label };
    });
    this.zoneMarker.setVisible(true);
    this.zoneLabel.setVisible(true);
  }

  public render(queue: PharmacyQueue, playerInZone: boolean): void {
    const serving = this.actors[queue.getServingIndex()];
    const line = queue.isDone() ? null : queue.getCurrentLine();
    if (serving && line?.speaker === 'senior') {
      this.bubble.setText(line.text).setPosition(serving.sprite.x, serving.sprite.y - LABEL_OFFSET_Y - 8).setVisible(true);
    } else {
      this.bubble.setVisible(false);
    }
    // The pharmacist answers from behind the counter (bubble below her).
    this.pharmacistBubble.setText(line?.speaker === 'pharmacist' ? line.text : '').setVisible(line?.speaker === 'pharmacist');
    const color = playerInZone ? 0x90be6d : 0xffd166;
    this.zoneMarker.setStrokeStyle(2, color, 0.9).setFillStyle(color, playerInZone ? 0.2 : 0.12);
    this.zoneLabel
      .setColor(playerInZone ? '#90be6d' : '#ffd166')
      .setText(playerInZone ? 'CZEKASZ W KOLEJCE' : 'KONIEC KOLEJKI');
    if (queue.isDone()) {
      this.zoneMarker.setVisible(false);
      this.zoneLabel.setVisible(false);
    }
  }

  /** The served senior shuffles out; everyone behind steps forward. */
  public onServed(customerIndex: number): void {
    const actor = this.actors[customerIndex];
    if (actor) {
      this.actors[customerIndex] = null;
      const exit = pharmacyQueueConfig.exit;
      this.scene.tweens.add({ targets: actor.sprite, x: exit.x, y: exit.y, alpha: 0, duration: WALK_OUT_MS, onComplete: () => actor.sprite.destroy() });
      this.scene.tweens.add({ targets: actor.label, x: exit.x, y: exit.y - LABEL_OFFSET_Y, alpha: 0, duration: WALK_OUT_MS, onComplete: () => actor.label.destroy() });
    }
    this.actors.forEach((waiting, index) => {
      if (!waiting || index <= customerIndex) return;
      const spot = pharmacyQueueConfig.spots[index - customerIndex - 1];
      if (!spot) return;
      this.scene.tweens.add({
        targets: waiting.sprite,
        x: spot.x,
        y: spot.y,
        duration: STEP_FORWARD_MS,
        onUpdate: () => waiting.sprite.setDepth(waiting.sprite.y),
      });
      this.scene.tweens.add({ targets: waiting.label, x: spot.x, y: spot.y - LABEL_OFFSET_Y, duration: STEP_FORWARD_MS });
    });
  }

  public despawn(): void {
    for (const actor of this.actors) {
      if (!actor) continue;
      this.scene.tweens.killTweensOf([actor.sprite, actor.label]);
      actor.sprite.destroy();
      actor.label.destroy();
    }
    this.actors = [];
    this.bubble.setVisible(false);
    this.pharmacistBubble.setVisible(false);
    this.zoneMarker.setVisible(false);
    this.zoneLabel.setVisible(false);
  }

  public destroy(): void {
    this.despawn();
    this.bubble.destroy();
    this.pharmacistBubble.destroy();
    this.pharmacist.destroy();
    this.zoneMarker.destroy();
    this.zoneLabel.destroy();
  }
}

function placeholderKey(senior: Pick<SeniorDefinition, 'textureKey'>): string {
  return `${senior.textureKey}-placeholder`;
}

/** Simple figure used until/if a character sprite is missing. */
function ensurePlaceholderTexture(scene: Phaser.Scene, senior: Pick<SeniorDefinition, 'textureKey' | 'placeholderColor'>): void {
  const key = placeholderKey(senior);
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(senior.placeholderColor, 1).fillRoundedRect(4, 16, 20, 26, 5);
  g.fillStyle(0xf2c9a0, 1).fillCircle(14, 11, 8);
  g.fillStyle(0xd9d9d9, 1).fillEllipse(14, 6, 18, 8);
  g.lineStyle(2, 0x1b1b1b, 1).strokeRoundedRect(4, 16, 20, 26, 5).strokeCircle(14, 11, 8);
  g.generateTexture(key, 28, 48);
  g.destroy();
}

function labelStyle(fontSize: number, color: string, stroke = '#06090d'): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: 'Courier New, monospace', fontSize: `${fontSize}px`, fontStyle: 'bold', color, stroke, strokeThickness: 2 };
}
