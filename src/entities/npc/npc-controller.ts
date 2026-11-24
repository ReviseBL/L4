import Phaser from 'phaser';
import { ObstacleAvoider } from '../../systems/navigation/stall-detector';
import type { ObstacleBounds, Point2D } from '../../core/math/geometry-types';
import { Npc } from './npc';
import { nextWaypoint } from '../../systems/navigation/door-router';
import { navigationBuildings } from '../../data/world/navigation-buildings';
import { WORK_COLLEAGUE_TEXTURE_KEY } from '../../game/create-placeholder-textures';
import {
  NPC_STATE,
  type NpcDefinition,
  type NpcDifficultyModifiers,
  type NpcPatrolSetup,
  type NpcState,
} from '../../domain/npcs/npc-types';
import type { EnemyType } from '../../domain/campaign/campaign-types';
import { NpcStateMachine } from '../../systems/npc-state-machine';
import { PerceptionSystem, type VisionProfile } from '../../systems/perception-system';

/** 180° cone needs more rays than the old narrow one to keep its outline smooth. */
export const VISION_RAY_COUNT = 40;

export interface PlayerStealthTarget extends Point2D {
  hidden: boolean;
  sprinting: boolean;
}

export interface NpcControllerCallbacks {
  onDetected: (source: EnemyType) => void;
}

export class NpcController {
  private readonly npc: Npc;
  private readonly perceptionSystem: PerceptionSystem;
  private readonly brain: NpcStateMachine;
  private readonly collider: Phaser.Physics.Arcade.Collider;
  private readonly halfAngleRadians: number;
  private readonly visionProfile: VisionProfile;
  private patrolIndex = 0;
  private facingRadians = 0;
  private visionPoints: Point2D[] = [];
  private paused = false;
  private enabled = true;
  private difficultyModifiers: NpcDifficultyModifiers = {
    viewDistanceMultiplier: 1,
    awarenessMultiplier: 1,
    searchDurationMultiplier: 1,
  };

  public constructor(
    scene: Phaser.Scene,
    private readonly definition: NpcDefinition,
    private patrol: NpcPatrolSetup,
    obstacles: Phaser.Physics.Arcade.StaticGroup,
    occluders: readonly ObstacleBounds[],
    private readonly callbacks: NpcControllerCallbacks,
  ) {
    this.npc = new Npc(
      scene,
      patrol.spawn.x,
      patrol.spawn.y,
      definition.displayName,
      WORK_COLLEAGUE_TEXTURE_KEY,
      'coworker',
    );
    this.perceptionSystem = new PerceptionSystem(occluders);
    this.brain = new NpcStateMachine(definition);
    this.halfAngleRadians = Phaser.Math.DegToRad(definition.viewHalfAngleDegrees);
    this.visionProfile = {
      focusHalfAngleRadians: Phaser.Math.DegToRad(definition.focusHalfAngleDegrees),
      peripheralRangeMultiplier: definition.peripheralRangeMultiplier,
    };
    this.collider = scene.physics.add.collider(this.npc, obstacles);
  }

  public update(deltaMs: number, player: PlayerStealthTarget): void {
    this.frameDeltaMs = deltaMs;
    if (!this.enabled || this.paused) {
      this.npc.setVelocity(0, 0);
      this.npc.refreshAnimation();
      return;
    }

    const rangeMultiplier = player.sprinting ? 1.18 : 1;
    const perception = this.perceptionSystem.evaluate({
      observer: this.npc,
      target: player,
      facingRadians: this.facingRadians,
      range: this.definition.viewDistance * this.difficultyModifiers.viewDistanceMultiplier,
      halfAngleRadians: this.halfAngleRadians,
      rangeMultiplier,
      targetHidden: player.hidden,
      profile: this.visionProfile,
    });
    const brainUpdate = this.brain.update(deltaMs, {
      visibility: perception.visibility,
      playerPosition: player,
    });

    if (brainUpdate.detectionTriggered) {
      this.callbacks.onDetected(this.definition.enemyType);
    }

    this.updateMovement(deltaMs, brainUpdate.state);

    this.visionPoints = this.perceptionSystem.castVisionRays(
      this.npc,
      this.facingRadians,
      this.halfAngleRadians,
      this.definition.viewDistance * this.difficultyModifiers.viewDistanceMultiplier * rangeMultiplier,
      VISION_RAY_COUNT,
      this.visionProfile,
    );
    this.npc.updatePresentation(brainUpdate.state, this.visionPoints);
  }

  public getNpc(): Npc {
    return this.npc;
  }

  public getLastKnownPosition(): Point2D | null {
    return this.brain.getLastKnownPosition();
  }

  public getVisionPoints(): readonly Point2D[] {
    return this.visionPoints;
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;

    if (paused) {
      this.npc.setVelocity(0, 0);
    }
  }

