import type { Point2D } from '../core/math/geometry-types';
import { HR_STATE, type HrBrainSnapshot, type HrDefinition, type HrDifficultyModifiers, type HrState } from '../domain/npcs/hr-types';
import { VISIBILITY_LEVEL, type VisibilityLevel } from './perception-system';

export class HrStateMachine {
  private state: HrState = HR_STATE.Patrol;
  private awarenessMs = 0;
  private lostSightMs = 0;
  private searchingMs = 0;
  private detectionCooldownMs = 0;
  private graceMs = 0;
  private lastKnownPlayer: Point2D | null = null;
  private difficulty: HrDifficultyModifiers = {
    viewDistanceMultiplier: 1,
    awarenessMultiplier: 1,
    searchDurationMultiplier: 1,
  };

  public constructor(private readonly definition: HrDefinition) {}

  public update(deltaMs: number, visibility: VisibilityLevel, playerPosition: Point2D, distance: number): HrBrainSnapshot {
    this.detectionCooldownMs = Math.max(0, this.detectionCooldownMs - deltaMs);
    this.graceMs = Math.max(0, this.graceMs - deltaMs);
    if (visibility !== VISIBILITY_LEVEL.None) this.lastKnownPlayer = { ...playerPosition };
    let detectionTriggered = false;
    let conversationRequested = false;

    if (this.state === HR_STATE.Patrol || this.state === HR_STATE.Returning) {
      // Right after a talk she has said her piece and walks back to her route.
      if (visibility !== VISIBILITY_LEVEL.None && this.graceMs === 0) {
        this.state = HR_STATE.Suspicious;
        this.awarenessMs = visibility === VISIBILITY_LEVEL.Clear ? deltaMs : deltaMs * 0.45;
      }
    } else if (this.state === HR_STATE.Suspicious) {
      if (visibility === VISIBILITY_LEVEL.None) {
        this.awarenessMs = Math.max(0, this.awarenessMs - deltaMs * 0.8);
        if (this.awarenessMs === 0) this.state = HR_STATE.Patrol;
      } else {
        this.awarenessMs += deltaMs * (visibility === VISIBILITY_LEVEL.Clear ? 1 : 0.45) * this.difficulty.awarenessMultiplier;
        if (this.awarenessMs >= this.definition.recognitionTimeMs) {
          this.state = HR_STATE.Approaching;
          this.lostSightMs = 0;
          if (this.detectionCooldownMs === 0) {
            detectionTriggered = true;
            this.detectionCooldownMs = this.definition.detectionCooldownMs;
          }
        }
      }
    } else if (this.state === HR_STATE.Approaching) {
      if (visibility === VISIBILITY_LEVEL.None) {
        this.lostSightMs += deltaMs;
        if (this.lostSightMs >= this.definition.loseSightTimeMs) {
          this.state = HR_STATE.Searching;
          this.searchingMs = 0;
        }
      } else {
        this.lostSightMs = 0;
        if (distance <= this.definition.conversationDistance) {
          this.state = HR_STATE.Conversation;
          conversationRequested = true;
        }
      }
    } else if (this.state === HR_STATE.Searching) {
      if (visibility !== VISIBILITY_LEVEL.None) {
        this.state = HR_STATE.Suspicious;
        this.awarenessMs = this.definition.recognitionTimeMs * 0.65;
      } else {
        this.searchingMs += deltaMs;
        if (this.searchingMs >= this.definition.searchDurationMs * this.difficulty.searchDurationMultiplier) {
          this.state = HR_STATE.Returning;
        }
      }
    }

    return { state: this.state, lastKnownPlayer: this.getLastKnownPosition(), detectionTriggered, conversationRequested };
  }

  public getState(): HrState { return this.state; }
  public getLastKnownPosition(): Point2D | null { return this.lastKnownPlayer ? { ...this.lastKnownPlayer } : null; }
  public setDifficultyModifiers(value: HrDifficultyModifiers): void { this.difficulty = { ...value }; }
  public completeConversation(): void {
    if (this.state !== HR_STATE.Conversation) return;
    this.state = HR_STATE.Returning;
    this.graceMs = this.definition.postConversationGraceMs;
    this.awarenessMs = 0;
  }
  public isInGracePeriod(): boolean { return this.graceMs > 0; }
  public completeReturnToPatrol(): void { if (this.state === HR_STATE.Returning) this.state = HR_STATE.Patrol; }
  public forceState(state: HrState, playerPosition?: Point2D): void {
    this.state = state;
    if (playerPosition) this.lastKnownPlayer = { ...playerPosition };
    this.awarenessMs = 0;
    this.lostSightMs = 0;
    this.searchingMs = 0;
  }
  public forceDetection(playerPosition: Point2D): boolean {
    this.lastKnownPlayer = { ...playerPosition };
    this.state = HR_STATE.Approaching;
    if (this.detectionCooldownMs > 0) return false;
    this.detectionCooldownMs = this.definition.detectionCooldownMs;
    return true;
  }
}
