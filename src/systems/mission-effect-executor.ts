import type { MissionEffect } from '../domain/missions/mission-types';
import type { PlayerController } from '../entities/player/player-controller';
import type { Player } from '../entities/player/player';
import type { Printer3DView } from '../entities/interactables/printer-3d-view';
import type { HomeProgressionView } from '../entities/interactables/home-progression-view';
import type { GameState } from '../state/game-state';
import type { HidingSystem } from './hiding-system';
import type { InventorySystem } from './inventory-system';
import type { Printer3DSystem } from './printer-3d-system';
import type { HomeProgressionSystem } from './home-progression-system';
import type { DialogueSystem } from './dialogue-system';
import type { MinigameRunner } from '../domain/minigames/minigame-types';

export class MissionEffectExecutor {
  private dialogueSequenceNumber = 0;

  public constructor(
    private readonly inventory: InventorySystem,
    private readonly printer: Printer3DSystem,
    private readonly printerView: Printer3DView,
    private readonly homeProgression: HomeProgressionSystem,
    private readonly homeProgressionView: HomeProgressionView,
    private readonly gameState: GameState,
    private readonly dialogueSystem: DialogueSystem,
    private readonly player: Player,
    private readonly playerController: PlayerController,
    private readonly hidingSystem: HidingSystem,
    private readonly minigameRunner: MinigameRunner | null = null,
  ) {
    this.synchronizeCarryState();
    this.synchronizeHomeState();

    const currentJob = this.printer.getCurrentJob();
    if (currentJob) {
      this.printerView.startPrinting(currentJob);
    }
  }

  public apply(effects: readonly MissionEffect[], onComplete: () => void = () => undefined): void {
    this.applyAtIndex(effects, 0, onComplete);
  }

  private applyAtIndex(effects: readonly MissionEffect[], index: number, onComplete: () => void): void {
    const effect = effects[index];

    if (!effect) {
      onComplete();
      return;
    }

    const continueWithNext = () => this.applyAtIndex(effects, index + 1, onComplete);

    switch (effect.type) {
      case 'add-item':
        this.inventory.add(effect.itemId, effect.quantity);
        this.synchronizeCarryState();
        continueWithNext();
        break;
      case 'remove-item':
        this.inventory.remove(effect.itemId, effect.quantity);
        this.synchronizeCarryState();
        continueWithNext();
        break;
      case 'start-print': {
        const job = this.printer.startPrint(effect.printJobId);
        this.gameState.startPrint(effect.printJobId);
        this.printerView.startPrinting(job);
        continueWithNext();
        break;
      }
      case 'complete-print': {
        const job = this.printer.completePrint(effect.printJobId);
        this.homeProgression.completePrint(effect.printJobId);
        this.printerView.completePrinting(job);
        this.synchronizeHomeState();
        continueWithNext();
        break;
      }
      case 'add-filament-spool':
        this.homeProgression.addFilamentSpool(effect.spoolId);
        this.synchronizeHomeState();
        continueWithNext();
        break;
      case 'add-desk-item':
        this.homeProgression.addDeskItem(effect.itemId);
        this.synchronizeHomeState();
        continueWithNext();
        break;
      case 'increment-campaign-stat':
        this.gameState.incrementCampaignStat(effect.stat, effect.amount);
        continueWithNext();
        break;
      case 'set-print-project-state':
        this.gameState.setPrintProjectState(effect.printJobId, effect.state);
        this.synchronizeHomeState();
        continueWithNext();
        break;
      case 'show-sequence':
        this.dialogueSequenceNumber += 1;
        this.dialogueSystem.showSequence(
          {
            id: `mission-sequence-${this.dialogueSequenceNumber}`,
            pauseWorld: true,
            lockPlayerMovement: true,
            lines: effect.entries,
          },
          { onComplete: continueWithNext },
        );
        break;
      case 'play-minigame':
        // Without a runner (tests, headless tools) the minigame counts as solved.
        if (this.minigameRunner) this.minigameRunner.play(effect.minigame, () => continueWithNext());
        else continueWithNext();
        break;
    }
  }

  private synchronizeCarryState(): void {
    const carriedItem = this.inventory.getVisibleCarriedItem();
    this.player.setCarriedItemVisual(carriedItem?.carryVisual ?? null);
    this.playerController.setSprintSpeedMultiplier(this.inventory.getSprintMultiplier());
    this.playerController.setCarryMovement(this.inventory.getCarryMovement());
    this.hidingSystem.setUnavailableSpotIds(this.inventory.getUnavailableHideSpotIds());
  }

  private synchronizeHomeState(): void {
    this.homeProgressionView.synchronize(this.homeProgression.getVisibleDefinitions());
  }
}
