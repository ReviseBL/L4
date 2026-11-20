import Phaser from 'phaser';
import { createSeededRandom } from '../core/math/seeded-random';
import { RIVER, RIVER_TRASH, SEWAGE_OUTFALLS } from '../data/world/river';
import { RiverTrashDrift } from '../systems/world/river-trash';
import { UI_FONT_FAMILY } from '../ui/text-style';
import { RIVER_ART } from '../data/art/round4-art';

const WATER_KEY = 'river-water';
const BANK_KEY = 'river-bank';

/** The dirty river along the bottom edge: flowing water, muddy bank, sewage and drifting rubbish. */
export class RiverView {
  private readonly water: Phaser.GameObjects.TileSprite | Phaser.GameObjects.Rectangle;
  private readonly plumes: Phaser.GameObjects.Graphics;
  private readonly drift: RiverTrashDrift;
  private readonly trashSprites = new Map<object, Phaser.GameObjects.Image>();
  private readonly streaks: Phaser.GameObjects.Image[] = [];
  private elapsedMs = 0;

  public constructor(
    private readonly scene: Phaser.Scene,
    obstacles: Phaser.Physics.Arcade.StaticGroup,
    worldWidth: number,
  ) {
    ensureRiverTextures(scene);
    const bankHeight = RIVER.waterTop - RIVER.bankTop;
    scene.add.tileSprite(worldWidth / 2, RIVER.bankTop + bankHeight / 2, worldWidth, bankHeight, BANK_KEY).setDepth(1);
    const waterHeight = RIVER.bottom - RIVER.waterTop;
    // Painted water tile when loaded, the procedural one otherwise.
    const waterKey = scene.textures.exists(RIVER_ART.water.key) ? RIVER_ART.water.key : WATER_KEY;
    this.water = scene.textures.exists(waterKey)
      ? scene.add.tileSprite(worldWidth / 2, RIVER.waterTop + waterHeight / 2, worldWidth, waterHeight, waterKey).setDepth(1)
      : scene.add.rectangle(worldWidth / 2, RIVER.waterTop + waterHeight / 2, worldWidth, waterHeight, 0x3d6c86).setDepth(1);
    addReeds(scene, worldWidth);
    for (const outfall of SEWAGE_OUTFALLS) addOutfall(scene, outfall.x);
    addNoSwimmingSign(scene, SEWAGE_OUTFALLS[1]?.x ?? 1280);
    this.plumes = scene.add.graphics().setDepth(2);
    if (scene.textures.exists(RIVER_ART.streak.key)) {
      for (const outfall of SEWAGE_OUTFALLS) {
        this.streaks.push(
          scene.add.image(outfall.x - 4, RIVER.waterTop + RIVER_ART.streak.height / 2 - 4, RIVER_ART.streak.key).setOrigin(0, 0.5).setDepth(2).setAlpha(0.95),
        );
      }
    }
    this.drift = new RiverTrashDrift(RIVER_TRASH, worldWidth, createSeededRandom(Date.now() & 0xffff));

    // Nobody goes for a swim in that.
    const blocker = scene.add.rectangle(worldWidth / 2, RIVER.waterTop + 4 + waterHeight / 2, worldWidth, waterHeight, 0).setVisible(false);
    obstacles.add(blocker);
  }

  public update(deltaMs: number): void {
    this.elapsedMs += deltaMs;
    if (this.water instanceof Phaser.GameObjects.TileSprite) {
      this.water.tilePositionX -= (RIVER.flowSpeed * deltaMs) / 1_000;
    }
    if (this.streaks.length > 0) this.swayStreaks();
    else this.drawPlumes();
    const items = this.drift.update(deltaMs);
    const alive = new Set<object>(items);
    for (const [item, sprite] of this.trashSprites) {
      if (!alive.has(item)) { sprite.destroy(); this.trashSprites.delete(item); }
    }
    for (const item of items) {
      let sprite = this.trashSprites.get(item);
      if (!sprite) {
        if (!this.scene.textures.exists(item.key)) continue;
        sprite = this.scene.add.image(item.x, item.y, item.key).setDepth(3).setTint(0xc9c7b0).setAlpha(0.95);
        this.trashSprites.set(item, sprite);
      }
      const wobble = Math.sin(this.elapsedMs / 650 + item.phase);
      sprite.setPosition(Math.round(item.x), Math.round(item.y + wobble * 1.5)).setRotation(wobble * 0.18);
    }
  }

