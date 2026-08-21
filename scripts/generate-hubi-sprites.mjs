import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const FRAME_WIDTH = 32;
const FRAME_HEIGHT = 44;
const COLUMNS = 8;

const DIRECTIONS = ['down', 'up', 'left', 'right'];
const ACTIONS = [
  ['idle', 2],
  ['walk', 6],
  ['sprint', 6],
  ['carry-idle', 2],
  ['carry-walk', 4],
  ['phone', 3],
  ['interact', 3],
];

const PALETTE = {
  outline: '#1b2228',
  outlineSoft: '#2c353c',
  skinShadow: '#b77756',
  skin: '#d99a73',
  skinLight: '#edb78f',
  shirtShadow: '#bcb9b0',
  shirt: '#dedbd2',
  shirtLight: '#f0ede4',
  pantsShadow: '#4b5259',
  pants: '#686f76',
  pantsLight: '#858b91',
  glasses: '#172027',
  lens: '#7fa6b2',
  shoe: '#242b31',
  sole: '#a7a8a3',
  phone: '#263746',
};

const frames = [];
for (const [action, count] of ACTIONS) {
  for (const direction of DIRECTIONS) {
    for (let phase = 0; phase < count; phase += 1) {
      frames.push({ action, direction, phase, count });
    }
  }
}

const rows = Math.ceil(frames.length / COLUMNS);
const width = COLUMNS * FRAME_WIDTH;
const height = rows * FRAME_HEIGHT;
const pixels = Buffer.alloc(width * height * 4);

function rgba(hex, alpha = 255) {
  const raw = hex.replace('#', '');
  return [
    Number.parseInt(raw.slice(0, 2), 16),
    Number.parseInt(raw.slice(2, 4), 16),
    Number.parseInt(raw.slice(4, 6), 16),
    alpha,
  ];
}

function createPainter(frameIndex) {
  const cellX = (frameIndex % COLUMNS) * FRAME_WIDTH;
  const cellY = Math.floor(frameIndex / COLUMNS) * FRAME_HEIGHT;

  const pixel = (x, y, color) => {
    const px = cellX + x;
    const py = cellY + y;
    if (x < 0 || y < 0 || x >= FRAME_WIDTH || y >= FRAME_HEIGHT) return;
    const index = (py * width + px) * 4;
    const [r, g, b, a] = rgba(color);
    pixels[index] = r;
    pixels[index + 1] = g;
    pixels[index + 2] = b;
    pixels[index + 3] = a;
  };

  const rect = (x, y, w, h, color) => {
    for (let yy = y; yy < y + h; yy += 1) {
      for (let xx = x; xx < x + w; xx += 1) pixel(xx, yy, color);
    }
  };

  const ellipse = (cx, cy, rx, ry, color) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) pixel(x, y, color);
      }
    }
  };

  return { pixel, rect, ellipse };
}

function drawOutlinedEllipse(painter, cx, cy, rx, ry, fill) {
  painter.ellipse(cx, cy, rx + 1, ry + 1, PALETTE.outline);
  painter.ellipse(cx, cy, rx, ry, fill);
}

function motionFor(action, phase, count) {
  const cycle = count > 1 ? phase / count : 0;
  const sine = Math.sin(cycle * Math.PI * 2);
  const step = Math.round(sine * (action === 'sprint' ? 3 : 2));
  const bob = action === 'idle' || action === 'carry-idle' || action === 'phone'
    ? phase % 2
    : Math.abs(step) >= 2 ? 0 : 1;
  const lean = action === 'sprint' ? 2 : 0;
  return { step, bob, lean };
}

function drawLegsFront(p, x, y, step) {
  p.rect(x + 7, y + 27, 8, 4, PALETTE.outline);
  p.rect(x + 17, y + 27, 8, 4, PALETTE.outline);
  p.rect(x + 8 + Math.max(0, step), y + 29, 6, 10 - Math.abs(step), PALETTE.pants);
  p.rect(x + 18 + Math.min(0, step), y + 29, 6, 10 - Math.abs(step), PALETTE.pantsShadow);
  p.rect(x + 8 + Math.max(0, step), y + 29, 2, 7, PALETTE.pantsLight);
  p.rect(x + 7 + Math.max(0, step), y + 38 - Math.abs(step), 8, 4, PALETTE.shoe);
  p.rect(x + 17 + Math.min(0, step), y + 38 - Math.abs(step), 8, 4, PALETTE.shoe);
  p.rect(x + 8 + Math.max(0, step), y + 41 - Math.abs(step), 7, 1, PALETTE.sole);
  p.rect(x + 18 + Math.min(0, step), y + 41 - Math.abs(step), 7, 1, PALETTE.sole);
}

