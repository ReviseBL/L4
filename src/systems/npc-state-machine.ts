import type { Point2D } from '../core/math/geometry-types';
import {
  NPC_STATE,
  type NpcDifficultyModifiers,
  type NpcState,
} from '../domain/npcs/npc-types';
import { VISIBILITY_LEVEL, type VisibilityLevel } from './perception-system';

export interface NpcBrainConfig {
  recognitionTimeMs: number;
  loseSightTimeMs: number;
  searchDurationMs: number;
  detectionCooldownMs: number;
}

export interface NpcBrainObservation {
  visibility: VisibilityLevel;
  playerPosition: Point2D;
}

export interface NpcBrainUpdate {
  state: NpcState;
  stateChanged: boolean;
  detectionTriggered: boolean;
}

export class NpcStateMachine {
  private state: NpcState = NPC_STATE.Patrol;
  private stateElapsedMs = 0;
  private awarenessMs = 0;
  private lostSightMs = 0;
  private detectionCooldownRemainingMs = 0;
  private graceRemainingMs = 0;
  private lastKnownPosition: Point2D | null = null;
  private difficultyModifiers: NpcDifficultyModifiers = {
    viewDistanceMultiplier: 1,
    awarenessMultiplier: 1,
    searchDurationMultiplier: 1,
  };

  public constructor(private readonly config: NpcBrainConfig) {}

  public update(deltaMs: number, observation: NpcBrainObservation): NpcBrainUpdate {
    const previousState = this.state;
    let detectionTriggered = false;

    this.stateElapsedMs += deltaMs;
    this.detectionCooldownRemainingMs = Math.max(0, this.detectionCooldownRemainingMs - deltaMs);
    this.graceRemainingMs = Math.max(0, this.graceRemainingMs - deltaMs);
    // After a confrontation the NPC deliberately looks away for a moment.
    const visibility = this.graceRemainingMs > 0 ? VISIBILITY_LEVEL.None : observation.visibility;

    if (visibility !== VISIBILITY_LEVEL.None) {
      this.lastKnownPosition = { ...observation.playerPosition };
    }

    switch (this.state) {
      case NPC_STATE.Patrol:
        if (visibility !== VISIBILITY_LEVEL.None) {
          this.transitionTo(NPC_STATE.Suspicious);
          detectionTriggered = this.gainAwareness(deltaMs, visibility);
        }
        break;

      case NPC_STATE.Suspicious:
        if (visibility === VISIBILITY_LEVEL.None) {
          this.awarenessMs = Math.max(0, this.awarenessMs - deltaMs * 0.9);

          if (this.stateElapsedMs >= 1_000 && this.awarenessMs === 0) {
            this.transitionTo(NPC_STATE.Patrol);
          }
        } else {
          detectionTriggered = this.gainAwareness(deltaMs, visibility);
        }
        break;

      case NPC_STATE.Detected:
        if (visibility === VISIBILITY_LEVEL.None) {
          this.lostSightMs += deltaMs;

          if (this.lostSightMs >= this.config.loseSightTimeMs) {
            this.transitionTo(NPC_STATE.Searching);
          }
        } else {
          this.lostSightMs = 0;
        }
        break;

      case NPC_STATE.Searching:
        if (visibility === VISIBILITY_LEVEL.Clear) {
          detectionTriggered = this.enterDetected();
        } else if (visibility === VISIBILITY_LEVEL.Peripheral) {
          this.transitionTo(NPC_STATE.Suspicious);
          this.awarenessMs = this.config.recognitionTimeMs * 0.25;
        } else if (
          this.stateElapsedMs >=
          this.config.searchDurationMs * this.difficultyModifiers.searchDurationMultiplier
        ) {
          this.transitionTo(NPC_STATE.Returning);
        }
        break;

      case NPC_STATE.Returning:
        if (visibility !== VISIBILITY_LEVEL.None) {
          this.transitionTo(NPC_STATE.Suspicious);
          detectionTriggered = this.gainAwareness(deltaMs, visibility);
        }
        break;
    }

    return {
      state: this.state,
      stateChanged: previousState !== this.state,
      detectionTriggered,
    };
  }

  public completeReturnToPatrol(): void {
    if (this.state === NPC_STATE.Returning) {
      this.transitionTo(NPC_STATE.Patrol);
    }
  }

  /** Ends a "caught you" talk: the NPC walks back to patrol and ignores the player for graceMs. */
  public releaseAfterConfrontation(graceMs: number): void {
    this.graceRemainingMs = Math.max(0, graceMs);
    this.awarenessMs = 0;
    this.lostSightMs = 0;
    this.transitionTo(NPC_STATE.Returning);
  }

  public isInGracePeriod(): boolean {
    return this.graceRemainingMs > 0;
  }

  public getState(): NpcState {
    return this.state;
  }

  public getLastKnownPosition(): Point2D | null {
    return this.lastKnownPosition ? { ...this.lastKnownPosition } : null;
  }

  public setDifficultyModifiers(modifiers: NpcDifficultyModifiers): void {
    this.difficultyModifiers = {
      viewDistanceMultiplier: clampMultiplier(modifiers.viewDistanceMultiplier),
      awarenessMultiplier: clampMultiplier(modifiers.awarenessMultiplier),
      searchDurationMultiplier: clampMultiplier(modifiers.searchDurationMultiplier),
    };
  }

  public investigate(position: Point2D): void {
    this.lastKnownPosition = { ...position };
    this.transitionTo(NPC_STATE.Searching);
  }

  private gainAwareness(deltaMs: number, visibility: VisibilityLevel): boolean {
    const multiplier = visibility === VISIBILITY_LEVEL.Clear ? 1 : 0.35;
    this.awarenessMs += deltaMs * multiplier * this.difficultyModifiers.awarenessMultiplier;

    return this.awarenessMs >= this.config.recognitionTimeMs ? this.enterDetected() : false;
  }

  private enterDetected(): boolean {
    const shouldTrigger = this.detectionCooldownRemainingMs <= 0;
    this.transitionTo(NPC_STATE.Detected);
    this.lostSightMs = 0;

    if (shouldTrigger) {
      this.detectionCooldownRemainingMs = this.config.detectionCooldownMs;
    }

    return shouldTrigger;
  }

  private transitionTo(nextState: NpcState): void {
    if (this.state === nextState) {
      return;
    }

    this.state = nextState;
    this.stateElapsedMs = 0;

    if (nextState === NPC_STATE.Patrol) {
      this.awarenessMs = 0;
      this.lostSightMs = 0;
    }
  }
}

function clampMultiplier(value: number): number {
  return Math.min(2, Math.max(0.5, value));
}
