import type {
  DebugMissionCheckpointDefinition,
  DebugMissionTestDefinition,
  DebugScenarioDefinition,
} from '../../domain/debug/debug-test-types';
import { HR_STATE } from '../../domain/npcs/hr-types';
import { COMPANY_CAR_STATE } from '../../domain/npcs/company-car-types';
import { MANAGER_STATE } from '../../domain/npcs/manager-types';
import { ZUS_FINALE_PHASE } from '../../domain/finale/zus-finale-types';

const HOME = { x: 285, y: 295 };
const HOME_APPROACH = { x: 285, y: 510 };
const STREET = { x: 650, y: 570 };
const PHARMACY = { x: 780, y: 1105 };
const GROCERY = { x: 950, y: 390 };
const PETG = { x: 1700, y: 300 };
const ORANGE_PLA = { x: 1545, y: 290 };
const TECH = { x: 1715, y: 290 };
const NOZZLE = { x: 1715, y: 290 };
const PARCEL = { x: 1320, y: 895 };
const ASA = { x: 1570, y: 290 };
const PRINTER = { x: 215, y: 200 };
const L4_FILAMENT = { x: 1705, y: 405 };
const KEBAB = { x: 1610, y: 1175 };
const TPU = { x: 1845, y: 405 };
const KIOSK = { x: 2050, y: 1525 };

/** Three-step errands: objective, a detour somewhere further away, then home. */
function detourCheckpoints(
  objective: { x: number; y: number },
  detour: { x: number; y: number },
  afterObjective: Readonly<Record<string, number>>,
  afterDetour: Readonly<Record<string, number>>,
): readonly DebugMissionCheckpointDefinition[] {
  return [
    { stage: 'MISSION_START', stepIndex: 0, playerStart: HOME },
    { stage: 'AFTER_INTRO', stepIndex: 0, playerStart: HOME },
    { stage: 'ON_ROUTE_TO_OBJECTIVE', stepIndex: 0, playerStart: STREET },
    { stage: 'OBJECTIVE_READY', stepIndex: 0, playerStart: objective },
    { stage: 'OBJECTIVE_COLLECTED', stepIndex: 1, playerStart: detour, inventory: afterObjective },
    { stage: 'RETURNING_HOME', stepIndex: 2, playerStart: HOME_APPROACH, inventory: afterDetour },
    { stage: 'FINAL_INTERACTION_READY', stepIndex: 2, playerStart: HOME_APPROACH, inventory: afterDetour },
  ];
}

function twoStepCheckpoints(
  objective: { x: number; y: number },
  itemId: string,
  finalStart: { x: number; y: number } = HOME_APPROACH,
): readonly DebugMissionCheckpointDefinition[] {
  return [
    { stage: 'MISSION_START', stepIndex: 0, playerStart: HOME },
    { stage: 'AFTER_INTRO', stepIndex: 0, playerStart: HOME },
    { stage: 'ON_ROUTE_TO_OBJECTIVE', stepIndex: 0, playerStart: STREET },
    { stage: 'OBJECTIVE_READY', stepIndex: 0, playerStart: objective },
    { stage: 'OBJECTIVE_COLLECTED', stepIndex: 1, playerStart: objective, inventory: { [itemId]: 1 } },
    { stage: 'RETURNING_HOME', stepIndex: 1, playerStart: HOME_APPROACH, inventory: { [itemId]: 1 } },
    { stage: 'FINAL_INTERACTION_READY', stepIndex: 1, playerStart: finalStart, inventory: { [itemId]: 1 } },
  ];
}

function printerMissionCheckpoints(
  objective: { x: number; y: number },
  itemId: string,
): readonly DebugMissionCheckpointDefinition[] {
  return [
    { stage: 'MISSION_START', stepIndex: 0, playerStart: HOME },
    { stage: 'AFTER_INTRO', stepIndex: 0, playerStart: PRINTER },
    { stage: 'ON_ROUTE_TO_OBJECTIVE', stepIndex: 1, playerStart: STREET },
    { stage: 'OBJECTIVE_READY', stepIndex: 1, playerStart: objective },
    { stage: 'OBJECTIVE_COLLECTED', stepIndex: 2, playerStart: objective, inventory: { [itemId]: 1 } },
    { stage: 'RETURNING_HOME', stepIndex: 2, playerStart: HOME_APPROACH, inventory: { [itemId]: 1 } },
    { stage: 'FINAL_INTERACTION_READY', stepIndex: 2, playerStart: PRINTER, inventory: { [itemId]: 1 } },
  ];
}

