import { describe, expect, it } from 'vitest';
import { campaignMonths } from '../src/data/campaign/campaign-months';
import { itemDefinitions } from '../src/data/items/items';
import { verticalSliceMissions } from '../src/data/missions/vertical-slice-missions';
import type { MissionEffect } from '../src/domain/missions/mission-types';
import { GameState } from '../src/state/game-state';
import { CampaignSystem } from '../src/systems/campaign-system';
import { InventorySystem } from '../src/systems/inventory-system';
import { MissionSystem } from '../src/systems/mission-system';

const interactionTargetIds = new Set([
  'home-printer',
  'grocery-counter',
  'filament-shelf',
  'orange-filament-shelf',
  'asa-filament-shelf',
  'tpu-filament-shelf',
  'l4-filament-pallet',
  'usb-c-shelf',
  'nozzle-shelf',
  'parcel-locker',
  'pharmacy-counter',
  'kebab-counter',
  'riverside-kiosk',
]);

describe('gameplay beta campaign data', () => {
  it('completes all 17 mission flows in order and reaches the finale checkpoint at day 179', () => {
    const gameState = new GameState();
    const campaign = new CampaignSystem(gameState, campaignMonths);
    const inventory = new InventorySystem(itemDefinitions);
    const missions = new MissionSystem(verticalSliceMissions);
    let nowMs = 0;
    let start = missions.startFirst({ nowMs, suspicion: 0 });

    for (const definition of verticalSliceMissions) {
      expect(start.mission.id).toBe(definition.id);
      applyEffects(start.effects, inventory, gameState);
      let finalSummary = null;

      for (const step of definition.steps) {
        nowMs += 1_000;
        const result = missions.handleEvent(step.trigger, { nowMs, suspicion: gameState.getSnapshot().suspicion });
        expect(result.matched, `${definition.id}/${step.id}`).toBe(true);
        applyEffects(result.effects, inventory, gameState);
        finalSummary = result.summary ?? finalSummary;
      }

      expect(finalSummary?.missionId).toBe(definition.id);
      campaign.advanceDays(definition.daysPassed);
      gameState.completeMission(definition.id, missions.getNextMissionId());
      start = missions.startNext({ nowMs: ++nowMs, suspicion: gameState.getSnapshot().suspicion }) ?? start;
    }

    const snapshot = gameState.getSnapshot();
    expect(snapshot.currentL4Day).toBe(179);
    expect(snapshot.currentMonth).toBe(6);
    expect(snapshot.completedMissionIds).toHaveLength(17);
    expect(inventory.getQuantities()).toEqual({});
    expect(snapshot.home.filamentSpoolIds).toEqual(['petg', 'pla-orange', 'asa-black', 'tpu-purple']);
    expect(snapshot.home.deskItemIds).toEqual(['nozzle-0-6-installed', 'usb-c-cable-installed']);
    expect(snapshot.home.completedPrintIds).toEqual(['cable-holder', 'l4-400']);
    expect(snapshot.home.printProjectStates['l4-400']).toBe('COMPLETED');
  });

  it('references only known interaction targets and inventory items', () => {
    const itemIds = new Set<string>(itemDefinitions.map((item) => item.id));
    for (const mission of verticalSliceMissions) {
      for (const step of mission.steps) {
        if (step.trigger.type === 'interaction') {
          expect(interactionTargetIds.has(step.trigger.targetId), `${mission.id}/${step.id}`).toBe(true);
        }
      }
      for (const effect of [...(mission.intro ?? []), ...mission.steps.flatMap((step) => step.effects ?? []), ...(mission.completionEffects ?? [])]) {
        if (effect.type === 'add-item' || effect.type === 'remove-item') {
          expect(itemIds.has(effect.itemId), `${mission.id}/${effect.itemId}`).toBe(true);
        }
      }
    }
  });
});

function applyEffects(effects: readonly MissionEffect[], inventory: InventorySystem, gameState: GameState): void {
  for (const effect of effects) {
    switch (effect.type) {
      case 'add-item': inventory.add(effect.itemId, effect.quantity); break;
      case 'remove-item':
        expect(inventory.has(effect.itemId, effect.quantity)).toBe(true);
        inventory.remove(effect.itemId, effect.quantity);
        break;
      case 'start-print': gameState.startPrint(effect.printJobId); break;
      case 'complete-print': gameState.completePrint(effect.printJobId); break;
      case 'add-filament-spool': gameState.addFilamentSpool(effect.spoolId); break;
      case 'add-desk-item': gameState.addDeskItem(effect.itemId); break;
      case 'increment-campaign-stat': gameState.incrementCampaignStat(effect.stat, effect.amount); break;
      case 'set-print-project-state': gameState.setPrintProjectState(effect.printJobId, effect.state); break;
      case 'show-sequence': break;
    }
  }
}
