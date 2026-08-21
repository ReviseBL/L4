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
