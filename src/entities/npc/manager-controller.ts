import Phaser from 'phaser';
import type { ObstacleBounds, Point2D } from '../../core/math/geometry-types';
import {
  MANAGER_STATE,
  type ManagerDefinition,
  type ManagerDifficultyModifiers,
  type ManagerInterestPoint,
  type ManagerState,
} from '../../domain/npcs/manager-types';
import { MANAGER_TEXTURE_KEY } from '../../game/create-placeholder-textures';
import { ManagerStateMachine } from '../../systems/manager-state-machine';
import { PerceptionSystem } from '../../systems/perception-system';
import { VISION_RAY_COUNT, type PlayerStealthTarget } from './npc-controller';
import { Npc } from './npc';
import { nextWaypoint } from '../../systems/navigation/door-router';
import { navigationBuildings } from '../../data/world/navigation-buildings';

export interface ManagerControllerCallbacks {
  onDetected: () => void;
  onCriticalInvestigation: () => void;
}

export class ManagerController {
  private readonly npc: Npc;
  private readonly brain: ManagerStateMachine;
  private readonly perception: PerceptionSystem;
  private readonly collider: Phaser.Physics.Arcade.Collider;
  private readonly debugGraphics: Phaser.GameObjects.Graphics;
  private interestPoints: readonly ManagerInterestPoint[];
  private facingRadians = 0;
  private visionPoints: Point2D[] = [];
  private enabled = false;
  private paused = false;
  private debugVisible = false;
  private reachedMovementTarget = false;
  private nextCriticalSignalAtMs = 0;
  private criticalSignalIndex = 0;
  private previousPosition: Point2D;
  private trackedMovementTarget: Point2D | null = null;
  private stalledMovementMs = 0;
  private difficulty: ManagerDifficultyModifiers = {
    viewDistanceMultiplier: 1,
    awarenessMultiplier: 1,
    searchDurationMultiplier: 1,
  };

  public constructor(
    scene: Phaser.Scene,
    private readonly definition: ManagerDefinition,
    spawn: Point2D,
    interestPoints: readonly ManagerInterestPoint[],
    obstacles: Phaser.Physics.Arcade.StaticGroup,
    occluders: readonly ObstacleBounds[],
    private readonly callbacks: ManagerControllerCallbacks,
  ) {
    this.interestPoints = interestPoints;
    this.previousPosition = { ...spawn };
    this.npc = new Npc(scene, spawn.x, spawn.y, definition.displayName, MANAGER_TEXTURE_KEY, 'manager');
    this.brain = new ManagerStateMachine(definition);
    this.brain.setInterestPoints(interestPoints);
    this.perception = new PerceptionSystem(occluders);
    this.collider = scene.physics.add.collider(this.npc, obstacles);
    this.debugGraphics = scene.add.graphics().setDepth(99_010).setVisible(false);
    this.setEnabled(false);
  }

  public update(deltaMs: number, player: PlayerStealthTarget): void {
    if (!this.enabled || this.paused) {
      this.npc.setVelocity(0, 0);
      this.npc.refreshAnimation();
      this.resetStallTracking();
      return;
    }

    this.updateStallTracking(deltaMs, this.brain.getMovementTarget());

    const halfAngle = Phaser.Math.DegToRad(this.definition.viewHalfAngleDegrees);
    const result = this.perception.evaluate({
      observer: this.npc,
      target: player,
      facingRadians: this.facingRadians,
      range: this.definition.viewDistance * this.difficulty.viewDistanceMultiplier,
      halfAngleRadians: halfAngle,
      rangeMultiplier: player.sprinting ? 1.12 : 1,
      targetHidden: player.hidden,
      profile: this.visionProfile(),
    });
    const snapshot = this.brain.update(deltaMs, result.visibility, player, this.reachedMovementTarget);
    if (snapshot.detectionTriggered) this.callbacks.onDetected();
    this.updateMovement(snapshot.state, snapshot.movementTarget);
    this.visionPoints = this.perception.castVisionRays(
      this.npc,
      this.facingRadians,
      halfAngle,
      this.definition.viewDistance * this.difficulty.viewDistanceMultiplier,
      VISION_RAY_COUNT,
      this.visionProfile(),
    );
    this.renderPresentation(snapshot.state);
    this.renderDebug();
  }

