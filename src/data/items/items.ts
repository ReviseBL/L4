import type { ItemDefinition } from '../../domain/items/item-types';
import { CARRY_TEXTURES } from '../art/round4-art';

const sprite = (texture: { key: string }) => ({ key: texture.key });

export const itemDefinitions = [
  {
    id: 'medicine',
    displayName: 'LEKI',
    description: 'Pakiet leków na wszelki wypadek.',
  },
  {
    id: 'milk',
    displayName: 'MLEKO',
    description: 'Jedna niewinnie wyglądająca butelka mleka.',
  },
  {
    id: 'coffee',
    displayName: 'KAWA',
    description: 'Kawa na wynos. Nadal ciepła, mimo planowania trasy patrolu.',
    spillable: { sprintDrainPerSecond: 0.22 },
    carryVisual: { label: 'KAWA', color: 0xd4a373, size: 'small', sprite: sprite(CARRY_TEXTURES.coffee) },
  },
  {
    id: 'package',
    displayName: 'PACZKA',
    description: 'Generyczna paczka z automatu bez żadnego prawdziwego logo.',
    carryVisual: { label: 'PACZKA', color: 0xc08552, sprite: sprite(CARRY_TEXTURES.parcelSmall) },
  },
  {
    id: 'nozzle-0-6',
    displayName: 'DYSZA 0,6 MM',
    description: 'Mniejsza precyzja, większe ambicje i szybsze drukowanie.',
  },
  {
    id: 'petg-spool',
    displayName: 'SZPULA PETG',
    description: 'Ciężka paczka z bardzo ważnym tworzywem do jeszcze ważniejszego wydruku.',
    sprintMultiplier: 0.86,
    unavailableHideSpotIds: ['hedge-hide', 'parking-hide', 'garden-west-hide', 'garden-east-hide', 'pharmacy-bush'],
    heavyCarry: { walkMultiplier: 0.75 },
    carryVisual: { label: 'PETG', color: 0x2a9d8f, sprite: sprite(CARRY_TEXTURES.spoolTeal) },
  },
  {
    id: 'usb-c-cable',
    displayName: 'KABEL USB-C',
    description: 'Nowy kabel do setupu. Ten poprzedni był bardziej taśmą niż kablem.',
  },
  {
    id: 'pla-orange-spool',
    displayName: 'PLA POMARAŃCZOWY',
    description: 'Nowy kolor, którego absolutnie nie dało się nie kupić.',
    sprintMultiplier: 0.94,
    heavyCarry: { walkMultiplier: 0.8 },
    carryVisual: { label: 'PLA', color: 0xf77f00, sprite: sprite(CARRY_TEXTURES.spoolOrange) },
  },
  {
    id: 'groceries',
    displayName: 'ZAKUPY',
    description: 'Torba codziennych zakupów. Zupełnie niepodejrzana.',
    carryVisual: { label: 'ZAKUPY', color: 0xe9ecef, sprite: sprite(CARRY_TEXTURES.groceries) },
  },
  {
    id: 'large-package',
    displayName: 'DUŻA PACZKA',
    description: 'Paczka o gabarycie, który natychmiast unieważnia dyskrecję.',
    sprintMultiplier: 0.82,
    unavailableHideSpotIds: ['hedge-hide', 'parking-hide', 'garden-west-hide', 'garden-east-hide', 'pharmacy-bush'],
    heavyCarry: { walkMultiplier: 0.68 },
    carryVisual: { label: 'DUŻA', color: 0x9c6644, size: 'large', sprite: sprite(CARRY_TEXTURES.parcelLarge) },
  },
  {
    id: 'asa-black-spool',
    displayName: 'ASA CZARNY',
    description: 'Kolejna absolutnie niezbędna szpula do kolekcji.',
    sprintMultiplier: 0.93,
    heavyCarry: { walkMultiplier: 0.8 },
    carryVisual: { label: 'ASA', color: 0x343a40, sprite: sprite(CARRY_TEXTURES.spoolBlack) },
  },
  {
    id: 'l4-print-filament',
    displayName: 'FILAMENT DO PROJEKTU L4',
    description: 'Duże pudełko materiału na projekt o zdecydowanie nieproporcjonalnej skali.',
    sprintMultiplier: 0.85,
    unavailableHideSpotIds: ['hedge-hide', 'parking-hide', 'garden-west-hide', 'garden-east-hide', 'pharmacy-bush'],
    heavyCarry: { walkMultiplier: 0.7 },
    carryVisual: { label: 'L4 1,7 KG', color: 0xe63946, size: 'large', sprite: sprite(CARRY_TEXTURES.l4Box) },
  },
  {
    id: 'kebab',
    displayName: 'KEBAB',
    description: 'Ostatni spokojny posiłek przed ostatnim miesiącem L4.',
    carryVisual: { label: 'KEBAB', color: 0xf4a261, sprite: sprite(CARRY_TEXTURES.kebab) },
  },
  {
    id: 'tpu-purple-spool',
    displayName: 'TPU FIOLETOWY',
    description: 'Naprawdę ostatnia szpula. Tym razem prawie na pewno.',
    sprintMultiplier: 0.93,
    heavyCarry: { walkMultiplier: 0.8 },
    carryVisual: { label: 'TPU', color: 0x9d4edd, sprite: sprite(CARRY_TEXTURES.spoolPurple) },
  },
  {
    id: 'crossword-newspaper',
    displayName: 'GAZETA Z KRZYŻÓWKAMI',
    description: 'Jedyna w okolicy. Kiosk nad rzeką odkłada ją specjalnie dla Herbiego.',
  },
  {
    id: 'scratch-card',
    displayName: 'ZDRAPKA',
    description: 'Dziś kumulacja. Zdrapać dopiero w domu, z dala od kierownika.',
  },
] as const satisfies readonly ItemDefinition[];
