import type { Point2D } from '../core/math/geometry-types';
import { COMPANY_CAR_STATE, type CompanyCarDefinition, type CompanyCarSnapshot, type CompanyCarState } from '../domain/npcs/company-car-types';
import { VISIBILITY_LEVEL, type VisibilityLevel } from './perception-system';

export class CompanyCarStateMachine {
  private state: CompanyCarState = COMPANY_CAR_STATE.Driving;
  private awarenessMs = 0;
  private stateMs = 0;
  private cooldownMs = 0;
  private lastSeenPlayer: Point2D | null = null;

  public constructor(private readonly definition: CompanyCarDefinition) {}

  public update(deltaMs: number, visibility: VisibilityLevel, player: Point2D): CompanyCarSnapshot {
    this.stateMs += deltaMs;
    this.cooldownMs = Math.max(0, this.cooldownMs - deltaMs);
    if (visibility !== VISIBILITY_LEVEL.None) this.lastSeenPlayer = { ...player };
    let detectionTriggered = false;

    if (this.state === COMPANY_CAR_STATE.Driving) {
      if (visibility !== VISIBILITY_LEVEL.None) this.transition(COMPANY_CAR_STATE.Suspicious);
    }
    if (this.state === COMPANY_CAR_STATE.Suspicious) {
      if (visibility === VISIBILITY_LEVEL.None) {
        this.awarenessMs = Math.max(0, this.awarenessMs - deltaMs);
        if (this.stateMs >= this.definition.suspiciousDecayMs && this.awarenessMs === 0) this.transition(COMPANY_CAR_STATE.Driving);
      } else {
        this.awarenessMs += deltaMs * (visibility === VISIBILITY_LEVEL.Clear ? 1 : 0.35);
        if (this.awarenessMs >= this.definition.recognitionTimeMs) {
          detectionTriggered = this.cooldownMs <= 0;
          if (detectionTriggered) this.cooldownMs = this.definition.detectionCooldownMs;
          this.transition(COMPANY_CAR_STATE.SpottedPlayer);
        }
      }
    } else if (this.state === COMPANY_CAR_STATE.SpottedPlayer && this.stateMs >= this.definition.spottedPresentationMs) {
      this.transition(COMPANY_CAR_STATE.Cooldown);
    } else if (this.state === COMPANY_CAR_STATE.Cooldown && this.cooldownMs <= 0) {
      this.transition(COMPANY_CAR_STATE.Driving);
    }

    return { state: this.state, detectionTriggered, lastSeenPlayer: this.lastSeenPlayer ? { ...this.lastSeenPlayer } : null };
  }

  public getState(): CompanyCarState { return this.state; }
  public getLastSeenPlayer(): Point2D | null { return this.lastSeenPlayer ? { ...this.lastSeenPlayer } : null; }
  public forceDetection(player: Point2D): boolean {
    this.lastSeenPlayer = { ...player };
    const triggered = this.cooldownMs <= 0;
    if (triggered) this.cooldownMs = this.definition.detectionCooldownMs;
    this.transition(COMPANY_CAR_STATE.SpottedPlayer);
    return triggered;
  }
  public forceState(state: CompanyCarState): void { this.transition(state); }

  private transition(state: CompanyCarState): void {
    if (this.state === state) return;
    this.state = state; this.stateMs = 0;
    if (state === COMPANY_CAR_STATE.Driving) this.awarenessMs = 0;
  }
}