  public destroy(): void {
    for (const sprite of this.trashSprites.values()) sprite.destroy();
    for (const streak of this.streaks) streak.destroy();
    this.trashSprites.clear();
    this.plumes.destroy();
  }

  /** The painted sewage streaks breathe a little, as if carried by the current. */
  private swayStreaks(): void {
    const t = this.elapsedMs / 1_000;
    this.streaks.forEach((streak, index) => {
      streak.setScale(1 + Math.sin(t * 0.7 + index) * 0.04, 1 + Math.sin(t * 1.1 + index * 2) * 0.08);
      streak.setAlpha(0.88 + Math.sin(t * 0.9 + index) * 0.07);
    });
  }

  /** Fallback: a narrow dirty streak from each pipe, widening and fading downstream. */
  private drawPlumes(): void {
    const g = this.plumes.clear();
    const t = this.elapsedMs / 1_000;
    for (const outfall of SEWAGE_OUTFALLS) {
      const segments = 34;
      for (let index = 0; index < segments; index += 1) {
        const k = index / segments;
        const x = outfall.x + 4 + index * 10;
        const centre = RIVER.waterTop + 7 + index * 0.85 + Math.sin(t * 1.4 + index * 0.45) * (1 + k * 2.5);
        const halfWidth = 2 + k * 9;
        g.fillStyle(index % 3 === 0 ? 0x6e5126 : 0x7d5e2c, 0.9 * (1 - k) + 0.12);
        g.fillRect(Math.round(x), Math.round(centre - halfWidth), 11, Math.max(2, Math.round(halfWidth * 2)));
        // Greasy scum flecks along the streak.
        if (index % 5 === 2) {
          g.fillStyle(0xc9bf8f, 0.5 * (1 - k));
          g.fillRect(Math.round(x + 3), Math.round(centre - 1), 3, 1);
        }
      }
      // Gush under the pipe.
      g.fillStyle(0x5a3f1f, 0.9).fillRect(outfall.x - 3, RIVER.waterTop, 7, 6);
      g.fillStyle(0xd8cfa8, 0.6).fillRect(outfall.x - 2, RIVER.waterTop + 5, 5, 1);
    }
  }
}