  /** Stops physics motion while the world is frozen (dialogue, overlays). */
  public holdStill(): void {
    this.npc.setVelocity(0, 0);
    this.npc.refreshAnimation(this.visionPoints);
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.npc.setNpcVisible(enabled);
    if (!enabled) this.npc.setVelocity(0, 0);
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public teleportTo(point: Point2D): void {
    this.npc.setPosition(point.x, point.y);
  }

  public investigate(position: Point2D, lingerMs = 0): void {
    this.brain.investigate(position, lingerMs);
  }

  /** Where the colleague is looking, for the shop-window glimpses. */
  public getVisionCone(): { position: Point2D; facingRadians: number; range: number; halfAngleRadians: number } {
    return {
      position: { x: this.npc.x, y: this.npc.y },
      facingRadians: this.facingRadians,
      range: this.definition.viewDistance * this.difficultyModifiers.viewDistanceMultiplier,
      halfAngleRadians: this.halfAngleRadians,
    };
  }

  public getState(): NpcState {
    return this.brain.getState();
  }

  /** True when the colleague, chasing the player, got close enough to grab them. */
  public isCatching(player: Point2D, catchDistance: number): boolean {
    return (
      this.enabled &&
      this.brain.getState() === NPC_STATE.Detected &&
      Math.hypot(player.x - this.npc.x, player.y - this.npc.y) <= catchDistance
    );
  }

  public releaseAfterConfrontation(graceMs: number): void {
    this.brain.releaseAfterConfrontation(graceMs);
    // Rejoin the route at its nearest point instead of crossing the map.
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    this.patrol.route.forEach((point, index) => {
      const distance = Math.hypot(point.x - this.npc.x, point.y - this.npc.y);
      if (distance < bestDistance) { bestDistance = distance; best = index; }
    });
    this.patrolIndex = best;
  }

  public setDifficultyModifiers(modifiers: NpcDifficultyModifiers): void {
    this.difficultyModifiers = { ...modifiers };
    this.brain.setDifficultyModifiers(modifiers);
  }

  public setPatrolRoute(route: readonly Point2D[]): void {
    if (route.length === 0) {
      throw new Error('NPC patrol route requires at least one waypoint.');
    }
    this.patrol = { spawn: this.patrol.spawn, route };
    this.patrolIndex = 0;
  }

  /** Starts a new day at waypoint `index` of the current route, with a clean head. */
  public startDayAt(index: number): void {
    const point = this.patrol.route[index] ?? this.patrol.route[0];
    if (!point) return;
    this.npc.setPosition(point.x, point.y);
    (this.npc.body as Phaser.Physics.Arcade.Body | null)?.reset(point.x, point.y);
    this.patrolIndex = (index + 1) % this.patrol.route.length;
    this.brain.resetForNewDay();
    this.avoider.reset();
  }

  /** Tints the sprite (a second colleague reusing the same sheet). */
  public setTint(color: number): void {
    this.npc.setTint(color);
  }

  public getPatrolRoute(): readonly Point2D[] {
    return this.patrol.route;
  }

  public destroy(): void {
    this.collider.destroy();
    this.npc.destroyNpc();
  }

  private updateMovement(deltaMs: number, state: NpcState): void {
    const lastKnownPosition = this.brain.getLastKnownPosition();

    switch (state) {
      case NPC_STATE.Patrol:
        this.followPatrolRoute();
        break;
      case NPC_STATE.Suspicious:
        this.npc.setVelocity(0, 0);
        this.facePoint(lastKnownPosition);
        break;
      case NPC_STATE.Detected:
        this.moveTowards(lastKnownPosition, this.definition.detectedSpeed);
        break;
      case NPC_STATE.Searching:
        if (!this.moveTowards(lastKnownPosition, this.definition.searchSpeed)) {
          this.npc.setVelocity(0, 0);
          this.facingRadians += deltaMs * 0.0011;
        }
        break;
      case NPC_STATE.Returning:
        if (!this.moveTowards(this.patrol.route[this.patrolIndex] ?? null, this.definition.patrolSpeed)) {
          this.brain.completeReturnToPatrol();
          this.advancePatrolPoint();
        }
        break;
    }
  }

  private followPatrolRoute(): void {
    const waypoint = this.patrol.route[this.patrolIndex];

    if (!waypoint || !this.moveTowards(waypoint, this.definition.patrolSpeed)) {
      this.advancePatrolPoint();
    }
  }

  private advancePatrolPoint(): void {
    this.patrolIndex = (this.patrolIndex + 1) % this.patrol.route.length;
  }

  private readonly avoider = new ObstacleAvoider();
  private frameDeltaMs = 0;

  private moveTowards(target: Point2D | null, speed: number): boolean {
    if (!target) {
      this.npc.setVelocity(0, 0);
      return false;
    }

    const deltaX = target.x - this.npc.x;
    const deltaY = target.y - this.npc.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance <= 14) {
      this.npc.setVelocity(0, 0);
      return false;
    }

    // Through doors instead of into walls.
    const step = nextWaypoint({ x: this.npc.x, y: this.npc.y }, target, navigationBuildings);
    // Stuck on furniture: step aside, and drop the target after a few tries.
    const decision = this.avoider.update(this.frameDeltaMs, this.npc, target, step);
    if (decision.type === 'give-up') {
      this.npc.setVelocity(0, 0);
      return false;
    }
    if (decision.type === 'sidestep') {
      this.npc.setVelocity(decision.direction.x * speed, decision.direction.y * speed);
      this.npc.setFlipX(decision.direction.x < 0);
      return true;
    }
    const stepX = step.x - this.npc.x;
    const stepY = step.y - this.npc.y;
    const stepDistance = Math.max(1, Math.hypot(stepX, stepY));
    this.facingRadians = Math.atan2(stepY, stepX);
    this.npc.setVelocity((stepX / stepDistance) * speed, (stepY / stepDistance) * speed);
    this.npc.setFlipX(stepX < 0);
    return true;
  }

  private facePoint(target: Point2D | null): void {
    if (target) {
      this.facingRadians = Math.atan2(target.y - this.npc.y, target.x - this.npc.x);
    }
  }
}
