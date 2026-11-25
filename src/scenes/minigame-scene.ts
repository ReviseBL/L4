import Phaser from 'phaser';
import {
  THREADING_STRESS_NOTICE,
  threadingRules,
  threadingSnapLines,
  threadingSuccessLines,
  threadingVariants,
} from '../data/minigames/threading-config';
import { timingFeedback, timingVariants } from '../data/minigames/timing-config';
import type {
  MinigameRequest,
  MinigameResult,
  ThreadingVariantConfig,
  TimingVariantConfig,
} from '../domain/minigames/minigame-types';
import { MINIGAME_ART_ANCHORS } from '../data/minigames/minigame-art';
import { ThreadingMinigame } from '../systems/minigames/threading-minigame';
import { TimingMinigame } from '../systems/minigames/timing-minigame';
import { UI_FONT_FAMILY } from '../ui/text-style';

export const MINIGAME_SCENE_KEY = 'MinigameScene';

export interface MinigameSceneData {
  request: MinigameRequest;
  /** 0..1, current company suspicion: nervous Herbi shakes more. */
  stress: number;
  onDone: (result: MinigameResult) => void;
}

/** Optional ChatGPT art; the scene draws simple placeholders until these are loaded. */
export const MINIGAME_TEXTURES = {
  extruder: 'mg-extruder',
  hotend: 'mg-hotend',
  hotendLarge: 'mg-hotend-large',
  hand: 'mg-hand',
  handTense: 'mg-hand-tense',
  snapFrames: ['mg-snap-0', 'mg-snap-1', 'mg-snap-2'],
  fumes: ['mg-fumes-0', 'mg-fumes-1', 'mg-fumes-2'],
  wrench: 'mg-wrench',
  printBed: 'mg-print-bed',
  spatula: 'mg-spatula',
} as const;

const CENTER_X = 480;
const PANEL = { x: 120, y: 56, width: 720, height: 428 };
/** Herbi feeds the filament from above, like loading a real printer. */
const PINCH_Y = 186;
const TIP_REST_Y = 236;
const HOLE_Y = 290;
const HAND_SCALE = 0.85;
const BAR_Y = 388;
const NOZZLE_Y = 320;
const BED_CENTER_Y = 232;
const PUSH_MS = 170;
/** Ignore E for a moment after success, so the winning press does not close it. */
const CLOSE_LOCK_MS = 300;
const SNAP_PAUSE_MS = 650;

type Phase = 'aiming' | 'pushing' | 'feedback' | 'done';

/**
 * Overlay scene for short at-home minigames. The game scene is paused while
 * this runs; logic lives in the pure ThreadingMinigame / TimingMinigame.
 */
export class MinigameScene extends Phaser.Scene {
  private request!: MinigameRequest;
  private stress = 0;
  private onDone!: (result: MinigameResult) => void;
  private phase: Phase = 'aiming';
  private phaseTimerMs = 0;
  private keys!: {
    left: Phaser.Input.Keyboard.Key[];
    right: Phaser.Input.Keyboard.Key[];
    action: Phaser.Input.Keyboard.Key[];
  };
  private graphics!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private controlsText!: Phaser.GameObjects.Text;
  private stageText!: Phaser.GameObjects.Text;
  private sprites: Phaser.GameObjects.Image[] = [];

  private threading: ThreadingMinigame | null = null;
  private threadingVariant: ThreadingVariantConfig | null = null;
  private pushProgress = 0;
  private snapIndex = 0;
  private snapAt: { x: number; y: number } | null = null;

  private timing: TimingMinigame | null = null;
  private timingVariant: TimingVariantConfig | null = null;

  public constructor() {
    super(MINIGAME_SCENE_KEY);
  }

  public create(data: MinigameSceneData): void {
    this.request = data.request;
    this.stress = Phaser.Math.Clamp(data.stress, 0, 1);
    this.onDone = data.onDone;
    this.phase = 'aiming';
    this.phaseTimerMs = 0;
    this.sprites = [];
    this.snapAt = null;
    this.pushProgress = 0;

    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is required for minigames.');
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      left: [keyboard.addKey(K.A), keyboard.addKey(K.LEFT)],
      right: [keyboard.addKey(K.D), keyboard.addKey(K.RIGHT)],
      action: [keyboard.addKey(K.E), keyboard.addKey(K.SPACE)],
    };