  private visionProfile(): { focusHalfAngleRadians: number; peripheralRangeMultiplier: number } {
    return {
      focusHalfAngleRadians: Phaser.Math.DegToRad(this.definition.focusHalfAngleDegrees),
      peripheralRangeMultiplier: this.definition.peripheralRangeMultiplier,
    };
  }

  public setInterestPoints(points: readonly ManagerInterestPoint[]): void {
    if (!points.length) throw new Error('Manager interest points cannot be empty.');
    this.interestPoints = points.map((point) => ({ ...point }));
    this.brain.setInterestPoints(this.interestPoints);
  }

  public investigate(position: Point2D): void { this.brain.investigate(position); }

  /** True when the manager, chasing the player, got close enough to grab them. */
  public isCatching(player: Point2D, catchDistance: number): boolean {
    return (
      this.enabled &&
      this.brain.getState() === MANAGER_STATE.Chase &&
      Math.hypot(player.x - this.npc.x, player.y - this.npc.y) <= catchDistance
    );
  }

  public releaseAfterConfrontation(graceMs: number): void { this.brain.releaseAfterConfrontation(graceMs); }

  public maybeReceiveCriticalSignal(timeMs: number, player: Point2D): boolean {
    if (!this.enabled || timeMs < this.nextCriticalSignalAtMs || this.brain.getState() === MANAGER_STATE.Chase) return false;
    const offsets = [
      { x: 250, y: -180 },
      { x: -230, y: 160 },
      { x: 190, y: 220 },
      { x: -270, y: -130 },
    ] as const;
    const offset = offsets[this.criticalSignalIndex % offsets.length];
    this.criticalSignalIndex += 1;
    this.nextCriticalSignalAtMs = timeMs + this.definition.criticalSignalCooldownMs;
    this.brain.investigate({ x: player.x + offset.x, y: player.y + offset.y });
    this.callbacks.onCriticalInvestigation();
    return true;
  }

  public isNear(point: Point2D): boolean {
    return this.enabled && Phaser.Math.Distance.Between(this.npc.x, this.npc.y, point.x, point.y) <= this.definition.proximityWarningDistance;
  }

  public setDifficultyModifiers(value: ManagerDifficultyModifiers): void {
    this.difficulty = { ...value };
    this.brain.setDifficultyModifiers(value);
  }