function l4ProjectCheckpoints(): readonly DebugMissionCheckpointDefinition[] {
  return [
    { stage: 'MISSION_START', stepIndex: 0, playerStart: HOME },
    { stage: 'AFTER_INTRO', stepIndex: 0, playerStart: PRINTER },
    { stage: 'ON_ROUTE_TO_OBJECTIVE', stepIndex: 1, playerStart: STREET },
    { stage: 'OBJECTIVE_READY', stepIndex: 1, playerStart: L4_FILAMENT },
    { stage: 'OBJECTIVE_COLLECTED', stepIndex: 2, playerStart: L4_FILAMENT, inventory: { 'l4-print-filament': 1 } },
    { stage: 'RETURNING_HOME', stepIndex: 2, playerStart: HOME_APPROACH, inventory: { 'l4-print-filament': 1 } },
    { stage: 'FINAL_INTERACTION_READY', stepIndex: 2, playerStart: PRINTER, inventory: { 'l4-print-filament': 1 } },
  ];
}

export const debugMissionTestDefinitions = [
  { missionId: 'medicine-run', label: 'M1-01 LEKI', month: 1, day: 1, phoneEnabled: false, coworkerEnabled: true, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, checkpoints: twoStepCheckpoints(PHARMACY, 'medicine') },
  { missionId: 'milk-run', label: 'M1-02 ŻABKA', month: 1, day: 8, phoneEnabled: false, coworkerEnabled: true, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, checkpoints: twoStepCheckpoints(GROCERY, 'milk') },
  { missionId: 'filament-run', label: 'M1-03 FILAMENT', month: 1, day: 20, phoneEnabled: false, coworkerEnabled: true, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, checkpoints: printerMissionCheckpoints(PETG, 'petg-spool') },
  { missionId: 'm2-coffee-run', label: 'M2-01 KAWA', month: 2, day: 31, phoneEnabled: true, coworkerEnabled: true, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, checkpoints: twoStepCheckpoints(GROCERY, 'coffee') },
  { missionId: 'm2-package-run', label: 'M2-02 PACZKA', month: 2, day: 41, phoneEnabled: true, coworkerEnabled: true, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, checkpoints: twoStepCheckpoints(PARCEL, 'package') },
  { missionId: 'm2-nozzle-run', label: 'M2-03 DYSZA', month: 2, day: 51, phoneEnabled: true, coworkerEnabled: true, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, checkpoints: printerMissionCheckpoints(NOZZLE, 'nozzle-0-6') },
  { missionId: 'm3-medicine-run', label: 'M3-01 LEKI', month: 3, day: 61, phoneEnabled: true, coworkerEnabled: true, hrEnabled: true, companyCarEnabled: false, managerEnabled: false, checkpoints: detourCheckpoints(PHARMACY, PARCEL, {}, { medicine: 1 }) },
  { missionId: 'm3-usb-c-run', label: 'M3-02 USB-C', month: 3, day: 71, phoneEnabled: true, coworkerEnabled: true, hrEnabled: true, companyCarEnabled: false, managerEnabled: false, checkpoints: twoStepCheckpoints(TECH, 'usb-c-cable') },
  { missionId: 'm3-orange-filament-run', label: 'M3-03 PLA ORANGE', month: 3, day: 81, phoneEnabled: true, coworkerEnabled: true, hrEnabled: true, companyCarEnabled: false, managerEnabled: false, checkpoints: twoStepCheckpoints(ORANGE_PLA, 'pla-orange-spool', PRINTER) },
  { missionId: 'm4-shopping-run', label: 'M4-01 ZAKUPY', month: 4, day: 91, phoneEnabled: true, coworkerEnabled: true, hrEnabled: false, companyCarEnabled: true, managerEnabled: false, checkpoints: detourCheckpoints(GROCERY, KIOSK, { groceries: 1 }, { groceries: 1, 'crossword-newspaper': 1 }) },
  { missionId: 'm4-large-package-run', label: 'M4-02 DUŻA PACZKA', month: 4, day: 101, phoneEnabled: true, coworkerEnabled: true, hrEnabled: true, companyCarEnabled: true, managerEnabled: false, checkpoints: twoStepCheckpoints(PARCEL, 'large-package') },
  { missionId: 'm4-asa-filament-run', label: 'M4-03 ASA', month: 4, day: 111, phoneEnabled: true, coworkerEnabled: true, hrEnabled: true, companyCarEnabled: true, managerEnabled: false, checkpoints: twoStepCheckpoints(ASA, 'asa-black-spool', PRINTER) },
  { missionId: 'm5-shopping-run', label: 'M5-01 KIEROWNIK', month: 5, day: 121, phoneEnabled: true, coworkerEnabled: true, hrEnabled: false, companyCarEnabled: false, managerEnabled: true, checkpoints: detourCheckpoints(KIOSK, GROCERY, { 'scratch-card': 1 }, { 'scratch-card': 1, groceries: 1 }) },
  { missionId: 'm5-l4-project-run', label: 'M5-02 L4 400%', month: 5, day: 131, phoneEnabled: true, coworkerEnabled: true, hrEnabled: true, companyCarEnabled: true, managerEnabled: true, checkpoints: l4ProjectCheckpoints() },
  { missionId: 'm5-kebab-run', label: 'M5-03 KEBAB', month: 5, day: 141, phoneEnabled: true, coworkerEnabled: true, hrEnabled: true, companyCarEnabled: true, managerEnabled: true, checkpoints: twoStepCheckpoints(KEBAB, 'kebab') },
  { missionId: 'm6-final-spool-run', label: 'M6-01 OSTATNIA SZPULA', month: 6, day: 151, phoneEnabled: true, coworkerEnabled: true, hrEnabled: true, companyCarEnabled: true, managerEnabled: true, checkpoints: twoStepCheckpoints(TPU, 'tpu-purple-spool', PRINTER) },
  { missionId: 'm6-food-run', label: 'M6-02 TYLKO PO JEDZENIE', month: 6, day: 165, phoneEnabled: true, coworkerEnabled: true, hrEnabled: true, companyCarEnabled: true, managerEnabled: true, checkpoints: twoStepCheckpoints(KEBAB, 'kebab') },
] as const satisfies readonly DebugMissionTestDefinition[];

