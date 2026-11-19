import type { Point2D } from '../core/math/geometry-types';
import {
  MANAGER_STATE,
  type ManagerBrainSnapshot,
  type ManagerDefinition,
  type ManagerDifficultyModifiers,
  type ManagerInterestPoint,
  type ManagerState,
} from '../domain/npcs/manager-types';
import { VISIBILITY_LEVEL, type VisibilityLevel } from './perception-system';

export class ManagerStateMachine {
  private state: ManagerState = MANAGER_STATE.PatrolArea;
  private awarenessMs = 0;
  private stateElapsedMs = 0;
  private lostSightMs = 0;
  private detectionCooldownMs = 0;
  private graceRemainingMs = 0;
  private lastKnownPlayer: Point2D | null = null;
  private investigationTarget: Point2D | null = null;
  private interestPoints: readonly ManagerInterestPoint[] = [];
  private interestIndex = 0;
  private checkingPoints: readonly Point2D[] = [];
  private checkingIndex = 0;
  private difficulty: ManagerDifficultyModifiers = {
    viewDistanceMultiplier: 1,
    awarenessMultiplier: 1,
    searchDurationMultiplier: 1,
  };

  public constructor(private readonly definition: ManagerDefinition) {}

  public update(
    deltaMs: number,
    observedVisibility: VisibilityLevel,
    playerPosition: Point2D,
    reachedMovementTarget: boolean,
  ): ManagerBrainSnapshot {
    this.graceRemainingMs = Math.max(0, this.graceRemainingMs - deltaMs);
    const visibility = this.graceRemainingMs > 0 ? VISIBILITY_LEVEL.None : observedVisibility;
    this.stateElapsedMs += deltaMs;
    this.detectionCooldownMs = Math.max(0, this.detectionCooldownMs - deltaMs);
    if (visibility !== VISIBILITY_LEVEL.None) this.lastKnownPlayer = { ...playerPosition };
    let detectionTriggered = false;

    switch (this.state) {
      case MANAGER_STATE.PatrolArea:
        if (visibility !== VISIBILITY_LEVEL.None) this.enterSuspicious(deltaMs, visibility);
        else if (reachedMovementTarget && this.stateElapsedMs >= this.getInterestLingerMs()) {
          this.advanceInterestPoint();
          this.stateElapsedMs = 0;
        }
        break;
      case MANAGER_STATE.Investigating:
        if (visibility !== VISIBILITY_LEVEL.None) this.enterSuspicious(deltaMs, visibility);
        else if (reachedMovementTarget) this.beginChecking(this.investigationTarget);
        break;
      case MANAGER_STATE.Suspicious:
        if (visibility === VISIBILITY_LEVEL.None) {
          this.awarenessMs = Math.max(0, this.awarenessMs - deltaMs * 0.65);
          if (this.stateElapsedMs >= this.definition.suspiciousForgetTimeMs) this.beginSearching();
        } else {
          this.awarenessMs += this.awarenessGain(deltaMs, visibility);
          if (this.awarenessMs >= this.definition.recognitionTimeMs) {
            detectionTriggered = this.enterChase();
          }
        }
        break;
      case MANAGER_STATE.Chase:
        if (visibility === VISIBILITY_LEVEL.None) {
          this.lostSightMs += deltaMs;
          if (this.lostSightMs >= this.definition.loseSightTimeMs) this.beginSearching();
        } else {
          this.lostSightMs = 0;
        }
        break;
      case MANAGER_STATE.Searching:
        if (visibility !== VISIBILITY_LEVEL.None) {
          detectionTriggered = this.enterChase();
        } else if (reachedMovementTarget || this.stateElapsedMs >= this.scaledSearchMemoryMs()) {
          this.beginChecking(this.lastKnownPlayer);
        }
        break;
      case MANAGER_STATE.CheckingLocation:
        if (visibility !== VISIBILITY_LEVEL.None) {
          this.enterSuspicious(this.definition.recognitionTimeMs * 0.7, visibility);
        } else if (reachedMovementTarget) {
          this.checkingIndex += 1;
          if (this.checkingIndex >= this.checkingPoints.length) this.transitionTo(MANAGER_STATE.Returning);
        }
        break;
      case MANAGER_STATE.Returning:
        if (visibility !== VISIBILITY_LEVEL.None) this.enterSuspicious(deltaMs, visibility);
        else if (reachedMovementTarget) this.transitionTo(MANAGER_STATE.PatrolArea);
        break;
    }

    return {
      state: this.state,
      lastKnownPlayer: this.getLastKnownPlayer(),
      movementTarget: this.getMovementTarget(),
      detectionTriggered,
    };
  }

  public setInterestPoints(points: readonly ManagerInterestPoint[]): void {
    if (points.length === 0) throw new Error('Manager requires at least one interest point.');
    this.interestPoints = points.map((point) => ({ ...point }));
    this.interestIndex = 0;
    this.transitionTo(MANAGER_STATE.PatrolArea);
  }

  public investigate(position: Point2D): void {
    this.investigationTarget = { ...position };
    this.lastKnownPlayer = { ...position };
    this.transitionTo(MANAGER_STATE.Investigating);
  }

