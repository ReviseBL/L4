import type {
  PhoneCallDefinition,
  PhoneCampaignStats,
  PhoneMissionStats,
  PhoneSnapshot,
  PhoneState,
  PhoneSystemCallbacks,
  PhoneSystemConfig,
  PhoneTriggerSignal,
} from '../domain/phone/phone-types';

interface ScheduledCall {
  definition: PhoneCallDefinition;
  eligibleAtMs: number | null;
  handled: boolean;
}

export class PhoneSystem {
  private state: PhoneState = 'DISABLED';
  private unlocked: boolean;
  private enabled = true;
  private missionId: string | null = null;
  private missionElapsedMs = 0;
  private stateRemainingMs = 0;
  private activeCall: PhoneCallDefinition | null = null;
  private calls: ScheduledCall[] = [];
  private missionStats: PhoneMissionStats = createMissionStats();
  private campaignStats: PhoneCampaignStats;

  public constructor(
    unlocked: boolean,
    campaignStats: Readonly<PhoneCampaignStats>,
    private readonly config: PhoneSystemConfig,
    private readonly callbacks: PhoneSystemCallbacks = {},
  ) {
    validateConfig(config);
    this.unlocked = unlocked;
    this.campaignStats = { ...campaignStats };
    this.synchronizeIdleState();
  }

  public startMission(missionId: string, calls: readonly PhoneCallDefinition[] = []): void {
    validateCalls(calls, this.config);
    this.missionId = missionId;
    this.missionElapsedMs = 0;
    this.stateRemainingMs = 0;
    this.activeCall = null;
    this.missionStats = createMissionStats();
    this.calls = calls.map((definition) => ({
      definition,
      eligibleAtMs:
        definition.trigger.type === 'elapsedTime'
          ? definition.trigger.seconds * 1_000
          : null,
      handled: false,
    }));
    this.synchronizeIdleState();
    this.emitStats();
  }

  public endMission(): void {
    this.missionId = null;
    this.calls = [];
    this.cancelTransientState();
  }

  public update(deltaMs: number): void {
    if (!this.enabled || !this.unlocked || this.missionId === null) {
      this.state = 'DISABLED';
      return;
    }

    const safeDelta = Math.max(0, deltaMs);
    this.missionElapsedMs += safeDelta;

    if (this.state === 'RINGING') {
      this.stateRemainingMs = Math.max(0, this.stateRemainingMs - safeDelta);
      if (this.stateRemainingMs === 0) {
        this.finishMissedCall();
      }
      return;
    }

    if (this.state === 'ANSWERED') {
      return;
    }

    if (this.state === 'AIRPLANE_MODE') {
      this.suppressCallsDueDuringAirplaneMode();
      this.stateRemainingMs = Math.max(0, this.stateRemainingMs - safeDelta);
      if (this.stateRemainingMs === 0) {
        this.state = 'IDLE';
      }
      return;
    }

    if (this.state === 'COOLDOWN') {
      this.stateRemainingMs = Math.max(0, this.stateRemainingMs - safeDelta);
      if (this.stateRemainingMs > 0) {
        return;
      }
      this.state = 'IDLE';
    }

    this.tryStartEligibleCall();
  }

  public notify(signal: PhoneTriggerSignal): void {
    if (!this.enabled || !this.unlocked || this.missionId === null) {
      return;
    }

    for (const call of this.calls) {
      if (call.handled || call.eligibleAtMs !== null || !triggerMatches(call.definition, signal)) {
        continue;
      }
      call.eligibleAtMs = this.missionElapsedMs + triggerDelayMs(call.definition);
    }

    if (this.state === 'IDLE') {
      this.tryStartEligibleCall();
    }
  }

  public answer(): boolean {
    if (this.state !== 'RINGING' || !this.activeCall) {
      return false;
    }

    this.state = 'ANSWERED';
    this.stateRemainingMs = 0;
    this.missionStats.callsAnswered += 1;
    this.campaignStats.totalAnswered += 1;
    this.emitStats();
    return true;
  }

