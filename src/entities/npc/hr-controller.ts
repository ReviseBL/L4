import Phaser from 'phaser';
import { StallDetector } from '../../systems/navigation/stall-detector';
import type { ObstacleBounds, Point2D } from '../../core/math/geometry-types';
import { HR_STATE, type HrDefinition, type HrDifficultyModifiers, type HrState } from '../../domain/npcs/hr-types';
import type { NpcPatrolSetup } from '../../domain/npcs/npc-types';
import { HR_TEXTURE_KEY } from '../../game/create-placeholder-textures';
import { HrStateMachine } from '../../systems/hr-state-machine';
import { PerceptionSystem } from '../../systems/perception-system';
import { VISION_RAY_COUNT, type PlayerStealthTarget } from './npc-controller';
import { Npc } from './npc';
import { nextWaypoint } from '../../systems/navigation/door-router';
import { navigationBuildings } from '../../data/world/navigation-buildings';

export interface HrControllerCallbacks {
  onDetected: () => void;
  onConversationRequested: () => void;
}

export class HrController {
  private readonly npc: Npc;
  private readonly brain: HrStateMachine;
  private readonly perception: PerceptionSystem;
  private readonly collider: Phaser.Physics.Arcade.Collider;
  private patrolIndex = 0;
  private facingRadians = 0;
  private visionPoints: Point2D[] = [];
  private paused = false;
  private enabled = false;
  private visionVisible = true;
  private difficulty: HrDifficultyModifiers = { viewDistanceMultiplier: 1, awarenessMultiplier: 1, searchDurationMultiplier: 1 };

  public constructor(
    scene: Phaser.Scene,
    private readonly definition: HrDefinition,
    private patrol: NpcPatrolSetup,
    obstacles: Phaser.Physics.Arcade.StaticGroup,
    occluders: readonly ObstacleBounds[],
    private readonly callbacks: HrControllerCallbacks,
  ) {
    this.npc = new Npc(scene, patrol.spawn.x, patrol.spawn.y, definition.displayName, HR_TEXTURE_KEY, 'hr');
    this.brain = new HrStateMachine(definition);
    this.perception = new PerceptionSystem(occluders);
    this.collider = scene.physics.add.collider(this.npc, obstacles);
    this.setEnabled(false);
  }

  public update(deltaMs: number, player: PlayerStealthTarget): void {
    this.frameDeltaMs = deltaMs;
    if (!this.enabled || this.paused) { this.npc.setVelocity(0, 0); this.npc.refreshAnimation(); return; }
    const halfAngle = Phaser.Math.DegToRad(this.definition.viewHalfAngleDegrees);
    const rangeMultiplier = player.sprinting ? 1.18 : 1;
    const result = this.perception.evaluate({
      observer: this.npc, target: player, facingRadians: this.facingRadians,
      range: this.definition.viewDistance * this.difficulty.viewDistanceMultiplier,
      halfAngleRadians: halfAngle, rangeMultiplier, targetHidden: player.hidden,
      profile: this.visionProfile(),
    });
    const snapshot = this.brain.update(deltaMs, result.visibility, player, result.distance);
    if (snapshot.detectionTriggered) this.callbacks.onDetected();
    if (snapshot.conversationRequested) this.callbacks.onConversationRequested();
    this.updateMovement(deltaMs, snapshot.state);
    this.visionPoints = this.perception.castVisionRays(this.npc, this.facingRadians, halfAngle,
      this.definition.viewDistance * this.difficulty.viewDistanceMultiplier * rangeMultiplier,
      VISION_RAY_COUNT, this.visionProfile());
    this.npc.updatePresentation(snapshot.state, this.visionPoints);
    this.npc.setVisionVisible(this.visionVisible);
  }