    this.add.rectangle(0, 0, 960, 540, 0x05080c, 0.82).setOrigin(0);
    this.add
      .rectangle(PANEL.x, PANEL.y, PANEL.width, PANEL.height, 0x0b0f14, 0.96)
      .setOrigin(0)
      .setStrokeStyle(2, 0xf4a261, 0.9);
    this.graphics = this.add.graphics().setDepth(2);
    this.titleText = this.add.text(PANEL.x + 16, PANEL.y + 12, '', style(17, '#ffd166'));
    this.stageText = this.add.text(PANEL.x + PANEL.width - 16, PANEL.y + 14, '', style(13, '#8ecae6')).setOrigin(1, 0);
    this.infoText = this.add
      .text(PANEL.x + 16, PANEL.y + 34, '', style(13, '#f4f1de'))
      .setWordWrapWidth(PANEL.width - 32);
    this.feedbackText = this.add
      .text(CENTER_X, PANEL.y + PANEL.height - 34, '', style(15, '#f4f1de'))
      .setOrigin(0.5);
    this.controlsText = this.add
      .text(CENTER_X, PANEL.y + PANEL.height - 13, '', style(13, '#8ecae6'))
      .setOrigin(0.5);

    if (this.request.kind === 'threading') this.setupThreading();
    else this.setupTiming();

