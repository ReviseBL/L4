import Phaser from 'phaser';
import type { ObstacleBounds, Point2D } from '../../core/math/geometry-types';
import { COMPANY_CAR_STATE, type CompanyCarDefinition, type CompanyCarState } from '../../domain/npcs/company-car-types';
import { COMPANY_CAR_ART } from '../../data/world/world-art';
import { COMPANY_CAR_SUV } from '../../data/art/round4-art';
import { COMPANY_CAR_TEXTURE_KEY } from '../../game/create-placeholder-textures';
import { CompanyCarStateMachine } from '../../systems/company-car-state-machine';
import { PerceptionSystem } from '../../systems/perception-system';
import { shouldYieldAtCrossing } from '../../systems/traffic/crossing-yield';
import { ZEBRA_CROSSING } from '../../data/world/pedestrian-routes';
import type { PlayerStealthTarget } from './npc-controller';
import { UI_FONT_FAMILY } from '../../ui/text-style';

export interface CompanyCarCallbacks { onDetected: (position: Point2D) => void; }

export class CompanyCarController {
  private readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly visionGraphics: Phaser.GameObjects.Graphics;
  private readonly routeGraphics: Phaser.GameObjects.Graphics;
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly perception: PerceptionSystem;
  private readonly brain: CompanyCarStateMachine;
  private readonly collider: Phaser.Physics.Arcade.Collider;
  private route: readonly Point2D[];
  private routeIndex = 0;
  private facingRadians = 0;
  private visionPoints: Point2D[] = [];
  /** People the car yields to on the zebra (player and walking NPCs), refreshed every frame. */
  private pedestrians: readonly Point2D[] = [];
  private enabled = false;
  private paused = false;
  private debugVisible = false;
  /** Grafika auta jest widokiem z boku: zamiast obracać, odbijamy ją w poziomie. */
  private readonly sideViewArt: boolean;
  private readonly art: { key: string; width: number; height: number } | null;

  public constructor(scene: Phaser.Scene, private readonly definition: CompanyCarDefinition, spawn: Point2D, route: readonly Point2D[], obstacles: Phaser.Physics.Arcade.StaticGroup, occluders: readonly ObstacleBounds[], private readonly callbacks: CompanyCarCallbacks) {
    this.route = route;
    // Prefer the white SUV, then the older side-view art, then the placeholder.
    this.art = scene.textures.exists(COMPANY_CAR_SUV.key) ? COMPANY_CAR_SUV : scene.textures.exists(COMPANY_CAR_ART.key) ? COMPANY_CAR_ART : null;
    this.sideViewArt = this.art !== null;
    this.sprite = scene.physics.add
      .sprite(spawn.x, spawn.y, this.art?.key ?? COMPANY_CAR_TEXTURE_KEY)
      .setDepth(spawn.y)
      .setBodySize(this.art === COMPANY_CAR_SUV ? 78 : 64, this.art === COMPANY_CAR_SUV ? 30 : 36);
    this.perception = new PerceptionSystem(occluders);
    this.brain = new CompanyCarStateMachine(definition);
    this.visionGraphics = scene.add.graphics().setDepth(90_000);
    this.routeGraphics = scene.add.graphics().setDepth(89_999);
    this.statusText = scene.add.text(spawn.x, spawn.y - 48, '', { fontFamily: UI_FONT_FAMILY, fontSize: '30px', fontStyle: 'bold', color: '#ffd166', stroke: '#111820', strokeThickness: 5 }).setOrigin(0.5).setDepth(99_001);
    this.collider = scene.physics.add.collider(this.sprite, obstacles);
    this.setEnabled(false);
  }

  public update(deltaMs: number, player: PlayerStealthTarget): void {
    if (!this.enabled) return;
    if (this.paused) this.sprite.setVelocity(0, 0); else this.followRoute();
    const halfAngle = Phaser.Math.DegToRad(this.definition.viewHalfAngleDegrees);
    const result = this.perception.evaluate({ observer: this.sprite, target: player, facingRadians: this.facingRadians, range: this.definition.viewDistance, halfAngleRadians: halfAngle, rangeMultiplier: 1, targetHidden: player.hidden });
    const snapshot = this.brain.update(deltaMs, result.visibility, player);
    if (snapshot.detectionTriggered) this.callbacks.onDetected(snapshot.lastSeenPlayer ?? player);
    this.visionPoints = this.perception.castVisionRays(this.sprite, this.facingRadians, halfAngle, this.definition.viewDistance);
    this.renderVision(snapshot.state);
    this.sprite.setDepth(Math.round(this.sprite.y));
  }

