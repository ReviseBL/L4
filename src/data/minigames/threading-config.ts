import type {
  ThreadingRules,
  ThreadingVariantConfig,
  ThreadingVariantId,
} from '../../domain/minigames/minigame-types';

export const threadingRules = {
  mercyPerMiss: 0.15,
  minimumMercyFactor: 0.35,
  stressTremorBonus: 0.6,
} as const satisfies ThreadingRules;

/** Above this stress level the screen explains why the hands shake more. */
export const THREADING_STRESS_NOTICE = 0.4;

const extruder = { label: 'EKSTRUDER', holeRadius: 7, holeDriftAmplitude: 0, holeDriftSpeed: 0 };

export const threadingVariants = {
  petg: {
    id: 'petg',
    filamentLabel: 'PETG',
    filamentColor: 0x2a9d8f,
    hint: 'Trafiaj końcówką w otwór. Ręce trochę drżą.',
    stages: [extruder],
    tremorAmplitude: 24,
    tremorSpeed: 3,
    steerSpeed: 120,
    steerLimit: 120,
  },
  pla: {
    id: 'pla',
    filamentLabel: 'PLA POMARAŃCZOWY',
    filamentColor: 0xf77f00,
    hint: 'Głowica jeszcze jedzie po starym wydruku. Otwór się przesuwa.',
    stages: [{ ...extruder, holeDriftAmplitude: 46, holeDriftSpeed: 1.3 }],
    tremorAmplitude: 22,
    tremorSpeed: 3,
    steerSpeed: 130,
    steerLimit: 130,
  },
  asa: {
    id: 'asa',
    filamentLabel: 'ASA CZARNY',
    filamentColor: 0x343a40,
    hint: 'ASA śmierdzi. Opary co chwilę zasłaniają otwór.',
    stages: [extruder],
    tremorAmplitude: 26,
    tremorSpeed: 3.2,
    steerSpeed: 120,
    steerLimit: 120,
    fumes: { intervalMs: 3_200, durationMs: 1_700 },
  },
  l4: {
    id: 'l4',
    filamentLabel: 'L4 1,7 KG',
    filamentColor: 0xe63946,
    hint: 'Projekt L4 wymaga dwóch otworów: najpierw ekstruder, potem głowica.',
    stages: [extruder, { label: 'GŁOWICA', holeRadius: 6, holeDriftAmplitude: 0, holeDriftSpeed: 0 }],
    tremorAmplitude: 26,
    tremorSpeed: 3.3,
    steerSpeed: 120,
    steerLimit: 120,
  },
  tpu: {
    id: 'tpu',
    filamentLabel: 'TPU FIOLETOWY',
    filamentColor: 0x9d4edd,
    hint: 'TPU jest gumowe. Końcówka gnie się i spóźnia za ręką.',
    stages: [{ ...extruder, holeRadius: 8 }],
    tremorAmplitude: 22,
    tremorSpeed: 2.6,
    steerSpeed: 120,
    steerLimit: 120,
    flexLagMs: 260,
  },
} as const satisfies Record<ThreadingVariantId, ThreadingVariantConfig>;

/** Rotated on every snap so the comedy does not repeat immediately. */
export const threadingSnapLines = [
  'No pięknie.',
  'Ręce jak galareta.',
  'To nie ja. To filament.',
  'Spokojnie, Hubert. Oddychaj.',
  'Jeszcze raz. Tym razem na serio.',
  'Kto projektuje takie małe dziurki?',
  'Pęknięty. Jak moja cierpliwość.',
] as const;

export const threadingSuccessLines = {
  petg: 'Weszło. Kocham ten dźwięk.',
  pla: 'Pomarańczowy. Idealny.',
  asa: 'Śmierdzi sukcesem.',
  l4: 'Oba otwory. Projekt L4 rusza.',
  tpu: 'Gumowe, ale weszło. Ostatnia. Na pewno.',
} as const satisfies Record<ThreadingVariantId, string>;