  public decline(): boolean {
    if (this.state !== 'RINGING' || !this.activeCall || !this.missionId) {
      return false;
    }

    const call = this.activeCall;
    this.missionStats.callsDeclined += 1;
    this.campaignStats.totalDeclined += 1;
    this.callbacks.onSuspicionEvent?.({ type: 'declinedWorkCall', missionId: this.missionId });
    this.callbacks.onOutcome?.('DECLINED', call);
    this.emitStats();
    this.enterCooldown();
    return true;
  }

  public activateAirplaneMode(): boolean {
    if (
      !this.enabled ||
      !this.unlocked ||
      this.missionId === null ||
      this.missionStats.airplaneModeUsed
    ) {
      return false;
    }

    if (this.activeCall) {
      this.callbacks.onOutcome?.('CANCELLED_BY_AIRPLANE_MODE', this.activeCall);
    }
    this.activeCall = null;
    this.missionStats.airplaneModeUsed = true;
    this.state = 'AIRPLANE_MODE';
    this.stateRemainingMs = this.config.airplaneModeDurationSeconds * 1_000;
    this.suppressCallsDueDuringAirplaneMode();
    this.emitStats();
    return true;
  }

  public setUnlocked(unlocked: boolean): void {
    this.unlocked = unlocked;
    if (!unlocked) {
      this.cancelTransientState();
    }
    this.synchronizeIdleState();
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.cancelTransientState();
    }
    this.synchronizeIdleState();
  }

  public forceCall(call?: PhoneCallDefinition): boolean {
    if (!this.enabled || !this.unlocked || this.missionId === null || this.state !== 'IDLE') {
      return false;
    }

    const scheduled = call
      ? { definition: call, eligibleAtMs: this.missionElapsedMs, handled: false }
      : this.calls.find((candidate) => !candidate.handled);
    if (!scheduled) {
      return false;
    }
    if (call) {
      this.calls.push(scheduled);
    }
    this.beginCall(scheduled);
    return true;
  }

  public forceMissedCall(): boolean {
    if (this.state !== 'RINGING') {
      return false;
    }
    this.finishMissedCall();
    return true;
  }

  public resetCooldown(): void {
    if (this.state === 'COOLDOWN') {
      this.stateRemainingMs = 0;
      this.synchronizeIdleState();
    }
  }

  public completeAnsweredCall(): boolean {
    if (this.state !== 'ANSWERED' || !this.activeCall) {
      return false;
    }
    this.finishAnsweredCall();
    return true;
  }

  public resetAirplaneModeUsage(): void {
    this.missionStats.airplaneModeUsed = false;
    if (this.state === 'AIRPLANE_MODE') {
      this.state = 'IDLE';
      this.stateRemainingMs = 0;
    }
    this.emitStats();
  }

  public isConversationActive(): boolean {
    return this.state === 'ANSWERED';
  }

  public getSnapshot(): PhoneSnapshot {
    return {
      state: this.state,
      enabled: this.enabled,
      unlocked: this.unlocked,
      activeCall: this.activeCall,
      stateRemainingMs: this.stateRemainingMs,
      missionStats: { ...this.missionStats },
      campaignStats: { ...this.campaignStats },
      airplaneModeAvailable: !this.missionStats.airplaneModeUsed,
      missionElapsedMs: this.missionElapsedMs,
      pendingCalls: this.calls.filter((call) => !call.handled).length,
    };
  }

  private tryStartEligibleCall(): void {
    if (this.state !== 'IDLE') {
      return;
    }
    const call = this.calls.find(
      (candidate) =>
        !candidate.handled &&
        candidate.eligibleAtMs !== null &&
        candidate.eligibleAtMs <= this.missionElapsedMs,
    );
    if (call) {
      this.beginCall(call);
    }
  }

  private beginCall(call: ScheduledCall): void {
    call.handled = true;
    this.activeCall = call.definition;
    this.state = 'RINGING';
    this.stateRemainingMs = call.definition.ringDuration * 1_000;
    this.missionStats.callsReceived += 1;
    this.emitStats();
  }

  private finishMissedCall(): void {
    if (!this.activeCall || !this.missionId) {
      return;
    }
    const call = this.activeCall;
    this.missionStats.callsMissed += 1;
    this.campaignStats.totalMissed += 1;
    this.callbacks.onSuspicionEvent?.({ type: 'missedWorkCall', missionId: this.missionId });
    this.callbacks.onOutcome?.('MISSED', call);
    this.emitStats();
    this.enterCooldown();
  }

  private finishAnsweredCall(): void {
    if (!this.activeCall) {
      return;
    }
    const call = this.activeCall;
    this.callbacks.onOutcome?.('ANSWERED', call);
    this.enterCooldown();
  }

  private enterCooldown(): void {
    this.activeCall = null;
    this.state = 'COOLDOWN';
    this.stateRemainingMs = this.config.minimumCallCooldownSeconds * 1_000;
  }

  private suppressCallsDueDuringAirplaneMode(): void {
    for (const call of this.calls) {
      if (
        !call.handled &&
        call.eligibleAtMs !== null &&
        call.eligibleAtMs <= this.missionElapsedMs
      ) {
        call.handled = true;
      }
    }
  }

  private cancelTransientState(): void {
    this.activeCall = null;
    this.stateRemainingMs = 0;
    this.state = 'DISABLED';
  }

  private synchronizeIdleState(): void {
    if (!this.enabled || !this.unlocked || this.missionId === null) {
      this.state = 'DISABLED';
    } else if (this.state === 'DISABLED') {
      this.state = 'IDLE';
    }
  }

  private emitStats(): void {
    this.callbacks.onStatsChanged?.({ ...this.missionStats }, { ...this.campaignStats });
  }
}