  public setRoute(route: readonly Point2D[]): void { if (!route.length) throw new Error('Company car route requires waypoints.'); this.route = route; this.routeIndex = 0; this.renderRoute(); }
  public setEnabled(enabled: boolean): void { this.enabled = enabled; this.sprite.setVisible(enabled).setActive(enabled); if (this.sprite.body) this.sprite.body.enable = enabled; this.statusText.setVisible(enabled); if (!enabled) this.sprite.setVelocity(0, 0); this.renderRoute(); this.visionGraphics.setVisible(enabled); }
  public isEnabled(): boolean { return this.enabled; }
  public setPedestrians(points: readonly Point2D[]): void { this.pedestrians = points; }
  public holdStill(): void { this.sprite.setVelocity(0, 0); }
  public setPaused(paused: boolean): void { this.paused = paused; if (paused) this.sprite.setVelocity(0, 0); }
  public isPaused(): boolean { return this.paused; }
  public setDebugVisible(visible: boolean): void { this.debugVisible = visible; this.visionGraphics.setVisible(this.enabled); this.renderRoute(); }
  public isDebugVisible(): boolean { return this.debugVisible; }
  public teleportTo(point: Point2D): void { this.sprite.setPosition(point.x, point.y); }
  public forceDetection(player: Point2D): void { if (this.brain.forceDetection(player)) this.callbacks.onDetected(player); }
  public forceState(state: CompanyCarState): void { this.brain.forceState(state); }
  public getState(): CompanyCarState { return this.brain.getState(); }
  public getVisionPoints(): readonly Point2D[] { return this.visionPoints; }
  public getPosition(): Point2D { return { x: this.sprite.x, y: this.sprite.y }; }
  public destroy(): void { this.collider.destroy(); this.visionGraphics.destroy(); this.routeGraphics.destroy(); this.statusText.destroy(); this.sprite.destroy(); }

  private followRoute(): void {
    const target = this.route[this.routeIndex]; if (!target) return;
    const dx = target.x - this.sprite.x; const dy = target.y - this.sprite.y; const distance = Math.hypot(dx, dy);
    if (distance < 20) { this.routeIndex = (this.routeIndex + 1) % this.route.length; return; }
    this.facingRadians = Math.atan2(dy, dx);
    const directionX = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : -1) : 0;
    const frontX = this.sprite.x + directionX * ((this.art?.width ?? COMPANY_CAR_ART.width) / 2);
    if (shouldYieldAtCrossing(frontX, directionX, ZEBRA_CROSSING, this.pedestrians)) {
      this.sprite.setVelocity(0, 0);
      return;
    }
    if (this.sideViewArt) {
      // Na krótkich odcinkach pionowych auto zachowuje ostatni kierunek poziomy.
      if (Math.abs(dx) > Math.abs(dy)) this.sprite.setFlipX(dx < 0);
    } else {
      this.sprite.setRotation(this.facingRadians);
    }
    this.sprite.setVelocity(dx / distance * this.definition.drivingSpeed, dy / distance * this.definition.drivingSpeed);
  }
  private renderVision(state: CompanyCarState): void {
    this.visionGraphics.clear();
    this.statusText.setPosition(this.sprite.x, this.sprite.y - 48).setText(state === COMPANY_CAR_STATE.SpottedPlayer ? '!' : state === COMPANY_CAR_STATE.Suspicious ? '?' : '').setColor(state === COMPANY_CAR_STATE.SpottedPlayer ? '#ff3b30' : '#ffd166');
    if (this.visionPoints.length < 2) return;
    const color = state === COMPANY_CAR_STATE.SpottedPlayer ? 0xff3b30 : state === COMPANY_CAR_STATE.Suspicious ? 0xffd166 : 0x90be6d;
    this.visionGraphics.fillStyle(color, 0.18).lineStyle(2, color, 0.8).beginPath().moveTo(this.sprite.x, this.sprite.y);
    for (const point of this.visionPoints) this.visionGraphics.lineTo(point.x, point.y);
    this.visionGraphics.closePath().fillPath().strokePath();
  }
  private renderRoute(): void {
    this.routeGraphics.clear().setVisible(this.enabled && this.debugVisible);
    if (!this.enabled || !this.debugVisible || this.route.length < 2) return;
    this.routeGraphics.lineStyle(3, 0x00b4d8, 0.65).beginPath().moveTo(this.route[0].x, this.route[0].y);
    for (let index = 1; index < this.route.length; index += 1) this.routeGraphics.lineTo(this.route[index].x, this.route[index].y);
    this.routeGraphics.closePath().strokePath();
  }
}
