import { describe, expect, it } from 'vitest';
import { verticalSliceMissions } from '../src/data/missions/vertical-slice-missions';
import { MissionSystem } from '../src/systems/mission-system';

describe('vertical slice mission data', () => {
  it('completes the month-one medicine, milk and filament loops in order', () => {
    const system = new MissionSystem(verticalSliceMissions);

    system.startFirst({ nowMs: 0, suspicion: 0 });
    const medicinePurchase = system.handleEvent(
      { type: 'interaction', targetId: 'pharmacy-counter' },
      { nowMs: 1_000, suspicion: 0 },
    );
    expect(medicinePurchase.effects).toContainEqual({ type: 'add-item', itemId: 'medicine' });
    const medicineComplete = system.handleEvent(
      { type: 'area-entered', areaId: 'home' },
      { nowMs: 5_000, suspicion: 0 },
    );
    expect(medicineComplete.summary?.missionId).toBe('medicine-run');

    system.startNext({ nowMs: 6_000, suspicion: 0 });
    const milkPurchase = system.handleEvent(
      { type: 'interaction', targetId: 'grocery-counter' },
      { nowMs: 8_000, suspicion: 0 },
    );
    expect(milkPurchase.effects).toContainEqual({ type: 'add-item', itemId: 'milk' });
    const milkComplete = system.handleEvent(
      { type: 'area-entered', areaId: 'home' },
      { nowMs: 12_000, suspicion: 0 },
    );
    expect(milkComplete.summary?.detectionCount).toBe(0);

    system.startNext({ nowMs: 13_000, suspicion: 0 });
    const printerIntro = system.handleEvent(
      { type: 'interaction', targetId: 'home-printer' },
      { nowMs: 14_000, suspicion: 0 },
    );
    expect(printerIntro.effects[0]).toMatchObject({ type: 'show-sequence' });

    const filamentPurchase = system.handleEvent(
      { type: 'interaction', targetId: 'filament-shelf' },
      { nowMs: 20_000, suspicion: 0 },
    );
    expect(filamentPurchase.effects).toContainEqual({ type: 'add-item', itemId: 'petg-spool' });

    const filamentComplete = system.handleEvent(
      { type: 'interaction', targetId: 'home-printer' },
      { nowMs: 30_000, suspicion: 5 },
    );
    expect(filamentComplete.effects).toContainEqual({
      type: 'start-print',
      printJobId: 'cable-holder',
    });
    expect(filamentComplete.effects).toContainEqual({
      type: 'add-filament-spool',
      spoolId: 'petg',
    });
    expect(filamentComplete.effects.at(-1)).toEqual({
      type: 'complete-print',
      printJobId: 'cable-holder',
    });
    expect(filamentComplete.summary).toMatchObject({
      missionId: 'filament-run',
      suspicionGained: 5,
      daysPassed: 4,
    });
    expect(system.hasNextMission()).toBe(true);
  });

  it('completes all three data-defined month-two mission loops', () => {
    const system = new MissionSystem(verticalSliceMissions);
    system.startAt('m2-coffee-run', 0, { nowMs: 0, suspicion: 10 });

    const coffee = system.handleEvent(
      { type: 'interaction', targetId: 'grocery-counter' },
      { nowMs: 1_000, suspicion: 10 },
    );
    expect(coffee.effects).toContainEqual({ type: 'add-item', itemId: 'coffee' });
    expect(
      system.handleEvent(
        { type: 'area-entered', areaId: 'home' },
        { nowMs: 5_000, suspicion: 10 },
      ).summary?.daysPassed,
    ).toBe(10);

    system.startNext({ nowMs: 6_000, suspicion: 10 });
    const parcel = system.handleEvent(
      { type: 'interaction', targetId: 'parcel-locker' },
      { nowMs: 9_000, suspicion: 10 },
    );
    expect(parcel.completedStepId).toBe('pickup-package');
    expect(parcel.effects).toContainEqual({ type: 'add-item', itemId: 'package' });
    expect(
      system.handleEvent(
        { type: 'area-entered', areaId: 'home' },
        { nowMs: 15_000, suspicion: 10 },
      ).summary?.missionId,
    ).toBe('m2-package-run');

    system.startNext({ nowMs: 16_000, suspicion: 10 });
    system.handleEvent(
      { type: 'interaction', targetId: 'home-printer' },
      { nowMs: 17_000, suspicion: 10 },
    );
    const nozzle = system.handleEvent(
      { type: 'interaction', targetId: 'nozzle-shelf' },
      { nowMs: 20_000, suspicion: 10 },
    );
    expect(nozzle.effects).toContainEqual({ type: 'add-item', itemId: 'nozzle-0-6' });
    const complete = system.handleEvent(
      { type: 'interaction', targetId: 'home-printer' },
      { nowMs: 28_000, suspicion: 10 },
    );
    expect(complete.effects).toContainEqual({ type: 'remove-item', itemId: 'nozzle-0-6' });
    expect(complete.effects).toContainEqual({
      type: 'add-desk-item',
      itemId: 'nozzle-0-6-installed',
    });
    expect(complete.summary).toMatchObject({ missionId: 'm2-nozzle-run', daysPassed: 10 });
    expect(system.hasNextMission()).toBe(true);
  });

  it('completes all three month-three loops and persists their data effects', () => {
    const system = new MissionSystem(verticalSliceMissions);
    system.startAt('m3-medicine-run', 0, { nowMs: 0, suspicion: 20 });
    system.handleEvent({ type: 'interaction', targetId: 'pharmacy-counter' }, { nowMs: 1_000, suspicion: 20 });
    expect(system.handleEvent({ type: 'area-entered', areaId: 'home' }, { nowMs: 2_000, suspicion: 20 }).summary?.daysPassed).toBe(10);

    system.startNext({ nowMs: 3_000, suspicion: 20 });
    const cable = system.handleEvent({ type: 'interaction', targetId: 'usb-c-shelf' }, { nowMs: 4_000, suspicion: 20 });
    expect(cable.effects).toContainEqual({ type: 'add-item', itemId: 'usb-c-cable' });
    const cableHome = system.handleEvent({ type: 'area-entered', areaId: 'home' }, { nowMs: 5_000, suspicion: 20 });
    expect(cableHome.effects).toContainEqual({ type: 'add-desk-item', itemId: 'usb-c-cable-installed' });

    system.startNext({ nowMs: 6_000, suspicion: 20 });
    const filament = system.handleEvent({ type: 'interaction', targetId: 'orange-filament-shelf' }, { nowMs: 7_000, suspicion: 20 });
    expect(filament.effects).toContainEqual({ type: 'add-item', itemId: 'pla-orange-spool' });
    const done = system.handleEvent({ type: 'interaction', targetId: 'home-printer' }, { nowMs: 8_000, suspicion: 20 });
    expect(done.effects).toContainEqual({ type: 'play-minigame', minigame: { kind: 'threading', variant: 'pla' } });
    expect(done.effects).toContainEqual({ type: 'add-filament-spool', spoolId: 'pla-orange' });
    expect(done.summary).toMatchObject({ missionId: 'm3-orange-filament-run', daysPassed: 10 });
    expect(system.hasNextMission()).toBe(true);
  });

  it('completes all three month-four loops and awards the permanent ASA spool', () => {
    const system = new MissionSystem(verticalSliceMissions);
    system.startAt('m4-shopping-run', 0, { nowMs: 0, suspicion: 20 });
    expect(system.handleEvent({ type: 'interaction', targetId: 'grocery-counter' }, { nowMs: 1, suspicion: 20 }).effects).toContainEqual({ type: 'add-item', itemId: 'groceries' });
    expect(system.handleEvent({ type: 'area-entered', areaId: 'home' }, { nowMs: 2, suspicion: 20 }).summary?.daysPassed).toBe(10);
    system.startNext({ nowMs: 3, suspicion: 20 });
    expect(system.handleEvent({ type: 'interaction', targetId: 'parcel-locker' }, { nowMs: 4, suspicion: 20 }).effects).toContainEqual({ type: 'add-item', itemId: 'large-package' });
    system.handleEvent({ type: 'area-entered', areaId: 'home' }, { nowMs: 5, suspicion: 20 });
    system.startNext({ nowMs: 6, suspicion: 20 });
    expect(system.handleEvent({ type: 'interaction', targetId: 'asa-filament-shelf' }, { nowMs: 7, suspicion: 20 }).effects).toContainEqual({ type: 'add-item', itemId: 'asa-black-spool' });
    const completed = system.handleEvent({ type: 'interaction', targetId: 'home-printer' }, { nowMs: 8, suspicion: 20 });
    expect(completed.effects).toContainEqual({ type: 'play-minigame', minigame: { kind: 'threading', variant: 'asa' } });
    expect(completed.effects).toContainEqual({ type: 'add-filament-spool', spoolId: 'asa-black' });
    expect(completed.summary).toMatchObject({ missionId: 'm4-asa-filament-run', daysPassed: 10 });
  });

  it('completes all month-five loops and starts then completes the L4 400% print', () => {
    const system = new MissionSystem(verticalSliceMissions);
    system.startAt('m5-shopping-run', 0, { nowMs: 0, suspicion: 40 });
    system.handleEvent({ type: 'interaction', targetId: 'grocery-counter' }, { nowMs: 1, suspicion: 40 });
    expect(system.handleEvent({ type: 'area-entered', areaId: 'home' }, { nowMs: 2, suspicion: 40 }).summary?.daysPassed).toBe(10);

    const l4 = system.startNext({ nowMs: 3, suspicion: 40 });
    expect(l4?.effects).toContainEqual({ type: 'set-print-project-state', printJobId: 'l4-400', state: 'PLANNED' });
    system.handleEvent({ type: 'interaction', targetId: 'home-printer' }, { nowMs: 4, suspicion: 40 });
    const filament = system.handleEvent({ type: 'interaction', targetId: 'l4-filament-pallet' }, { nowMs: 5, suspicion: 40 });
    expect(filament.effects).toContainEqual({ type: 'add-item', itemId: 'l4-print-filament' });
    expect(filament.effects).toContainEqual({ type: 'set-print-project-state', printJobId: 'l4-400', state: 'MATERIALS_READY' });
    const printing = system.handleEvent({ type: 'interaction', targetId: 'home-printer' }, { nowMs: 6, suspicion: 40 });
    expect(printing.effects).toContainEqual({ type: 'start-print', printJobId: 'l4-400' });
    expect(printing.summary).toMatchObject({ missionId: 'm5-l4-project-run', daysPassed: 10 });

    const kebab = system.startNext({ nowMs: 7, suspicion: 40 });
    expect(kebab?.effects).toContainEqual({ type: 'complete-print', printJobId: 'l4-400' });
    expect(system.handleEvent({ type: 'interaction', targetId: 'kebab-counter' }, { nowMs: 8, suspicion: 40 }).effects).toContainEqual({ type: 'add-item', itemId: 'kebab' });
    expect(system.handleEvent({ type: 'area-entered', areaId: 'home' }, { nowMs: 9, suspicion: 40 }).summary).toMatchObject({ missionId: 'm5-kebab-run', daysPassed: 10 });
    expect(system.hasNextMission()).toBe(true);
  });

  it('completes both month-six stealth missions at day 179 readiness', () => {
    const system = new MissionSystem(verticalSliceMissions);
    const spoolMission = system.startAt('m6-final-spool-run', 0, { nowMs: 0, suspicion: 55 });
    expect(spoolMission.mission.daysPassed).toBe(14);
    const spool = system.handleEvent({ type: 'interaction', targetId: 'tpu-filament-shelf' }, { nowMs: 1, suspicion: 55 });
    expect(spool.effects).toContainEqual({ type: 'add-item', itemId: 'tpu-purple-spool' });
    const spoolHome = system.handleEvent({ type: 'interaction', targetId: 'home-printer' }, { nowMs: 2, suspicion: 55 });
    expect(spoolHome.effects).toContainEqual({ type: 'play-minigame', minigame: { kind: 'threading', variant: 'tpu' } });
    expect(spoolHome.effects).toContainEqual({ type: 'add-filament-spool', spoolId: 'tpu-purple' });
    expect(spoolHome.summary?.daysPassed).toBe(14);

    system.startNext({ nowMs: 3, suspicion: 55 });
    const food = system.handleEvent({ type: 'interaction', targetId: 'kebab-counter' }, { nowMs: 4, suspicion: 55 });
    expect(food.effects).toContainEqual({ type: 'increment-campaign-stat', stat: 'kebabsCollected' });
    const done = system.handleEvent({ type: 'area-entered', areaId: 'home' }, { nowMs: 5, suspicion: 55 });
    expect(done.summary).toMatchObject({ missionId: 'm6-food-run', daysPassed: 14 });
    expect(system.hasNextMission()).toBe(false);
  });
});