export const debugScenarioDefinitions = [
  {
    id: 'm2-nozzle-before-purchase', label: 'M2-03 BEFORE PURCHASE',
    selection: { missionId: 'm2-nozzle-run', stage: 'OBJECTIVE_READY', day: 51, suspicion: 20, phoneEnabled: true, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, homePreset: 'month2' },
  },
  {
    id: 'm2-nozzle-after-purchase', label: 'M2-03 AFTER PURCHASE',
    selection: { missionId: 'm2-nozzle-run', stage: 'OBJECTIVE_COLLECTED', day: 51, suspicion: 20, phoneEnabled: true, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, homePreset: 'month2' },
  },
  {
    id: 'm2-nozzle-install', label: 'M2-03 INSTALL',
    selection: { missionId: 'm2-nozzle-run', stage: 'FINAL_INTERACTION_READY', day: 51, suspicion: 20, phoneEnabled: true, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, homePreset: 'month2' },
  },
  {
    id: 'hr-basic-patrol', label: 'HR BASIC PATROL',
    selection: { missionId: 'm3-medicine-run', stage: 'AFTER_INTRO', day: 61, suspicion: 25, phoneEnabled: false, coworkerEnabled: false, hrEnabled: true, companyCarEnabled: false, managerEnabled: false, homePreset: 'month3' },
    runtimeOverrides: { forcePhoneCall: false, hrStart: { x: 720, y: 940 }, hrState: HR_STATE.Patrol },
  },
  {
    id: 'hr-detection', label: 'HR DETECTION',
    selection: { missionId: 'm3-medicine-run', stage: 'ON_ROUTE_TO_OBJECTIVE', day: 61, suspicion: 35, phoneEnabled: false, coworkerEnabled: false, hrEnabled: true, companyCarEnabled: false, managerEnabled: false, homePreset: 'month3' },
    runtimeOverrides: { forcePhoneCall: false, hrStart: { x: 510, y: 570 }, hrState: HR_STATE.Suspicious },
  },
  {
    id: 'hr-conversation', label: 'HR CONVERSATION',
    selection: { missionId: 'm3-medicine-run', stage: 'AFTER_INTRO', day: 61, suspicion: 45, phoneEnabled: false, coworkerEnabled: false, hrEnabled: true, companyCarEnabled: false, managerEnabled: false, homePreset: 'month3' },
    runtimeOverrides: { forcePhoneCall: false, hrStart: { x: 340, y: 295 }, hrState: HR_STATE.Conversation, triggerHrConversation: true },
  },
  {
    id: 'phone-hr-conflict', label: 'PHONE + HR CONFLICT',
    selection: { missionId: 'm3-usb-c-run', stage: 'ON_ROUTE_TO_OBJECTIVE', day: 71, suspicion: 55, phoneEnabled: true, coworkerEnabled: false, hrEnabled: true, companyCarEnabled: false, managerEnabled: false, homePreset: 'month3' },
    runtimeOverrides: { forcePhoneCall: true, hrStart: { x: 820, y: 570 }, hrState: HR_STATE.Approaching },
  },
  {
    id: 'return-home-double-npc', label: 'COWORKER + HR RETURN',
    selection: { missionId: 'm3-orange-filament-run', stage: 'RETURNING_HOME', day: 81, suspicion: 55, phoneEnabled: true, coworkerEnabled: true, hrEnabled: true, companyCarEnabled: false, managerEnabled: false, homePreset: 'month3' },
    runtimeOverrides: { forcePhoneCall: false, hrStart: { x: 760, y: 650 }, hrState: HR_STATE.Patrol },
  },
  { id: 'company-car-basic', label: 'COMPANY CAR BASIC', selection: { missionId: 'm4-shopping-run', stage: 'ON_ROUTE_TO_OBJECTIVE', day: 91, suspicion: 30, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: true, managerEnabled: false, homePreset: 'month4' }, runtimeOverrides: { companyCarStart: { x: 1050, y: 700 }, companyCarState: COMPANY_CAR_STATE.Driving } },
  { id: 'company-car-detection', label: 'COMPANY CAR DETECTION', selection: { missionId: 'm4-shopping-run', stage: 'ON_ROUTE_TO_OBJECTIVE', day: 91, suspicion: 35, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: true, managerEnabled: false, homePreset: 'month4' }, runtimeOverrides: { companyCarStart: { x: 510, y: 700 }, companyCarState: COMPANY_CAR_STATE.Suspicious } },
  { id: 'position-reported', label: 'POSITION REPORTED', selection: { missionId: 'm4-large-package-run', stage: 'RETURNING_HOME', day: 101, suspicion: 50, phoneEnabled: false, coworkerEnabled: true, hrEnabled: true, companyCarEnabled: true, managerEnabled: false, homePreset: 'month4' }, runtimeOverrides: { forcePositionReport: true, companyCarStart: { x: 900, y: 790 }, hrState: HR_STATE.Searching } },
  { id: 'phone-car', label: 'PHONE + CAR', selection: { missionId: 'm4-shopping-run', stage: 'ON_ROUTE_TO_OBJECTIVE', day: 91, suspicion: 45, phoneEnabled: true, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: true, managerEnabled: false, homePreset: 'month4' }, runtimeOverrides: { forcePhoneCall: true, companyCarStart: { x: 900, y: 700 } } },
  { id: 'month4-chaos', label: 'FULL MONTH 4 CHAOS', selection: { missionId: 'm4-asa-filament-run', stage: 'RETURNING_HOME', day: 111, suspicion: 65, phoneEnabled: true, coworkerEnabled: true, hrEnabled: true, companyCarEnabled: true, managerEnabled: false, homePreset: 'month4' }, runtimeOverrides: { forcePhoneCall: true, companyCarStart: { x: 1250, y: 790 } } },
  { id: 'manager-basic', label: 'MANAGER BASIC', selection: { missionId: 'm5-shopping-run', stage: 'ON_ROUTE_TO_OBJECTIVE', day: 121, suspicion: 35, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: true, homePreset: 'month5' }, runtimeOverrides: { managerStart: { x: 930, y: 575 }, managerState: MANAGER_STATE.PatrolArea } },
  { id: 'manager-detection', label: 'MANAGER DETECTION', selection: { missionId: 'm5-shopping-run', stage: 'ON_ROUTE_TO_OBJECTIVE', day: 121, suspicion: 45, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: true, homePreset: 'month5' }, runtimeOverrides: { managerStart: { x: 860, y: 575 }, managerState: MANAGER_STATE.Suspicious } },
  { id: 'manager-chase', label: 'MANAGER CHASE', selection: { missionId: 'm5-shopping-run', stage: 'ON_ROUTE_TO_OBJECTIVE', day: 121, suspicion: 55, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: true, homePreset: 'month5' }, runtimeOverrides: { managerStart: { x: 780, y: 575 }, forceManagerDetection: true } },
  { id: 'manager-searching', label: 'MANAGER SEARCHING', selection: { missionId: 'm5-shopping-run', stage: 'ON_ROUTE_TO_OBJECTIVE', day: 121, suspicion: 72, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: true, homePreset: 'month5' }, runtimeOverrides: { managerStart: { x: 760, y: 650 }, managerState: MANAGER_STATE.Searching } },
  { id: 'car-report-manager', label: 'CAR REPORT + MANAGER', selection: { missionId: 'm5-l4-project-run', stage: 'RETURNING_HOME', day: 131, suspicion: 72, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: true, managerEnabled: true, homePreset: 'month5' }, runtimeOverrides: { forcePositionReport: true, companyCarStart: { x: 920, y: 790 }, managerStart: { x: 1450, y: 895 } } },
  { id: 'l4-print-return', label: 'L4 PRINT RETURN', selection: { missionId: 'm5-l4-project-run', stage: 'RETURNING_HOME', day: 131, suspicion: 60, phoneEnabled: true, coworkerEnabled: false, hrEnabled: true, companyCarEnabled: true, managerEnabled: true, homePreset: 'month5' }, runtimeOverrides: { managerStart: { x: 1120, y: 895 } } },
  { id: 'month5-chaos', label: 'MONTH 5 FULL CHAOS', selection: { missionId: 'm5-kebab-run', stage: 'RETURNING_HOME', day: 141, suspicion: 82, phoneEnabled: true, coworkerEnabled: true, hrEnabled: true, companyCarEnabled: true, managerEnabled: true, homePreset: 'month5' }, runtimeOverrides: { forcePhoneCall: true, companyCarStart: { x: 1240, y: 790 }, managerStart: { x: 980, y: 895 } } },
  { id: 'month6-basic', label: 'MONTH 6 BASIC', selection: { missionId: 'm6-final-spool-run', stage: 'MISSION_START', day: 151, suspicion: 65, phoneEnabled: true, coworkerEnabled: true, hrEnabled: true, companyCarEnabled: true, managerEnabled: true, homePreset: 'month6' } },
  { id: 'day-179', label: 'DAY 179', selection: { missionId: 'm6-food-run', stage: 'RETURNING_HOME', day: 179, suspicion: 78, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, homePreset: 'month6' }, runtimeOverrides: { triggerZusSummons: true } },
  { id: 'zus-documents', label: 'ZUS DOCUMENTS', selection: { missionId: 'm6-food-run', stage: 'RETURNING_HOME', day: 179, suspicion: 55, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, homePreset: 'month6' }, runtimeOverrides: { finalePhase: ZUS_FINALE_PHASE.Documents, finaleCredibility: 75 } },
  { id: 'zus-questions', label: 'ZUS QUESTIONS', selection: { missionId: 'm6-food-run', stage: 'RETURNING_HOME', day: 179, suspicion: 55, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, homePreset: 'month6' }, runtimeOverrides: { finalePhase: ZUS_FINALE_PHASE.Questions, finaleCredibility: 72 } },
  { id: 'zus-inkblots', label: 'ZUS INKBLOTS', selection: { missionId: 'm6-food-run', stage: 'RETURNING_HOME', day: 179, suspicion: 55, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, homePreset: 'month6' }, runtimeOverrides: { finalePhase: ZUS_FINALE_PHASE.Inkblots, finaleCredibility: 68 } },
  { id: 'zus-reflex', label: 'ZUS REFLEX', selection: { missionId: 'm6-food-run', stage: 'RETURNING_HOME', day: 179, suspicion: 55, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, homePreset: 'month6' }, runtimeOverrides: { finalePhase: ZUS_FINALE_PHASE.Reflex, finaleCredibility: 68 } },
  { id: 'zus-walk-test', label: 'ZUS WALK TEST', selection: { missionId: 'm6-food-run', stage: 'RETURNING_HOME', day: 179, suspicion: 55, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, homePreset: 'month6' }, runtimeOverrides: { finalePhase: ZUS_FINALE_PHASE.WalkTest, finaleCredibility: 68 } },
  { id: 'zus-verdict-good', label: 'ZUS VERDICT GOOD', selection: { missionId: 'm6-food-run', stage: 'RETURNING_HOME', day: 179, suspicion: 15, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, homePreset: 'month6' }, runtimeOverrides: { finalePhase: ZUS_FINALE_PHASE.Verdict, finaleCredibility: 88, forcedEnding: 'extended' } },
  { id: 'zus-verdict-bad', label: 'ZUS VERDICT BAD', selection: { missionId: 'm6-food-run', stage: 'RETURNING_HOME', day: 179, suspicion: 98, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, homePreset: 'month6' }, runtimeOverrides: { finalePhase: ZUS_FINALE_PHASE.Verdict, finaleCredibility: 18, forcedEnding: 'hr-meeting' } },
  { id: 'zus-ending-standard', label: 'ZUS ENDING B', selection: { missionId: 'm6-food-run', stage: 'RETURNING_HOME', day: 179, suspicion: 65, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, homePreset: 'month6' }, runtimeOverrides: { finalePhase: ZUS_FINALE_PHASE.Verdict, finaleCredibility: 55, forcedEnding: 'back-to-work' } },
  { id: 'zus-ending-hidden', label: 'ZUS HIDDEN ENDING', selection: { missionId: 'm6-food-run', stage: 'RETURNING_HOME', day: 179, suspicion: 5, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, homePreset: 'month6' }, runtimeOverrides: { finalePhase: ZUS_FINALE_PHASE.Verdict, finaleCredibility: 96, forcedEnding: 'waiting-forever' } },
  { id: 'full-finale', label: 'FULL FINALE', selection: { missionId: 'm6-food-run', stage: 'RETURNING_HOME', day: 179, suspicion: 62, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, homePreset: 'month6' }, runtimeOverrides: { triggerZusSummons: true } },
  { id: 'suspicion-99', label: 'SUSPICION 99', selection: { missionId: 'm4-shopping-run', stage: 'ON_ROUTE_TO_OBJECTIVE', day: 91, suspicion: 99, phoneEnabled: false, coworkerEnabled: true, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, homePreset: 'month4' } },
  { id: 'trigger-critical', label: 'TRIGGER CRITICAL', selection: { missionId: 'm4-shopping-run', stage: 'ON_ROUTE_TO_OBJECTIVE', day: 91, suspicion: 99, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, homePreset: 'month4' }, runtimeOverrides: { triggerCriticalSuspicionIncident: true } },
  { id: 'post-incident-mission-end', label: 'POST-INCIDENT MISSION END', selection: { missionId: 'm4-shopping-run', stage: 'RETURNING_HOME', day: 91, suspicion: 100, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, homePreset: 'month4' }, runtimeOverrides: { currentMissionCriticalIncident: true } },
  { id: 'zus-zero-incidents', label: 'ZUS WITH 0 INCIDENTS', selection: { missionId: 'm6-food-run', stage: 'RETURNING_HOME', day: 179, suspicion: 55, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, homePreset: 'month6' }, runtimeOverrides: { finalePhase: ZUS_FINALE_PHASE.Documents, criticalSuspicionIncidents: 0 } },
  { id: 'zus-three-incidents', label: 'ZUS WITH 3 INCIDENTS', selection: { missionId: 'm6-food-run', stage: 'RETURNING_HOME', day: 179, suspicion: 55, phoneEnabled: false, coworkerEnabled: false, hrEnabled: false, companyCarEnabled: false, managerEnabled: false, homePreset: 'month6' }, runtimeOverrides: { finalePhase: ZUS_FINALE_PHASE.Documents, criticalSuspicionIncidents: 3 } },
] as const satisfies readonly DebugScenarioDefinition[];