function drawLegsSide(p, x, y, direction, step) {
  const sign = direction === 'right' ? 1 : -1;
  const front = step * sign;
  p.rect(x + 12, y + 28, 9, 4, PALETTE.outline);
  p.rect(x + 11 - Math.max(0, front), y + 30, 6, 9 - Math.abs(step), PALETTE.pantsShadow);
  p.rect(x + 17 + Math.max(0, front), y + 30, 6, 9 - Math.abs(step), PALETTE.pants);
  p.rect(x + 9 - Math.max(0, front), y + 38 - Math.abs(step), 9, 4, PALETTE.shoe);
  p.rect(x + 17 + Math.max(0, front), y + 38 - Math.abs(step), 9, 4, PALETTE.shoe);
  p.rect(x + 9 - Math.max(0, front), y + 41 - Math.abs(step), 9, 1, PALETTE.sole);
  p.rect(x + 17 + Math.max(0, front), y + 41 - Math.abs(step), 9, 1, PALETTE.sole);
}

function drawTorsoFront(p, x, y, action, step) {
  drawOutlinedEllipse(p, x + 16, y + 24, 10, 10, PALETTE.shirt);
  p.rect(x + 9, y + 17, 14, 4, PALETTE.shirtLight);
  p.rect(x + 9, y + 25, 3, 6, PALETTE.shirtShadow);
  p.rect(x + 12, y + 31, 9, 1, PALETTE.shirtShadow);
  const armSwing = action === 'sprint' ? Math.sign(step || 1) * 3 : Math.sign(step) * 2;
  if (!action.startsWith('carry')) {
    p.rect(x + 5, y + 19 + Math.max(0, armSwing), 4, 10, PALETTE.outline);
    p.rect(x + 6, y + 20 + Math.max(0, armSwing), 3, 8, PALETTE.skin);
    p.rect(x + 23, y + 19 + Math.max(0, -armSwing), 4, 10, PALETTE.outline);
    p.rect(x + 23, y + 20 + Math.max(0, -armSwing), 3, 8, PALETTE.skinShadow);
  } else {
    p.rect(x + 5, y + 19, 5, 9, PALETTE.outline);
    p.rect(x + 6, y + 20, 4, 7, PALETTE.skin);
    p.rect(x + 22, y + 19, 5, 9, PALETTE.outline);
    p.rect(x + 22, y + 20, 4, 7, PALETTE.skinShadow);
  }
}

function drawHeadFront(p, x, y, phoneSide = 0) {
  drawOutlinedEllipse(p, x + 16, y + 9, 8, 8, PALETTE.skin);
  p.rect(x + 11, y + 3, 8, 2, PALETTE.skinLight);
  p.rect(x + 8, y + 7, 2, 5, PALETTE.skinShadow);
  p.rect(x + 22, y + 7, 2, 5, PALETTE.skinShadow);
  p.rect(x + 8, y + 6, 7, 5, PALETTE.glasses);
  p.rect(x + 17, y + 6, 7, 5, PALETTE.glasses);
  p.rect(x + 10, y + 7, 4, 2, PALETTE.lens);
  p.rect(x + 18, y + 7, 4, 2, PALETTE.lens);
  p.rect(x + 15, y + 8, 2, 1, PALETTE.glasses);
  p.rect(x + 15, y + 12, 3, 1, PALETTE.skinShadow);
  if (phoneSide !== 0) {
    const px = phoneSide > 0 ? x + 23 : x + 6;
    p.rect(px, y + 5, 3, 10, PALETTE.outline);
    p.rect(px + (phoneSide > 0 ? 0 : 1), y + 6, 2, 8, PALETTE.phone);
  }
}

function drawHeadBack(p, x, y, phoneSide = 0) {
  drawOutlinedEllipse(p, x + 16, y + 9, 8, 8, PALETTE.skinShadow);
  p.rect(x + 11, y + 3, 8, 2, PALETTE.skinLight);
  p.rect(x + 8, y + 8, 2, 4, PALETTE.skin);
  p.rect(x + 22, y + 8, 2, 4, PALETTE.skin);
  p.rect(x + 9, y + 8, 4, 2, PALETTE.glasses);
  p.rect(x + 19, y + 8, 4, 2, PALETTE.glasses);
  if (phoneSide !== 0) {
    const px = phoneSide > 0 ? x + 23 : x + 6;
    p.rect(px, y + 5, 3, 10, PALETTE.outline);
    p.rect(px + (phoneSide > 0 ? 0 : 1), y + 6, 2, 8, PALETTE.phone);
  }
}

