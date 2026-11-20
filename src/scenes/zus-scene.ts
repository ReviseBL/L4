import Phaser from 'phaser';
import { dialogueConfig } from '../data/dialogue/dialogue-config';
import { zusDocumentChoices, zusQuestionEffects } from '../data/finale/zus-finale-data';
import type { DialogueSequenceDefinition } from '../domain/dialogue/dialogue-types';
import {
  ZUS_FINALE_PHASE,
  type FinaleCampaignContext,
  type FinaleResult,
  type ZusFinalePhase,
} from '../domain/finale/zus-finale-types';
import type { FinaleEndingId } from '../domain/game-state/game-state-types';
import { PRINT_PROJECT_STATE } from '../domain/printing/print-job-types';
import { resolveDeveloperToolsEnabled } from '../config/developer-tools';
import { DebugStateService } from '../services/debug-state-service';
import { SaveGameService } from '../services/save-game-service';
import { GameState } from '../state/game-state';
import { DialogueSystem } from '../systems/dialogue-system';
import { resolveTitleFlowScene } from '../systems/title-flow-system';
import { ZusFinaleSystem } from '../systems/zus-finale-system';
import { DialogueBox } from '../ui/dialogue-box';
import { UI_FONT_FAMILY } from '../ui/text-style';
import { INKBLOT_CARDS, inkblotTestConfig, reflexTestConfig } from '../data/finale/zus-tests';
import { InkblotTest } from '../systems/finale/inkblot-test';
import { ReflexTest } from '../systems/finale/reflex-test';
import { InkblotView } from './zus/inkblot-view';
import { ReflexView } from './zus/reflex-view';

interface ZusSceneData {
  phase?: ZusFinalePhase;
  credibility?: number;
  forcedEnding?: FinaleEndingId;
}

export class ZusScene extends Phaser.Scene {
  private readonly saveGameService = new SaveGameService(window.localStorage);
  private readonly debugStateService = new DebugStateService(window.localStorage);
  private gameState!: GameState;
  private finaleSystem!: ZusFinaleSystem;
  private dialogueSystem!: DialogueSystem;
  private dialogueBox!: DialogueBox;
  private advanceKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private upKey!: Phaser.Input.Keyboard.Key;
  private downKey!: Phaser.Input.Keyboard.Key;
  private wKey!: Phaser.Input.Keyboard.Key;
  private sKey!: Phaser.Input.Keyboard.Key;
  private leftKey!: Phaser.Input.Keyboard.Key;
  private rightKey!: Phaser.Input.Keyboard.Key;
  private aKey!: Phaser.Input.Keyboard.Key;
  private dKey!: Phaser.Input.Keyboard.Key;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private documentContainer: Phaser.GameObjects.Container | null = null;
  private selectedDocumentIndex = 0;
  private walkContainer: Phaser.GameObjects.Container | null = null;
  private walkPlayer: Phaser.GameObjects.Rectangle | null = null;
  private walkMessage: Phaser.GameObjects.Text | null = null;
  private sprintWarningCooldownMs = 0;
  private phase: ZusFinalePhase = ZUS_FINALE_PHASE.Documents;
  private forcedEnding?: FinaleEndingId;
  private firstActivityChoice = '';
  private debugRuntimeActive = false;
  private inkblotTest: InkblotTest | null = null;
  private inkblotView: InkblotView | null = null;
  private inkblotChoice = 0;
  private reflexTest: ReflexTest | null = null;
  private reflexView: ReflexView | null = null;
  private reflexAnimating = false;

  public constructor() { super('ZusScene'); }

