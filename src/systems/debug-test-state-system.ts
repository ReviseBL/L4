import { debugMissionTestDefinitions, debugScenarioDefinitions } from '../data/debug/debug-test-states';
import type {
  DebugHomePreset,
  DebugRuntimeState,
  DebugScenarioDefinition,
  DebugTestSelection,
} from '../domain/debug/debug-test-types';
import type { MissionDefinition } from '../domain/missions/mission-types';
import { createDefaultGameStateData } from '../state/game-state';
import { PRINT_PROJECT_STATE } from '../domain/printing/print-job-types';

export class DebugTestStateSystem {
  public constructor(private readonly missions: readonly MissionDefinition[]) {
    const missionIds = new Set(missions.map((mission) => mission.id));
    for (const definition of debugMissionTestDefinitions) {
      if (!missionIds.has(definition.missionId)) {
        throw new Error(`Debug state references unknown mission: ${definition.missionId}.`);
      }
    }
  }

  public getMissionDefinitions() {
    return debugMissionTestDefinitions;
  }

  public getScenarioDefinitions(): readonly DebugScenarioDefinition[] {
    return debugScenarioDefinitions;
  }

  public createDefaultSelection(missionId = 'medicine-run'): DebugTestSelection {
    const definition = this.requireDefinition(missionId);
    return {
      missionId,
      stage: 'MISSION_START',
      day: definition.day,
      suspicion: 0,
      phoneEnabled: definition.phoneEnabled,
      coworkerEnabled: definition.coworkerEnabled,
      hrEnabled: definition.hrEnabled,
      companyCarEnabled: definition.companyCarEnabled,
      managerEnabled: definition.managerEnabled,
      homePreset: `month${Math.min(6, definition.month)}` as DebugHomePreset,
    };
  }

  public build(selection: DebugTestSelection, label = 'CUSTOM TEST STATE'): DebugRuntimeState {
    const definition = this.requireDefinition(selection.missionId);
    const checkpoint = definition.checkpoints.find((candidate) => candidate.stage === selection.stage);
    if (!checkpoint) throw new Error(`Missing debug stage ${selection.stage} for ${selection.missionId}.`);

    const missionIndex = this.missions.findIndex((mission) => mission.id === selection.missionId);
    const completedMissionIds = this.missions.slice(0, missionIndex).map((mission) => mission.id);
    const state = createDefaultGameStateData();
    state.currentMissionId = selection.missionId;
    state.currentMissionStepIndex = checkpoint.stepIndex;
    state.completedMissionIds = completedMissionIds;
    const monthStart = (definition.month - 1) * 30 + 1;
    const monthEnd = definition.month * 30;
    state.currentL4Day = clamp(selection.day, monthStart, monthEnd);
    state.currentMonth = definition.month;
    state.completedMonths = [1, 2, 3, 4, 5, 6].filter((month) => month < definition.month) as typeof state.completedMonths;
    state.suspicion = clamp(selection.suspicion, 0, 100);
    state.suspicionMaxReached = state.suspicion >= 100;
    state.inventory = { ...(checkpoint.inventory ?? {}) };
    state.phone.unlocked = selection.phoneEnabled;
    state.hr.unlocked = selection.hrEnabled;
    state.manager.unlocked = selection.managerEnabled;
    state.home = createHomePreset(selection.homePreset);

    if (completedMissionIds.includes('m3-usb-c-run')) {
      addUnique(state.home.deskItemIds, 'usb-c-cable-installed');
    }
    if (completedMissionIds.includes('m3-orange-filament-run')) {
      addUnique(state.home.filamentSpoolIds, 'pla-orange');
    }
    if (completedMissionIds.includes('m4-asa-filament-run')) addUnique(state.home.filamentSpoolIds, 'asa-black');
    if (selection.missionId === 'm5-l4-project-run') {
      state.home.printProjectStates['l4-400'] = checkpoint.stepIndex >= 2
        ? PRINT_PROJECT_STATE.MaterialsReady
        : PRINT_PROJECT_STATE.Planned;
    }
    if (completedMissionIds.includes('m5-l4-project-run')) {
      state.home.currentPrintId = 'l4-400';
      state.home.printProjectStates['l4-400'] = PRINT_PROJECT_STATE.Printing;
    }
    if (selection.missionId === 'm5-kebab-run' && selection.stage !== 'MISSION_START') {
      state.home.currentPrintId = null;
      state.home.printProjectStates['l4-400'] = PRINT_PROJECT_STATE.Completed;
      addUnique(state.home.completedPrintIds, 'l4-400');
    }
    if (completedMissionIds.includes('m5-kebab-run')) {
      state.home.currentPrintId = null;
      state.home.printProjectStates['l4-400'] = PRINT_PROJECT_STATE.Completed;
      addUnique(state.home.completedPrintIds, 'l4-400');
    }
    if (completedMissionIds.includes('m6-final-spool-run')) addUnique(state.home.filamentSpoolIds, 'tpu-purple');

    return {
      version: 1,
      label,
      selection: { ...selection },
      gameState: state,
      playerStart: { ...checkpoint.playerStart },
      forcePhoneCall: false,
    };
  }

