import Phaser from 'phaser';
import type { DialogueSnapshot } from '../domain/dialogue/dialogue-types';
import type { OpeningPanelDefinition, OpeningVisual } from '../data/narrative/opening-sequence';
import { calculateCoverPlacement } from './title-cover-layout';
import { UI_FONT_FAMILY } from './text-style';

const DEPTH = 120_000;

export class NoirNarrativeView {
  private readonly background: Phaser.GameObjects.Graphics;
  private readonly textureImage: Phaser.GameObjects.Image;
  private readonly captionText: Phaser.GameObjects.Text;
  private readonly speakerText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly progressText: Phaser.GameObjects.Text;
  private readonly promptText: Phaser.GameObjects.Text;
  private readonly skipText: Phaser.GameObjects.Text;
  private readonly container: Phaser.GameObjects.Container;
  private currentPanelId: string | null = null;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly panels: readonly OpeningPanelDefinition[],
    onAdvance: () => void,
    onSkip: () => void,
  ) {
    this.background = scene.add.graphics();
    this.textureImage = scene.add.image(0, 0, '__MISSING').setOrigin(0, 0).setVisible(false);
    const lowerShade = scene.add.rectangle(480, 445, 960, 190, 0x050607, 0.88);
    const redRule = scene.add.rectangle(480, 352, 960, 3, 0xc51f2f, 0.92);
    this.captionText = scene.add.text(48, 36, '', textStyle(12, '#a8a8a8')).setLetterSpacing(2);
    this.speakerText = scene.add.text(48, 382, '', textStyle(17, '#d9273c')).setLetterSpacing(2);
    this.bodyText = scene.add
      .text(48, 416, '', textStyle(28, '#f2efe8'))
      .setWordWrapWidth(790, true)
      .setLineSpacing(8);
    this.progressText = scene.add.text(48, 507, '', textStyle(11, '#6f7074')).setOrigin(0, 1);
    this.promptText = scene.add
      .text(912, 507, '[E / SPACE] DALEJ', textStyle(12, '#f2efe8'))
      .setOrigin(1, 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', onAdvance);
    this.skipText = scene.add
      .text(912, 32, '[ESC] POMIŃ INTRO', textStyle(11, '#8f9094'))
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.skipText.setColor('#ef4055'))
      .on('pointerout', () => this.skipText.setColor('#8f9094'))
      .on('pointerdown', onSkip);
    this.container = scene.add
      .container(0, 0, [
        this.background,
        this.textureImage,
        lowerShade,
        redRule,
        this.captionText,
        this.speakerText,
        this.bodyText,
        this.progressText,
        this.promptText,
        this.skipText,
      ])
      .setDepth(DEPTH);
  }

  public update(snapshot: DialogueSnapshot): void {
    if (!snapshot.active) {
      this.container.setVisible(false);
      return;
    }
    this.container.setVisible(true);
    const panel = this.panels[snapshot.pageIndex];
    if (!panel) return;

    if (panel.id !== this.currentPanelId) {
      this.currentPanelId = panel.id;
      this.renderPanel(panel);
      this.scene.cameras.main.fadeIn(260, 0, 0, 0);
    }

    this.captionText.setText(panel.caption ?? '');
    this.speakerText.setText(snapshot.speaker ?? '');
    this.bodyText.setText(snapshot.text).setColor(panel.accent === 'red' ? '#ef4055' : '#f2efe8');
    this.promptText.setVisible(!snapshot.isTyping);
    this.progressText.setText(`${String(snapshot.pageIndex + 1).padStart(2, '0')} / ${String(this.panels.length).padStart(2, '0')}`);
  }

  public destroy(): void {
    this.container.destroy(true);
  }

  private renderPanel(panel: OpeningPanelDefinition): void {
    const hasTexture = this.scene.textures.exists(panel.assetKey);
    this.textureImage.setVisible(hasTexture);
    this.background.setVisible(!hasTexture);
    if (hasTexture) {
      this.textureImage.setTexture(panel.assetKey);
      const source = this.textureImage.texture.getSourceImage() as {
        width: number;
        height: number;
      };
      const placement = calculateCoverPlacement(
        source.width,
        source.height,
        960,
        540,
        panel.focalPoint?.x,
        panel.focalPoint?.y,
        panel.coverZoom,
      );
      this.textureImage
        .setPosition(placement.x, placement.y)
        .setScale(placement.scale);
      return;
    }
    drawProceduralPanel(this.background, panel.visual);
  }
}