  public create(data: ZusSceneData = {}): void {
    this.cameras.main.setBackgroundColor('#090d12');
    const developerToolsEnabled = resolveDeveloperToolsEnabled(import.meta.env.DEV, import.meta.env.VITE_ENABLE_DEBUG);
    const debugRuntime = developerToolsEnabled ? this.debugStateService.loadActive() : null;
    this.debugRuntimeActive = debugRuntime !== null;
    this.gameState = debugRuntime ? new GameState(debugRuntime.gameState) : this.saveGameService.loadGame();
    this.phase = data.phase ?? ZUS_FINALE_PHASE.Documents;
    this.forcedEnding = data.forcedEnding;
    this.dialogueSystem = new DialogueSystem(dialogueConfig);
    this.dialogueBox = new DialogueBox(this);
    this.finaleSystem = new ZusFinaleSystem(this.createCampaignContext(), data.credibility);
    this.finaleSystem.setPhase(this.phase);
    this.createInput();
    this.add.text(28, 22, 'KONTROLA — SATYRYCZNY FINAŁ GRY', uiStyle(14, '#788da1'));
    this.add.text(932, 22, 'ZUS', uiStyle(24, '#f4f1de')).setOrigin(1, 0);

    if (data.phase) this.startPhase(data.phase);
    else this.showDialogue('zus-arrival', [
      { speaker: 'DZIEŃ 180', text: 'KONTROLA', tone: 'system' },
      { speaker: 'ZUS', text: 'Proszę przygotować dokumenty.', tone: 'speech' },
    ], () => this.startDocuments());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdown());
  }

  public update(_time: number, delta: number): void {
    const dialogueWasActive = this.dialogueSystem.isActive();
    if (dialogueWasActive) this.handleDialogueInput();
    else if (this.phase === ZUS_FINALE_PHASE.Documents) this.handleDocumentInput();
    else if (this.phase === ZUS_FINALE_PHASE.Inkblots) this.updateInkblots(delta);
    else if (this.phase === ZUS_FINALE_PHASE.Reflex) this.updateReflex(delta);
    else if (this.phase === ZUS_FINALE_PHASE.WalkTest) this.updateWalkTest(delta);
    this.dialogueSystem.update(delta);
    this.dialogueBox.update(this.dialogueSystem.getSnapshot());
  }

  private createCampaignContext(): FinaleCampaignContext {
    const snapshot = this.gameState.getSnapshot();
    return {
      suspicion: snapshot.suspicion,
      hrFirstMeetingChoice: snapshot.hr.dialogueChoices.hrFirstMeeting ?? null,
      l4PrintCompleted: snapshot.home.printProjectStates['l4-400'] === PRINT_PROJECT_STATE.Completed,
      completedMissionCount: snapshot.completedMissionIds.length,
      acquiredFilamentCount: snapshot.home.filamentSpoolIds.length,
      completedPrintCount: snapshot.home.completedPrintIds.length,
      phoneStats: { ...snapshot.phone },
      campaignStats: { ...snapshot.campaignStats },
    };
  }

  private startPhase(phase: ZusFinalePhase): void {
    switch (phase) {
      case ZUS_FINALE_PHASE.Documents: this.startDocuments(); break;
      case ZUS_FINALE_PHASE.Questions: this.startQuestions(); break;
      case ZUS_FINALE_PHASE.Inkblots: this.startInkblots(); break;
      case ZUS_FINALE_PHASE.Reflex: this.startReflex(); break;
      case ZUS_FINALE_PHASE.WalkTest: this.startWalkTest(); break;
      case ZUS_FINALE_PHASE.Analysis: this.startAnalysis(); break;
      case ZUS_FINALE_PHASE.Verdict: this.startVerdict(); break;
      case ZUS_FINALE_PHASE.Summary: this.showFinalSummary(this.finaleSystem.calculateResult(this.forcedEnding)); break;
    }
  }

  private startDocuments(): void {
    this.phase = ZUS_FINALE_PHASE.Documents;
    this.finaleSystem.setPhase(this.phase);
    this.documentContainer?.destroy(true);
    const title = this.add.text(480, 74, 'DOKUMENTACJA', uiStyle(30, '#ffd166')).setOrigin(0.5);
    const hint = this.add.text(480, 112, 'WYBIERZ 3 DOKUMENTY  •  W/S LUB ↑/↓  •  E', uiStyle(13, '#8ecae6')).setOrigin(0.5);
    const panel = this.add.rectangle(480, 290, 690, 315, 0x111820).setStrokeStyle(4, 0x8ecae6);
    this.documentContainer = this.add.container(0, 0, [panel, title, hint]);
    this.refreshDocumentList();
  }

  private refreshDocumentList(): void {
    if (!this.documentContainer) return;
    const snapshot = this.finaleSystem.getSnapshot();
    const old = this.documentContainer.getByName('document-list');
    old?.destroy();
    const list = this.add.text(208, 146, zusDocumentChoices.map((document, index) => {
      const chosen = snapshot.selectedDocumentIds.includes(document.id);
      return `${index === this.selectedDocumentIndex ? '▶' : ' '} ${chosen ? '[X]' : '[ ]'} ${document.label}`;
    }).join('\n'), uiStyle(18, '#f4f1de')).setLineSpacing(8).setName('document-list');
    this.documentContainer.add(list);
  }

  private handleDocumentInput(): void {
    if (Phaser.Input.Keyboard.JustDown(this.upKey) || Phaser.Input.Keyboard.JustDown(this.wKey)) {
      this.selectedDocumentIndex = (this.selectedDocumentIndex + zusDocumentChoices.length - 1) % zusDocumentChoices.length;
      this.refreshDocumentList();
    }
    if (Phaser.Input.Keyboard.JustDown(this.downKey) || Phaser.Input.Keyboard.JustDown(this.sKey)) {
      this.selectedDocumentIndex = (this.selectedDocumentIndex + 1) % zusDocumentChoices.length;
      this.refreshDocumentList();
    }
    if (!Phaser.Input.Keyboard.JustDown(this.advanceKey) && !Phaser.Input.Keyboard.JustDown(this.spaceKey)) return;
    const document = zusDocumentChoices[this.selectedDocumentIndex];
    if (!this.finaleSystem.selectDocument(document)) return;
    this.refreshDocumentList();
    if (this.finaleSystem.getSnapshot().selectedDocumentIds.length === 3) {
      this.documentContainer?.destroy(true);
      this.documentContainer = null;
      this.showDialogue('documents-done', [{ speaker: 'ZUS', text: 'Dokumenty przyjęte. Teraz kilka pytań.', tone: 'speech' }], () => this.startQuestions());
    }
  }

  private startQuestions(): void {
    this.phase = ZUS_FINALE_PHASE.Questions;
    this.finaleSystem.setPhase(this.phase);
    const definition: DialogueSequenceDefinition = {
      id: 'zus-main-questions', pauseWorld: true, lockPlayerMovement: true,
      lines: [
        { speaker: 'ROZMOWA', text: 'Proszę odpowiadać naturalnie.', tone: 'system' },
        { speaker: 'ZUS', text: 'Jak się pan obecnie czuje?', tone: 'speech', choices: [
          { id: 'still_need_time', text: 'Jeszcze potrzebuję czasu.' },
          { id: 'feeling_better', text: 'Coraz lepiej.' },
          { id: 'feeling_great', text: 'Rewelacyjnie.' },
        ] },
        { speaker: 'ZUS', text: 'A czym zajmuje się pan w domu?', tone: 'speech', choices: [
          { id: 'resting', text: 'Odpoczywam.' },
          { id: 'computer', text: 'Trochę siedzę przy komputerze.' },
          { id: 'printing_3d', text: 'Drukuję rzeczy w 3D.' },
        ] },
      ],
    };
    this.dialogueSystem.showSequence(definition, {
      onChoice: (choiceId) => {
        this.finaleSystem.applyAnswer(zusQuestionEffects[choiceId] ?? 0);
        if (['resting', 'computer', 'printing_3d'].includes(choiceId)) this.firstActivityChoice = choiceId;
      },
      onComplete: () => this.continueQuestions(),
    });
  }

  private continueQuestions(): void {
    if (this.firstActivityChoice === 'printing_3d') {
      this.dialogueSystem.showSequence({
        id: 'zus-printing-amount', pauseWorld: true, lockPlayerMovement: true,
        lines: [{ speaker: 'ZUS', text: 'Dużo?', tone: 'speech', choices: [
          { id: 'print_none', text: 'Nie.' },
          { id: 'print_some', text: 'Trochę.' },
          { id: 'print_1_7kg', text: '1,7 kilograma.' },
        ] }],
      }, {
        onChoice: (choiceId) => this.finaleSystem.applyAnswer(zusQuestionEffects[choiceId] ?? 0),
        onComplete: () => this.afterPrintingQuestion(),
      });
      return;
    }
    this.afterPrintingQuestion();
  }

  private afterPrintingQuestion(): void {
    const l4Completed = this.gameState.getPrintProjectState('l4-400') === PRINT_PROJECT_STATE.Completed;
    if (!l4Completed) { this.introInkblots(); return; }
    this.dialogueSystem.showSequence({
      id: 'zus-l4-400', pauseWorld: true, lockPlayerMovement: true,
      lines: [
        { speaker: 'ZUS', text: 'Co to jest „L4 — wersja 400%”?', tone: 'speech', choices: [
          { id: 'l4_decoration', text: 'Dekoracja.' },
          { id: 'l4_technical', text: 'Projekt techniczny.' },
          { id: 'l4_worth_it', text: 'Warto było.' },
        ] },
        { speaker: 'ZUS', text: '...', tone: 'speech' },
        { speaker: 'ZUS', text: 'Dobrze.', tone: 'speech' },
      ],
    }, {
      onChoice: (choiceId) => this.finaleSystem.applyAnswer(zusQuestionEffects[choiceId] ?? 0),
      onComplete: () => this.introInkblots(),
    });
  }

  private introInkblots(): void {
    this.showDialogue('zus-inkblots-intro', [
      { speaker: 'ZUS', text: 'Teraz pani psycholog. Krótki test.', tone: 'speech' },
      { speaker: 'PSYCHOLOG', text: 'Pokażę panu kilka kart. Proszę mówić pierwsze, co przyjdzie do głowy.', tone: 'speech' },
    ], () => this.startInkblots());
  }

  private startInkblots(): void {
    this.phase = ZUS_FINALE_PHASE.Inkblots;
    this.finaleSystem.setPhase(this.phase);
    this.inkblotTest = new InkblotTest(INKBLOT_CARDS, inkblotTestConfig);
    this.inkblotView = new InkblotView(this);
    this.inkblotChoice = 0;
  }

  private updateInkblots(delta: number): void {
    const test = this.inkblotTest;
    if (!test || !this.inkblotView) return;
    if (Phaser.Input.Keyboard.JustDown(this.upKey) || Phaser.Input.Keyboard.JustDown(this.wKey)) this.inkblotChoice = (this.inkblotChoice + 2) % 3;
    if (Phaser.Input.Keyboard.JustDown(this.downKey) || Phaser.Input.Keyboard.JustDown(this.sKey)) this.inkblotChoice = (this.inkblotChoice + 1) % 3;
    const chosen = Phaser.Input.Keyboard.JustDown(this.advanceKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey);
    const outcome = chosen ? test.choose(this.inkblotChoice) : test.update(delta);
    if (!outcome) {
      this.inkblotView.render(test, this.inkblotChoice);
      return;
    }
    this.finaleSystem.applyAnswer(outcome.credibilityDelta);
    this.inkblotChoice = 0;
    const done = test.isDone();
    this.showDialogue(`zus-inkblot-${test.getCardNumber()}`, [{ speaker: 'PSYCHOLOG', text: outcome.reaction, tone: 'speech' }], () => {
      if (!done) return;
      this.inkblotView?.destroy();
      this.inkblotView = null;
      this.inkblotTest = null;
      this.showDialogue('zus-reflex-intro', [
        { speaker: 'PSYCHOLOG', text: 'Dziękuję. To wszystko.', tone: 'speech' },
        { speaker: 'LEKARZ', text: 'Teraz odruchy. Proszę usiąść na kozetce.', tone: 'speech' },
      ], () => this.startReflex());
    });
    if (!done) this.inkblotView.render(test, this.inkblotChoice);
  }

  private startReflex(): void {
    this.phase = ZUS_FINALE_PHASE.Reflex;
    this.finaleSystem.setPhase(this.phase);
    this.reflexTest = new ReflexTest(reflexTestConfig, Math.random);
    this.reflexView = new ReflexView(this, reflexTestConfig);
    this.reflexAnimating = false;
  }

  private updateReflex(delta: number): void {
    const test = this.reflexTest;
    const view = this.reflexView;
    if (!test || !view || this.reflexAnimating) return;
    test.update(delta);
    view.render(test);
    if (!Phaser.Input.Keyboard.JustDown(this.advanceKey) && !Phaser.Input.Keyboard.JustDown(this.spaceKey)) return;
    const outcome = test.press();
    if (!outcome) return;
    this.finaleSystem.applyAnswer(outcome.credibilityDelta);
    this.reflexAnimating = true;
    view.playKick(outcome, () => {
      const done = test.isDone();
      this.showDialogue(`zus-reflex-${test.getRound()}`, [{ speaker: 'LEKARZ', text: outcome.line, tone: outcome.result === 'weak' ? 'speech' : 'warning' }], () => {
        this.reflexAnimating = false;
        if (!done) return;
        this.reflexView?.destroy();
        this.reflexView = null;
        this.reflexTest = null;
        this.showDialogue('zus-walk-intro', [
          { speaker: 'LEKARZ', text: 'Na koniec proszę przejść do zaznaczonego miejsca.', tone: 'speech' },
        ], () => this.startWalkTest());
      });
    });
  }

  private startWalkTest(): void {
    this.phase = ZUS_FINALE_PHASE.WalkTest;
    this.finaleSystem.setPhase(this.phase);
    const floor = this.add.rectangle(480, 305, 790, 250, 0x263238).setStrokeStyle(5, 0x90a4ae);
    const start = this.add.rectangle(145, 305, 70, 150, 0x2a9d8f, 0.42);
    const finish = this.add.rectangle(815, 305, 70, 150, 0xe9c46a, 0.42);
    const title = this.add.text(480, 80, 'BADANIE', uiStyle(30, '#ffd166')).setOrigin(0.5);
    const objective = this.add.text(480, 120, 'ZACHOWUJ SIĘ NATURALNIE', uiStyle(18, '#f4f1de')).setOrigin(0.5);
    const hint = this.add.text(480, 485, 'PRZEJDŹ DO ZAZNACZONEGO MIEJSCA  •  SHIFT = SPRINT', uiStyle(13, '#8ecae6')).setOrigin(0.5);
    this.walkPlayer = this.add.rectangle(150, 305, 34, 46, 0xf4f1de).setStrokeStyle(4, 0x111820);
    this.walkMessage = this.add.text(480, 165, '', uiStyle(16, '#ff8c69')).setOrigin(0.5);
    this.walkContainer = this.add.container(0, 0, [floor, start, finish, title, objective, hint, this.walkPlayer, this.walkMessage]);
  }

  private updateWalkTest(delta: number): void {
    if (!this.walkPlayer) return;
    const horizontal = Number(this.rightKey.isDown || this.dKey.isDown) - Number(this.leftKey.isDown || this.aKey.isDown);
    const vertical = Number(this.downKey.isDown || this.sKey.isDown) - Number(this.upKey.isDown || this.wKey.isDown);
    const length = Math.hypot(horizontal, vertical) || 1;
    const sprinting = this.shiftKey.isDown && (horizontal !== 0 || vertical !== 0);
    const speed = sprinting ? 215 : 105;
    this.walkPlayer.x = Phaser.Math.Clamp(this.walkPlayer.x + horizontal / length * speed * delta / 1000, 115, 845);
    this.walkPlayer.y = Phaser.Math.Clamp(this.walkPlayer.y + vertical / length * speed * delta / 1000, 220, 390);
    this.sprintWarningCooldownMs -= delta;
    if (sprinting && this.sprintWarningCooldownMs <= 0) {
      this.finaleSystem.recordSprintIncident();
      this.sprintWarningCooldownMs = 850;
      const incidents = this.finaleSystem.getSnapshot().sprintIncidents;
      this.walkMessage?.setText(incidents >= 3 ? 'TO NIE WYGLĄDA NA ODPOCZYNEK' : 'ZUS PATRZY');
    } else if (!sprinting && this.sprintWarningCooldownMs <= 250) {
      this.walkMessage?.setText('');
    }
    if (this.walkPlayer.x >= 800) {
      this.walkContainer?.destroy(true);
      this.walkContainer = null;
      this.walkPlayer = null;
      this.walkMessage = null;
      this.startAnalysis();
    }
  }

  private startAnalysis(): void {
    this.phase = ZUS_FINALE_PHASE.Analysis;
    this.finaleSystem.setPhase(this.phase);
    const snapshot = this.gameState.getSnapshot();
    const stats = snapshot.campaignStats;
    const lines = [
      { speaker: 'ANALIZA', text: '180 DNI L4', tone: 'system' as const },
      { speaker: 'WYKRYCIA', text: `COWORKER: ${stats.coworkerDetections}  •  HR: ${stats.hrDetections}  •  KIEROWNIK: ${stats.managerDetections}  •  AUTO: ${stats.companyCarDetections}`, tone: 'system' as const },
      { speaker: 'TELEFON', text: `ODEBRANE: ${snapshot.phone.totalAnswered}  •  NIEODEBRANE: ${snapshot.phone.totalMissed}  •  ODRZUCONE: ${snapshot.phone.totalDeclined}`, tone: 'system' as const },
      { speaker: 'DRUK 3D', text: `SZPULE: ${snapshot.home.filamentSpoolIds.length}  •  DYSZE: ${snapshot.home.deskItemIds.includes('nozzle-0-6-installed') ? 1 : 0}  •  WYDRUKI: ${snapshot.home.completedPrintIds.length}`, tone: 'system' as const },
      { speaker: 'STATYSTYKI SPECJALNE', text: `KEBABY: ${stats.kebabsCollected}  •  DUŻE WYDRUKI L4: ${snapshot.home.completedPrintIds.includes('l4-400') ? 1 : 0}`, tone: 'system' as const },
      { speaker: 'INCYDENTY', text: `100% PODEJRZLIWOŚCI: ${stats.criticalSuspicionIncidents}`, tone: 'warning' as const },
    ];
    this.showDialogue('zus-analysis', lines, () => this.startVerdict());
  }

  private startVerdict(): void {
    this.phase = ZUS_FINALE_PHASE.Verdict;
    this.finaleSystem.setPhase(this.phase);
    const result = this.finaleSystem.calculateResult(this.forcedEnding);
    const lines = endingDialogue(result.endingId);
    this.showDialogue(`zus-ending-${result.endingId}`, lines, () => this.showFinalSummary(result));
  }

  private showFinalSummary(result: FinaleResult): void {
    this.phase = ZUS_FINALE_PHASE.Summary;
    this.finaleSystem.setPhase(this.phase);
    this.gameState.setCampaignProgress(180, 6, [1, 2, 3, 4, 5, 6]);
    this.gameState.completeCampaign(result.endingId, result.score, result.rank);
    const debugRuntime = this.debugRuntimeActive ? this.debugStateService.loadActive() : null;
    if (debugRuntime) {
      this.debugStateService.saveActive({ ...debugRuntime, gameState: this.gameState.getSnapshot() });
    } else {
      this.saveGameService.saveGame(this.gameState);
    }
    this.add.rectangle(480, 270, 760, 420, 0x111820).setStrokeStyle(5, 0xffd166);
    this.add.text(480, 105, 'L4: THE OFFICE ESCAPE', uiStyle(32, '#f4f1de')).setOrigin(0.5);
    this.add.text(480, 160, '180 DNI', uiStyle(20, '#8ecae6')).setOrigin(0.5);
    this.add.text(480, 225, `L4 SCORE: ${result.score.toLocaleString('pl-PL')}`, uiStyle(28, '#90be6d')).setOrigin(0.5);
    this.add.text(480, 275, `RANGA: ${result.rank}`, uiStyle(32, '#ffd166')).setOrigin(0.5);
    this.createSummaryButton(360, 360, 'ZAGRAJ PONOWNIE', () => {
      this.debugStateService.clearActive();
      this.saveGameService.resetGame();
      this.scene.start(resolveTitleFlowScene('new-game'));
    });
    this.createSummaryButton(600, 360, 'MENU', () => {
      this.debugStateService.clearActive();
      this.scene.start('MenuScene');
    });
  }

  private showDialogue(id: string, lines: DialogueSequenceDefinition['lines'], onComplete: () => void): void {
    this.dialogueSystem.showSequence({ id, pauseWorld: true, lockPlayerMovement: true, lines }, { onComplete });
  }

  private handleDialogueInput(): void {
    if (Phaser.Input.Keyboard.JustDown(this.upKey) || Phaser.Input.Keyboard.JustDown(this.wKey)) this.dialogueSystem.moveChoice(-1);
    if (Phaser.Input.Keyboard.JustDown(this.downKey) || Phaser.Input.Keyboard.JustDown(this.sKey)) this.dialogueSystem.moveChoice(1);
    if (Phaser.Input.Keyboard.JustDown(this.advanceKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.dialogueSystem.advance();
  }

  private createInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is required for ZusScene.');
    this.advanceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.upKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.leftKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.wKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.sKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.aKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.dKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.shiftKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
  }

  private createSummaryButton(x: number, y: number, label: string, action: () => void): void {
    this.add.rectangle(x, y, 210, 54, 0xd35400).setStrokeStyle(3, 0xffd166)
      .setInteractive({ useHandCursor: true }).on('pointerdown', action);
    this.add.text(x, y, label, uiStyle(15, '#ffffff')).setOrigin(0.5);
  }

  private shutdown(): void {
    this.inkblotView?.destroy();
    this.reflexView?.destroy();
    this.dialogueSystem.clear();
    this.dialogueBox.destroy();
    [this.advanceKey, this.spaceKey, this.upKey, this.downKey, this.leftKey, this.rightKey, this.wKey, this.sKey, this.aKey, this.dKey, this.shiftKey].forEach((key) => key.destroy());
  }
}

