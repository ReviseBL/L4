import type { MissionDefinition } from '../../domain/missions/mission-types';
import { recoveryCheckDialogue } from '../phone/manager-call-dialogues';

export const month2CoffeeMission = {
  id: 'm2-coffee-run',
  campaignMonth: 2,
  title: 'TYLKO JEDNO PYTANIE',
  goal: 'Idź po kawę i wróć do mieszkania.',
  daysPassed: 10,
  phoneCalls: [
    {
      id: 'call-m2-01-01',
      caller: 'manager',
      trigger: { type: 'elapsedTime', seconds: 8 },
      ringDuration: 8,
      answerDuration: 4,
      dialogue: recoveryCheckDialogue,
      tutorial: true,
    },
  ],
  intro: [
    {
      type: 'show-sequence',
      entries: [
        { speaker: 'TELEFON SŁUŻBOWY', text: 'BRRRR... BRRRR...', tone: 'system' },
        { speaker: 'BOHATER', text: 'No pięknie.', tone: 'speech' },
        { speaker: 'MISJA', text: 'TYLKO JEDNO PYTANIE', tone: 'system' },
        { speaker: 'NOWY CEL', text: 'Idź po kawę i wróć do mieszkania.', tone: 'system' },
      ],
    },
  ],
  steps: [
    {
      id: 'buy-coffee',
      objective: 'Kup kawę w minimarkecie.',
      trigger: { type: 'interaction', targetId: 'grocery-counter' },
      interactionPrompt: '[E] KUP KAWĘ',
      effects: [
        { type: 'add-item', itemId: 'coffee' },
        {
          type: 'show-sequence',
          entries: [
            { speaker: 'ZDOBYTO', text: 'KAWA', tone: 'success' },
            { speaker: 'BOHATER', text: 'Bez pokrywki. Lepiej nie biegać.', tone: 'speech' },
          ],
        },
      ],
    },
    {
      id: 'return-home-with-coffee',
      objective: 'Wróć z kawą do mieszkania.',
      trigger: { type: 'area-entered', areaId: 'home' },
      effects: [
        { type: 'remove-item', itemId: 'coffee' },
        {
          type: 'show-sequence',
          entries: [{ text: 'KAWA DONIESIONA', tone: 'success' }],
        },
      ],
    },
  ],
} as const satisfies MissionDefinition;