function drawProceduralPanel(graphics: Phaser.GameObjects.Graphics, visual: OpeningVisual): void {
  graphics.clear();
  graphics.fillStyle(0x07090b).fillRect(0, 0, 960, 540);
  graphics.fillStyle(0x15181c).fillRect(0, 0, 960, 355);

  if (visual === 'rain-city' || visual === 'client-office') drawCity(graphics);
  if (visual === 'desk') drawDesk(graphics);
  if (visual === 'server-room') drawServerRoom(graphics);
  if (visual === 'lidka') drawLidka(graphics);
  if (visual === 'cables') drawCables(graphics);
  if (visual === 'blackout') drawBlackout(graphics);
  if (visual === 'rj45') drawRj45(graphics);
  if (visual === 'legend') drawLegend(graphics);

  drawRainAndGrain(graphics, visual.length * 97);
  graphics.fillStyle(0x000000, 0.26).fillRect(0, 0, 960, 540);
}

function drawCity(graphics: Phaser.GameObjects.Graphics): void {
  graphics.fillStyle(0x2d3035).fillRect(52, 126, 182, 229);
  graphics.fillStyle(0x22252a).fillRect(255, 82, 245, 273);
  graphics.fillStyle(0x33363b).fillRect(540, 146, 168, 209);
  graphics.fillStyle(0x1d2024).fillRect(728, 105, 196, 250);
  for (let x = 76; x < 900; x += 54) {
    graphics.fillStyle(x % 108 === 0 ? 0xb82537 : 0x777b80, 0.75).fillRect(x, 170 + (x % 70), 15, 21);
  }
}

function drawDesk(graphics: Phaser.GameObjects.Graphics): void {
  graphics.fillStyle(0x45484d).fillRect(72, 256, 600, 32);
  graphics.fillStyle(0x24272b).fillRect(138, 106, 250, 135);
  graphics.lineStyle(5, 0xd8d8d5).strokeRect(138, 106, 250, 135);
  graphics.fillStyle(0xb82537).fillRect(172, 137, 180, 8);
  graphics.fillStyle(0x303339).fillCircle(730, 196, 78);
  graphics.fillStyle(0xd7d7d2).fillCircle(705, 178, 9).fillCircle(754, 178, 9);
  graphics.lineStyle(5, 0x8a8c90).strokeCircle(705, 178, 16).strokeCircle(754, 178, 16).lineBetween(721, 178, 738, 178);
}

function drawServerRoom(graphics: Phaser.GameObjects.Graphics): void {
  for (let x = 66; x <= 690; x += 208) {
    graphics.fillStyle(0x25282d).fillRect(x, 45, 170, 310);
    graphics.lineStyle(4, 0xa7a8aa).strokeRect(x, 45, 170, 310);
    for (let y = 72; y < 330; y += 35) {
      graphics.fillStyle(0x090b0e).fillRect(x + 13, y, 144, 22);
      graphics.fillStyle(y % 70 === 0 ? 0xb82537 : 0xd5d5d0).fillCircle(x + 143, y + 11, 3);
    }
  }
}

function drawLidka(graphics: Phaser.GameObjects.Graphics): void {
  graphics.fillStyle(0x22252a).fillRect(0, 0, 960, 355);
  graphics.fillStyle(0xc6c6c2).fillCircle(650, 132, 54);
  graphics.fillStyle(0x383b40).fillEllipse(650, 270, 190, 240);
  graphics.lineStyle(4, 0xb82537).beginPath().arc(650, 148, 20, 0.2, Math.PI - 0.2).strokePath();
  graphics.fillStyle(0x404349).fillRect(70, 94, 390, 198);
  graphics.fillStyle(0x111317).fillRect(98, 122, 334, 142);
}