    for (const text of [this.titleText, this.stageText, this.infoText, this.feedbackText, this.controlsText]) text.setDepth(6);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
  }

  public override update(_time: number, delta: number): void {
    if (this.phase === 'done') return;
    if (this.request.kind === 'threading') this.updateThreading(delta);
    else this.updateTiming(delta);
  }

  // ------------------------------------------------------------ threading

  private setupThreading(): void {
    if (this.request.kind !== 'threading') return;
    const variant = threadingVariants[this.request.variant];
    this.threadingVariant = variant;
    this.threading = new ThreadingMinigame(variant, threadingRules, this.stress);
    this.titleText.setText(`ZAŁADUJ FILAMENT: ${variant.filamentLabel}`);
    const stressNote = this.stress >= THREADING_STRESS_NOTICE
      ? `\nRęce trzęsą się bardziej: firma Cię podejrzewa (${Math.round(this.stress * 100)}%).`
      : '';
    this.infoText.setText(`${variant.hint}${stressNote}`);
    this.controlsText.setText('[A/D] celuj    [E] wsuń filament');
  }

  private updateThreading(delta: number): void {
    const game = this.threading;
    const variant = this.threadingVariant;
    if (!game || !variant) return;

    if (this.phase === 'aiming') {
      const steer = (this.isDown(this.keys.right) ? 1 : 0) - (this.isDown(this.keys.left) ? 1 : 0);
      game.update(delta, steer);
      if (this.justDown(this.keys.action)) {
        this.phase = 'pushing';
        this.phaseTimerMs = 0;
      }
    } else if (this.phase === 'pushing') {
      this.phaseTimerMs += delta;
      this.pushProgress = Math.min(1, this.phaseTimerMs / PUSH_MS);
      if (this.pushProgress >= 1) this.resolvePush(game, variant);
    } else if (this.phase === 'feedback') {
      this.phaseTimerMs += delta;
      game.update(delta, 0);
      if (game.isFinished()) {
        // The player closes the window themselves, after reading the result.
        if (this.phaseTimerMs >= CLOSE_LOCK_MS && this.justDown(this.keys.action)) {
          this.finish({ kind: 'threading', attempts: game.getAttempt() });
        }
      } else if (this.phaseTimerMs >= SNAP_PAUSE_MS) {
        this.phase = 'aiming';
        this.pushProgress = 0;
        this.snapAt = null;
        this.named.get('snap')?.setVisible(false);
      }
    }
    this.drawThreading(game, variant);
  }

  private resolvePush(game: ThreadingMinigame, variant: ThreadingVariantConfig): void {
    const tipX = CENTER_X + game.getTipX();
    const outcome = game.push();
    this.phase = 'feedback';
    this.phaseTimerMs = 0;
    if (outcome === 'snap') {
      this.snapAt = { x: tipX, y: HOLE_Y + 8 };
      const line = threadingSnapLines[this.snapIndex % threadingSnapLines.length]!;
      this.snapIndex += 1;
      this.feedbackText.setText(`TRZASK! Filament pękł.  „${line}”`).setColor('#ff8c69');
      this.cameras.main.shake(120, 0.004);
    } else if (outcome === 'stage-cleared') {
      this.feedbackText.setText('Jest! Teraz drugi otwór.').setColor('#90be6d');
    } else {
      this.feedbackText.setText(`„${threadingSuccessLines[variant.id]}”`).setColor('#90be6d');
      this.controlsText.setText('[E] DALEJ');
    }
    // Keep the filament in the hole while the result is shown.
    this.pushProgress = 1;
  }

  private drawThreading(game: ThreadingMinigame, variant: ThreadingVariantConfig): void {
    const g = this.graphics;
    g.clear();
    const stage = game.getStage();
    const holeX = CENTER_X + game.getHoleX();
    const stageCount = game.getStageCount();
    this.stageText.setText(
      `${stageCount > 1 ? `${stage.label} ${Math.min(game.getStageIndex() + 1, stageCount)}/${stageCount}  ·  ` : ''}PODEJŚCIE ${game.getAttempt()}`,
    );

    // Printer part comes from the stage data (only L4 has a second, hotend hole);
    // after the last hole getStage() keeps returning it, so the art stays put.
    const useHotend = stage.part === 'hotend';
    const artKey = useHotend ? MINIGAME_TEXTURES.hotend : MINIGAME_TEXTURES.extruder;
    if (this.hasArt(artKey)) {
      const anchor = useHotend ? MINIGAME_ART_ANCHORS.hotendHole : MINIGAME_ART_ANCHORS.extruderHole;
      const art = this.placeSprite('printer-part', artKey, holeX, HOLE_Y, 0, 0);
      art.setOrigin(anchor.x / art.width, anchor.y / art.height).setDepth(1);
      g.lineStyle(2, 0xffd166, 0.85).strokeCircle(holeX, HOLE_Y + 2, stage.holeRadius + 4);
    } else {
      g.fillStyle(0x2b3138, 1).fillRect(holeX - 150, HOLE_Y, 300, 140);
      g.lineStyle(2, 0x11161b, 1).strokeRect(holeX - 150, HOLE_Y, 300, 140);
      g.fillStyle(0xf1faee, 0.9).fillCircle(holeX, HOLE_Y, stage.holeRadius + 5);
      g.fillStyle(0x05080c, 1).fillCircle(holeX, HOLE_Y, stage.holeRadius + 1);
    }

    const handX = CENTER_X + game.getHandX();
    const restTipX = CENTER_X + game.getTipX();
    const pushing = this.phase === 'pushing' || (this.phase === 'feedback' && !this.snapAt);
    const tipY = pushing ? Phaser.Math.Linear(TIP_REST_Y, HOLE_Y + 4, this.pushProgress) : TIP_REST_Y;

    if (this.snapAt) {
      // Short stub left in the fingers and the piece that snapped off.
      this.drawFilament(g, handX, PINCH_Y, handX, PINCH_Y + 22, variant.filamentColor);
      const fall = Math.min(1, this.phaseTimerMs / SNAP_PAUSE_MS);
      g.lineStyle(4, variant.filamentColor, 1 - fall).lineBetween(
        this.snapAt.x - 8 - fall * 30, this.snapAt.y - 18 + fall * 40, this.snapAt.x + 4 - fall * 26, this.snapAt.y + fall * 60,
      );
      this.drawSnapBurst(g, this.snapAt.x, this.snapAt.y, fall);
    } else {
      this.drawFilament(g, handX, PINCH_Y, restTipX, tipY, variant.filamentColor);
    }

    const fumes = game.getFumesOpacity();
    this.drawFumes(g, holeX, fumes);
    this.drawHand(g, handX, PINCH_Y);
  }

  private drawFilament(g: Phaser.GameObjects.Graphics, fromX: number, fromY: number, toX: number, toY: number, color: number): void {
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(fromX, fromY),
      new Phaser.Math.Vector2(fromX, (fromY + toY) / 2),
      new Phaser.Math.Vector2(toX, toY),
    );
    // Light halo keeps dark filaments (ASA) readable on the dark panel.
    g.lineStyle(8, 0x8d99ae, 0.45);
    curve.draw(g, 24);
    g.lineStyle(6, 0x05080c, 1);
    curve.draw(g, 24);
    g.lineStyle(4, color, 1);
    curve.draw(g, 24);
  }

  private drawHand(g: Phaser.GameObjects.Graphics, x: number, pinchY: number): void {
    const tense = this.isDown(this.keys.action) || this.phase === 'pushing';
    const key = tense && this.hasArt(MINIGAME_TEXTURES.handTense) ? MINIGAME_TEXTURES.handTense : MINIGAME_TEXTURES.hand;
    if (this.hasArt(key)) {
      const pinch = key === MINIGAME_TEXTURES.handTense ? MINIGAME_ART_ANCHORS.handTensePinch : MINIGAME_ART_ANCHORS.handPinch;
      const push = this.phase === 'pushing' ? this.pushProgress * (HOLE_Y - TIP_REST_Y) : 0;
      this.placeSprite('hand', key, x, pinchY + push, pinch.x, pinch.y).setOrigin(pinch.x, pinch.y).setScale(HAND_SCALE).setDepth(3);
      return;
    }
    g.fillStyle(0xf2c9a0, 1).fillRoundedRect(x - 26, pinchY - 50, 52, 46, 10);
    g.fillStyle(0x8ecae6, 1).fillRect(x - 30, pinchY - 70, 60, 20);
    g.lineStyle(2, 0x2b1d14, 1).strokeRoundedRect(x - 26, pinchY - 50, 52, 46, 10);
  }

  private drawSnapBurst(g: Phaser.GameObjects.Graphics, x: number, y: number, progress: number): void {
    const frames = MINIGAME_TEXTURES.snapFrames;
    const frameKey = frames[Math.min(frames.length - 1, Math.floor(progress * frames.length))]!;
    if (this.hasArt(frameKey)) {
      this.placeSprite('snap', frameKey, x, y, 0.5, 0.5).setAlpha(progress > 0.8 ? (1 - progress) * 5 : 1).setVisible(true).setDepth(4);
      return;
    }
    const radius = 10 + progress * 18;
    g.lineStyle(3, 0xffd166, 1 - progress);
    for (let ray = 0; ray < 8; ray += 1) {
      const angle = (ray / 8) * Math.PI * 2;
      g.lineBetween(x + Math.cos(angle) * radius * 0.4, y + Math.sin(angle) * radius * 0.4, x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    }
  }

  private drawFumes(g: Phaser.GameObjects.Graphics, x: number, opacity: number): void {
    const t = this.time.now / 1000;
    const puffs = MINIGAME_TEXTURES.fumes;
    for (let puff = 0; puff < 5; puff += 1) {
      const offsetX = Math.sin(t * 0.9 + puff * 1.7) * 34 + (puff - 2) * 18;
      const offsetY = Math.cos(t * 0.7 + puff) * 10 - 10;
      const key = puffs[puff % puffs.length]!;
      if (this.hasArt(key)) {
        this.placeSprite(`fume-${puff}`, key, x + offsetX, HOLE_Y + offsetY, 0.5, 0.5)
          .setAlpha(0.85 * opacity)
          .setVisible(opacity > 0)
          .setDepth(5);
      } else if (opacity > 0) {
        g.fillStyle(0x9aa59a, 0.55 * opacity).fillCircle(x + offsetX, HOLE_Y + offsetY, 26 + puff * 3);
      }
    }
  }

  // ------------------------------------------------------------ timing

  private setupTiming(): void {
    if (this.request.kind !== 'timing') return;
    const variant = timingVariants[this.request.variant];
    this.timingVariant = variant;
    this.timing = new TimingMinigame(variant);
    this.titleText.setText(variant.title);
    this.infoText.setText(this.request.variant === 'nozzle'
      ? 'Za słabo: będzie kapać. Za mocno: gwint trzeszczy. Celuj w zielone.'
      : 'Wydruk trzyma się stołu jak przyklejony. Podważ go w trzech miejscach.');
    this.controlsText.setText(variant.instruction);
    if (this.request.variant === 'nozzle' && this.hasArt(MINIGAME_TEXTURES.hotendLarge)) {
      const anchor = MINIGAME_ART_ANCHORS.hotendLargeNozzle;
      const art = this.add.image(CENTER_X, NOZZLE_Y, MINIGAME_TEXTURES.hotendLarge);
      art.setOrigin(anchor.x / art.width, anchor.y / art.height).setDepth(1);
      this.sprites.push(art);
    } else if (this.request.variant === 'print-removal' && this.hasArt(MINIGAME_TEXTURES.printBed)) {
      const art = this.add.image(CENTER_X, BED_CENTER_Y, MINIGAME_TEXTURES.printBed).setDepth(1);
      this.sprites.push(art);
    }
  }

  private updateTiming(delta: number): void {
    const game = this.timing;
    const variant = this.timingVariant;
    if (!game || !variant || this.request.kind !== 'timing') return;
    const feedback = timingFeedback[this.request.variant];

    if (this.phase === 'aiming') {
      game.update(delta);
      if (this.justDown(this.keys.action)) {
        const outcome = game.press();
        if (outcome === 'complete') {
          this.feedbackText.setText(`„${feedback.complete}”`).setColor('#90be6d');
          this.controlsText.setText('[E] DALEJ');
          this.phase = 'feedback';
          this.phaseTimerMs = 0;
        } else if (outcome === 'hit') {
          this.feedbackText.setText(feedback.hit).setColor('#90be6d');
        } else {
          const lines = outcome === 'under' ? feedback.under : feedback.over;
          this.feedbackText.setText(lines[game.getMisses() % lines.length]!).setColor('#ff8c69');
          if (outcome === 'over') this.cameras.main.shake(100, 0.003);
        }
      }
    } else if (this.phase === 'feedback') {
      this.phaseTimerMs += delta;
      if (this.phaseTimerMs >= CLOSE_LOCK_MS && this.justDown(this.keys.action)) {
        this.finish({ kind: 'timing', attempts: game.getAttempts() });
      }
    }
    this.drawTiming(game, variant);
  }

  private drawTiming(game: TimingMinigame, variant: TimingVariantConfig): void {
    const g = this.graphics;
    g.clear();
    const nozzle = variant.id === 'nozzle';
    const needle = game.getNeedle();
    this.stageText.setText(variant.requiredHits > 1
      ? `PODWAŻONO ${Math.min(game.getHits(), variant.requiredHits)}/${variant.requiredHits}`
      : `PRÓBA ${game.getAttempts() + (game.isFinished() ? 0 : 1)}`);

    if (nozzle) this.drawNozzleScene(g, needle);
    else this.drawPrintBedScene(g, needle, game.getHits() / variant.requiredHits);

    // Scale.
    const barX = 220;
    const barWidth = 520;
    const barY = BAR_Y;
    const zone = game.getZone();
    g.fillStyle(0x3a1d1d, 1).fillRect(barX, barY, barWidth, 20);
    g.fillStyle(0x2d6a4f, 1).fillRect(barX + zone.start * barWidth, barY, (zone.end - zone.start) * barWidth, 20);
    g.lineStyle(2, 0xf4f1de, 0.8).strokeRect(barX, barY, barWidth, 20);
    const needleX = barX + needle * barWidth;
    g.fillStyle(0xffd166, 1).fillTriangle(needleX - 8, barY - 12, needleX + 8, barY - 12, needleX, barY + 2);
    g.lineStyle(3, 0xffd166, 1).lineBetween(needleX, barY, needleX, barY + 20);
    this.ensureScaleLabels(barX, barWidth, barY, nozzle);
  }

  private scaleLabels: Phaser.GameObjects.Text[] = [];

  private ensureScaleLabels(barX: number, barWidth: number, barY: number, nozzle: boolean): void {
    if (this.scaleLabels.length > 0) return;
    this.scaleLabels = [
      this.add.text(barX, barY + 26, nozzle ? 'ZA SŁABO' : 'ZA LEKKO', style(11, '#ff8c69')).setDepth(6),
      this.add.text(barX + barWidth, barY + 26, 'ZA MOCNO', style(11, '#ff8c69')).setOrigin(1, 0).setDepth(6),
    ];
  }

  private drawNozzleScene(g: Phaser.GameObjects.Graphics, needle: number): void {
    const hasArt = this.hasArt(MINIGAME_TEXTURES.hotendLarge);
    if (!hasArt) {
      g.fillStyle(0x6c757d, 1).fillRect(CENTER_X - 70, NOZZLE_Y - 190, 140, 70);
      g.fillStyle(0xadb5bd, 1).fillRect(CENTER_X - 90, NOZZLE_Y - 120, 180, 100);
      g.fillStyle(0xc9a227, 1).fillTriangle(CENTER_X - 26, NOZZLE_Y - 20, CENTER_X + 26, NOZZLE_Y - 20, CENTER_X, NOZZLE_Y + 24);
    }
    // The wrench turns upward with the needle: further right = tighter.
    const angle = Phaser.Math.DegToRad(-needle * 55);
    if (this.hasArt(MINIGAME_TEXTURES.wrench)) {
      const jaw = MINIGAME_ART_ANCHORS.wrenchJaw;
      this.placeSprite('wrench', MINIGAME_TEXTURES.wrench, CENTER_X, NOZZLE_Y, jaw.x, jaw.y).setOrigin(jaw.x, jaw.y).setRotation(angle).setDepth(3);
      return;
    }
    const length = 140;
    const endX = CENTER_X + Math.cos(angle) * length;
    const endY = NOZZLE_Y + Math.sin(angle) * length;
    g.lineStyle(14, 0x2b3138, 1).lineBetween(CENTER_X, NOZZLE_Y, endX, endY);
    g.lineStyle(10, 0xb0b8bf, 1).lineBetween(CENTER_X, NOZZLE_Y, endX, endY);
    g.fillStyle(0xd62828, 1).fillCircle(endX, endY, 9);
  }

  private drawPrintBedScene(g: Phaser.GameObjects.Graphics, needle: number, peeled: number): void {
    const bed = this.hasArt(MINIGAME_TEXTURES.printBed) ? this.textures.getFrame(MINIGAME_TEXTURES.printBed) : null;
    let edgeFrom: number;
    let edgeTo: number;
    let edgeY: number;
    if (bed) {
      const left = CENTER_X - bed.width / 2;
      const top = BED_CENTER_Y - bed.height / 2;
      const edge = MINIGAME_ART_ANCHORS.printBottom;
      edgeFrom = left + edge.fromX;
      edgeTo = left + edge.toX;
      edgeY = top + edge.y;
    } else {
      g.fillStyle(0xb08d57, 1).fillRect(CENTER_X - 230, 110, 460, 200);
      g.fillStyle(0xe63946, 1).fillRect(CENTER_X - 110, 150, 34, 110).fillRect(CENTER_X - 110, 226, 96, 34);
      g.fillRect(CENTER_X + 20, 150, 34, 70).fillRect(CENTER_X + 20, 198, 100, 30).fillRect(CENTER_X + 80, 150, 34, 110);
      edgeFrom = CENTER_X - 110;
      edgeTo = CENTER_X + 114;
      edgeY = 262;
    }
    // A dark gap opens under the print with every good press.
    if (peeled > 0) {
      g.fillStyle(0x05080c, 0.85).fillRect(edgeFrom, edgeY - 1, (edgeTo - edgeFrom) * peeled, 3 + peeled * 5);
    }
    const spatulaX = edgeFrom + needle * (edgeTo - edgeFrom);
    if (this.hasArt(MINIGAME_TEXTURES.spatula)) {
      this.placeSprite('spatula', MINIGAME_TEXTURES.spatula, spatulaX, edgeY, 0.5, 0.03).setOrigin(0.5, 0.03).setScale(0.8).setDepth(3);
      return;
    }
    g.fillStyle(0xced4da, 1).fillRect(spatulaX - 18, edgeY, 36, 26);
    g.fillStyle(0x212529, 1).fillRect(spatulaX - 7, edgeY + 26, 14, 40);
  }

  // ------------------------------------------------------------ helpers

  private finish(result: MinigameResult): void {
    if (this.phase === 'done') return;
    this.phase = 'done';
    const onDone = this.onDone;
    this.scene.stop();
    onDone(result);
  }

  private hasArt(key: string): boolean {
    return this.textures.exists(key);
  }

  private readonly named = new Map<string, Phaser.GameObjects.Image>();

  private placeSprite(name: string, key: string, x: number, y: number, originX: number, originY: number): Phaser.GameObjects.Image {
    let sprite = this.named.get(name);
    if (!sprite || sprite.texture.key !== key) {
      sprite?.destroy();
      sprite = this.add.image(x, y, key).setOrigin(originX, originY);
      this.named.set(name, sprite);
      this.sprites.push(sprite);
    }
    return sprite.setPosition(x, y);
  }

  private isDown(keys: Phaser.Input.Keyboard.Key[]): boolean {
    return keys.some((key) => key.isDown);
  }

  private justDown(keys: Phaser.Input.Keyboard.Key[]): boolean {
    let pressed = false;
    for (const key of keys) if (Phaser.Input.Keyboard.JustDown(key)) pressed = true;
    return pressed;
  }

  private cleanup(): void {
    for (const sprite of this.sprites) sprite.destroy();
    this.sprites = [];
    this.named.clear();
    this.scaleLabels = [];
    this.threading = null;
    this.timing = null;
    const keyboard = this.input.keyboard;
    if (keyboard) for (const key of [...this.keys.left, ...this.keys.right, ...this.keys.action]) keyboard.removeKey(key);
  }
}

function style(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: UI_FONT_FAMILY,
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    color,
    stroke: '#06090d',
    strokeThickness: 2,
  };
}