function createMissionStats(): PhoneMissionStats {
  return {
    callsReceived: 0,
    callsAnswered: 0,
    callsMissed: 0,
    callsDeclined: 0,
    airplaneModeUsed: false,
  };
}

function triggerDelayMs(call: PhoneCallDefinition): number {
  return call.trigger.type === 'elapsedTime' ? 0 : (call.trigger.delaySeconds ?? 0) * 1_000;
}

function triggerMatches(call: PhoneCallDefinition, signal: PhoneTriggerSignal): boolean {
  const trigger = call.trigger;
  if (trigger.type !== signal.type) {
    return false;
  }
  switch (trigger.type) {
    case 'enterZone':
      return trigger.zoneId === (signal as Extract<PhoneTriggerSignal, { type: 'enterZone' }>).zoneId;
    case 'objectiveCompleted':
      return trigger.stepId === (signal as Extract<PhoneTriggerSignal, { type: 'objectiveCompleted' }>).stepId;
    case 'itemPickedUp':
      return trigger.itemId === (signal as Extract<PhoneTriggerSignal, { type: 'itemPickedUp' }>).itemId;
    case 'returningHome':
      return trigger.afterStepId === (signal as Extract<PhoneTriggerSignal, { type: 'returningHome' }>).afterStepId;
  }
}

function validateConfig(config: PhoneSystemConfig): void {
  if (
    config.minimumCallCooldownSeconds < 0 ||
    config.airplaneModeDurationSeconds <= 0 ||
    !Number.isInteger(config.maximumCallsPerMission) ||
    config.maximumCallsPerMission < 1
  ) {
    throw new Error('Invalid phone system configuration.');
  }
}

function validateCalls(calls: readonly PhoneCallDefinition[], config: PhoneSystemConfig): void {
  if (calls.length > config.maximumCallsPerMission) {
    throw new Error(`A mission may define at most ${config.maximumCallsPerMission} phone calls.`);
  }
  const ids = new Set<string>();
  for (const call of calls) {
    if (
      !call.id ||
      ids.has(call.id) ||
      call.ringDuration <= 0 ||
      call.answerDuration <= 0 ||
      call.dialogue.lines.length === 0
    ) {
      throw new Error(`Invalid phone call definition: ${call.id || '<missing id>'}.`);
    }
    ids.add(call.id);
  }
}
