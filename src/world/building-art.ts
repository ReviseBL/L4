import Phaser from 'phaser';
import type { BuildingWindow } from '../domain/world/window-types';

export const BRICK_TEXTURE_KEY = 'wall-brick';
const BRICK_W = 16;
const BRICK_H = 8;
const TILE_W = BRICK_W * 4;
const TILE_H = BRICK_H * 4;
const BRICK_COLORS = ['#9c4a35', '#a8553c', '#8f4230', '#b05e42', '#94482f', '#a14f38'];
const MORTAR = '#5b4a42';

/** Procedural running-bond brick tile (deterministic, so every wall matches). */
export function ensureBrickTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(BRICK_TEXTURE_KEY)) return;
  const texture = scene.textures.createCanvas(BRICK_TEXTURE_KEY, TILE_W, TILE_H);
  if (!texture) return;
  const ctx = texture.getContext();
  ctx.fillStyle = MORTAR;
  ctx.fillRect(0, 0, TILE_W, TILE_H);
  let seed = 7;
  const next = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  for (let row = 0; row < TILE_H / BRICK_H; row += 1) {
    const offset = row % 2 === 0 ? 0 : -BRICK_W / 2;
    for (let col = -1; col <= TILE_W / BRICK_W; col += 1) {
      const x = col * BRICK_W + offset;
      const y = row * BRICK_H;
      ctx.fillStyle = BRICK_COLORS[Math.floor(next() * BRICK_COLORS.length)] ?? BRICK_COLORS[0]!;
      ctx.fillRect(x + 1, y + 1, BRICK_W - 1, BRICK_H - 1);
      // Light top edge and a darker bottom edge give each brick some depth.
      ctx.fillStyle = 'rgba(255, 220, 190, 0.18)';
      ctx.fillRect(x + 1, y + 1, BRICK_W - 1, 1);
      ctx.fillStyle = 'rgba(40, 15, 10, 0.25)';
      ctx.fillRect(x + 1, y + BRICK_H - 1, BRICK_W - 1, 1);
    }
  }
  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

/** Brick face of a wall segment, with a dark coping line along its edges. */
export function drawBrickWall(scene: Phaser.Scene, x: number, y: number, width: number, height: number, depth: number): void {
  if (scene.textures.exists(BRICK_TEXTURE_KEY)) {
    scene.add.tileSprite(x, y, width, height, BRICK_TEXTURE_KEY).setDepth(depth);
  } else {
    scene.add.rectangle(x, y, width, height, 0x9c4a35).setDepth(depth);
  }
  scene.add.rectangle(x, y, width, height).setStrokeStyle(2, 0x3b2420, 0.9).setDepth(depth);
}

/** A window set into the street wall: frame, glass with a glint, sill on the street side. */
export function drawWindow(scene: Phaser.Scene, window: BuildingWindow): void {
  const depth = Math.round(window.wallY) + 1;
  const g = scene.add.graphics().setDepth(depth);
  const width = 42;
  const height = 16;
  const left = window.x - width / 2;
  const top = window.wallY - height / 2;
  g.fillStyle(0xe8e4da, 1).fillRect(left, top, width, height);
  g.fillStyle(window.safe ? 0x7fb3c8 : 0x9cc7d6, 1).fillRect(left + 3, top + 3, width - 6, height - 6);
  g.fillStyle(0xe8e4da, 1).fillRect(window.x - 1, top + 3, 2, height - 6);
  g.fillStyle(0xffffff, 0.55).fillRect(left + 6, top + 4, 6, 2).fillRect(window.x + 4, top + 4, 4, 2);
  const sillY = window.facing === 'down' ? top + height : top - 3;
  g.fillStyle(0xbdb6a8, 1).fillRect(left - 2, sillY, width + 4, 3);
  g.lineStyle(1, 0x3b3a36, 0.9).strokeRect(left, top, width, height);
}