  public getState(): ManagerState { return this.brain.getState(); }
  public getLastKnownPosition(): Point2D | null { return this.brain.getLastKnownPlayer(); }
  public getInterestPoints(): readonly ManagerInterestPoint[] { return this.interestPoints.map((point) => ({ ...point })); }
  public getPosition(): Point2D { return { x: this.npc.x, y: this.npc.y }; }
  public isEnabled(): boolean { return this.enabled; }
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.npc.setNpcVisible(enabled);
    this.debugGraphics.setVisible(enabled && this.debugVisible);
    if (!enabled) {
      this.npc.setVelocity(0, 0);
      this.resetStallTracking();
    }
  }
  public holdStill(): void {
    this.npc.setVelocity(0, 0);
    this.npc.refreshAnimation(this.visionPoints);
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) {
      this.npc.setVelocity(0, 0);
      this.resetStallTracking();
    }
  }
  public setDebugVisible(visible: boolean): void { this.debugVisible = visible; this.debugGraphics.setVisible(visible && this.enabled); }
  public teleportTo(point: Point2D): void {
    this.npc.setPosition(point.x, point.y);
    this.resetStallTracking();
  }
  public teleportToInterestPoint(index = 0): void {
    const point = this.interestPoints[index % this.interestPoints.length];
    if (point) this.teleportTo(point);
  }
  public forceState(state: ManagerState, player?: Point2D): void { this.brain.forceState(state, player); }
  public forceDetection(player: Point2D): void { if (this.brain.forceDetection(player)) this.callbacks.onDetected(); }
  public destroy(): void { this.collider.destroy(); this.debugGraphics.destroy(); this.npc.destroyNpc(); }

  private updateMovement(state: ManagerState, target: Point2D | null): void {
    if (state === MANAGER_STATE.Suspicious) {
      this.npc.setVelocity(0, 0);
      this.facePoint(target);
      this.reachedMovementTarget = false;
      return;
    }
    const speed = state === MANAGER_STATE.Chase
      ? this.definition.chaseSpeed
      : state === MANAGER_STATE.Investigating
        ? this.definition.investigateSpeed
        : state === MANAGER_STATE.Searching || state === MANAGER_STATE.CheckingLocation
          ? this.definition.searchSpeed
          : this.definition.patrolSpeed;
    this.reachedMovementTarget = !this.moveTowards(target, speed);
  }

  private updateStallTracking(deltaMs: number, target: Point2D | null): void {
    const movement = Phaser.Math.Distance.Between(
      this.previousPosition.x,
      this.previousPosition.y,
      this.npc.x,
      this.npc.y,
    );
    const targetChanged = !samePoint(target, this.trackedMovementTarget);
    const distanceToTarget = target
      ? Phaser.Math.Distance.Between(this.npc.x, this.npc.y, target.x, target.y)
      : 0;

    if (!target || targetChanged || distanceToTarget <= 24 || movement >= 0.35) {
      this.stalledMovementMs = 0;
    } else {
      this.stalledMovementMs += Math.max(0, deltaMs);
      if (this.stalledMovementMs >= 900) {
        this.brain.handleMovementBlocked();
        this.stalledMovementMs = 0;
      }
    }

    this.previousPosition = { x: this.npc.x, y: this.npc.y };
    this.trackedMovementTarget = target ? { ...target } : null;
  }

  private resetStallTracking(): void {
    this.previousPosition = { x: this.npc.x, y: this.npc.y };
    this.trackedMovementTarget = null;
    this.stalledMovementMs = 0;
  }

  private moveTowards(target: Point2D | null, speed: number): boolean {
    if (!target) { this.npc.setVelocity(0, 0); return false; }
    const dx = target.x - this.npc.x;
    const dy = target.y - this.npc.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 18) { this.npc.setVelocity(0, 0); return false; }
    // Through doors instead of into walls.
    const step = nextWaypoint({ x: this.npc.x, y: this.npc.y }, target, navigationBuildings);
    const sx = step.x - this.npc.x;
    const sy = step.y - this.npc.y;
    const stepDistance = Math.max(1, Math.hypot(sx, sy));
    this.facingRadians = Math.atan2(sy, sx);
    this.npc.setVelocity(sx / stepDistance * speed, sy / stepDistance * speed).setFlipX(sx < 0);
    return true;
  }

  private facePoint(point: Point2D | null): void {
    if (point) this.facingRadians = Math.atan2(point.y - this.npc.y, point.x - this.npc.x);
  }

  private renderPresentation(state: ManagerState): void {
    const presentationState = state === MANAGER_STATE.Chase
      ? 'DETECTED'
      : state === MANAGER_STATE.Suspicious
        ? 'SUSPICIOUS'
        : state === MANAGER_STATE.Searching || state === MANAGER_STATE.CheckingLocation || state === MANAGER_STATE.Investigating
          ? 'SEARCHING'
          : state === MANAGER_STATE.Returning
            ? 'RETURNING'
            : 'PATROL';
    this.npc.updatePresentation(presentationState, this.visionPoints);
    this.npc.setStatusIndicator(
      state === MANAGER_STATE.Chase ? '!!!' : state === MANAGER_STATE.Suspicious ? '?!' : state === MANAGER_STATE.Investigating ? '?' : '',
      state === MANAGER_STATE.Chase ? '#ff3b30' : '#ffd166',
    );
  }

  private renderDebug(): void {
    this.debugGraphics.clear().setVisible(this.enabled && this.debugVisible);
    if (!this.enabled || !this.debugVisible) return;
    this.debugGraphics.lineStyle(2, 0xc77dff, 0.8);
    for (const point of this.interestPoints) {
      this.debugGraphics.strokeCircle(point.x, point.y, 26);
      this.debugGraphics.lineBetween(point.x - 8, point.y, point.x + 8, point.y);
      this.debugGraphics.lineBetween(point.x, point.y - 8, point.x, point.y + 8);
    }
    const lastKnown = this.brain.getLastKnownPlayer();
    if (lastKnown) {
      this.debugGraphics.lineStyle(3, 0xff006e, 0.9).strokeCircle(lastKnown.x, lastKnown.y, 18);
      this.debugGraphics.lineBetween(this.npc.x, this.npc.y, lastKnown.x, lastKnown.y);
    }
  }
}

function samePoint(first: Point2D | null, second: Point2D | null): boolean {
  if (first === null || second === null) return first === second;
  return Math.abs(first.x - second.x) < 0.5 && Math.abs(first.y - second.y) < 0.5;
}