  public getNpc(): Npc { return this.npc; }
  public getState(): HrState { return this.brain.getState(); }
  public getLastKnownPosition(): Point2D | null { return this.brain.getLastKnownPosition(); }
  public getVisionPoints(): readonly Point2D[] { return this.visionPoints; }
  public isEnabled(): boolean { return this.enabled; }
  public setEnabled(enabled: boolean): void { this.enabled = enabled; this.npc.setNpcVisible(enabled); if (!enabled) this.npc.setVelocity(0, 0); }
  public holdStill(): void { this.npc.setVelocity(0, 0); this.npc.refreshAnimation(this.visionPoints); }
  public setPaused(paused: boolean): void { this.paused = paused; if (paused) this.npc.setVelocity(0, 0); }
  public setVisionVisible(visible: boolean): void { this.visionVisible = visible; this.npc.setVisionVisible(visible); }
  public isVisionVisible(): boolean { return this.visionVisible; }
  public setDifficultyModifiers(value: HrDifficultyModifiers): void { this.difficulty = { ...value }; this.brain.setDifficultyModifiers(value); }
  public completeConversation(): void { this.brain.completeConversation(); }
  public forceState(state: HrState, player?: Point2D): void { this.brain.forceState(state, player); }
  public forceDetection(player: Point2D): void { if (this.brain.forceDetection(player)) this.callbacks.onDetected(); }
  public investigate(position: Point2D): void { this.brain.forceState(HR_STATE.Searching, position); }
  public teleportTo(point: Point2D): void { this.npc.setPosition(point.x, point.y); }
  public setPatrolRoute(route: readonly Point2D[]): void { if (!route.length) return; this.patrol = { spawn: this.patrol.spawn, route }; this.patrolIndex = 0; }
  public destroy(): void { this.collider.destroy(); this.npc.destroyNpc(); }

  private updateMovement(deltaMs: number, state: HrState): void {
    const lastKnown = this.brain.getLastKnownPosition();
    if (state === HR_STATE.Patrol) this.followPatrol();
    else if (state === HR_STATE.Suspicious || state === HR_STATE.Conversation) { this.npc.setVelocity(0, 0); this.facePoint(lastKnown); }
    else if (state === HR_STATE.Approaching) this.moveTowards(lastKnown, this.definition.approachSpeed);
    else if (state === HR_STATE.Searching) { if (!this.moveTowards(lastKnown, this.definition.searchSpeed)) { this.npc.setVelocity(0, 0); this.facingRadians += deltaMs * 0.001; } }
    else if (state === HR_STATE.Returning && !this.moveTowards(this.patrol.route[this.patrolIndex] ?? null, this.definition.patrolSpeed)) { this.brain.completeReturnToPatrol(); this.advancePatrol(); }
  }
  private visionProfile(): { focusHalfAngleRadians: number; peripheralRangeMultiplier: number } {
    return {
      focusHalfAngleRadians: Phaser.Math.DegToRad(this.definition.focusHalfAngleDegrees),
      peripheralRangeMultiplier: this.definition.peripheralRangeMultiplier,
    };
  }
  private followPatrol(): void { const point = this.patrol.route[this.patrolIndex]; if (!point || !this.moveTowards(point, this.definition.patrolSpeed)) this.advancePatrol(); }
  private advancePatrol(): void { this.patrolIndex = (this.patrolIndex + 1) % this.patrol.route.length; }
  private readonly stall = new StallDetector();
  private frameDeltaMs = 0;
  private moveTowards(target: Point2D | null, speed: number): boolean {
    // Stuck against an obstacle for a while: treat the target as reached.
    if (this.stall.update(this.frameDeltaMs, this.npc, target)) { this.npc.setVelocity(0, 0); return false; }
    if (!target) { this.npc.setVelocity(0, 0); return false; }
    const dx = target.x - this.npc.x; const dy = target.y - this.npc.y; const distance = Math.hypot(dx, dy);
    if (distance <= 14) { this.npc.setVelocity(0, 0); return false; }
    // Through doors instead of into walls.
    const step = nextWaypoint({ x: this.npc.x, y: this.npc.y }, target, navigationBuildings);
    const sx = step.x - this.npc.x; const sy = step.y - this.npc.y; const stepDistance = Math.max(1, Math.hypot(sx, sy));
    this.facingRadians = Math.atan2(sy, sx); this.npc.setVelocity(sx / stepDistance * speed, sy / stepDistance * speed); this.npc.setFlipX(sx < 0); return true;
  }
  private facePoint(target: Point2D | null): void { if (target) this.facingRadians = Math.atan2(target.y - this.npc.y, target.x - this.npc.x); }
}