function endingDialogue(endingId: FinaleEndingId): DialogueSequenceDefinition['lines'] {
  if (endingId === 'extended') return [
    { speaker: 'ZUS', text: 'DECYZJA', tone: 'system' },
    { speaker: 'DECYZJA', text: 'L4 PRZEDŁUŻONE', tone: 'success' },
    { speaker: 'DECYZJA', text: '+30 DNI', tone: 'success' },
    { speaker: 'BOHATER', text: '...', tone: 'speech' },
    { speaker: 'BOHATER', text: 'Warto.', tone: 'speech' },
    { speaker: 'SEZON 2?', text: '...', tone: 'system' },
  ];
  if (endingId === 'back-to-work') return [
    { speaker: 'DECYZJA', text: 'ZDOLNY DO PRACY', tone: 'warning' },
    { speaker: 'PONIEDZIAŁEK', text: '07:01', tone: 'system' },
    { speaker: 'BOHATER', text: '...', tone: 'speech' },
    { speaker: 'BOHATER', text: 'No dobra.', tone: 'speech' },
    { speaker: 'GAME OVER', text: 'POWRÓT DO BIURKA', tone: 'warning' },
  ];
  if (endingId === 'hr-meeting') return [
    { speaker: 'DECYZJA', text: 'WEZWANIE DO HR', tone: 'warning' },
    { speaker: 'HR', text: 'Chcielibyśmy porozmawiać.', tone: 'speech' },
    { speaker: 'KIEROWNIK', text: 'Usiądź.', tone: 'speech' },
    { speaker: 'BOHATER', text: '...', tone: 'speech' },
    { speaker: 'GAME OVER', text: 'KONIEC L4', tone: 'warning' },
  ];
  return [
    { speaker: 'ZUS', text: 'Proszę czekać na decyzję.', tone: 'speech' },
    { speaker: 'BOHATER', text: 'Ile?', tone: 'speech' },
    { speaker: 'ZUS', text: 'Tak.', tone: 'speech' },
    { speaker: 'KONIEC', text: '...', tone: 'system' },
  ];
}

function uiStyle(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: UI_FONT_FAMILY, fontSize: `${fontSize}px`, fontStyle: 'bold', color, stroke: '#02070b', strokeThickness: 3 };
}