  public buildScenario(scenarioId: string): DebugRuntimeState {
    const scenario = debugScenarioDefinitions.find((candidate) => candidate.id === scenarioId);
    if (!scenario) throw new Error(`Unknown debug scenario: ${scenarioId}.`);
    const runtime: DebugRuntimeState = {
      ...this.build(scenario.selection, scenario.label),
      ...('runtimeOverrides' in scenario ? scenario.runtimeOverrides : {}),
      selection: { ...scenario.selection },
    };
    if (runtime.criticalSuspicionIncidents !== undefined) {
      const incidentCount = Math.max(0, Math.floor(runtime.criticalSuspicionIncidents));
      runtime.gameState.campaignStats.criticalSuspicionIncidents = incidentCount;
      runtime.gameState.criticalIncidentMissionIds = Array.from(
        { length: incidentCount },
        (_, index) => `debug-critical-incident-${index + 1}`,
      );
      runtime.gameState.suspicionMaxReached = incidentCount > 0;
    }
    if (runtime.currentMissionCriticalIncident) {
      if (!runtime.gameState.criticalIncidentMissionIds.includes(runtime.selection.missionId)) {
        runtime.gameState.criticalIncidentMissionIds.push(runtime.selection.missionId);
        runtime.gameState.campaignStats.criticalSuspicionIncidents += 1;
      }
      runtime.gameState.suspicion = 100;
      runtime.gameState.suspicionMaxReached = true;
    }
    return runtime;
  }

  public withCurrentSnapshot(runtime: DebugRuntimeState, gameState: DebugRuntimeState['gameState'], playerStart: DebugRuntimeState['playerStart']): DebugRuntimeState {
    return {
      ...runtime,
      gameState,
      playerStart: { ...playerStart },
      selection: { ...runtime.selection, day: gameState.currentL4Day, suspicion: gameState.suspicion },
    };
  }

  private requireDefinition(missionId: string) {
    const definition = debugMissionTestDefinitions.find((candidate) => candidate.missionId === missionId);
    if (!definition) throw new Error(`Unknown debug mission: ${missionId}.`);
    return definition;
  }
}

function createHomePreset(preset: DebugHomePreset): DebugRuntimeState['gameState']['home'] {
  if (preset === 'month1') {
    return { filamentSpoolIds: [], completedPrintIds: [], deskItemIds: [], decorationIds: [], currentPrintId: null, printProjectStates: {} };
  }
  if (preset === 'month2') {
    return { filamentSpoolIds: ['petg'], completedPrintIds: ['cable-holder'], deskItemIds: [], decorationIds: [], currentPrintId: null, printProjectStates: {} };
  }
  if (preset === 'month3') return {
    filamentSpoolIds: ['petg'],
    completedPrintIds: ['cable-holder'],
    deskItemIds: ['nozzle-0-6-installed'],
    decorationIds: [],
    currentPrintId: null,
    printProjectStates: {},
  };
  const month4 = {
    filamentSpoolIds: ['petg', 'pla-orange'],
    completedPrintIds: ['cable-holder'],
    deskItemIds: ['nozzle-0-6-installed', 'usb-c-cable-installed'],
    decorationIds: [],
    currentPrintId: null,
    printProjectStates: {},
  };
  if (preset === 'month4') return month4;
  if (preset === 'month5') return {
    ...month4,
    filamentSpoolIds: [...month4.filamentSpoolIds, 'asa-black'],
    printProjectStates: { 'l4-400': PRINT_PROJECT_STATE.Planned },
  };
  return {
    ...month4,
    filamentSpoolIds: [...month4.filamentSpoolIds, 'asa-black', 'tpu-purple'],
    completedPrintIds: [...month4.completedPrintIds, 'l4-400'],
    printProjectStates: { 'l4-400': PRINT_PROJECT_STATE.Completed },
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function addUnique(values: string[], value: string): void {
  if (!values.includes(value)) values.push(value);
}
