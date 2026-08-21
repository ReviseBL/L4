import { describe, expect, it } from 'vitest';
import { verticalSliceMissions } from '../src/data/missions/vertical-slice-missions';
import { DebugTestStateSystem } from '../src/systems/debug-test-state-system';
import { MissionSystem } from '../src/systems/mission-system';

const system = new DebugTestStateSystem(verticalSliceMissions);

describe('DebugTestStateSystem', () => {
  it.each([
    ['medicine-run', 1, 1, false, false],
    ['m2-coffee-run', 2, 31, true, false],
    ['m3-medicine-run', 3, 61, true, true],
    ['m4-shopping-run', 4, 91, true, false],
    ['m5-shopping-run', 5, 121, true, false],
    ['m6-final-spool-run', 6, 151, true, true],
  ] as const)('builds a coherent jump for %s', (missionId, month, day, phone, hr) => {
    const runtime = system.build(system.createDefaultSelection(missionId));
    expect(runtime.gameState).toMatchObject({
      currentMissionId: missionId,
      currentMissionStepIndex: 0,
      currentMonth: month,
      currentL4Day: day,
      phone: { unlocked: phone },
      hr: { unlocked: hr },
    });
    expect(runtime.selection.coworkerEnabled).toBe(true);
    expect(runtime.gameState.completedMonths).toEqual(Array.from({ length: month - 1 }, (_, index) => index + 1));
  });

  it('starts M4-02 returning home with the large package and car enabled', () => {
    const runtime = system.build({ ...system.createDefaultSelection('m4-large-package-run'), stage: 'RETURNING_HOME' });
    expect(runtime.gameState.inventory).toEqual({ 'large-package': 1 });
    expect(runtime.selection.companyCarEnabled).toBe(true);
    expect(runtime.gameState.currentMonth).toBe(4);
  });

  it('starts M2-03 at RETURNING_HOME with the nozzle and correct objective', () => {
    const selection = { ...system.createDefaultSelection('m2-nozzle-run'), stage: 'RETURNING_HOME' as const };
    const runtime = system.build(selection);
    expect(runtime.gameState.inventory).toEqual({ 'nozzle-0-6': 1 });
    expect(runtime.gameState.currentMissionStepIndex).toBe(2);
    const mission = new MissionSystem(verticalSliceMissions);
    mission.startAt(runtime.gameState.currentMissionId!, runtime.gameState.currentMissionStepIndex, { nowMs: 0, suspicion: 0 });
    expect(mission.getCurrentObjectiveText()).toContain('zainstaluj dyszę');
  });

  it.each([
    ['m2-nozzle-before-purchase', 1, {}],
    ['m2-nozzle-after-purchase', 2, { 'nozzle-0-6': 1 }],
    ['m2-nozzle-install', 2, { 'nozzle-0-6': 1 }],
  ] as const)('builds nozzle scenario %s', (scenarioId, stepIndex, inventory) => {
    const runtime = system.buildScenario(scenarioId);
    expect(runtime.gameState).toMatchObject({
      currentMissionId: 'm2-nozzle-run',
      currentMissionStepIndex: stepIndex,
      currentMonth: 2,
      inventory,
    });
    expect(runtime.selection.coworkerEnabled).toBe(false);
  });

  it('starts M5-02 returning home with filament, manager and material-ready project', () => {
    const runtime = system.build({ ...system.createDefaultSelection('m5-l4-project-run'), stage: 'RETURNING_HOME' });
    expect(runtime.gameState.inventory).toEqual({ 'l4-print-filament': 1 });
    expect(runtime.gameState.home.printProjectStates['l4-400']).toBe('MATERIALS_READY');
    expect(runtime.selection.managerEnabled).toBe(true);
    expect(runtime.gameState.manager.unlocked).toBe(true);
  });

  it.each(['manager-basic', 'manager-chase', 'manager-searching', 'car-report-manager', 'l4-print-return', 'month5-chaos'])('builds month-five scenario %s', (id) => {
    const runtime = system.buildScenario(id);
    expect(runtime.gameState.currentMonth).toBe(5);
    expect(runtime.selection.managerEnabled).toBe(true);
  });

  it.each(['month6-basic', 'day-179', 'zus-documents', 'zus-questions', 'zus-walk-test', 'zus-verdict-good', 'zus-verdict-bad', 'full-finale'])('builds month-six/finale scenario %s', (id) => {
    const runtime = system.buildScenario(id);
    expect(runtime.gameState.currentMonth).toBe(6);
    expect(runtime.gameState.version).toBe(7);
  });

  it('starts the final spool return with TPU and complete home progression', () => {
    const runtime = system.build({ ...system.createDefaultSelection('m6-final-spool-run'), stage: 'RETURNING_HOME' });
    expect(runtime.gameState.inventory).toEqual({ 'tpu-purple-spool': 1 });
    expect(runtime.gameState.home.completedPrintIds).toContain('l4-400');
    expect(runtime.selection.homePreset).toBe('month6');
  });

  it('starts M3-03 on the return route with PLA, HR, phone and custom suspicion', () => {
    const selection = {
      ...system.createDefaultSelection('m3-orange-filament-run'),
      stage: 'RETURNING_HOME' as const,
      day: 88,
      suspicion: 55,
    };
    const runtime = system.build(selection);
    expect(runtime.gameState).toMatchObject({
      currentMonth: 3,
      currentL4Day: 88,
      currentMissionStepIndex: 1,
      suspicion: 55,
      inventory: { 'pla-orange-spool': 1 },
      phone: { unlocked: true },
      hr: { unlocked: true },
    });
    expect(runtime.gameState.home.deskItemIds).toContain('usb-c-cable-installed');
  });

  it('clamps a manually selected day to the selected mission month', () => {
    const selection = { ...system.createDefaultSelection('m2-package-run'), day: 180 };
    expect(system.build(selection).gameState.currentL4Day).toBe(60);
  });

  it.each([
    ['hr-basic-patrol', false, true, false],
    ['hr-detection', false, true, false],
    ['phone-hr-conflict', true, true, true],
    ['return-home-double-npc', true, true, false],
  ] as const)('builds scenario %s', (id, phone, hr, forcedCall) => {
    const runtime = system.buildScenario(id);
    expect(runtime.selection.phoneEnabled).toBe(phone);
    expect(runtime.selection.hrEnabled).toBe(hr);
    expect(runtime.forcePhoneCall).toBe(forcedCall);
    expect(runtime.gameState.currentMonth).toBe(3);
  });

  it('rebuilding the same stage resets stale mission data deterministically', () => {
    const selection = { ...system.createDefaultSelection('m3-usb-c-run'), stage: 'OBJECTIVE_COLLECTED' as const };
    const first = system.build(selection);
    first.gameState.inventory.package = 99;
    const restarted = system.build(selection);
    expect(restarted.gameState.inventory).toEqual({ 'usb-c-cable': 1 });
    expect(restarted.gameState.currentMissionStepIndex).toBe(1);
  });

  it.each([
    ['suspicion-99', 99, 0, false],
    ['trigger-critical', 99, 0, true],
    ['post-incident-mission-end', 100, 1, false],
    ['zus-zero-incidents', 55, 0, false],
    ['zus-three-incidents', 55, 3, false],
  ] as const)('builds critical incident scenario %s', (id, suspicion, incidents, trigger) => {
    const runtime = system.buildScenario(id);
    expect(runtime.gameState.suspicion).toBe(suspicion);
    expect(runtime.gameState.campaignStats.criticalSuspicionIncidents).toBe(incidents);
    expect(Boolean(runtime.triggerCriticalSuspicionIncident)).toBe(trigger);
  });
});
