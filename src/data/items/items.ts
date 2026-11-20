import type { ItemDefinition } from '../../domain/items/item-types';

/** Grey spool art tinted with the filament colour. */
const SPOOL_SPRITE = { key: 'world-spool-28x28', tintWithColor: true, scale: 0.9 } as const;

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
  },
  {
    id: 'package',
    displayName: 'PACZKA',
    description: 'Generyczna paczka z automatu bez żadnego prawdziwego logo.',
    carryVisual: { label: 'PACZKA', color: 0xc08552 },
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
    unavailableHideSpotIds: ['hedge-hide', 'parking-hide', 'garden-west-hide', 'garden-east-hide'],
    heavyCarry: { walkMultiplier: 0.75 },
    carryVisual: { label: 'PETG', color: 0x2a9d8f, sprite: SPOOL_SPRITE },
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
    carryVisual: { label: 'PLA', color: 0xf77f00, sprite: SPOOL_SPRITE },
  },
  {
    id: 'groceries',
    displayName: 'ZAKUPY',
    description: 'Torba codziennych zakupów. Zupełnie niepodejrzana.',
  },
  {
    id: 'large-package',
    displayName: 'DUŻA PACZKA',
    description: 'Paczka o gabarycie, który natychmiast unieważnia dyskrecję.',
    sprintMultiplier: 0.82,
    unavailableHideSpotIds: ['hedge-hide', 'parking-hide', 'garden-west-hide', 'garden-east-hide'],
    heavyCarry: { walkMultiplier: 0.68 },
    carryVisual: { label: 'DUŻA', color: 0x9c6644, size: 'large' },
  },
  {
    id: 'asa-black-spool',
    displayName: 'ASA CZARNY',
    description: 'Kolejna absolutnie niezbędna szpula do kolekcji.',
    sprintMultiplier: 0.93,
    heavyCarry: { walkMultiplier: 0.8 },
    carryVisual: { label: 'ASA', color: 0x343a40, sprite: SPOOL_SPRITE },
  },
  {
    id: 'l4-print-filament',
    displayName: 'FILAMENT DO PROJEKTU L4',
    description: 'Duże pudełko materiału na projekt o zdecydowanie nieproporcjonalnej skali.',
    sprintMultiplier: 0.85,
    unavailableHideSpotIds: ['hedge-hide', 'parking-hide', 'garden-west-hide', 'garden-east-hide'],
    heavyCarry: { walkMultiplier: 0.7 },
    carryVisual: { label: 'L4 1,7 KG', color: 0xe63946, size: 'large' },
  },
  {
    id: 'kebab',
    displayName: 'KEBAB',
    description: 'Ostatni spokojny posiłek przed ostatnim miesiącem L4.',
    carryVisual: { label: 'KEBAB', color: 0xf4a261 },
  },
  {
    id: 'tpu-purple-spool',
    displayName: 'TPU FIOLETOWY',
    description: 'Naprawdę ostatnia szpula. Tym razem prawie na pewno.',
    sprintMultiplier: 0.93,
    heavyCarry: { walkMultiplier: 0.8 },
    carryVisual: { label: 'TPU', color: 0x9d4edd, sprite: SPOOL_SPRITE },
  },
] as const satisfies readonly ItemDefinition[];