function drawSide(p, x, y, direction, action, step, phone) {
  const right = direction === 'right';
  const lean = action === 'sprint' ? (right ? 2 : -2) : 0;
  drawLegsSide(p, x, y, direction, step);
  drawOutlinedEllipse(p, x + 16 + lean, y + 24, 10, 10, PALETTE.shirt);
  p.rect(x + 11 + lean, y + 17, 9, 4, PALETTE.shirtLight);
  p.rect(x + (right ? 10 : 19) + lean, y + 23, 3, 7, PALETTE.shirtShadow);
  const armX = right ? x + 22 + lean : x + 6 + lean;
  if (!action.startsWith('carry')) {
    p.rect(armX, y + 19, 4, 11, PALETTE.outline);
    p.rect(armX + (right ? 0 : 1), y + 20, 3, 9, PALETTE.skin);
  } else {
    p.rect(armX, y + 18, 5, 9, PALETTE.outline);
    p.rect(armX + (right ? 0 : 1), y + 19, 4, 7, PALETTE.skin);
  }
  drawOutlinedEllipse(p, x + 16 + lean, y + 9, 8, 8, PALETTE.skin);
  p.rect(x + 12 + lean, y + 3, 7, 2, PALETTE.skinLight);
  const faceX = right ? x + 21 + lean : x + 7 + lean;
  p.rect(faceX, y + 7, 4, 5, PALETTE.glasses);
  p.rect(faceX + (right ? 1 : 0), y + 8, 3, 2, PALETTE.lens);
  p.rect(right ? faceX + 3 : faceX - 1, y + 9, 2, 2, PALETTE.skinShadow);
  if (phone) {
    const phoneX = right ? x + 22 + lean : x + 7 + lean;
    p.rect(phoneX, y + 5, 3, 10, PALETTE.outline);
    p.rect(phoneX + (right ? 0 : 1), y + 6, 2, 8, PALETTE.phone);
    p.rect(right ? x + 20 + lean : x + 9 + lean, y + 13, 4, 8, PALETTE.skin);
  }
}

function drawFrame(frameIndex, frame) {
  const p = createPainter(frameIndex);
  const { step, bob, lean } = motionFor(frame.action, frame.phase, frame.count);
  const x = 0;
  const y = Math.min(2, bob);
  const phone = frame.action === 'phone';
  const interact = frame.action === 'interact';

  if (frame.direction === 'left' || frame.direction === 'right') {
    drawSide(p, x, y, frame.direction, frame.action, step, phone);
    if (interact) {
      const reach = frame.phase === 1 ? 3 : frame.phase === 2 ? 1 : 0;
      const rx = frame.direction === 'right' ? 24 : 4 - reach;
      p.rect(rx + (frame.direction === 'right' ? reach : 0), y + 20, 5, 4, PALETTE.skinLight);
    }
    return;
  }

  drawLegsFront(p, x, y, step);
  drawTorsoFront(p, x + (frame.direction === 'up' ? 0 : 0), y, frame.action, step);
  if (frame.direction === 'down') {
    drawHeadFront(p, x, y - lean, phone ? 1 : 0);
  } else {
    drawHeadBack(p, x, y - lean, phone ? -1 : 0);
  }
  if (phone) {
    const handX = frame.direction === 'down' ? 22 : 7;
    p.rect(handX, y + 13, 4, 8, PALETTE.skin);
  }
  if (interact) {
    const reach = frame.phase === 1 ? 3 : frame.phase === 2 ? 1 : 0;
    p.rect(x + 21 + reach, y + 20, 5, 4, PALETTE.skinLight);
  }
}

frames.forEach((frame, index) => drawFrame(index, frame));

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function encodePng() {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const target = y * (width * 4 + 1);
    scanlines[target] = 0;
    pixels.copy(scanlines, target + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(scanlines, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outputPath = resolve('public/assets/characters/hubi-spritesheet.png');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, encodePng());

console.log(`Generated ${outputPath}: ${width}x${height}, ${frames.length} frames (${FRAME_WIDTH}x${FRAME_HEIGHT}).`);
