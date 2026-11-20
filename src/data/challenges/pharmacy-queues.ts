import type {
  PharmacyQueueConfig,
  PharmacyQueueDefinition,
  SeniorDefinition,
  SeniorId,
} from '../../domain/challenges/pharmacy-queue-types';

/** Fictional regulars of the "Na wszelki wypadek" pharmacy. No real drug names. */
export const seniors = {
  halinka: { id: 'halinka', displayName: 'PANI HALINKA', placeholderColor: 0xb5838d, textureKey: 'senior-halinka' },
  zdzislaw: { id: 'zdzislaw', displayName: 'PAN ZDZISŁAW', placeholderColor: 0x7f5539, textureKey: 'senior-zdzislaw' },
  jadzia: { id: 'jadzia', displayName: 'PANI JADZIA', placeholderColor: 0x6d597a, textureKey: 'senior-jadzia' },
} as const satisfies Record<SeniorId, SeniorDefinition>;

const halinkaLines = [
  'Maść końską, syrop z cebulki i coś na stawy.',
  'A ta witamina to ta sama, co w telewizji?',
  'Paragonik poproszę. I torebeczkę. Nie, tę drugą.',
] as const;

const zdzislawLines = [
  'Coś na ciśnienie. Tylko nie te małe tabletki.',
  'I krople do oczu. No te, co zawsze!',
  'Ile?! Za moich czasów to było za darmo…',
] as const;

const jadziaLines = [
  'Ziółka na sen. I coś na pamięć… zapomniałam, na co.',
  'Aaa, już wiem! Plasterki. I krem na odciski.',
  'Drobne mam, proszę poczekać… gdzieś tu były…',
] as const;

export const pharmacyQueues = {
  'm1-pharmacy': {
    id: 'm1-pharmacy',
    customers: [
      { seniorId: 'halinka', lines: halinkaLines, serviceMs: 6_000 },
      { seniorId: 'zdzislaw', lines: zdzislawLines, serviceMs: 6_000 },
    ],
  },
  'm3-pharmacy': {
    id: 'm3-pharmacy',
    customers: [
      { seniorId: 'jadzia', lines: jadziaLines, serviceMs: 6_500 },
      { seniorId: 'halinka', lines: halinkaLines, serviceMs: 6_000 },
      { seniorId: 'zdzislaw', lines: zdzislawLines, serviceMs: 6_000 },
    ],
  },
} as const satisfies Record<string, PharmacyQueueDefinition>;

export type PharmacyQueueId = keyof typeof pharmacyQueues;

/** Positions inside the pharmacy (door at the top, counter in the middle). */
export const pharmacyQueueConfig = {
  lineMs: 2_100,
  playerZoneRadius: 34,
  spots: [
    { x: 780, y: 1118 },
    { x: 838, y: 1104 },
    { x: 890, y: 1090 },
  ],
  playerSpot: { x: 905, y: 1062 },
  exit: { x: 780, y: 1030 },
} as const satisfies PharmacyQueueConfig;

export function getPharmacyQueue(id: string): PharmacyQueueDefinition | null {
  return (pharmacyQueues as Record<string, PharmacyQueueDefinition>)[id] ?? null;
}
