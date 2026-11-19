import Phaser from 'phaser';
import { DeveloperDebugPanel } from '../debug/developer-debug-panel';
import { StealthDebugOverlay } from '../debug/stealth-debug-overlay';
import { campaignMonths } from '../data/campaign/campaign-months';
import { dialogueConfig } from '../data/dialogue/dialogue-config';
import { HR_FIRST_MEETING_ID, hrDialogueResponses, hrFirstMeetingDialogue, hrRepeatMeetingDialogue } from '../data/dialogue/hr-dialogues';
import { homeVisualDefinitions } from '../data/home/home-progression';
import { itemDefinitions } from '../data/items/items';
import { verticalSliceMissions } from '../data/missions/vertical-slice-missions';
import { workColleagueDefinition } from '../data/npcs/work-colleague';
import { hrDefinition } from '../data/npcs/hr';
import { printJobDefinitions } from '../data/printing/print-jobs';
import { phoneConfig } from '../data/phone/phone-config';
import { suspicionConfig } from '../data/suspicion/suspicion-config';
import type { CampaignMonthTransition } from '../domain/campaign/campaign-types';
import type { EnemyType } from '../domain/campaign/campaign-types';
import type { DebugRuntimeState, DebugTestSelection } from '../domain/debug/debug-test-types';
import type {
  MissionCompletionSummary,
  MissionDefinition,
  MissionEvent,
  MissionEventResult,
  MissionSummary,
} from '../domain/missions/mission-types';
import type { PhoneMissionStats } from '../domain/phone/phone-types';
import type { SuspicionChangeResult } from '../domain/suspicion/suspicion-types';
import type { HomeProgressionView } from '../entities/interactables/home-progression-view';
import { NpcController } from '../entities/npc/npc-controller';
import { HrController } from '../entities/npc/hr-controller';
import { CompanyCarController } from '../entities/npc/company-car-controller';
import { companyCarDefinition } from '../data/npcs/company-car';
import { positionReportConfig } from '../data/npcs/position-report-config';
import { PositionReportSystem } from '../systems/position-report-system';
import { HR_STATE } from '../domain/npcs/hr-types';
import { MANAGER_STATE } from '../domain/npcs/manager-types';
import { managerDefinition } from '../data/npcs/manager';
import { ManagerController } from '../entities/npc/manager-controller';
import { PRINT_PROJECT_STATE } from '../domain/printing/print-job-types';
import { Player } from '../entities/player/player';
import { PlayerController } from '../entities/player/player-controller';
import {
  DEVELOPER_TOOLS_ENABLED,
  STEALTH_DEBUG_DEFAULT,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../game/game-config';
import { SaveGameService } from '../services/save-game-service';
import { DebugStateService } from '../services/debug-state-service';
import { GameState } from '../state/game-state';
import { AreaTriggerSystem } from '../systems/area-trigger-system';
import { ActionInputRouter, type ActionInputOwner } from '../systems/action-input-router';
import { CampaignSystem } from '../systems/campaign-system';
import { DialogueSystem } from '../systems/dialogue-system';
import { DebugTestStateSystem } from '../systems/debug-test-state-system';
import { HidingSystem } from '../systems/hiding-system';
import { HomeProgressionSystem } from '../systems/home-progression-system';
import { InteractionSystem } from '../systems/interaction-system';
import { InventorySystem } from '../systems/inventory-system';
import { MissionEffectExecutor } from '../systems/mission-effect-executor';
import { MissionSystem } from '../systems/mission-system';
import { resolveMissionResumePosition } from '../systems/mission-resume-system';
import { Printer3DSystem } from '../systems/printer-3d-system';
import { PhoneSystem } from '../systems/phone-system';
import { SuspicionSystem } from '../systems/suspicion-system';
import { GameHud } from '../ui/game-hud';
import { DialogueBox } from '../ui/dialogue-box';
import { MissionSummaryOverlay } from '../ui/mission-summary-overlay';
import { MonthTransitionOverlay } from '../ui/month-transition-overlay';
import { PhoneHud } from '../ui/phone-hud';
import { createTestWorld } from '../world/test-world-builder';
import { ZUS_FINALE_PHASE } from '../domain/finale/zus-finale-types';
import { confrontationConfig } from '../data/confrontation/confrontation-config';
import { confrontationScenarios } from '../data/confrontation/confrontation-scenarios';
import type {
  ConfrontationSource,
  PreparedConfrontation,
} from '../domain/confrontation/confrontation-types';
import { ConfrontationSystem } from '../systems/confrontation-system';
import { callNoiseConfig, callNoiseLabels, callNoiseManagerLines } from '../data/phone/call-noise-config';
import type { CallNoiseResult } from '../domain/phone/call-noise-types';
import { evaluateCallNoise } from '../systems/call-noise-system';
import type { MinigameRequest, MinigameResult, MinigameRunner } from '../domain/minigames/minigame-types';
import { MINIGAME_SCENE_KEY, type MinigameSceneData } from './minigame-scene';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private playerController!: PlayerController;
  private interactionSystem!: InteractionSystem;
  private areaTriggerSystem!: AreaTriggerSystem;
  private missionSystem!: MissionSystem;
  private missionEffectExecutor!: MissionEffectExecutor;
  private inventorySystem!: InventorySystem;
  private suspicionSystem!: SuspicionSystem;
  private hidingSystem!: HidingSystem;
  private npcController!: NpcController;
  private hrController!: HrController;
  private companyCarController!: CompanyCarController;
  private managerController!: ManagerController;
  private readonly positionReportSystem = new PositionReportSystem(positionReportConfig);
  private readonly confrontationSystem = new ConfrontationSystem(
    confrontationScenarios,
    confrontationConfig,
  );
  private printerSystem!: Printer3DSystem;
  private homeProgressionSystem!: HomeProgressionSystem;
  private campaignSystem!: CampaignSystem;
  private phoneSystem!: PhoneSystem;
  private dialogueSystem!: DialogueSystem;
  private readonly actionInputRouter = new ActionInputRouter();
  private gameState!: GameState;
  private readonly saveGameService = new SaveGameService(window.localStorage);
  private readonly debugStateService = new DebugStateService(window.localStorage);
  private readonly debugTestStateSystem = new DebugTestStateSystem(verticalSliceMissions);
  private developerDebugPanel: DeveloperDebugPanel | null = null;
  private debugRuntimeState: DebugRuntimeState | null = null;
  private debugOverlay!: StealthDebugOverlay;
  private hud!: GameHud;
  private summaryOverlay!: MissionSummaryOverlay;
  private monthTransitionOverlay!: MonthTransitionOverlay;
  private phoneHud!: PhoneHud;
  private dialogueBox!: DialogueBox;
  private homeProgressionView!: HomeProgressionView;
  private homeSpawn!: Phaser.Math.Vector2;
  private playerCollider: Phaser.Physics.Arcade.Collider | null = null;
  private missionTransitionPending = false;
  private summaryVisible = false;
  private monthTransitionVisible = false;
  private pendingMonthTransition: CampaignMonthTransition | null = null;
  private phoneAnswerKey!: Phaser.Input.Keyboard.Key;
  private phoneDeclineKey!: Phaser.Input.Keyboard.Key;
  private phoneAirplaneKey!: Phaser.Input.Keyboard.Key;
  private actionKey!: Phaser.Input.Keyboard.Key;
  private dialogueSpaceKey!: Phaser.Input.Keyboard.Key;
  private dialogueUpKey!: Phaser.Input.Keyboard.Key;
  private dialogueDownKey!: Phaser.Input.Keyboard.Key;
  private dialogueWKey!: Phaser.Input.Keyboard.Key;
  private dialogueSKey!: Phaser.Input.Keyboard.Key;
  private hubiShowcaseKey: Phaser.Input.Keyboard.Key | null = null;
  private workColleaguePatrolRoutes!: Readonly<
    Record<string, readonly { x: number; y: number }[]>
  >;
  private hrPatrolRoutes!: Readonly<Record<string, readonly { x: number; y: number }[]>>;
  private companyCarRoutes!: Readonly<Record<string, readonly { x: number; y: number }[]>>;

  public constructor() {
    super('GameScene');
  }

  public create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.debugRuntimeState = DEVELOPER_TOOLS_ENABLED ? this.debugStateService.loadActive() : null;
    this.gameState = this.debugRuntimeState
      ? new GameState(this.debugRuntimeState.gameState)
      : this.saveGameService.loadGame();
    this.campaignSystem = new CampaignSystem(this.gameState, campaignMonths);
    this.reconcileMissionState();
    const savedState = this.gameState.getSnapshot();
    const world = createTestWorld(this);
    this.homeSpawn = world.playerSpawn.clone();
    this.homeProgressionView = world.homeProgressionView;
    this.workColleaguePatrolRoutes = world.workColleaguePatrolRoutes;
    this.hrPatrolRoutes = world.hrPatrolRoutes;
    this.companyCarRoutes = world.companyCarRoutes;

    const playerStart = this.debugRuntimeState?.playerStart ?? resolveMissionResumePosition({
      missions: verticalSliceMissions,
      missionId: savedState.currentMissionId,
      stepIndex: savedState.currentMissionStepIndex,
      defaultPosition: world.playerSpawn,
      areas: world.areas,
    });
    this.player = new Player(this, playerStart.x, playerStart.y);
    this.playerController = new PlayerController(this, this.player);
    this.playerCollider = this.physics.add.collider(this.player, world.obstacles);

    this.suspicionSystem = new SuspicionSystem(
      savedState.suspicion,
      suspicionConfig,
      campaignMonths,
    );
    this.inventorySystem = new InventorySystem(itemDefinitions, savedState.inventory);
    this.printerSystem = new Printer3DSystem(printJobDefinitions, savedState.home.currentPrintId);
    this.homeProgressionSystem = new HomeProgressionSystem(this.gameState, homeVisualDefinitions);
    this.missionSystem = new MissionSystem(verticalSliceMissions);
    this.interactionSystem = new InteractionSystem(
      world.interactionTargets,
      (target) =>
        !target.requiresHomeVisualId ||
        this.homeProgressionSystem
          .getVisibleDefinitions()
          .some((definition) => definition.id === target.requiresHomeVisualId),
    );
    this.areaTriggerSystem = new AreaTriggerSystem(world.areas);
    this.hidingSystem = new HidingSystem(world.hideSpots);
    this.dialogueSystem = new DialogueSystem(dialogueConfig);
    this.hud = new GameHud(this);
    this.phoneHud = new PhoneHud(this);
    this.dialogueBox = new DialogueBox(this);
    this.summaryOverlay = new MissionSummaryOverlay(this);
    this.monthTransitionOverlay = new MonthTransitionOverlay(this);
    this.missionEffectExecutor = new MissionEffectExecutor(
      this.inventorySystem,
      this.printerSystem,
      world.printerView,
      this.homeProgressionSystem,
      world.homeProgressionView,
      this.gameState,
      this.dialogueSystem,
      this.player,
      this.playerController,
      this.hidingSystem,
      this.createMinigameRunner(),
    );

    if (
      this.campaignSystem.getCurrentMonth().id >= 2 &&
      (!this.debugRuntimeState || this.debugRuntimeState.selection.phoneEnabled)
    ) {
      this.gameState.unlockPhone();
    }
    if (
      this.campaignSystem.getCurrentMonth().id >= 3 &&
      (!this.debugRuntimeState || this.debugRuntimeState.selection.hrEnabled)
    ) this.gameState.unlockHr();
    if (
      this.campaignSystem.getCurrentMonth().id >= 5 &&
      (!this.debugRuntimeState || this.debugRuntimeState.selection.managerEnabled)
    ) this.gameState.unlockManager();
    this.phoneSystem = new PhoneSystem(
      this.gameState.isPhoneUnlocked(),
      this.gameState.getPhoneCampaignStats(),
      phoneConfig,
      {
        onSuspicionEvent: (event) => {
          const change = this.suspicionSystem.registerEvent({
            ...event,
            month: this.campaignSystem.getCurrentMonth().id,
          });
          this.hud.showAlert(
            event.type === 'missedWorkCall'
              ? `NIEODEBRANE POŁĄCZENIE — PRACA  +${change.appliedDelta}%`
              : `POŁĄCZENIE ODRZUCONE  +${change.appliedDelta}%`,
          );
          this.handleSuspicionChange(change);
          this.applyNpcDifficulty();
          this.persistCurrentState();
        },
        onOutcome: (outcome) => {
          if (outcome === 'ANSWERED') this.hud.showMessage('ROZMOWA ZAKOŃCZONA');
          if (outcome === 'DECLINED') this.hud.showMessage('POŁĄCZENIE ODRZUCONE');
          if (outcome === 'MISSED') this.hud.showMessage('NIEODEBRANE POŁĄCZENIE — PRACA');
          if (outcome === 'CANCELLED_BY_AIRPLANE_MODE') {
            this.hud.showMessage('TRYB SAMOLOTOWY — POŁĄCZENIE PRZERWANE');
          }
        },
        onStatsChanged: (_missionStats, campaignStats) => {
          this.gameState.setPhoneCampaignStats(campaignStats);
          this.persistCurrentState();
        },
      },
    );

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is required for the phone system.');
    }
    this.phoneAnswerKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.phoneDeclineKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.phoneAirplaneKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    this.actionKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.dialogueSpaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.dialogueUpKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.dialogueDownKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.dialogueWKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.dialogueSKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    if (DEVELOPER_TOOLS_ENABLED) {
      this.hubiShowcaseKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2);
    }

    this.npcController = new NpcController(
      this,
      workColleagueDefinition,
      world.workColleaguePatrol,
      world.obstacles,
      world.occluders,
      {
        onDetected: (source) => {
          this.handleNpcDetection(source, 'KOLEGA Z PRACY CIĘ ZAUWAŻYŁ');
        },
      },
    );
    this.hrController = new HrController(
      this,
      hrDefinition,
      world.hrPatrol,
      world.obstacles,
      world.occluders,
      {
        onDetected: () => this.handleNpcDetection('hr', 'HR CIĘ ZAUWAŻYŁ'),
        onConversationRequested: () => this.startHrConversation(),
      },
    );
    const defaultCarRoute = world.companyCarRoutes['tutorial-road-loop'];
    this.companyCarController = new CompanyCarController(
      this, companyCarDefinition, defaultCarRoute[0], defaultCarRoute,
      world.obstacles, world.occluders,
      { onDetected: (position) => this.handleCompanyCarDetection(position) },
    );
    this.companyCarController.setDebugVisible(DEVELOPER_TOOLS_ENABLED);
    const defaultManagerPoints = [
      { id: 'parking', x: 1450, y: 895 },
      { id: 'grocery', x: 970, y: 575 },
      { id: 'home-route', x: 650, y: 575 },
    ] as const;
    this.managerController = new ManagerController(
      this,
      managerDefinition,
      world.managerSpawn,
      defaultManagerPoints,
      world.obstacles,
      world.occluders,
      {
        onDetected: () => this.handleNpcDetection('manager', 'KIEROWNIK CIĘ ZOBACZYŁ'),
        onCriticalInvestigation: () => this.hud.showMessage('KIEROWNIK SPRAWDZA PODEJRZANĄ OKOLICĘ'),
      },
    );
    this.managerController.setDebugVisible(DEVELOPER_TOOLS_ENABLED);
    this.debugOverlay = new StealthDebugOverlay(
      this,
      world.occluders,
      STEALTH_DEBUG_DEFAULT,
      DEVELOPER_TOOLS_ENABLED,
    );

    if (DEVELOPER_TOOLS_ENABLED) this.createDeveloperDebugPanel();

    this.applyNpcDifficulty();

    this.cameras.main.startFollow(this.player, true, 0.13, 0.13);
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.fadeIn(350, 17, 24, 32);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      world.printerView.destroy();
      world.homeProgressionView.destroy();
      this.handleShutdown();
    });

    if (this.debugRuntimeState?.finalePhase) {
      this.scene.start('ZusScene', {
        phase: this.debugRuntimeState.finalePhase,
        credibility: this.debugRuntimeState.finaleCredibility,
        forcedEnding: this.debugRuntimeState.forcedEnding,
      });
      return;
    }

    const currentMissionId = this.gameState.getCurrentMissionId();

    if (currentMissionId !== null) {
      const missionStart = this.missionSystem.startAt(
        currentMissionId,
        this.gameState.getCurrentMissionStepIndex(),
        this.getMissionContext(),
      );
      this.suspicionSystem.startMission(currentMissionId);
      this.startPhoneForMission(missionStart.mission);
      this.applyMissionPatrol(missionStart.mission.coworkerPatrolRouteId);
      this.applyHrMissionSetup(missionStart.mission);
      this.applyCompanyCarMissionSetup(missionStart.mission);
      this.applyManagerMissionSetup(missionStart.mission);
      this.applyDebugRuntimeOverrides();
      this.persistCurrentState();
      const introEffects = this.debugRuntimeState && this.debugRuntimeState.selection.stage !== 'MISSION_START'
        ? []
        : missionStart.effects;
      this.missionEffectExecutor.apply(introEffects, () => this.persistCurrentState());
      if (this.debugRuntimeState?.triggerZusSummons) {
        this.time.delayedCall(0, () => this.startZusSummons());
      }
    } else {
      this.suspicionSystem.startMission(null);
      this.phoneSystem.endMission();
      this.persistCurrentState(false);
      if (
        this.campaignSystem.getCurrentDay() >= 179 &&
        !this.gameState.getSnapshot().finale.campaignCompleted
      ) {
        this.time.delayedCall(0, () => this.startZusSummons());
      }
    }

  }

  public update(time: number, delta: number): void {
    if (
      this.hubiShowcaseKey &&
      Phaser.Input.Keyboard.JustDown(this.hubiShowcaseKey)
    ) {
      this.scene.start('HubiShowcaseScene');
      return;
    }
    this.developerDebugPanel?.update(this.debugRuntimeState);
    if (this.developerDebugPanel?.isVisible()) {
      this.playerController.setMovementEnabled(false);
      this.phoneHud.update(this.phoneSystem.getSnapshot());
      this.updateHud(null);
      return;
    }

    // Read the E edge exactly once. Phaser reuses Key objects for the same
    // keycode, so a second JustDown(E) in PlayerController would always lose.
    const actionPressed = Phaser.Input.Keyboard.JustDown(this.actionKey);
    const dialogueBeforeInput = this.dialogueSystem.getSnapshot();
    const actionInputOwner = this.actionInputRouter.resolve({
      dialogueActive: dialogueBeforeInput.active,
      summaryVisible: this.summaryVisible,
      monthTransitionVisible: this.monthTransitionVisible,
    });
    const dialogueHandledThisFrame = this.handleDialogueAndOverlayInput(
      actionInputOwner,
      actionPressed,
    );
    const dialogueAfterInput = this.dialogueSystem.getSnapshot();
    const pauseWorldForDialogue =
      dialogueBeforeInput.pauseWorld || dialogueAfterInput.pauseWorld;

    this.dialogueSystem.update(delta);
    if (!pauseWorldForDialogue) this.phoneSystem.update(delta);
    if (!dialogueHandledThisFrame && !this.dialogueSystem.isActive()) this.handlePhoneInput();

    const dialogueSnapshot = this.dialogueSystem.getSnapshot();
    const dialogueFrameActive = dialogueHandledThisFrame || dialogueSnapshot.active;
    this.dialogueBox.update(dialogueSnapshot);
    this.hud.setDialogueActive(dialogueSnapshot.active);
    this.player.setPhoneActive(this.phoneSystem.isConversationActive());
    this.synchronizeMovementLock(dialogueSnapshot.lockPlayerMovement);
    this.phoneHud.update(this.phoneSystem.getSnapshot());
    this.updateCallNoiseHint();

    if (this.isGameplayLocked()) {
      this.holdNpcsStill();
      this.debugOverlay.update(time, this.player, this.npcController, this.hrController);
      this.updateHud(null);
      return;
    }

    if (dialogueFrameActive) {
      if (!pauseWorldForDialogue && !dialogueSnapshot.pauseWorld) {
        this.updateNpcAndDebug(time, delta);
      } else {
        this.holdNpcsStill();
        this.debugOverlay.update(time, this.player, this.npcController, this.hrController);
      }
      this.updateHud(null);
      return;
    }

    this.playerController.update();

    const playerPosition = { x: this.player.x, y: this.player.y };

    for (const areaId of this.areaTriggerSystem.update(playerPosition)) {
      this.phoneSystem.notify({ type: 'enterZone', zoneId: areaId });
      this.processMissionEvent({ type: 'area-entered', areaId });

      if (this.isGameplayLocked() || this.dialogueSystem.isActive()) {
        this.updateHud(null);
        return;
      }
    }

    const nearbyHideSpot = this.hidingSystem.findNearby(playerPosition);
    const preferredInteractionTargetId = this.missionSystem.getCurrentInteractionTargetId();
    const nearbyTarget = this.interactionSystem.findNearby(
      this.player.x,
      this.player.y,
      preferredInteractionTargetId,
    );

    if (actionPressed && actionInputOwner === 'GAMEPLAY') {
      const hidingResult = this.hidingSystem.toggle(playerPosition);

      if (hidingResult.type === 'entered') {
        this.playerController.setMovementEnabled(false);
        this.player.setHiddenState(true);
        this.hud.showMessage(`Ukrywasz się: ${hidingResult.spot.label}.`);
      } else if (hidingResult.type === 'exited') {
        this.playerController.setMovementEnabled(true);
        this.player.setHiddenState(false);
        this.hud.showMessage('Wychodzisz z ukrycia. Ostrożnie.');
      } else if (hidingResult.type === 'blocked') {
        this.hud.showMessage('Z tą paczką się tu nie zmieścisz. Spróbuj przy kontenerze.');
      } else {
        const interaction = this.interactionSystem.interact(
          this.player.x,
          this.player.y,
          preferredInteractionTargetId,
        );

        if (interaction) {
          const matchedMission = this.processMissionEvent({
            type: 'interaction',
            targetId: interaction.target.id,
          });

          if (!matchedMission) {
            this.hud.showMessage(interaction.message);
          }
        }
      }
    }

    if (this.isGameplayLocked()) {
      this.updateHud(null);
      return;
    }

    this.updateNpcAndDebug(time, delta);

    const targetPrompt = nearbyTarget
      ? (this.missionSystem.getInteractionPrompt(nearbyTarget.id) ?? nearbyTarget.prompt)
      : null;
    const interactionPrompt = this.hidingSystem.isHidden()
      ? '[E] WYJDŹ Z UKRYCIA'
      : nearbyHideSpot
        ? this.hidingSystem.isAvailable(nearbyHideSpot)
          ? '[E] SCHOWAJ SIĘ'
          : '[E] ZA DUŻA PACZKA — BRAK MIEJSCA'
        : targetPrompt;

    this.updateHud(interactionPrompt);
  }

  private processMissionEvent(event: MissionEvent): boolean {
    const result = this.missionSystem.handleEvent(event, this.getMissionContext());

    if (!result.matched) {
      return false;
    }

    this.applyMissionResult(result);
    return true;
  }

  private applyMissionResult(result: MissionEventResult): void {
    this.notifyPhoneOfMissionResult(result);
    if (!result.summary) {
      this.missionEffectExecutor.apply(result.effects, () => this.persistCurrentState());
      return;
    }

    this.missionTransitionPending = true;
    this.playerController.setMovementEnabled(false);
    this.npcController.setPaused(true);
    this.hrController.setPaused(true);
    this.companyCarController.setPaused(true);
    this.managerController.setPaused(true);
    const summary = result.summary;
    const mission = this.missionSystem.getCurrentMission();
    const phoneStats = mission?.phoneCalls
      ? { ...this.phoneSystem.getSnapshot().missionStats }
      : null;
    this.phoneSystem.endMission();
    this.missionEffectExecutor.apply(result.effects, () => {
      const completionSummary = this.completeMissionProgress(summary, phoneStats);
      this.gameState.completeMission(summary.missionId, this.missionSystem.getNextMissionId());
      this.persistCurrentState(false);
      this.showMissionSummary(completionSummary);
    });
  }

  private showMissionSummary(summary: MissionCompletionSummary): void {
    this.missionTransitionPending = false;
    this.summaryVisible = true;
    this.pendingMonthTransition = summary.monthTransition;
    const continuesToFinale =
      !this.missionSystem.hasNextMission() &&
      summary.currentL4Day >= 179 &&
      !this.gameState.getSnapshot().finale.campaignCompleted;
    this.summaryOverlay.show(
      summary,
      this.missionSystem.hasNextMission() || summary.monthTransition !== null || continuesToFinale,
      () => this.continueAfterSummary(),
      continuesToFinale ? '[E] DALEJ — DZIEŃ 179' : undefined,
    );
  }

  private continueAfterSummary(): void {
    this.summaryOverlay.hide();
    this.summaryVisible = false;

    if (this.pendingMonthTransition) {
      const transition = this.pendingMonthTransition;
      this.pendingMonthTransition = null;
      this.monthTransitionVisible = true;
      this.monthTransitionOverlay.show(
        this.campaignSystem.getCurrentMonth(),
        transition.completedDays,
        () => this.continueAfterMonthTransition(),
      );
      return;
    }

    this.continueToNextMission();
  }

  private continueAfterMonthTransition(): void {
    this.monthTransitionOverlay.hide();
    this.monthTransitionVisible = false;
    this.player.setPosition(this.homeSpawn.x, this.homeSpawn.y);
    this.player.updatePresentation();
    if (this.campaignSystem.getCurrentMonth().id >= 2) {
      this.gameState.unlockPhone();
      this.phoneSystem.setUnlocked(true);
    }
    if (this.campaignSystem.getCurrentMonth().id >= 3) this.gameState.unlockHr();
    if (this.campaignSystem.getCurrentMonth().id >= 5) this.gameState.unlockManager();
    this.continueToNextMission();
  }

  private continueToNextMission(): void {
    if (!this.missionSystem.hasNextMission()) {
      if (this.campaignSystem.getCurrentDay() >= 179 && !this.gameState.getSnapshot().finale.campaignCompleted) {
        this.startZusSummons();
      } else {
        this.scene.start('MenuScene');
      }
      return;
    }

    this.playerController.setMovementEnabled(true);
    this.npcController.setPaused(false);
    this.hrController.setPaused(false);
    this.companyCarController.setPaused(false);
    this.managerController.setPaused(false);

    const nextMission = this.missionSystem.startNext(this.getMissionContext());

    if (nextMission) {
      this.gameState.setMissionProgress(nextMission.mission.id, 0);
      this.suspicionSystem.startMission(nextMission.mission.id);
      this.startPhoneForMission(nextMission.mission);
      this.applyMissionPatrol(nextMission.mission.coworkerPatrolRouteId);
      this.applyHrMissionSetup(nextMission.mission);
      this.applyCompanyCarMissionSetup(nextMission.mission);
      this.applyManagerMissionSetup(nextMission.mission);
      this.persistCurrentState();
      this.missionEffectExecutor.apply(nextMission.effects, () => this.persistCurrentState());
    }
  }

  private getInventoryHudText(): string {
    const text = this.inventorySystem.getDisplayText();
    return this.inventorySystem.getCarryMovement().sprintAllowed ? text : `${text} · BEZ SPRINTU`;
  }

  private updateHud(interactionPrompt: string | null): void {
    this.hud.update(
      this.campaignSystem.getCurrentMonth().id,
      this.campaignSystem.getCurrentDay(),
      this.suspicionSystem.getValue(),
      this.suspicionSystem.getLevel(),
      this.missionSystem.getCurrentMissionTitle(),
      this.missionSystem.getCurrentObjectiveText(),
      this.getInventoryHudText(),
      interactionPrompt,
      this.hidingSystem.isHidden(),
    );
  }

  private getMissionContext(): { nowMs: number; suspicion: number } {
    return {
      nowMs: this.time.now,
      suspicion: this.suspicionSystem.getValue(),
    };
  }

  private isGameplayLocked(): boolean {
    return this.missionTransitionPending || this.summaryVisible || this.monthTransitionVisible;
  }

  private handleShutdown(): void {
    this.playerCollider?.destroy();
    this.playerCollider = null;
    this.summaryOverlay.destroy();
    this.monthTransitionOverlay.destroy();
    this.phoneHud.destroy();
    this.dialogueBox.destroy();
    this.dialogueSystem.clear();
    this.developerDebugPanel?.destroy();
    this.developerDebugPanel = null;
    this.phoneAnswerKey.destroy();
    this.phoneDeclineKey.destroy();
    this.phoneAirplaneKey.destroy();
    this.actionKey.destroy();
    this.dialogueSpaceKey.destroy();
    this.dialogueUpKey.destroy();
    this.dialogueDownKey.destroy();
    this.dialogueWKey.destroy();
    this.dialogueSKey.destroy();
    this.hubiShowcaseKey?.destroy();
    this.hubiShowcaseKey = null;
    this.debugOverlay.destroy();
    this.npcController.destroy();
    this.hrController.destroy();
    this.companyCarController.destroy();
    this.managerController.destroy();
    this.hud.destroy();
    this.cameras.main?.stopFollow();
  }

  private persistCurrentState(includeMissionProgress = true): void {
    if (includeMissionProgress) {
      const progress = this.missionSystem.getProgress();
      if (progress) {
        this.gameState.setMissionProgress(progress.missionId, progress.stepIndex);
      }
    }

    this.gameState.setSuspicion(this.suspicionSystem.getValue());
    this.gameState.setInventory(this.inventorySystem.getQuantities());
    if (this.debugRuntimeState) {
      this.debugRuntimeState = this.debugTestStateSystem.withCurrentSnapshot(
        this.debugRuntimeState,
        this.gameState.getSnapshot(),
        { x: this.player.x, y: this.player.y },
      );
      this.debugStateService.saveActive(this.debugRuntimeState);
    } else {
      this.saveGameService.saveGame(this.gameState);
    }
  }

  private completeMissionProgress(
    summary: MissionSummary,
    phoneStats: Readonly<PhoneMissionStats> | null,
  ): MissionCompletionSummary {
    const criticalSuspicionIncident = this.gameState.hasCriticalSuspicionIncidentForMission(
      summary.missionId,
    );
    const reward = this.suspicionSystem.resolveMissionCompletion(
      summary.detectionCount,
      criticalSuspicionIncident,
    );
    this.handleSuspicionChange(reward);
    const campaignAdvance = this.campaignSystem.advanceDays(summary.daysPassed);
    this.applyNpcDifficulty();
    this.homeProgressionView.synchronize(this.homeProgressionSystem.getVisibleDefinitions());

    return {
      ...summary,
      stealthBonus: reward.configuredBonus,
      suspicionAfterMission: reward.currentValue,
      currentL4Day: campaignAdvance.currentDay,
      currentMonth: campaignAdvance.currentMonth,
      stealthMessage: reward.message,
      monthTransition: campaignAdvance.transition,
      phoneStats,
      criticalSuspicionIncident,
    };
  }

  private handleSuspicionChange(change: SuspicionChangeResult): void {
    if (change.events.includes('SUSPICION_MAX_REACHED')) {
      const missionId = this.missionSystem.getCurrentMission()?.id ?? 'free-roam';
      if (this.gameState.recordCriticalSuspicionIncident(missionId)) {
        this.dialogueSystem.showSequence({
          id: `critical-suspicion-${missionId}`,
          pauseWorld: true,
          lockPlayerMovement: true,
          lines: [
            { speaker: 'FIRMA', text: 'ŻĄDA WYJAŚNIEŃ.', tone: 'warning' },
            { speaker: 'PODEJRZLIWOŚĆ', text: 'OSIĄGNĘŁA 100%', tone: 'warning' },
            { speaker: 'BOHATER', text: 'No pięknie.', tone: 'speech' },
          ],
        });
      }
      return;
    }

    if (change.appliedDelta > 0 && change.previousLevel !== change.currentLevel) {
      const message = this.suspicionSystem.getThreshold().message;
      if (message) {
        this.hud.showAlert(message);
      }
    }
  }

  private applyNpcDifficulty(): void {
    const campaignDifficulty = this.campaignSystem.getCurrentMonth().difficulty;
    const companyAlert = this.suspicionSystem.getThreshold();
    this.npcController.setDifficultyModifiers({
      viewDistanceMultiplier: companyAlert.viewDistanceMultiplier,
      awarenessMultiplier:
        campaignDifficulty.npcAwarenessMultiplier * companyAlert.awarenessMultiplier,
      searchDurationMultiplier:
        campaignDifficulty.npcSearchDurationMultiplier * companyAlert.searchDurationMultiplier,
    });
    this.hrController.setDifficultyModifiers({
      viewDistanceMultiplier: companyAlert.viewDistanceMultiplier,
      awarenessMultiplier:
        campaignDifficulty.npcAwarenessMultiplier * companyAlert.awarenessMultiplier,
      searchDurationMultiplier:
        campaignDifficulty.npcSearchDurationMultiplier * companyAlert.searchDurationMultiplier,
    });
    this.managerController.setDifficultyModifiers({
      viewDistanceMultiplier: companyAlert.viewDistanceMultiplier,
      awarenessMultiplier:
        campaignDifficulty.npcAwarenessMultiplier * companyAlert.awarenessMultiplier,
      searchDurationMultiplier:
        campaignDifficulty.npcSearchDurationMultiplier * companyAlert.searchDurationMultiplier,
    });
  }

  private handlePhoneInput(): void {
    if (Phaser.Input.Keyboard.JustDown(this.phoneAnswerKey)) {
      this.answerPhoneCall();
    }
    if (Phaser.Input.Keyboard.JustDown(this.phoneDeclineKey)) {
      this.phoneSystem.decline();
    }
    if (Phaser.Input.Keyboard.JustDown(this.phoneAirplaneKey)) {
      if (this.phoneSystem.activateAirplaneMode()) {
        this.hud.showMessage(`TRYB SAMOLOTOWY — ${phoneConfig.airplaneModeDurationSeconds} SEK.`);
      } else if (this.phoneSystem.getSnapshot().unlocked) {
        this.hud.showMessage('TRYB SAMOLOTOWY — WYKORZYSTANY');
      }
    }
  }

  private evaluateCallNoiseNow(): CallNoiseResult {
    const cars = this.companyCarController.isEnabled() ? [this.companyCarController.getPosition()] : [];
    return evaluateCallNoise(
      { position: { x: this.player.x, y: this.player.y }, hidden: this.hidingSystem.isHidden(), cars },
      callNoiseConfig,
    );
  }

  /** While the phone rings, the panel tells whether answering here would be heard. */
  private updateCallNoiseHint(): void {
    if (this.phoneSystem.getSnapshot().state !== 'RINGING') {
      this.phoneHud.setBackgroundNoise(null, false);
      return;
    }
    const noise = this.evaluateCallNoiseNow();
    this.phoneHud.setBackgroundNoise(callNoiseLabels[noise.reason], noise.loud);
  }

  private answerPhoneCall(): void {
    const call = this.phoneSystem.getSnapshot().activeCall;
    if (!call || !this.phoneSystem.answer()) return;

    const noise = this.evaluateCallNoiseNow();
    const noiseLines: { speaker?: string; text: string; tone: 'speech' | 'warning' }[] = [];
    if (noise.loud && (noise.reason === 'street' || noise.reason === 'car')) {
      const change = this.suspicionSystem.registerEvent({
        type: 'noisyWorkCall',
        missionId: this.missionSystem.getCurrentMission()?.id ?? 'free-roam',
        month: this.campaignSystem.getCurrentMonth().id,
      });
      this.hud.showAlert(`HAŁAS W TLE  +${change.appliedDelta}%`);
      this.handleSuspicionChange(change);
      this.applyNpcDifficulty();
      this.persistCurrentState();
      noiseLines.push(
        { speaker: 'KIEROWNIK', text: callNoiseManagerLines[noise.reason], tone: 'warning' },
        {
          speaker: 'HAŁAS W TLE',
          text: `Kierownik słyszy ${noise.reason === 'car' ? 'samochód' : 'ulicę'}. Odbieraj w budynku albo w kryjówce.`,
          tone: 'warning',
        },
      );
    }

    this.dialogueSystem.showSequence(
      {
        id: `phone-${call.id}`,
        pauseWorld: false,
        lockPlayerMovement: true,
        lines: [
          ...noiseLines,
          ...call.dialogue.lines.map((line) => ({ ...line, tone: 'speech' as const })),
        ],
      },
      { onComplete: () => this.phoneSystem.completeAnsweredCall() },
    );
  }

  private handleDialogueAndOverlayInput(
    owner: ActionInputOwner,
    actionPressed: boolean,
  ): boolean {
    const advancePressed =
      actionPressed ||
      Phaser.Input.Keyboard.JustDown(this.dialogueSpaceKey);

    if (owner === 'DIALOGUE') {
      if (
        Phaser.Input.Keyboard.JustDown(this.dialogueUpKey) ||
        Phaser.Input.Keyboard.JustDown(this.dialogueWKey)
      ) {
        this.dialogueSystem.moveChoice(-1);
      }
      if (
        Phaser.Input.Keyboard.JustDown(this.dialogueDownKey) ||
        Phaser.Input.Keyboard.JustDown(this.dialogueSKey)
      ) {
        this.dialogueSystem.moveChoice(1);
      }
      if (advancePressed) this.dialogueSystem.advance();
      return true;
    }

    if (advancePressed && owner === 'SUMMARY') {
      this.continueAfterSummary();
      return true;
    }
    if (advancePressed && owner === 'MONTH_TRANSITION') {
      this.continueAfterMonthTransition();
      return true;
    }
    return false;
  }

  private synchronizeMovementLock(dialogueLocksMovement: boolean): void {
    const canMove =
      !dialogueLocksMovement &&
      !this.phoneSystem.isConversationActive() &&
      !this.hidingSystem.isHidden() &&
      !this.isGameplayLocked();
    this.playerController.setMovementEnabled(canMove);
  }

  /**
   * "Pausing the world" only skips NPC thinking; Arcade physics would keep pushing
   * bodies with their last velocity, so zero it every frozen frame.
   */
  private holdNpcsStill(): void {
    this.npcController.holdStill();
    this.hrController.holdStill();
    this.companyCarController.holdStill();
    this.managerController.holdStill();
  }

  private updateNpcAndDebug(time: number, delta: number): void {
    const target = {
      x: this.player.x,
      y: this.player.y,
      hidden: this.hidingSystem.isHidden(),
      sprinting: this.playerController.isSprinting(),
    };
    this.npcController.update(delta, target);
    this.hrController.update(delta, target);
    this.companyCarController.update(delta, target);
    this.managerController.update(delta, target);
    if (this.suspicionSystem.getThreshold().shareApproximatePlayerPositionWithManager) {
      this.managerController.maybeReceiveCriticalSignal(time, target);
    }
    this.checkForConfrontation(target);
    this.hud.setManagerNearby(this.managerController.isNear(target));
    if (this.positionReportSystem.update(time)) this.hud.showMessage('POSZUKIWANIA ZAKOŃCZONE');
    this.debugOverlay.update(time, this.player, this.npcController, this.hrController);
  }

  private notifyPhoneOfMissionResult(result: MissionEventResult): void {
    if (!result.completedStepId) return;
    this.phoneSystem.notify({ type: 'objectiveCompleted', stepId: result.completedStepId });
    this.phoneSystem.notify({ type: 'returningHome', afterStepId: result.completedStepId });
    for (const effect of result.effects) {
      if (effect.type === 'add-item') {
        this.phoneSystem.notify({ type: 'itemPickedUp', itemId: effect.itemId });
      }
    }
  }

  private startPhoneForMission(mission: MissionDefinition): void {
    this.phoneSystem.startMission(mission.id, mission.phoneCalls ?? []);
  }

  private applyMissionPatrol(routeId = 'standard'): void {
    const route = this.workColleaguePatrolRoutes[routeId] ?? this.workColleaguePatrolRoutes.standard;
    if (route) this.npcController.setPatrolRoute(route);
  }

  private applyHrMissionSetup(mission: MissionDefinition): void {
    const active = mission.campaignMonth >= 3 && Boolean(mission.hrPatrolRouteId);
    this.hrController.setEnabled(active);
    if (!active) return;
    if (!this.debugRuntimeState || this.debugRuntimeState.selection.hrEnabled) {
      this.gameState.unlockHr();
    }
    const route = this.hrPatrolRoutes[mission.hrPatrolRouteId ?? 'pharmacy-loop'];
    if (route) this.hrController.setPatrolRoute(route);
    this.hrController.forceState(HR_STATE.Patrol);
  }

  private applyCompanyCarMissionSetup(mission: MissionDefinition): void {
    const enabled = mission.campaignMonth >= 4 && Boolean(mission.companyCarRouteId);
    this.companyCarController.setEnabled(enabled);
    if (!enabled) { this.positionReportSystem.clear(); return; }
    const route = this.companyCarRoutes[mission.companyCarRouteId ?? 'tutorial-road-loop'];
    if (route) this.companyCarController.setRoute(route);
  }

  private applyManagerMissionSetup(mission: MissionDefinition): void {
    const enabled = mission.campaignMonth >= 5 && Boolean(mission.managerInterestPoints?.length);
    this.managerController.setEnabled(enabled);
    if (!enabled) {
      this.hud.setManagerNearby(false);
      return;
    }
    if (!this.debugRuntimeState || this.debugRuntimeState.selection.managerEnabled) this.gameState.unlockManager();
    this.managerController.setInterestPoints(mission.managerInterestPoints ?? []);
    this.managerController.forceState(MANAGER_STATE.PatrolArea);
  }

  private handleCompanyCarDetection(position: { x: number; y: number }): void {
    this.handleNpcDetection('companyCar', 'SAMOCHÓD SŁUŻBOWY CIĘ ZAUWAŻYŁ');
    this.positionReportSystem.reportPlayer(position, this.time.now);
    const coworkerTarget = this.positionReportSystem.getInvestigationTarget('coworker', this.time.now);
    const hrTarget = this.positionReportSystem.getInvestigationTarget('hr', this.time.now);
    const managerTarget = this.positionReportSystem.getInvestigationTarget('manager', this.time.now);
    if (coworkerTarget && this.npcController.isEnabled()) this.npcController.investigate(coworkerTarget);
    if (hrTarget && this.hrController.isEnabled()) this.hrController.investigate(hrTarget);
    if (managerTarget && this.managerController.isEnabled()) this.managerController.investigate(managerTarget);
    this.hud.showAlert('⚠ POZYCJA ZGŁOSZONA — FIRMA SPRAWDZA OKOLICĘ');
  }

  private handleNpcDetection(source: EnemyType, message: string): void {
    const missionId = this.missionSystem.getCurrentMission()?.id ?? 'free-roam';
    const detection = this.suspicionSystem.registerDetection({
      source,
      missionId,
      month: this.campaignSystem.getCurrentMonth().id,
    });
    this.missionSystem.recordDetection();
    if (source !== 'zus') this.gameState.recordDetection(source);
    this.hud.showAlert(`${message}  +${detection.appliedDelta}%`);
    this.handleSuspicionChange(detection);
    this.applyNpcDifficulty();
    this.persistCurrentState();
  }

  private startZusSummons(): void {
    this.missionTransitionPending = true;
    this.playerController.setMovementEnabled(false);
    this.npcController.setPaused(true);
    this.hrController.setPaused(true);
    this.companyCarController.setPaused(true);
    this.managerController.setPaused(true);
    this.phoneSystem.endMission();
    this.dialogueSystem.showSequence({
      id: 'zus-summons',
      pauseWorld: true,
      lockPlayerMovement: true,
      lines: [
        { speaker: 'DZIEŃ L4', text: '179 / 180', tone: 'system' },
        { text: 'BRRRR... BRRRR...', tone: 'system' },
        { speaker: 'MASZ NOWĄ WIADOMOŚĆ', text: 'NADAWCA: ZAKŁAD UBEZPIECZEŃ SPOŁECZNYCH', tone: 'warning' },
        { speaker: 'WIADOMOŚĆ', text: 'WEZWANIE NA KONTROLĘ', tone: 'warning' },
        { speaker: 'BOHATER', text: '...', tone: 'speech' },
        { speaker: 'BOHATER', text: 'No to pięknie.', tone: 'speech' },
        { speaker: 'DZIEŃ 180', text: 'KONTROLA', tone: 'system' },
        { speaker: 'ZUS', text: '...', tone: 'warning' },
      ],
    }, {
      onComplete: () => {
        this.gameState.setCampaignProgress(180, 6, [1, 2, 3, 4, 5, 6]);
        this.persistCurrentState(false);
        this.cameras.main.fadeOut(500, 6, 9, 13);
        this.time.delayedCall(520, () => this.scene.start('ZusScene', { phase: ZUS_FINALE_PHASE.Documents }));
      },
    });
  }

  private startHrConversation(): void {
    const previousChoice = this.gameState.getDialogueChoice(HR_FIRST_MEETING_ID);
    if (previousChoice) {
      // After the first meeting every HR encounter becomes an "explain yourself" talk.
      if (this.confrontationSystem.hasScenarios('hr')) this.startConfrontation('hr');
      else this.dialogueSystem.showSequence(hrRepeatMeetingDialogue, {
        onComplete: () => this.hrController.completeConversation(),
      });
      return;
    }

    this.dialogueSystem.showSequence(hrFirstMeetingDialogue, {
      onChoice: (choiceId) => this.resolveHrChoice(choiceId),
    });
  }

  /**
   * At-home minigames run in their own overlay scene; the whole estate is
   * paused meanwhile, so nothing can catch Hubi mid-threading.
   */
  private createMinigameRunner(): MinigameRunner {
    return {
      play: (request: MinigameRequest, onDone: (result: MinigameResult) => void) => {
        this.playerController.setMovementEnabled(false);
        const data: MinigameSceneData = {
          request,
          stress: this.suspicionSystem.getValue() / 100,
          onDone: (result) => {
            this.scene.resume();
            onDone(result);
          },
        };
        // Deferred one tick: pausing is ignored while the scene is still in create().
        this.time.delayedCall(0, () => {
          this.scene.launch(MINIGAME_SCENE_KEY, data);
          this.scene.bringToTop(MINIGAME_SCENE_KEY);
          this.scene.pause();
        });
      },
    };
  }

  /** A chasing colleague or manager who reaches Hubi stops him for a talk. */
  private checkForConfrontation(target: { x: number; y: number; hidden: boolean }): void {
    if (target.hidden || this.dialogueSystem.isActive() || this.isGameplayLocked()) return;
    const distance = confrontationConfig.catchDistance;
    if (this.npcController.isCatching(target, distance)) this.startConfrontation('coworker');
    else if (this.managerController.isCatching(target, distance)) this.startConfrontation('manager');
  }

  private startConfrontation(source: ConfrontationSource): void {
    const prepared = this.confrontationSystem.prepare(source, {
      carrying: this.inventorySystem.getVisibleCarriedItem() !== null,
      heavy: !this.inventorySystem.getCarryMovement().sprintAllowed,
    });
    const speaker = getConfrontationSpeaker(source);
    this.playerController.setMovementEnabled(false);
    this.dialogueSystem.showSequence({
      id: `confrontation-${prepared.scenario.id}`,
      pauseWorld: true,
      lockPlayerMovement: true,
      lines: [{
        speaker,
        text: prepared.scenario.opening,
        tone: 'warning',
        choices: prepared.excuses.map((excuse) => ({ id: excuse.id, text: excuse.text })),
      }],
    }, {
      onChoice: (choiceId) => this.resolveConfrontation(prepared, choiceId, speaker),
    });
  }

  private resolveConfrontation(
    prepared: PreparedConfrontation,
    choiceId: string,
    speaker: string,
  ): void {
    const outcome = this.confrontationSystem.resolve(prepared, choiceId);
    if (outcome.penalty > 0) {
      const change = this.suspicionSystem.applyPenalty(outcome.penalty);
      this.hud.showAlert(`SŁABA WYMÓWKA  +${change.appliedDelta}%`);
      this.handleSuspicionChange(change);
      this.applyNpcDifficulty();
    }
    this.persistCurrentState();
    this.dialogueSystem.showSequence({
      id: `confrontation-reply-${outcome.excuseId}`,
      pauseWorld: true,
      lockPlayerMovement: true,
      lines: [{ speaker, text: outcome.reply, tone: outcome.quality === 'good' ? 'success' : 'warning' }],
    }, {
      onComplete: () => {
        this.releaseConfrontation(outcome.source);
        if (outcome.quality === 'good') this.hud.showMessage('Udało się wybrnąć.');
      },
    });
  }

  private releaseConfrontation(source: ConfrontationSource): void {
    const graceMs = confrontationConfig.releaseGraceMs;
    if (source === 'coworker') this.npcController.releaseAfterConfrontation(graceMs);
    else if (source === 'manager') this.managerController.releaseAfterConfrontation(graceMs);
    else this.hrController.completeConversation();
  }

  private resolveHrChoice(choiceId: string): void {
    const response = hrDialogueResponses[choiceId];
    if (!response) {
      this.hrController.completeConversation();
      return;
    }
    if (this.gameState.recordDialogueChoice(HR_FIRST_MEETING_ID, choiceId) && response.eventType) {
      const change = this.suspicionSystem.registerEvent({
        type: response.eventType,
        missionId: this.missionSystem.getCurrentMission()?.id ?? 'free-roam',
        month: this.campaignSystem.getCurrentMonth().id,
      });
      this.hud.showAlert(`+${change.appliedDelta}% PODEJRZLIWOŚCI`);
      this.handleSuspicionChange(change);
      this.applyNpcDifficulty();
    }
    this.persistCurrentState();
    this.dialogueSystem.showSequence({
      id: `hr-response-${choiceId}`,
      pauseWorld: true,
      lockPlayerMovement: true,
      lines: [{ speaker: 'HR', text: response.response, tone: 'speech' }],
    }, { onComplete: () => this.hrController.completeConversation() });
  }

  private debugForcePhoneCall(): void {
    const configuredCall = this.missionSystem.getCurrentMission()?.phoneCalls?.[0]
      ?? verticalSliceMissions.flatMap((mission) => [...(mission.phoneCalls ?? [])])[0];
    if (!this.phoneSystem.forceCall(configuredCall)) {
      this.hud.showMessage('DEBUG: NIE MOŻNA TERAZ WYWOŁAĆ POŁĄCZENIA');
    }
  }

  private createDeveloperDebugPanel(): void {
    const currentMissionId = this.gameState.getCurrentMissionId();
    const supportedCurrentMission = currentMissionId
      ? this.debugTestStateSystem.getMissionDefinitions().some((entry) => entry.missionId === currentMissionId)
      : false;
    const initialSelection = this.debugRuntimeState?.selection
      ?? this.debugTestStateSystem.createDefaultSelection(
        supportedCurrentMission && currentMissionId ? currentMissionId : 'medicine-run',
      );
    const panelRuntime = this.debugRuntimeState
      ?? this.debugTestStateSystem.withCurrentSnapshot(
        this.debugTestStateSystem.build({
          ...initialSelection,
          day: this.campaignSystem.getCurrentDay(),
          suspicion: this.suspicionSystem.getValue(),
          phoneEnabled: this.gameState.isPhoneUnlocked(),
          hrEnabled: this.gameState.isHrUnlocked(),
          managerEnabled: this.gameState.isManagerUnlocked(),
        }, 'CURRENT GAME'),
        this.gameState.getSnapshot(),
        { x: this.player.x, y: this.player.y },
      );
    this.developerDebugPanel = new DeveloperDebugPanel(
      this,
      this.debugTestStateSystem.getMissionDefinitions(),
      this.debugTestStateSystem.getScenarioDefinitions(),
      panelRuntime,
      {
        applySelection: (selection) => this.startDebugRuntime(this.debugTestStateSystem.build(selection)),
        applyScenario: (scenarioId) => this.startDebugRuntime(this.debugTestStateSystem.buildScenario(scenarioId)),
        restartMission: () => this.restartDebugMission(),
        restartStage: () => this.restartDebugStage(),
        saveSlot: (slot) => this.saveDebugSlot(slot),
        loadSlot: (slot) => this.loadDebugSlot(slot),
        exitDebugSession: () => { this.debugStateService.clearActive(); this.scene.restart(); },
        forceCall: () => this.debugForcePhoneCall(),
        resetPhone: () => { this.phoneSystem.resetCooldown(); this.phoneSystem.resetAirplaneModeUsage(); },
        togglePhone: () => this.toggleDebugPhone(),
        toggleCoworker: () => this.toggleDebugCoworker(),
        toggleHr: () => this.toggleDebugHr(),
        toggleCompanyCar: () => this.toggleDebugCompanyCar(),
        toggleManager: () => this.toggleDebugManager(),
        pauseCompanyCar: () => { const paused = !this.companyCarController.isPaused(); this.companyCarController.setPaused(paused); return paused; },
        forceCompanyCarDetection: () => this.companyCarController.forceDetection(this.player),
        teleportPlayerToCarRoute: () => { this.player.setPosition(760, 700); this.player.updatePresentation(); },
        teleportPlayerToObjective: () => this.teleportPlayerToDebugObjective(),
        teleportCoworkerToPlayer: () => this.npcController.teleportTo({ x: this.player.x + 75, y: this.player.y }),
        teleportHrToPlayer: () => this.hrController.teleportTo({ x: this.player.x + 75, y: this.player.y }),
        teleportManagerToInterestPoint: () => this.managerController.teleportToInterestPoint(),
        forceManagerChase: () => this.managerController.forceDetection(this.player),
        forceManagerSearching: () => this.managerController.forceState(MANAGER_STATE.Searching, this.player),
        addHomeItem: (item) => this.addDebugHomeItem(item),
        addL4PrintFilament: () => this.addDebugL4PrintFilament(),
        setL4ProjectState: (state) => this.setDebugL4ProjectState(state),
        setSuspicion99: () => this.debugSetSuspicion(99),
        triggerCriticalSuspicionIncident: () => this.debugTriggerCriticalSuspicionIncident(),
        cycleCriticalSuspicionIncidents: () => this.debugCycleCriticalSuspicionIncidents(),
        getLiveStatus: () => ({
          suspicion: this.suspicionSystem.getValue(),
          phone: this.phoneSystem.getSnapshot().enabled && this.phoneSystem.getSnapshot().unlocked,
          coworker: this.npcController.isEnabled(),
          hr: this.hrController.isEnabled(),
          companyCar: this.companyCarController.isEnabled(),
          carPaused: this.companyCarController.isPaused(),
          carState: this.companyCarController.getState(),
          manager: this.managerController.isEnabled(),
          managerState: this.managerController.getState(),
          managerLastKnown: formatDebugPoint(this.managerController.getLastKnownPosition()),
          actionInputOwner: this.actionInputRouter.resolve({
            dialogueActive: this.dialogueSystem.isActive(),
            summaryVisible: this.summaryVisible,
            monthTransitionVisible: this.monthTransitionVisible,
          }),
          dialogueActive: this.dialogueSystem.isActive(),
          interactionAvailable:
            this.hidingSystem.isHidden() ||
            this.hidingSystem.findNearby({ x: this.player.x, y: this.player.y }) !== null ||
            this.interactionSystem.findNearby(this.player.x, this.player.y) !== null,
          criticalSuspicionIncidents:
            this.gameState.getCampaignStatistics().criticalSuspicionIncidents,
        }),
        hasSlot: (slot) => this.debugStateService.hasSlot(slot),
      },
    );
  }

  private startDebugRuntime(runtime: DebugRuntimeState): void {
    this.debugStateService.saveActive(runtime);
    this.scene.restart();
  }

  private restartDebugMission(): void {
    const selection = this.getDebugSelection();
    this.startDebugRuntime(this.debugTestStateSystem.build({
      ...selection,
      stage: 'MISSION_START',
      suspicion: this.suspicionSystem.getValue(),
    }, 'RESTARTED MISSION'));
  }

  private restartDebugStage(): void {
    const selection = this.getDebugSelection();
    this.startDebugRuntime(this.debugTestStateSystem.build({
      ...selection,
      suspicion: this.suspicionSystem.getValue(),
    }, 'RESTARTED STAGE'));
  }

  private getDebugSelection(): DebugTestSelection {
    return this.debugRuntimeState?.selection
      ?? this.developerDebugPanel?.getSelection()
      ?? this.debugTestStateSystem.createDefaultSelection();
  }

  private captureDebugRuntime(): DebugRuntimeState {
    const base = this.debugRuntimeState
      ?? this.debugTestStateSystem.build(this.getDebugSelection(), 'QUICK SAVE');
    return this.debugTestStateSystem.withCurrentSnapshot(
      base,
      this.gameState.getSnapshot(),
      { x: this.player.x, y: this.player.y },
    );
  }

  private saveDebugSlot(slot: 1 | 2): void {
    this.debugStateService.saveSlot(slot, this.captureDebugRuntime());
    this.hud.showMessage(`DEBUG STATE ZAPISANY — SLOT ${slot}`);
  }

  private loadDebugSlot(slot: 1 | 2): void {
    const runtime = this.debugStateService.loadSlot(slot);
    if (!runtime) { this.hud.showMessage(`DEBUG SLOT ${slot} JEST PUSTY`); return; }
    this.startDebugRuntime(runtime);
  }

  private toggleDebugPhone(): boolean {
    const snapshot = this.phoneSystem.getSnapshot();
    const enabled = !(snapshot.enabled && snapshot.unlocked);
    this.phoneSystem.setUnlocked(enabled);
    this.phoneSystem.setEnabled(enabled);
    this.updateDebugRuntimeSelection({ phoneEnabled: enabled });
    return enabled;
  }

  private toggleDebugCoworker(): boolean {
    const enabled = !this.npcController.isEnabled();
    this.npcController.setEnabled(enabled);
    this.updateDebugRuntimeSelection({ coworkerEnabled: enabled });
    return enabled;
  }

  private toggleDebugHr(): boolean {
    const enabled = !this.hrController.isEnabled();
    this.hrController.setEnabled(enabled);
    this.updateDebugRuntimeSelection({ hrEnabled: enabled });
    return enabled;
  }

  private toggleDebugCompanyCar(): boolean {
    const enabled = !this.companyCarController.isEnabled();
    this.companyCarController.setEnabled(enabled);
    this.updateDebugRuntimeSelection({ companyCarEnabled: enabled });
    return enabled;
  }

  private toggleDebugManager(): boolean {
    const enabled = !this.managerController.isEnabled();
    this.managerController.setEnabled(enabled);
    if (enabled) this.gameState.unlockManager();
    this.updateDebugRuntimeSelection({ managerEnabled: enabled });
    return enabled;
  }

  private updateDebugRuntimeSelection(change: Partial<DebugTestSelection>): void {
    if (!this.debugRuntimeState) return;
    this.debugRuntimeState = {
      ...this.debugRuntimeState,
      selection: { ...this.debugRuntimeState.selection, ...change },
    };
    this.debugStateService.saveActive(this.debugRuntimeState);
  }

  private teleportPlayerToDebugObjective(): void {
    const definition = this.debugTestStateSystem.getMissionDefinitions()
      .find((candidate) => candidate.missionId === this.getDebugSelection().missionId);
    const checkpoint = definition?.checkpoints.find((candidate) => candidate.stage === 'OBJECTIVE_READY');
    if (!checkpoint) return;
    this.player.setPosition(checkpoint.playerStart.x, checkpoint.playerStart.y);
    this.player.updatePresentation();
  }

  private addDebugHomeItem(item: 'spool' | 'cable' | 'nozzle'): void {
    if (item === 'spool') this.homeProgressionSystem.addFilamentSpool('pla-orange');
    if (item === 'cable') this.homeProgressionSystem.addDeskItem('usb-c-cable-installed');
    if (item === 'nozzle') this.homeProgressionSystem.addDeskItem('nozzle-0-6-installed');
    this.homeProgressionView.synchronize(this.homeProgressionSystem.getVisibleDefinitions());
    this.persistCurrentState();
  }

  private addDebugL4PrintFilament(): void {
    this.missionEffectExecutor.apply([{ type: 'add-item', itemId: 'l4-print-filament' }], () => this.persistCurrentState());
  }

  private setDebugL4ProjectState(state: 'PRINTING' | 'COMPLETED'): void {
    if (state === PRINT_PROJECT_STATE.Printing) {
      this.missionEffectExecutor.apply([{ type: 'start-print', printJobId: 'l4-400' }], () => this.persistCurrentState());
      return;
    }
    this.missionEffectExecutor.apply([{ type: 'complete-print', printJobId: 'l4-400' }], () => this.persistCurrentState());
  }

  private debugSetSuspicion(value: number): void {
    const change = this.suspicionSystem.setValue(value);
    this.handleSuspicionChange(change);
    this.applyNpcDifficulty();
    this.persistCurrentState();
  }

  private debugTriggerCriticalSuspicionIncident(): void {
    this.debugSetSuspicion(99);
    const change = this.suspicionSystem.setValue(100);
    this.handleSuspicionChange(change);
    this.applyNpcDifficulty();
    this.persistCurrentState();
  }

  private debugCycleCriticalSuspicionIncidents(): number {
    const current = this.gameState.getCampaignStatistics().criticalSuspicionIncidents;
    const next = (current + 1) % 4;
    this.gameState.setCriticalSuspicionIncidentsForDebug(next);
    this.persistCurrentState();
    return next;
  }

  private applyDebugRuntimeOverrides(): void {
    if (!this.debugRuntimeState) return;
    const runtime = this.debugRuntimeState;
    this.phoneSystem.setUnlocked(runtime.selection.phoneEnabled);
    this.phoneSystem.setEnabled(runtime.selection.phoneEnabled);
    this.npcController.setEnabled(runtime.selection.coworkerEnabled);
    this.hrController.setEnabled(runtime.selection.hrEnabled);
    this.companyCarController.setEnabled(runtime.selection.companyCarEnabled);
    this.managerController.setEnabled(runtime.selection.managerEnabled);
    if (runtime.hrStart) this.hrController.teleportTo(runtime.hrStart);
    if (runtime.hrState) this.hrController.forceState(runtime.hrState, this.player);
    if (runtime.companyCarStart) this.companyCarController.teleportTo(runtime.companyCarStart);
    if (runtime.companyCarState) this.companyCarController.forceState(runtime.companyCarState);
    if (runtime.forceCompanyCarDetection) this.companyCarController.forceDetection(this.player);
    if (runtime.forcePositionReport) this.handleCompanyCarDetection(this.player);
    if (runtime.managerStart) this.managerController.teleportTo(runtime.managerStart);
    if (runtime.managerState) this.managerController.forceState(runtime.managerState, this.player);
    if (runtime.forceManagerDetection) this.managerController.forceDetection(this.player);
    if (runtime.forcePhoneCall) this.debugForcePhoneCall();
    if (runtime.triggerHrConversation) this.startHrConversation();
    if (runtime.triggerCriticalSuspicionIncident) {
      this.debugTriggerCriticalSuspicionIncident();
      this.debugRuntimeState = { ...runtime, triggerCriticalSuspicionIncident: false };
      this.debugStateService.saveActive(this.debugRuntimeState);
    }
  }

  private reconcileMissionState(): void {
    const completed = new Set(this.gameState.getCompletedMissionIds());
    const currentMissionId = this.gameState.getCurrentMissionId();
    const currentMission = verticalSliceMissions.find((mission) => mission.id === currentMissionId);
    const currentStepIsValid =
      currentMission !== undefined &&
      this.gameState.getCurrentMissionStepIndex() < currentMission.steps.length;

    if (currentMissionId !== null && currentStepIsValid && !completed.has(currentMissionId)) {
      return;
    }

    const firstIncomplete =
      verticalSliceMissions.find((mission) => !completed.has(mission.id))?.id ?? null;
    this.gameState.setMissionProgress(firstIncomplete, 0);
  }
}

function formatDebugPoint(point: { x: number; y: number } | null): string {
  return point ? `LAST ${Math.round(point.x)}/${Math.round(point.y)}` : 'LAST NONE';
}

function getConfrontationSpeaker(source: ConfrontationSource): string {
  switch (source) {
    case 'coworker':
      return workColleagueDefinition.displayName;
    case 'hr':
      return hrDefinition.displayName;
    case 'manager':
      return managerDefinition.displayName;
  }
}
