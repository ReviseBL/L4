import type { DocumentChoiceDefinition } from '../../domain/finale/zus-finale-types';

export const zusDocumentChoices = [
  { id: 'certificate', label: 'ZAŚWIADCZENIE', credibilityDelta: 7, correct: true },
  { id: 'treatment-history', label: 'HISTORIA LECZENIA', credibilityDelta: 7, correct: true },
  { id: 'documentation', label: 'DOKUMENTACJA', credibilityDelta: 7, correct: true },
  { id: 'kebab-receipt', label: 'PARAGON ZA KEBABA', credibilityDelta: -5, correct: false },
  { id: '3d-shop-receipt', label: 'PARAGON ZE SKLEPU 3D', credibilityDelta: -6, correct: false },
  { id: 'printer-manual', label: 'INSTRUKCJA DRUKARKI 3D', credibilityDelta: -4, correct: false },
  { id: 'l4-photo', label: 'ZDJĘCIE L4 400%', credibilityDelta: -7, correct: false },
  { id: 'filament-invoice', label: 'FAKTURA ZA FILAMENT', credibilityDelta: -5, correct: false },
] as const satisfies readonly DocumentChoiceDefinition[];

export const zusQuestionEffects: Readonly<Record<string, number>> = {
  still_need_time: 4,
  feeling_better: 0,
  feeling_great: -5,
  resting: 4,
  computer: -1,
  printing_3d: -3,
  print_none: 1,
  print_some: -1,
  print_1_7kg: -5,
  l4_decoration: 0,
  l4_technical: -2,
  l4_worth_it: -3,
};

/**
 * Balance of the finale. Credibility starts lower than it used to, so the
 * documents alone no longer decide the verdict: the answers, the cards, the
 * reflexes and the walk all count.
 */
export const zusFinaleBalance = {
  baseCredibility: 52,
  hiddenEnding: { minCredibility: 92, maxSuspicion: 20, maxManagerDetections: 1 },
  extendedMinCredibility: 76,
  backToWorkMinCredibility: 40,
  /** At or above this suspicion the only ending below "extended" is HR. */
  hrSuspicion: 95,
} as const;

/** What the final rank letter means on the summary screen (the save keeps the letter). */
export const zusRankTitles = {
  S: { title: 'LEGENDA L4', subtitle: 'ZUS wciąż szuka dowodów. Nie znajdzie.' },
  A: { title: 'MISTRZ KOCA I HERBATKI', subtitle: 'Kaszel wiarygodny, kebab dyskretny.' },
  B: { title: 'SPRAWNY REKONWALESCENT', subtitle: 'Parę wpadek, ale kto ich nie ma.' },
  C: { title: 'AMATOR ZWOLNIEŃ', subtitle: 'Szpule widać było z ulicy.' },
  D: { title: 'PRZYŁAPANY NA KEBABIE', subtitle: 'Mieszany/mieszany. Na oczach kierownika.' },
} as const;