  public setDifficultyModifiers(value: ManagerDifficultyModifiers): void {
    this.difficulty = {
      viewDistanceMultiplier: clamp(value.viewDistanceMultiplier, 0.5, 2),
      awarenessMultiplier: clamp(value.awarenessMultiplier, 0.5, 2),
      searchDurationMultiplier: clamp(value.searchDurationMultiplier, 0.5, 2),
    };
  }

  public getState(): ManagerState { return this.state; }
  public getLastKnownPlayer(): Point2D | null { return this.lastKnownPlayer ? { ...this.lastKnownPlayer } : null; }
  public getMovementTarget(): Point2D | null {
    if (this.state === MANAGER_STATE.Investigating) return copy(this.investigationTarget);
    if (this.state === MANAGER_STATE.Chase || this.state === MANAGER_STATE.Searching || this.state === MANAGER_STATE.Suspicious) return copy(this.lastKnownPlayer);
    if (this.state === MANAGER_STATE.CheckingLocation) return copy(this.checkingPoints[this.checkingIndex] ?? null);
    return copy(this.interestPoints[this.interestIndex] ?? null);
  }

  public forceState(state: ManagerState, playerPosition?: Point2D): void {
    if (playerPosition) this.lastKnownPlayer = { ...playerPosition };
    if (state === MANAGER_STATE.Investigating && playerPosition) this.investigationTarget = { ...playerPosition };
    if (state === MANAGER_STATE.CheckingLocation) this.beginChecking(playerPosition ?? this.lastKnownPlayer);
    else this.transitionTo(state);
  }

  /** Ends a "caught you" talk: the manager returns to patrol and ignores the player for graceMs. */
  public releaseAfterConfrontation(graceMs: number): void {
    this.graceRemainingMs = Math.max(0, graceMs);
    this.awarenessMs = 0;
    this.lostSightMs = 0;
    this.transitionTo(MANAGER_STATE.Returning);
  }

  public isInGracePeriod(): boolean {
    return this.graceRemainingMs > 0;
  }

  public forceDetection(playerPosition: Point2D): boolean {
    this.lastKnownPlayer = { ...playerPosition };
    return this.enterChase();
  }

  public handleMovementBlocked(): void {
    switch (this.state) {
      case MANAGER_STATE.PatrolArea:
      case MANAGER_STATE.Returning:
        this.advanceInterestPoint();
        this.transitionTo(MANAGER_STATE.PatrolArea);
        break;
      case MANAGER_STATE.Investigating:
      case MANAGER_STATE.Searching:
        this.beginChecking(this.getMovementTarget());
        break;
      case MANAGER_STATE.CheckingLocation:
        this.checkingIndex += 1;
        if (this.checkingIndex >= this.checkingPoints.length) {
          this.transitionTo(MANAGER_STATE.Returning);
        }
        break;
      case MANAGER_STATE.Suspicious:
      case MANAGER_STATE.Chase:
        this.beginSearching();
        break;
    }
  }

  private enterSuspicious(initialAwarenessMs: number, visibility: VisibilityLevel): void {
    this.transitionTo(MANAGER_STATE.Suspicious);
    this.awarenessMs = Math.max(this.awarenessMs, this.awarenessGain(initialAwarenessMs, visibility));
  }

  private enterChase(): boolean {
    const detectionTriggered = this.detectionCooldownMs <= 0;
    this.transitionTo(MANAGER_STATE.Chase);
    this.lostSightMs = 0;
    if (detectionTriggered) this.detectionCooldownMs = this.definition.detectionCooldownMs;
    return detectionTriggered;
  }

  private beginSearching(): void {
    this.transitionTo(MANAGER_STATE.Searching);
  }

  private beginChecking(origin: Point2D | null): void {
    const center = origin ?? this.getMovementTarget() ?? { x: 0, y: 0 };
    this.checkingPoints = this.definition.checkingOffsets.map((offset) => ({
      x: center.x + offset.x,
      y: center.y + offset.y,
    }));
    this.checkingIndex = 0;
    this.transitionTo(MANAGER_STATE.CheckingLocation);
  }

  private transitionTo(state: ManagerState): void {
    this.state = state;
    this.stateElapsedMs = 0;
    if (state === MANAGER_STATE.PatrolArea) {
      this.awarenessMs = 0;
      this.lostSightMs = 0;
      this.investigationTarget = null;
    }
  }

  private advanceInterestPoint(): void {
    if (this.interestPoints.length > 0) this.interestIndex = (this.interestIndex + 1) % this.interestPoints.length;
  }

  private getInterestLingerMs(): number {
    return this.interestPoints[this.interestIndex]?.lingerMs ?? this.definition.areaPatrolDurationMs;
  }

  private awarenessGain(deltaMs: number, visibility: VisibilityLevel): number {
    return deltaMs * (visibility === VISIBILITY_LEVEL.Clear ? 1 : 0.42) * this.difficulty.awarenessMultiplier;
  }

  private scaledSearchMemoryMs(): number {
    return this.definition.searchMemoryDurationMs * this.difficulty.searchDurationMultiplier;
  }
}

function copy(point: Point2D | null | undefined): Point2D | null { return point ? { ...point } : null; }
function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }
