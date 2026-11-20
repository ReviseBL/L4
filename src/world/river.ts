import Phaser from 'phaser';
import { createSeededRandom } from '../core/math/seeded-random';
import { RIVER, RIVER_TRASH, SEWAGE_OUTFALLS } from '../data/world/river';
import { RiverTrashDrift } from '../systems/world/river-trash';
import { UI_FONT_FAMILY } from '../ui/text-style';

const WATER_KEY = 'river-water';
const BANK_KEY = 'river-bank';

/** The dirty river along the bottom edge: flowing water, muddy bank, sewage and drifting rubbish. */
export class RiverView {
  private readonly water: Phaser.GameObjects.TileSprite | Phaser.GameObjects.Rectangle;
  private readonly plumes: Phaser.GameObjects.Graphics;
  private readonly drift: RiverTrashDrift;
  private readonly trashSprites = new Map<object, Phaser.GameObjects.Image>();
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
    this.water = scene.textures.exists(WATER_KEY)
      ? scene.add.tileSprite(worldWidth / 2, RIVER.waterTop + waterHeight / 2, worldWidth, waterHeight, WATER_KEY).setDepth(1)
      : scene.add.rectangle(worldWidth / 2, RIVER.waterTop + waterHeight / 2, worldWidth, waterHeight, 0x4d5b3a).setDepth(1);
    addReeds(scene, worldWidth);
    for (const outfall of SEWAGE_OUTFALLS) addOutfall(scene, outfall.x);
    addNoSwimmingSign(scene, SEWAGE_OUTFALLS[1]?.x ?? 1280);
    this.plumes = scene.add.graphics().setDepth(2);
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
    this.drawPlumes();
    const items = this.drift.update(deltaMs);
    const alive = new Set<object>(items);
    for (const [item, sprite] of this.trashSprites) {
      if (!alive.has(item)) { sprite.destroy(); this.trashSprites.delete(item); }
    }
    for (const item of items) {
      let sprite = this.trashSprites.get(item);
      if (!sprite) {
        if (!this.scene.textures.exists(item.key)) continue;
        sprite = this.scene.add.image(item.x, item.y, item.key).setDepth(3).setTint(0xb8b59a).setAlpha(0.92);
        this.trashSprites.set(item, sprite);
      }
      const wobble = Math.sin(this.elapsedMs / 650 + item.phase);
      sprite.setPosition(Math.round(item.x), Math.round(item.y + wobble * 1.5)).setRotation(wobble * 0.18);
    }
  }

  public destroy(): void {
    for (const sprite of this.trashSprites.values()) sprite.destroy();
    this.trashSprites.clear();
    this.plumes.destroy();
  }

  /** Brown sewage clouds pouring from the pipes and smearing downstream. */
  private drawPlumes(): void {
    const g = this.plumes.clear();
    const pulse = 0.5 + 0.5 * Math.sin(this.elapsedMs / 900);
    for (const outfall of SEWAGE_OUTFALLS) {
      for (let index = 0; index < 9; index += 1) {
        const spread = index / 8;
        const x = outfall.x + 10 + index * 38 + ((this.elapsedMs / 55 + index * 11) % 14);
        const y = RIVER.waterTop + 12 + spread * 40;
        g.fillStyle(index % 2 === 0 ? 0x7a5528 : 0x8a6a2e, (0.78 - spread * 0.55) * (0.85 + pulse * 0.15));
        g.fillEllipse(x, y, 30 + spread * 60, 12 + spread * 22);
      }
      // Foam and the gush right under the pipe.
      g.fillStyle(0x5a3f1f, 0.9).fillEllipse(outfall.x + 2, RIVER.waterTop + 6, 22, 10);
      g.fillStyle(0xd8cfa8, 0.55 + pulse * 0.25).fillEllipse(outfall.x + 6, RIVER.waterTop + 8, 10, 4);
    }
  }
}

function ensureRiverTextures(scene: Phaser.Scene): void {
  const random = createSeededRandom(0x5eed);
  if (!scene.textures.exists(WATER_KEY)) {
    const texture = scene.textures.createCanvas(WATER_KEY, 96, 48);
    if (texture) {
      const ctx = texture.getContext();
      ctx.fillStyle = '#4f5d3c';
      ctx.fillRect(0, 0, 96, 48);
      for (let index = 0; index < 60; index += 1) {
        ctx.fillStyle = random() < 0.5 ? 'rgba(90, 104, 66, 0.9)' : 'rgba(64, 74, 48, 0.9)';
        ctx.fillRect(Math.floor(random() * 96), Math.floor(random() * 48), 2 + Math.floor(random() * 4), 1);
      }
      // Lazy ripples.
      ctx.fillStyle = 'rgba(170, 180, 140, 0.7)';
      for (let index = 0; index < 14; index += 1) {
        const x = Math.floor(random() * 90);
        const y = Math.floor(random() * 46);
        ctx.fillRect(x, y, 6 + Math.floor(random() * 6), 1);
      }
      // A greasy sheen here and there.
      ctx.fillStyle = 'rgba(120, 96, 140, 0.25)';
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
