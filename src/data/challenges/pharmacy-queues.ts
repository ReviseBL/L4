import type {
  QueueLine,
  PharmacyQueueConfig,
  PharmacyQueueDefinition,
  SeniorDefinition,
  SeniorId,
} from '../../domain/challenges/pharmacy-queue-types';

/** Behind the counter; real sprite key used once the ChatGPT art exists. */
export const PHARMACIST = { displayName: 'FARMACEUTKA', textureKey: 'npc-pharmacist', placeholderColor: 0xf1faee } as const;

/** Fictional regulars of the "Na wszelki wypadek" pharmacy. No real drug names. */
export const seniors = {
  halinka: { id: 'halinka', displayName: 'PANI HALINKA', placeholderColor: 0xb5838d, textureKey: 'senior-halinka' },
  zdzislaw: { id: 'zdzislaw', displayName: 'PAN ZDZISŁAW', placeholderColor: 0x7f5539, textureKey: 'senior-zdzislaw' },
  jadzia: { id: 'jadzia', displayName: 'PANI JADZIA', placeholderColor: 0x6d597a, textureKey: 'senior-jadzia' },
} as const satisfies Record<SeniorId, SeniorDefinition>;

/** Shorthand for the counter small talk. */
const senior = (text: string): QueueLine => ({ speaker: 'senior', text });
const pharmacist = (text: string): QueueLine => ({ speaker: 'pharmacist', text });

// Deliberately slow: Hubi has to stand there and suffer, in plain sight.
const halinkaLines = [
  senior('Dzień dobry, pani magister! Jak tam wnusia?'),
  pharmacist('Dzień dobry. Dobrze, dziękuję. Co podać?'),
  senior('A to co zawsze. Maść końską i syrop z cebulki.'),
  pharmacist('Maść jest. Syropu z cebulki nie prowadzimy.'),
  senior('Jak to nie? Pani Krysia zawsze miała!'),
  pharmacist('Pani Krysia jest na emeryturze od pięciu lat.'),
  senior('To poproszę paragonik. I torebeczkę. Nie, tę drugą.'),
] as const;

const zdzislawLines = [
  senior('Ja na receptę. Tylko gdzie ja ją dałem…'),
  pharmacist('Może w portfelu?'),
  senior('W portfelu mam zdjęcie wnuka. Chce pani zobaczyć?'),
  pharmacist('Bardzo ładny. A recepta?'),
  senior('Aaa, mam kod w telefonie! Tylko jak się to otwiera…'),
  pharmacist('Proszę mi pokazać… O, jest.'),
  senior('Ile?! Za moich czasów to było za darmo!'),
] as const;

const jadziaLines = [
  senior('Ja tylko po ziółka na sen. I coś na pamięć.'),
  pharmacist('Na pamięć mamy te kapsułki.'),
  senior('A po co ja jeszcze przyszłam… Zapomniałam.'),
  pharmacist('Może plasterki?'),
  senior('O! Plasterki. I krem na odciski. I drożdże.'),
  pharmacist('Drożdże są w sklepie obok.'),
  senior('Drobne mam, proszę poczekać… gdzieś tu były…'),
] as const;

export const pharmacyQueues = {
  'm1-pharmacy': {
    id: 'm1-pharmacy',
    customers: [
      { seniorId: 'halinka', lines: halinkaLines },
      { seniorId: 'zdzislaw', lines: zdzislawLines },
    ],
  },
  'm3-pharmacy': {
    id: 'm3-pharmacy',
    customers: [
      { seniorId: 'jadzia', lines: jadziaLines },
      { seniorId: 'halinka', lines: halinkaLines },
      { seniorId: 'zdzislaw', lines: zdzislawLines },
    ],
  },
} as const satisfies Record<string, PharmacyQueueDefinition>;

export type PharmacyQueueId = keyof typeof pharmacyQueues;

/** Positions inside the pharmacy (door at the top, counter in the middle). */
export const pharmacyQueueConfig = {
  lineMs: 2_400,
  playerZoneRadius: 34,
  spots: [
    { x: 780, y: 1118 },
    { x: 838, y: 1104 },
    { x: 890, y: 1090 },
  ],
  playerSpot: { x: 905, y: 1062 },
  exit: { x: 780, y: 1030 },
  pharmacistSpot: { x: 780, y: 1222 },
} as const satisfies PharmacyQueueConfig;

export function getPharmacyQueue(id: string): PharmacyQueueDefinition | null {
  return (pharmacyQueues as Record<string, PharmacyQueueDefinition>)[id] ?? null;
}
