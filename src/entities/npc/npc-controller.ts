import Phaser from 'phaser';
import type { ObstacleBounds, Point2D } from '../../core/math/geometry-types';
import { Npc } from './npc';
import {
  NPC_STATE,
  type NpcDefinition,
  type NpcDifficultyModifiers,
  type NpcPatrolSetup,
  type NpcState,
} from '../../domain/npcs/npc-types';
import type { EnemyType } from '../../domain/campaign/campaign-types';
import { NpcStateMachine } from '../../systems/npc-state-machine';
import { PerceptionSystem } from '../../systems/perception-system';

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
    this.npc = new Npc(scene, patrol.spawn.x, patrol.spawn.y, definition.displayName);
    this.perceptionSystem = new PerceptionSystem(occluders);
    this.brain = new NpcStateMachine(definition);
    this.halfAngleRadians = Phaser.Math.DegToRad(definition.viewHalfAngleDegrees);
    this.collider = scene.physics.add.collider(this.npc, obstacles);
  }

  public update(deltaMs: number, player: PlayerStealthTarget): void {
    if (!this.enabled || this.paused) {
      this.npc.setVelocity(0, 0);
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
    );
    this.npc.updatePresentation(brainUpdate.state, this.visionPoints);
  }

  public getNpc(): Npc {
    return this.npc;
  }

  public getState(): NpcState {
    return this.brain.getState();
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

  public investigate(position: Point2D): void {
    this.brain.investigate(position);
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

    this.facingRadians = Math.atan2(deltaY, deltaX);
    this.npc.setVelocity((deltaX / distance) * speed, (deltaY / distance) * speed);
    this.npc.setFlipX(deltaX < 0);
    return true;
  }

  private facePoint(target: Point2D | null): void {
    if (target) {
      this.facingRadians = Math.atan2(target.y - this.npc.y, target.x - this.npc.x);
    }
  }
}