function ensureRiverTextures(scene: Phaser.Scene): void {
  const random = createSeededRandom(0x5eed);
  if (!scene.textures.exists(WATER_KEY)) {
    const texture = scene.textures.createCanvas(WATER_KEY, 96, 48);
    if (texture) {
      const ctx = texture.getContext();
      ctx.fillStyle = '#3d6c86';
      ctx.fillRect(0, 0, 96, 48);
      for (let index = 0; index < 60; index += 1) {
        ctx.fillStyle = random() < 0.5 ? 'rgba(70, 120, 146, 0.9)' : 'rgba(48, 92, 116, 0.9)';
        ctx.fillRect(Math.floor(random() * 96), Math.floor(random() * 48), 2 + Math.floor(random() * 4), 1);
      }
      // Lazy ripples.
      ctx.fillStyle = 'rgba(176, 214, 230, 0.75)';
      for (let index = 0; index < 14; index += 1) {
        const x = Math.floor(random() * 90);
        const y = Math.floor(random() * 46);
        ctx.fillRect(x, y, 6 + Math.floor(random() * 6), 1);
      }
      // A greasy sheen here and there.
      ctx.fillStyle = 'rgba(110, 120, 80, 0.35)';
      ctx.fillRect(Math.floor(random() * 80), Math.floor(random() * 40), 10, 2);
      texture.refresh();
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  }
  if (!scene.textures.exists(BANK_KEY)) {
    const texture = scene.textures.createCanvas(BANK_KEY, 64, 24);
    if (texture) {
      const ctx = texture.getContext();
      ctx.fillStyle = '#6e5a3f';
      ctx.fillRect(0, 0, 64, 24);
      for (let index = 0; index < 40; index += 1) {
        const shade = random();
        ctx.fillStyle = shade < 0.4 ? '#5b4a33' : shade < 0.8 ? '#806b4c' : '#9a9486';
        ctx.fillRect(Math.floor(random() * 64), Math.floor(random() * 24), 2 + Math.floor(random() * 3), 2);
      }
      ctx.fillStyle = '#4c6b3c';
      ctx.fillRect(0, 0, 64, 3);
      texture.refresh();
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  }
}

/** Clumps of reeds along the bank (seeded, so they do not move between visits). */
function addReeds(scene: Phaser.Scene, worldWidth: number): void {
  const random = createSeededRandom(0x7eed);
  const g = scene.add.graphics().setDepth(RIVER.waterTop);
  for (let x = 20; x < worldWidth; x += 70 + Math.floor(random() * 90)) {
    if (SEWAGE_OUTFALLS.some((outfall) => Math.abs(outfall.x - x) < 40)) continue;
    const blades = 4 + Math.floor(random() * 4);
    for (let index = 0; index < blades; index += 1) {
      const bx = x + index * 3 - blades;
      const height = 10 + Math.floor(random() * 10);
      g.lineStyle(2, random() < 0.5 ? 0x5f7f3a : 0x7a8f45, 1).lineBetween(bx, RIVER.waterTop + 2, bx + (random() - 0.5) * 4, RIVER.waterTop + 2 - height);
    }
    g.fillStyle(0x6b4a2b, 1).fillRect(x - 1, RIVER.waterTop - 16, 3, 6);
  }
}

/** Concrete pipe sticking out of the bank. */
function addOutfall(scene: Phaser.Scene, x: number): void {
  if (scene.textures.exists(RIVER_ART.outfall.key)) {
    scene.add.image(x, RIVER.waterTop + 8, RIVER_ART.outfall.key).setOrigin(0.5, 1).setDepth(RIVER.waterTop + 1);
    return;
  }
  const g = scene.add.graphics().setDepth(RIVER.waterTop + 1);
  g.fillStyle(0x8d8a83, 1).fillRoundedRect(x - 13, RIVER.bankTop + 4, 26, 18, 4);
  g.lineStyle(2, 0x4a4844, 1).strokeRoundedRect(x - 13, RIVER.bankTop + 4, 26, 18, 4);
  g.fillStyle(0x2b2117, 1).fillEllipse(x, RIVER.waterTop - 2, 16, 9);
  g.fillStyle(0x6b4f2a, 1).fillRect(x - 3, RIVER.waterTop, 6, 6);
}

function addNoSwimmingSign(scene: Phaser.Scene, nearX: number): void {
  const x = nearX - 46;
  const y = RIVER.bankTop - 2;
  const g = scene.add.graphics().setDepth(y + 2);
  g.fillStyle(0x6b4a2b, 1).fillRect(x - 1, y - 22, 3, 24);
  g.fillStyle(0xf1faee, 1).fillRect(x - 24, y - 38, 48, 18);
  g.lineStyle(2, 0xd62828, 1).strokeRect(x - 24, y - 38, 48, 18);
  scene.add
    .text(x, y - 29, 'ZAKAZ\nKĄPIELI', {
      fontFamily: UI_FONT_FAMILY,
      fontSize: '7px',
      fontStyle: 'bold',
      color: '#d62828',
      align: 'center',
      lineSpacing: -2,
    })
    .setOrigin(0.5)
    .setDepth(y + 3);
}
