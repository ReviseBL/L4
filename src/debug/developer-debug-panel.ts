import Phaser from 'phaser';
import type { DebugHomePreset, DebugMissionStage, DebugRuntimeState, DebugTestSelection } from '../domain/debug/debug-test-types';
import type { DebugMissionTestDefinition, DebugScenarioDefinition } from '../domain/debug/debug-test-types';
import { UI_FONT_FAMILY } from '../ui/text-style';

export interface DeveloperDebugPanelActions {
  applySelection: (selection: DebugTestSelection) => void;
  applyScenario: (scenarioId: string) => void;
  restartMission: () => void;
  restartStage: () => void;
  saveSlot: (slot: 1 | 2) => void;
  loadSlot: (slot: 1 | 2) => void;
  exitDebugSession: () => void;
  forceCall: () => void;
  resetPhone: () => void;
  togglePhone: () => boolean;
  toggleCoworker: () => boolean;
  toggleHr: () => boolean;
  toggleCompanyCar: () => boolean;
  toggleManager: () => boolean;
  pauseCompanyCar: () => boolean;
  forceCompanyCarDetection: () => void;
  teleportPlayerToCarRoute: () => void;
  teleportPlayerToObjective: () => void;
  teleportCoworkerToPlayer: () => void;
  teleportHrToPlayer: () => void;
  teleportManagerToInterestPoint: () => void;
  forceManagerChase: () => void;
  forceManagerSearching: () => void;
  addHomeItem: (item: 'spool' | 'cable' | 'nozzle') => void;
  addL4PrintFilament: () => void;
  setL4ProjectState: (state: 'PRINTING' | 'COMPLETED') => void;
  setSuspicion99: () => void;
  triggerCriticalSuspicionIncident: () => void;
  cycleCriticalSuspicionIncidents: () => number;
  getLiveStatus: () => { suspicion: number; phone: boolean; coworker: boolean; hr: boolean; companyCar: boolean; carPaused: boolean; carState: string; manager: boolean; managerState: string; managerLastKnown: string; actionInputOwner: string; dialogueActive: boolean; interactionAvailable: boolean; criticalSuspicionIncidents: number };
  hasSlot: (slot: 1 | 2) => boolean;
}

export class DeveloperDebugPanel {
  private readonly container: Phaser.GameObjects.Container;
  private readonly summary: Phaser.GameObjects.Text;
  private readonly activeBadge: Phaser.GameObjects.Text;
  private readonly launcher: Phaser.GameObjects.Text;
  private readonly toggleKey: Phaser.Input.Keyboard.Key;
  private visible = false;
  private missionIndex = 0;
  private stageIndex = 0;
  private scenarioIndex = 0;
  private selection: DebugTestSelection;

