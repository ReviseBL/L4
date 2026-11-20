/** The "how to play" board shown before the first mission (and on [H] any time). */
export interface HowToPlaySection {
  title: string;
  lines: readonly string[];
}

export const HOW_TO_PLAY = {
  title: 'JAK PRZETRWAĆ L4',
  goal: 'Hubi jest na zwolnieniu. Załatw to, co każe misja, i wróć do mieszkania, zanim ktoś z firmy cię nakryje.',
  left: [
    {
      title: 'STEROWANIE',
      lines: [
        'WASD / strzałki — chodzenie',
        'SHIFT — sprint (krótki! Hubi łapie zadyszkę, pasek nad głową)',
        'E — akcja: kup, odbierz, porozmawiaj, schowaj się, dalej',
        'Kryjówki oznacza „H” — E, by wejść i wyjść',
      ],
    },
    {
      title: 'TELEFON SŁUŻBOWY',
      lines: [
        '1 — odbierz · 2 — odrzuć · 3 — tryb samolotowy (raz na misję)',
        'Nieodebrany telefon = podejrzliwość. Odbieraj w budynku:',
        'hałas ulicy i aut w tle też podnosi podejrzenia',
      ],
    },
  ],
  right: [
    {
      title: 'KTO CIĘ SZUKA',
      lines: [
        'Kolega, HR, kierownik i auto służbowe — uważaj na stożki wzroku',
        'Złapany? Wybierz wymówkę. Dobra ratuje, zła kosztuje',
        'Sąsiedzi krzyczą „Cześć Hubi!” i ściągają uwagę',
        'Nie sterczeć pod oknami sklepów — sprzedawcy patrzą',
      ],
    },
    {
      title: 'PODEJRZLIWOŚĆ I CODZIENNOŚĆ',
      lines: [
        'Pasek u góry: wpadki, telefony i hałas go podnoszą',
        'Ciężkie paczki: wolniej, bez sprintu, nie w każdą kryjówkę',
        'Kawa chlapie przy biegu · w aptece i przy kebabie trzeba poczekać',
      ],
    },
  ],
  footer: '[E] ZACZYNAMY        ·        [H] TA PLANSZA W KAŻDEJ CHWILI',
} as const;

/** Remembered in the browser, so the board opens by itself only once. */
export const HOW_TO_PLAY_SEEN_KEY = 'l4.howToPlaySeen';
