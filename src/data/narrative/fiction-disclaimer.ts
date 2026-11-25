/** The usual "any resemblance is coincidental" card shown before the opening. */
export const FICTION_DISCLAIMER = {
  title: 'ZASTRZEŻENIE',
  paragraphs: [
    'Wszystkie postacie i wydarzenia przedstawione w tej grze są fikcyjne.',
    'Jakiekolwiek podobieństwo do osób żyjących lub zmarłych, prawdziwych firm, kierowników, działów HR, sąsiadów z ławki i placówek ZUS jest całkowicie przypadkowe.',
    'Gra nie zachęca do nadużywania zwolnień lekarskich. Herbert też by nie zachęcał. Chyba.',
    'Podczas tworzenia gry nie ucierpiał żaden kierownik. Jeden pies nasikał pod ławką.',
  ],
  continueHint: '[E] / SPACJA — DALEJ',
  /** The card moves on by itself after this long. */
  autoContinueMs: 9_000,
} as const;
