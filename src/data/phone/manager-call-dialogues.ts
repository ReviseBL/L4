import type { PhoneDialogueDefinition } from '../../domain/phone/phone-types';

export const recoveryCheckDialogue = {
  lines: [
    { speaker: 'KIEROWNIK', text: 'Cześć, jak się czujesz?' },
    { speaker: 'BOHATER', text: 'Jeszcze dochodzę do siebie.' },
    { speaker: 'KIEROWNIK', text: 'Jasne. Wracaj do zdrowia.' },
  ],
} as const satisfies PhoneDialogueDefinition;

export const quickQuestionDialogue = {
  lines: [
    { speaker: 'KIEROWNIK', text: 'Tylko jedno pytanie. Pamiętasz hasło do Wi-Fi?' },
    { speaker: 'BOHATER', text: 'Nie przy sobie.' },
    { speaker: 'KIEROWNIK', text: 'Okej, zdrowiej.' },
  ],
} as const satisfies PhoneDialogueDefinition;

export const statusUpdateDialogue = {
  lines: [
    { speaker: 'KIEROWNIK', text: 'Daj znać, czy coś się zmieniło.' },
    { speaker: 'BOHATER', text: 'Głównie temperatura dyszy.' },
    { speaker: 'KIEROWNIK', text: 'Co?' },
    { speaker: 'BOHATER', text: 'Nic. Zdrowieję.' },
  ],
} as const satisfies PhoneDialogueDefinition;

/**
 * Variants for each kind of call, so the manager does not ask about the Wi-Fi
 * every time. Missions keep pointing at the base dialogue above; the picker
 * swaps in a variant from the matching pool at answer time.
 */
const quickQuestionVariants: readonly PhoneDialogueDefinition[] = [
  quickQuestionDialogue,
  { lines: [
    { speaker: 'KIEROWNIK', text: 'Gdzie trzymaliśmy zapasowy toner?' },
    { speaker: 'BOHATER', text: 'W szafce z napisem NIE OTWIERAĆ.' },
    { speaker: 'KIEROWNIK', text: 'Logiczne. Dzięki.' },
  ] },
  { lines: [
    { speaker: 'KIEROWNIK', text: 'Jak się restartuje ten serwer w piwnicy?' },
    { speaker: 'BOHATER', text: 'Wyłączyć i włączyć.' },
    { speaker: 'KIEROWNIK', text: 'Serio? ...O, działa. Zdrowiej.' },
  ] },
  { lines: [
    { speaker: 'KIEROWNIK', text: 'Kto ma klucz do serwerowni?' },
    { speaker: 'BOHATER', text: 'Ten, kto go ostatnio zgubił.' },
    { speaker: 'KIEROWNIK', text: 'Czyli ty. Świetnie.' },
  ] },
  { lines: [
    { speaker: 'KIEROWNIK', text: 'Drukarka na trzecim piętrze drukuje same krzaczki.' },
    { speaker: 'BOHATER', text: 'Ma L4. Jak ja.' },
    { speaker: 'KIEROWNIK', text: 'Bardzo śmieszne.' },
  ] },
  { lines: [
    { speaker: 'KIEROWNIK', text: 'W którym folderze była prezentacja dla zarządu?' },
    { speaker: 'BOHATER', text: 'Pulpit. „Nowy folder (7)”.' },
    { speaker: 'KIEROWNIK', text: 'Oczywiście, że tak.' },
  ] },
  { lines: [
    { speaker: 'KIEROWNIK', text: 'Jak się dodaje drukarkę na Macu?' },
    { speaker: 'BOHATER', text: 'Ustawienia, Drukarki, plusik.' },
    { speaker: 'KIEROWNIK', text: 'Plusik. Jasne. Wiedziałem.' },
  ] },
  { lines: [
    { speaker: 'KIEROWNIK', text: 'Ktoś zmienił hasło do skrzynki działu. To nie ty?' },
    { speaker: 'BOHATER', text: 'Jestem chory. Nawet hasła mi się nie chce.' },
    { speaker: 'KIEROWNIK', text: 'No dobra.' },
  ] },
];

