import type { TimingVariantConfig, TimingVariantId } from '../../domain/minigames/minigame-types';

export const timingVariants = {
  nozzle: {
    id: 'nozzle',
    title: 'DOKRĘĆ DYSZĘ 0,6 MM',
    instruction: '[E] zatrzymaj klucz w zielonym polu',
    needleCyclesPerSecond: 0.75,
    zoneCenter: 0.62,
    zoneWidth: 0.12,
    zoneGrowthPerMiss: 0.03,
    maxZoneWidth: 0.26,
    requiredHits: 1,
  },
  'print-removal': {
    id: 'print-removal',
    title: 'ODKLEJ WYDRUK L4 400%',
    instruction: '[E] podważ szpachelką w zielonym polu (3 razy)',
    needleCyclesPerSecond: 0.9,
    zoneCenter: 0.5,
    zoneWidth: 0.14,
    zoneGrowthPerMiss: 0.025,
    maxZoneWidth: 0.26,
    requiredHits: 3,
  },
} as const satisfies Record<TimingVariantId, TimingVariantConfig>;

export const timingFeedback = {
  nozzle: {
    under: ['Za słabo. Będzie kapać.', 'Luźno jak moje L4.'],
    over: ['KRRRK! Gwint trzeszczy.', 'Za mocno! Prawie po gwincie.'],
    hit: 'Idealnie. Ani za mocno, ani za słabo.',
    complete: 'Dysza siedzi. Teraz to będzie drukować.',
  },
  'print-removal': {
    under: ['Nie drgnęło. Trzyma jak ZUS.', 'Za lekko. Wydruk się śmieje.'],
    over: ['Szpachelka się ześlizgnęła!', 'Ostrożnie, to stół, nie deska do krojenia.'],
    hit: 'Puszcza! Jeszcze trochę…',
    complete: 'L4 400% odklejone. Piękne. Bezużyteczne. Moje.',
  },
} as const satisfies Record<TimingVariantId, {
  under: readonly string[];
  over: readonly string[];
  hit: string;
  complete: string;
}>;
