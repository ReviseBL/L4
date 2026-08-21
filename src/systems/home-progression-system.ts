import type { HomeProgressionStateData } from '../domain/game-state/game-state-types';
import type {
  HomeUnlockCondition,
  HomeVisualDefinition,
} from '../domain/home/home-progression-types';
import type { GameState } from '../state/game-state';

export class HomeProgressionSystem {
  public constructor(
    private readonly gameState: GameState,
    private readonly visualDefinitions: readonly HomeVisualDefinition[],
  ) {
    validateVisualDefinitions(visualDefinitions);
  }

  public addFilamentSpool(spoolId: string): void {
    this.gameState.addFilamentSpool(spoolId);
  }

  public completePrint(printJobId: string): void {
    this.gameState.completePrint(printJobId);
  }

  public addDeskItem(itemId: string): void {
    this.gameState.addDeskItem(itemId);
  }

  public reset(): void {
    this.gameState.resetHomeProgression();
  }

  public getVisibleDefinitions(): readonly HomeVisualDefinition[] {
    const snapshot = this.gameState.getSnapshot();
    return this.visualDefinitions.filter((definition) =>
      conditionMatches(definition.unlock, snapshot.home, snapshot.completedMissionIds, snapshot.currentMonth),
    );
  }
}

function conditionMatches(
  condition: HomeUnlockCondition,
  home: HomeProgressionStateData,
  completedMissionIds: readonly string[],
  currentMonth: number,
): boolean {
  switch (condition.type) {
    case 'filament-spool-owned':
      return home.filamentSpoolIds.includes(condition.spoolId);
    case 'print-completed':
      return home.completedPrintIds.includes(condition.printJobId);
    case 'desk-item-owned':
      return home.deskItemIds.includes(condition.itemId);
    case 'decoration-owned':
      return home.decorationIds.includes(condition.decorationId);
    case 'mission-completed':
      return completedMissionIds.includes(condition.missionId);
    case 'campaign-month-at-least':
      return currentMonth >= condition.month;
  }
}

function validateVisualDefinitions(definitions: readonly HomeVisualDefinition[]): void {
  const ids = new Set<string>();

  for (const definition of definitions) {
    if (!definition.id || !definition.label || definition.width <= 0 || definition.height <= 0) {
      throw new Error(`Invalid home visual definition: ${definition.id || '<missing id>'}.`);
    }
    if (ids.has(definition.id)) {
      throw new Error(`Duplicate home visual id: ${definition.id}.`);
    }
    ids.add(definition.id);
  }
}
