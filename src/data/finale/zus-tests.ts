/**
 * Two extra examinations in the ZUS finale, between the questions and the
 * walk: the psychologist's ink-blot cards and the doctor's reflex hammer.
 */
export type InkblotAnswerKind = 'sick' | 'work' | 'printer';

export interface InkblotAnswer {
  text: string;
  kind: InkblotAnswerKind;
  credibilityDelta: number;
  reaction: string;
}

export interface InkblotCard {
  id: string;
  /** Seed of the procedurally drawn, mirrored blot. */
  seed: number;
  answers: readonly InkblotAnswer[];
}

export interface InkblotTestConfig {
  /** Time to answer before hesitation costs credibility. */
  thinkMs: number;
  /** After this long without an answer the card counts as "nothing". */
  timeoutMs: number;
  hesitationDelta: number;
  timeoutDelta: number;
  hesitationLine: string;
  timeoutLine: string;
}

export const inkblotTestConfig: InkblotTestConfig = {
  thinkMs: 6_000,
  timeoutMs: 12_000,
  hesitationDelta: -2,
  timeoutDelta: -3,
  hesitationLine: 'Długo się pan zastanawiał.',
  timeoutLine: 'Nic? Zupełnie nic?',
};

export const INKBLOT_CARDS: readonly InkblotCard[] = [
  {
    id: 'butterfly',
    seed: 1_807,
    answers: [
      { text: 'Motyla. Bardzo zmęczonego motyla.', kind: 'sick', credibilityDelta: 3, reaction: 'Rozumiem. Zmęczonego.' },
      { text: 'Wykres Gantta. Z opóźnieniem.', kind: 'work', credibilityDelta: -4, reaction: 'Tęskni pan za pracą?' },
      { text: 'Model do druku. Bez podpór nie wyjdzie.', kind: 'printer', credibilityDelta: -3, reaction: 'Podpór…?' },
    ],
  },
  {
    id: 'thermometer',
    seed: 4_412,
    answers: [
      { text: 'Logo mojej firmy. Tęsknię.', kind: 'work', credibilityDelta: -4, reaction: 'Ciekawe. Bardzo ciekawe.' },
      { text: 'Termometr. Pokazuje 38,5.', kind: 'sick', credibilityDelta: 3, reaction: 'Odnotowuję gorączkę.' },
      { text: 'Splątaną szpulę PETG.', kind: 'printer', credibilityDelta: -3, reaction: 'Czego?' },
    ],
  },
  {
    id: 'blanket',
    seed: 7_031,
    answers: [
      { text: 'Dyszę 0,6 mm. Zapchaną.', kind: 'printer', credibilityDelta: -3, reaction: 'To jakaś choroba?' },
      { text: 'Open space we wtorek rano.', kind: 'work', credibilityDelta: -4, reaction: 'Bardzo konkretny obraz.' },
      { text: 'Siebie pod kocem. Bez sił.', kind: 'sick', credibilityDelta: 3, reaction: 'Mhm. Pod kocem.' },
    ],
  },
  {
    id: 'kebab',
    seed: 9_260,
    answers: [
      { text: 'Excela z makrami.', kind: 'work', credibilityDelta: -4, reaction: 'Proszę się nie denerwować.' },
      { text: 'Hotend… znaczy się, motyla.', kind: 'printer', credibilityDelta: -2, reaction: 'Znowu motyl. Notuję.' },
      { text: 'Lekarstwo. Duże. Na receptę.', kind: 'sick', credibilityDelta: 1, reaction: 'Wygląda pan, jakby myślał o kebabie.' },
    ],
  },
];

export interface ReflexTestConfig {
  rounds: number;
  /** Needle sweep speed (full bar per second) per round. */
  speeds: readonly number[];
  /** "Weak but alive" window on the 0..1 kick-strength bar. */
  weakFrom: number;
  weakTo: number;
  weakDelta: number;
  noneDelta: number;
  strongDelta: number;
  lines: { weak: readonly string[]; none: readonly string[]; strong: readonly string[] };
}

export const reflexTestConfig: ReflexTestConfig = {
  rounds: 3,
  speeds: [0.75, 0.95, 1.2],
  weakFrom: 0.36,
  weakTo: 0.56,
  weakDelta: 2,
  noneDelta: -2,
  strongDelta: -3,
  lines: {
    weak: ['Słaby odruch. Zgodnie z dokumentacją.', 'Ledwo drgnęło. Notuję.', 'Osłabiony. Tak jak pisał lekarz.'],
    none: ['Zero reakcji? Symuluje pan?', 'Nic? To podejrzane.', 'Noga jak z drewna. Hmm.'],
    strong: ['Ała! Zdrowy jak koń.', 'Kopnął pan mi długopis.', 'Ten odruch chodzi na siłownię.'],
  },
};