const statusUpdateVariants: readonly PhoneDialogueDefinition[] = [
  statusUpdateDialogue,
  { lines: [
    { speaker: 'KIEROWNIK', text: 'Jest lepiej? Bo zespół pyta.' },
    { speaker: 'BOHATER', text: 'Lepiej niż wczoraj, gorzej niż jutro.' },
    { speaker: 'KIEROWNIK', text: 'Co to w ogóle znaczy?' },
    { speaker: 'BOHATER', text: 'Że zdrowieję.' },
  ] },
  { lines: [
    { speaker: 'KIEROWNIK', text: 'Lekarz mówił, kiedy wrócisz?' },
    { speaker: 'BOHATER', text: 'Mówił, żebym nie odbierał telefonów z pracy.' },
    { speaker: 'KIEROWNIK', text: '...Rozumiem. Cześć.' },
  ] },
  { lines: [
    { speaker: 'KIEROWNIK', text: 'Słyszałem, że widziano cię na mieście.' },
    { speaker: 'BOHATER', text: 'To pewnie mój sobowtór. Często go widują.' },
    { speaker: 'KIEROWNIK', text: 'Mhm.' },
  ] },
  { lines: [
    { speaker: 'KIEROWNIK', text: 'Mogę wpisać ci w grafik przyszły tydzień?' },
    { speaker: 'BOHATER', text: 'Wpisz ołówkiem.' },
    { speaker: 'KIEROWNIK', text: 'Ołówkiem. Okej.' },
  ] },
  { lines: [
    { speaker: 'KIEROWNIK', text: 'Daj znać, jak będziesz na chodzie. Potrzebujemy cię przy migracji.' },
    { speaker: 'BOHATER', text: 'Jakiej migracji?' },
    { speaker: 'KIEROWNIK', text: 'Dużej. Zdrowiej szybko.' },
  ] },
];

const recoveryCheckVariants: readonly PhoneDialogueDefinition[] = [
  recoveryCheckDialogue,
  { lines: [
    { speaker: 'KIEROWNIK', text: 'Jak zdrowie? Bierzesz leki?' },
    { speaker: 'BOHATER', text: 'Regularnie. Co cztery godziny i co misję.' },
    { speaker: 'KIEROWNIK', text: 'Co misję?' },
    { speaker: 'BOHATER', text: 'Co... posiłek. Zdrowiej. To znaczy, zdrowieję.' },
  ] },
  { lines: [
    { speaker: 'KIEROWNIK', text: 'Pijesz dużo wody? Moja żona mówi, że to podstawa.' },
    { speaker: 'BOHATER', text: 'Piję. I herbatę z miodem.' },
    { speaker: 'KIEROWNIK', text: 'Wzorowo.' },
  ] },
  { lines: [
    { speaker: 'KIEROWNIK', text: 'Nie przemęczaj się. Leżenie to też praca.' },
    { speaker: 'BOHATER', text: 'Właśnie leżę.' },
    { speaker: 'KIEROWNIK', text: 'Słyszę jakieś piski w tle.' },
    { speaker: 'BOHATER', text: 'To czajnik.' },
  ] },
  { lines: [
    { speaker: 'KIEROWNIK', text: 'Zespół przesyła pozdrowienia. I kartkę. I listę zadań na potem.' },
    { speaker: 'BOHATER', text: 'Poproszę najpierw kartkę.' },
    { speaker: 'KIEROWNIK', text: 'Jasne.' },
  ] },
  { lines: [
    { speaker: 'KIEROWNIK', text: 'Możesz chociaż odpisać na maile? Tylko te pilne.' },
    { speaker: 'BOHATER', text: 'Lekarz zabronił ekranów.' },
    { speaker: 'KIEROWNIK', text: 'A telefon?' },
    { speaker: 'BOHATER', text: 'To... wyjątek. Pa.' },
  ] },
];

export const managerCallPools: ReadonlyMap<PhoneDialogueDefinition, readonly PhoneDialogueDefinition[]> = new Map<
  PhoneDialogueDefinition,
  readonly PhoneDialogueDefinition[]
>([
  [quickQuestionDialogue, quickQuestionVariants],
  [statusUpdateDialogue, statusUpdateVariants],
  [recoveryCheckDialogue, recoveryCheckVariants],
]);