  public constructor(
    scene: Phaser.Scene,
    private readonly missions: readonly DebugMissionTestDefinition[],
    private readonly scenarios: readonly DebugScenarioDefinition[],
    initialRuntime: DebugRuntimeState | null,
    private readonly actions: DeveloperDebugPanelActions,
  ) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is required for developer debug panel.');
    this.toggleKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F1);
    this.selection = initialRuntime?.selection
      ? { ...initialRuntime.selection }
      : this.selectionForMission(this.missions[0]);
    this.missionIndex = Math.max(0, this.missions.findIndex((entry) => entry.missionId === this.selection.missionId));
    this.stageIndex = this.stageDefinitions().findIndex((entry) => entry === this.selection.stage);
    if (this.stageIndex < 0) this.stageIndex = 0;

    const backdrop = scene.add.rectangle(480, 270, 950, 536, 0x071018, 0.97).setStrokeStyle(3, 0x00b4d8);
    const title = scene.add.text(480, 24, 'CAMPAIGN DEBUG — F1', textStyle(21, '#8ecae6')).setOrigin(0.5, 0);
    this.summary = scene.add.text(28, 62, '', textStyle(14, '#ffffff')).setFixedSize(730, 112);
    const objects: Phaser.GameObjects.GameObject[] = [backdrop, title, this.summary];

    const addButton = (x: number, y: number, width: number, label: string, action: () => void) => {
      const button = scene.add.text(x, y, label, textStyle(12, '#ffffff'))
        .setOrigin(0.5).setPadding(8, 6).setBackgroundColor('#263746').setScrollFactor(0)
        .setInteractive({ useHandCursor: true }).on('pointerdown', action);
      button.setFixedSize(width, 30).setAlign('center');
      objects.push(button);
    };

    addButton(90, 190, 120, '◀ MONTH', () => this.changeMonth(-1));
    addButton(230, 190, 120, 'MONTH ▶', () => this.changeMonth(1));
    addButton(390, 190, 140, '◀ MISSION', () => this.changeMission(-1));
    addButton(550, 190, 140, 'MISSION ▶', () => this.changeMission(1));
    addButton(710, 190, 140, '◀ STAGE', () => this.changeStage(-1));
    addButton(870, 190, 140, 'STAGE ▶', () => this.changeStage(1));
    addButton(850, 82, 140, 'DAY -1', () => { this.selection.day = Math.max((this.currentMission().month - 1) * 30 + 1, this.selection.day - 1); this.refresh(); });
    addButton(850, 122, 140, 'DAY +1', () => { this.selection.day = Math.min(this.currentMission().month * 30, this.selection.day + 1); this.refresh(); });

    addButton(70, 230, 95, 'SUSP -10', () => this.adjustSuspicion(-10));
    addButton(175, 230, 95, 'SUSP 0', () => this.setSuspicion(0));
    addButton(280, 230, 95, 'SUSP +10', () => this.adjustSuspicion(10));
    addButton(390, 230, 100, 'PHONE', () => { this.selection.phoneEnabled = !this.selection.phoneEnabled; this.refresh(); });
    addButton(500, 230, 100, 'COW', () => { this.selection.coworkerEnabled = !this.selection.coworkerEnabled; this.refresh(); });
    addButton(610, 230, 100, 'HR', () => { this.selection.hrEnabled = !this.selection.hrEnabled; this.refresh(); });
    addButton(720, 230, 100, 'CAR', () => { this.selection.companyCarEnabled = !this.selection.companyCarEnabled; this.refresh(); });
    addButton(850, 230, 140, 'MANAGER', () => { this.selection.managerEnabled = !this.selection.managerEnabled; this.refresh(); });

    addButton(190, 278, 300, 'START TEST STATE', () => this.actions.applySelection({ ...this.selection }));
    addButton(510, 278, 300, '◀ SCENARIO / SCENARIO ▶', () => this.changeScenario(1));
    addButton(790, 278, 220, 'RUN SCENARIO', () => this.actions.applyScenario(this.scenarios[this.scenarioIndex].id));

    addButton(130, 326, 200, 'RESTART MISSION', () => this.actions.restartMission());
    addButton(350, 326, 200, 'RESTART STAGE', () => this.actions.restartStage());
    addButton(570, 326, 200, 'PLAYER → OBJECTIVE', () => this.actions.teleportPlayerToObjective());
    addButton(790, 326, 200, 'HOME PRESET ▶', () => this.changeHomePreset());

    addButton(100, 374, 140, 'FORCE CALL', () => this.actions.forceCall());
    addButton(260, 374, 140, 'RESET CALL', () => this.actions.resetPhone());
    addButton(420, 374, 140, 'PHONE LIVE', () => this.actions.togglePhone());
    addButton(580, 374, 140, 'COW LIVE', () => this.actions.toggleCoworker());
    addButton(740, 374, 140, 'HR LIVE', () => this.actions.toggleHr());
    addButton(880, 374, 100, 'CAR LIVE', () => this.actions.toggleCompanyCar());

    addButton(100, 422, 140, 'SAVE SLOT 1', () => this.actions.saveSlot(1));
    addButton(260, 422, 140, 'LOAD SLOT 1', () => this.actions.loadSlot(1));
    addButton(420, 422, 140, 'SAVE SLOT 2', () => this.actions.saveSlot(2));
    addButton(580, 422, 140, 'LOAD SLOT 2', () => this.actions.loadSlot(2));
    addButton(740, 422, 140, 'COW → PLAYER', () => this.actions.teleportCoworkerToPlayer());
    addButton(880, 422, 100, 'CAR PAUSE', () => this.actions.pauseCompanyCar());

    addButton(60, 468, 95, 'ADD PLA', () => this.actions.addHomeItem('spool'));
    addButton(160, 468, 95, 'ADD USB-C', () => this.actions.addHomeItem('cable'));
    addButton(260, 468, 95, 'NOZZLE', () => this.actions.addHomeItem('nozzle'));
    addButton(360, 468, 95, 'CAR DETECT', () => this.actions.forceCompanyCarDetection());
    addButton(460, 468, 95, 'P → ROAD', () => this.actions.teleportPlayerToCarRoute());
    addButton(565, 468, 105, 'SUSP 99', () => this.actions.setSuspicion99());
    addButton(690, 468, 130, 'TRIGGER 100', () => this.actions.triggerCriticalSuspicionIncident());
    addButton(855, 468, 170, 'INCIDENTS 0→3', () => this.actions.cycleCriticalSuspicionIncidents());

    addButton(75, 510, 115, 'MAN LIVE', () => this.actions.toggleManager());
    addButton(205, 510, 125, 'MAN → POINT', () => this.actions.teleportManagerToInterestPoint());
    addButton(340, 510, 125, 'MAN CHASE', () => this.actions.forceManagerChase());
    addButton(475, 510, 125, 'MAN SEARCH', () => this.actions.forceManagerSearching());
    addButton(610, 510, 125, 'ADD L4 FIL', () => this.actions.addL4PrintFilament());
    addButton(745, 510, 125, 'L4 PRINTING', () => this.actions.setL4ProjectState('PRINTING'));
    addButton(880, 510, 125, 'L4 DONE', () => this.actions.setL4ProjectState('COMPLETED'));

    this.container = scene.add.container(0, 0, objects).setScrollFactor(0).setDepth(300_000).setVisible(false);
    this.launcher = scene.add.text(948, 42, 'DEBUG F1 · HUBI F2', textStyle(11, '#8ecae6'))
      .setOrigin(1, 0).setScrollFactor(0).setDepth(299_995).setBackgroundColor('#071018dd').setPadding(7, 5)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.setVisible(!this.visible));
    this.activeBadge = scene.add.text(950, 512, '', textStyle(11, '#80ed99'))
      .setOrigin(1, 1).setScrollFactor(0).setDepth(299_990).setBackgroundColor('#071018dd').setPadding(6, 4);
    this.refresh();
  }

  public update(activeRuntime: DebugRuntimeState | null): void {
    if (Phaser.Input.Keyboard.JustDown(this.toggleKey)) {
      this.setVisible(!this.visible);
    }
    const live = this.actions.getLiveStatus();
    this.activeBadge.setVisible(activeRuntime !== null && !this.visible).setText(activeRuntime
      ? `DEBUG TEST STATE | M${activeRuntime.gameState.currentMonth} | ${activeRuntime.selection.missionId} | ${activeRuntime.selection.stage}\nSUSP ${Math.round(live.suspicion)}% | PHONE ${live.phone ? 'ON' : 'OFF'} | HR ${live.hr ? 'ON' : 'OFF'} | CAR ${live.companyCar ? 'ON' : 'OFF'} | MAN ${live.manager ? live.managerState : 'OFF'}`
      : '');
    if (this.visible) this.refresh();
  }

  public isVisible(): boolean { return this.visible; }
  public getSelection(): DebugTestSelection { return { ...this.selection }; }
  public destroy(): void { this.container.destroy(true); this.launcher.destroy(); this.activeBadge.destroy(); this.toggleKey.destroy(); }

  private setVisible(visible: boolean): void {
    this.visible = visible;
    this.container.setVisible(visible);
    this.launcher.setVisible(!visible);
  }

  private currentMission(): DebugMissionTestDefinition { return this.missions[this.missionIndex]; }
  private stageDefinitions(): readonly DebugMissionStage[] { return this.currentMission().checkpoints.map((entry) => entry.stage); }
  private selectionForMission(mission: DebugMissionTestDefinition): DebugTestSelection {
    return { missionId: mission.missionId, stage: 'MISSION_START', day: mission.day, suspicion: 0, phoneEnabled: mission.phoneEnabled, coworkerEnabled: mission.coworkerEnabled, hrEnabled: mission.hrEnabled, companyCarEnabled: mission.companyCarEnabled, managerEnabled: mission.managerEnabled, homePreset: `month${Math.min(6, mission.month)}` as DebugHomePreset };
  }
  private changeMonth(direction: number): void {
    const months = [...new Set(this.missions.map((entry) => entry.month))];
    const currentIndex = months.indexOf(this.currentMission().month);
    const month = months[(currentIndex + direction + months.length) % months.length];
    this.missionIndex = this.missions.findIndex((entry) => entry.month === month);
    this.selection = this.selectionForMission(this.currentMission()); this.stageIndex = 0; this.refresh();
  }
  private changeMission(direction: number): void {
    this.missionIndex = (this.missionIndex + direction + this.missions.length) % this.missions.length;
    this.selection = this.selectionForMission(this.currentMission()); this.stageIndex = 0; this.refresh();
  }
  private changeStage(direction: number): void {
    const stages = this.stageDefinitions(); this.stageIndex = (this.stageIndex + direction + stages.length) % stages.length;
    this.selection.stage = stages[this.stageIndex]; this.refresh();
  }
  private changeScenario(direction: number): void { this.scenarioIndex = (this.scenarioIndex + direction + this.scenarios.length) % this.scenarios.length; this.refresh(); }
  private adjustSuspicion(delta: number): void { this.setSuspicion(this.selection.suspicion + delta); }
  private setSuspicion(value: number): void { this.selection.suspicion = Math.min(100, Math.max(0, value)); this.refresh(); }
  private changeHomePreset(): void { const presets: DebugHomePreset[] = ['month1', 'month2', 'month3', 'month4', 'month5', 'month6']; const index = presets.indexOf(this.selection.homePreset); this.selection.homePreset = presets[(index + 1) % presets.length]; this.refresh(); }
  private refresh(): void {
    const mission = this.currentMission(); const live = this.actions.getLiveStatus();
    this.summary.setText([
      `MONTH: ${mission.month}   DAY: ${this.selection.day}   MISSION: ${mission.label}`,
      `STAGE: ${this.selection.stage}   SUSPICION: ${this.selection.suspicion}%`,
      `BUILD: PHONE ${this.selection.phoneEnabled ? 'ON' : 'OFF'} | COW ${this.selection.coworkerEnabled ? 'ON' : 'OFF'} | HR ${this.selection.hrEnabled ? 'ON' : 'OFF'} | CAR ${this.selection.companyCarEnabled ? 'ON' : 'OFF'} | MAN ${this.selection.managerEnabled ? 'ON' : 'OFF'} | HOME ${this.selection.homePreset}`,
      `SCENARIO: ${this.scenarios[this.scenarioIndex].label}   SLOTS: 1 ${this.actions.hasSlot(1) ? 'OK' : 'EMPTY'} / 2 ${this.actions.hasSlot(2) ? 'OK' : 'EMPTY'}`,
      `LIVE: SUSP ${Math.round(live.suspicion)}% | INCIDENTS ${live.criticalSuspicionIncidents} | PHONE ${live.phone ? 'ON' : 'OFF'} | COW ${live.coworker ? 'ON' : 'OFF'} | HR ${live.hr ? 'ON' : 'OFF'} | CAR ${live.companyCar ? live.carPaused ? 'PAUSED' : live.carState : 'OFF'} | MAN ${live.manager ? live.managerState : 'OFF'} ${live.managerLastKnown}`,
      `ACTION: ${live.actionInputOwner} | DIALOGUE ${live.dialogueActive ? 'YES' : 'NO'} | INTERACTION ${live.interactionAvailable ? 'YES' : 'NO'}`,
    ].join('\n'));
  }
}

function textStyle(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: UI_FONT_FAMILY, fontSize: `${fontSize}px`, fontStyle: 'bold', color, stroke: '#02070b', strokeThickness: 3 };
}
