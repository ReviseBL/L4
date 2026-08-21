import { describe, expect, it } from 'vitest';
import { itemDefinitions } from '../src/data/items/items';
import { verticalSliceMissions } from '../src/data/missions/vertical-slice-missions';
import { worldInteractionTargets } from '../src/data/world/interaction-targets';
import type { MissionEffect } from '../src/domain/missions/mission-types';
import type { StorageLike } from '../src/domain/game-state/game-state-types';
import { SaveGameService } from '../src/services/save-game-service';
import { GameState } from '../src/state/game-state';
import { ActionInputRouter } from '../src/systems/action-input-router';
import { InteractionSystem } from '../src/systems/interaction-system';
import { InventorySystem } from '../src/systems/inventory-system';
import { MissionSystem } from '../src/systems/mission-system';

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  public removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('M2-03 nozzle regression', () => {
  it('selects the mission offer when the nozzle and USB-C zones overlap', () => {
    const interactions = new InteractionSystem(worldInteractionTargets);
    const mission = new MissionSystem(verticalSliceMissions);
    mission.startAt('m2-nozzle-run', 1, { nowMs: 0, suspicion: 0 });

    const defaultTarget = interactions.findNearby(1785, 290);
    const missionTargetId = mission.getCurrentInteractionTargetId();
    const selectedTarget = interactions.findNearby(1785, 290, missionTargetId);

    expect(defaultTarget?.id).toBe('usb-c-shelf');
    expect(missionTargetId).toBe('nozzle-shelf');
    expect(selectedTarget?.id).toBe('nozzle-shelf');
    expect(mission.getInteractionPrompt(selectedTarget?.id ?? '')).toBe('[E] KUP DYSZĘ 0,6 MM');
  });

  it('requires a new E action after dialogue, purchases once, survives reload and installs permanently', () => {
    const storage = new MemoryStorage();
    const save = new SaveGameService(storage);
    const state = new GameState();
    const inventory = new InventorySystem(itemDefinitions);
    const interactions = new InteractionSystem(worldInteractionTargets);
    const mission = new MissionSystem(verticalSliceMissions);
    const input = new ActionInputRouter();
    mission.startAt('m2-nozzle-run', 1, { nowMs: 0, suspicion: 0 });

    const dialogueOwner = input.resolve({
      dialogueActive: true,
      summaryVisible: false,
      monthTransitionVisible: false,
    });
    expect(dialogueOwner).toBe('DIALOGUE');

    const gameplayOwner = input.resolve({
      dialogueActive: false,
      summaryVisible: false,
      monthTransitionVisible: false,
    });
    expect(gameplayOwner).toBe('GAMEPLAY');

    const nozzleTarget = interactions.interact(
      1785,
      290,
      mission.getCurrentInteractionTargetId(),
    );
    expect(nozzleTarget?.target.id).toBe('nozzle-shelf');

    const purchase = mission.handleEvent(
      { type: 'interaction', targetId: nozzleTarget?.target.id ?? '' },
      { nowMs: 1_000, suspicion: 0 },
    );
    applyDurableEffects(purchase.effects, inventory, state);
    expect(inventory.getQuantities()).toEqual({ 'nozzle-0-6': 1 });
    expect(mission.getCurrentObjectiveText()).toBe('Wróć do mieszkania i zainstaluj dyszę w drukarce.');

    const duplicatePurchase = mission.handleEvent(
      { type: 'interaction', targetId: 'nozzle-shelf' },
      { nowMs: 1_001, suspicion: 0 },
    );
    expect(duplicatePurchase.matched).toBe(false);
    expect(inventory.getQuantities()).toEqual({ 'nozzle-0-6': 1 });

    const progressAfterPurchase = mission.getProgress();
    state.setMissionProgress(progressAfterPurchase?.missionId ?? null, progressAfterPurchase?.stepIndex ?? 0);
    state.setInventory(inventory.getQuantities());
    save.saveGame(state);

    const reloadedAfterPurchase = save.loadGame();
    expect(reloadedAfterPurchase.getSnapshot()).toMatchObject({
      currentMissionId: 'm2-nozzle-run',
      currentMissionStepIndex: 2,
      inventory: { 'nozzle-0-6': 1 },
    });

    const restoredMission = new MissionSystem(verticalSliceMissions);
    restoredMission.startAt(
      reloadedAfterPurchase.getCurrentMissionId() ?? '',
      reloadedAfterPurchase.getCurrentMissionStepIndex(),
      { nowMs: 2_000, suspicion: 0 },
    );
    const printerTarget = interactions.interact(
      155,
      200,
      restoredMission.getCurrentInteractionTargetId(),
    );
    expect(printerTarget?.target.id).toBe('home-printer');
    expect(restoredMission.getInteractionPrompt('home-printer')).toBe('[E] ZAINSTALUJ DYSZĘ 0,6 MM');

    const install = restoredMission.handleEvent(
      { type: 'interaction', targetId: printerTarget?.target.id ?? '' },
      { nowMs: 3_000, suspicion: 0 },
    );
    applyDurableEffects(install.effects, inventory, reloadedAfterPurchase);
    expect(install.summary).toMatchObject({ missionId: 'm2-nozzle-run', daysPassed: 10 });
    expect(inventory.getQuantities()).toEqual({});

    reloadedAfterPurchase.setInventory(inventory.getQuantities());
    reloadedAfterPurchase.completeMission('m2-nozzle-run', 'm3-medicine-run');
    save.saveGame(reloadedAfterPurchase);

    const reloadedAfterInstall = save.loadGame().getSnapshot();
    expect(reloadedAfterInstall.currentMissionId).toBe('m3-medicine-run');
    expect(reloadedAfterInstall.completedMissionIds).toContain('m2-nozzle-run');
    expect(reloadedAfterInstall.inventory).toEqual({});
    expect(reloadedAfterInstall.home.deskItemIds).toContain('nozzle-0-6-installed');
  });

  it.each([
    ['filament-run', 'filament-shelf', 'petg-spool'],
    ['m2-nozzle-run', 'nozzle-shelf', 'nozzle-0-6'],
    ['m3-orange-filament-run', 'orange-filament-shelf', 'pla-orange-spool'],
    ['m4-asa-filament-run', 'asa-filament-shelf', 'asa-black-spool'],
    ['m5-l4-project-run', 'l4-filament-pallet', 'l4-print-filament'],
    ['m6-final-spool-run', 'tpu-filament-shelf', 'tpu-purple-spool'],
  ] as const)('keeps the 3D shop offer for %s mapped to %s', (missionId, targetId, itemId) => {
    const definition = verticalSliceMissions.find((candidate) => candidate.id === missionId);
    const purchaseStep = definition?.steps.find(
      (step) => step.trigger.type === 'interaction' && step.trigger.targetId === targetId,
    );
    const target = worldInteractionTargets.find((candidate) => candidate.id === targetId);

    expect(target).toBeDefined();
    expect(purchaseStep?.effects).toContainEqual({ type: 'add-item', itemId });

    const interactions = new InteractionSystem(worldInteractionTargets);
    expect(interactions.findNearby(target?.x ?? 0, target?.y ?? 0, targetId)?.id).toBe(targetId);
  });
});

function applyDurableEffects(
  effects: readonly MissionEffect[],
  inventory: InventorySystem,
  state: GameState,
): void {
  for (const effect of effects) {
    if (effect.type === 'add-item') inventory.add(effect.itemId, effect.quantity);
    if (effect.type === 'remove-item') inventory.remove(effect.itemId, effect.quantity);
    if (effect.type === 'add-desk-item') state.addDeskItem(effect.itemId);
  }
}