function drawCables(graphics: Phaser.GameObjects.Graphics): void {
  graphics.fillStyle(0x22252a).fillRect(120, 42, 720, 310);
  for (let y = 72; y < 325; y += 35) {
    graphics.lineStyle(7, y === 212 ? 0xc92a3d : 0x9a9ca0).beginPath();
    graphics.moveTo(150, y);
    graphics.lineTo(390 + (y % 70), y + 12);
    graphics.lineTo(585, y - 7);
    graphics.lineTo(810, y + 6);
    graphics.strokePath();
  }
  graphics.fillStyle(0xef4055).fillRect(578, 189, 65, 44);
}

function drawBlackout(graphics: Phaser.GameObjects.Graphics): void {
  graphics.fillStyle(0x020303).fillRect(0, 0, 960, 355);
  graphics.fillStyle(0xc51f2f, 0.9).fillCircle(480, 166, 15);
  graphics.lineStyle(2, 0xc51f2f, 0.35).strokeCircle(480, 166, 68).strokeCircle(480, 166, 118);
}

function drawRj45(graphics: Phaser.GameObjects.Graphics): void {
  graphics.fillStyle(0x202328).fillRect(0, 0, 960, 355);
  graphics.lineStyle(18, 0xc92a3d).beginPath();
  graphics.moveTo(80, 338);
  graphics.lineTo(260, 292);
  graphics.lineTo(458, 306);
  graphics.lineTo(650, 174);
  graphics.strokePath();
  graphics.fillStyle(0xd9d9d4).fillRect(625, 128, 154, 86);
  graphics.fillStyle(0x777a7f).fillRect(760, 143, 70, 56);
  for (let x = 642; x < 760; x += 19) graphics.fillStyle(0xc9a34e).fillRect(x, 142, 9, 31);
  graphics.fillStyle(0x303339).fillCircle(720, 286, 92);
  graphics.fillStyle(0xd7d7d2).fillCircle(694, 266, 10).fillCircle(745, 266, 10);
  graphics.lineStyle(5, 0x8a8c90).strokeCircle(694, 266, 17).strokeCircle(745, 266, 17).lineBetween(711, 266, 728, 266);
}

function drawLegend(graphics: Phaser.GameObjects.Graphics): void {
  graphics.fillStyle(0x050607).fillRect(0, 0, 960, 355);
  graphics.fillStyle(0xb82537).fillTriangle(0, 355, 600, 355, 0, 82);
  graphics.fillStyle(0xe4e3dc, 0.88).fillCircle(720, 122, 64);
  graphics.fillStyle(0x25282d).fillEllipse(720, 276, 230, 270);
  graphics.lineStyle(7, 0x15181c).strokeCircle(693, 111, 19).strokeCircle(748, 111, 19).lineBetween(712, 111, 729, 111);
}

function drawRainAndGrain(graphics: Phaser.GameObjects.Graphics, seed: number): void {
  let value = seed >>> 0;
  const random = (): number => {
    value = (value * 1_664_525 + 1_013_904_223) >>> 0;
    return value / 4_294_967_296;
  };
  graphics.lineStyle(1, 0xd8d8d5, 0.13);
  for (let index = 0; index < 90; index += 1) {
    const x = random() * 960;
    const y = random() * 355;
    graphics.lineBetween(x, y, x - 8, y + 23);
  }
  graphics.fillStyle(0xffffff, 0.04);
  for (let index = 0; index < 180; index += 1) graphics.fillCircle(random() * 960, random() * 540, 1);
}

function textStyle(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: UI_FONT_FAMILY,
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    color,
    stroke: '#030405',
    strokeThickness: 4,
  };
}
