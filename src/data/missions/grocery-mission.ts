import type { MissionDefinition } from '../../domain/missions/mission-types';

export const groceryMission = {
  id: 'milk-run',
  campaignMonth: 1,
  title: 'TYLKO NA CHWILĘ',
  goal: 'Idź do sklepu po mleko i wróć niezauważony.',
  daysPassed: 2,
  intro: [
    {
      type: 'show-sequence',
      entries: [
        { speaker: 'MISJA', text: 'TYLKO NA CHWILĘ', tone: 'system' },
        { speaker: 'NOWY CEL', text: 'Idź do sklepu po mleko i wróć niezauważony.', tone: 'system' },
      ],
    },
  ],
  steps: [
    {
      id: 'buy-milk',
      objective: 'Kup mleko w minimarkecie.',
      trigger: { type: 'interaction', targetId: 'grocery-counter' },
      interactionPrompt: '[E] KUP MLEKO',
      effects: [
        { type: 'add-item', itemId: 'milk' },
        {
          type: 'show-sequence',
          entries: [{ speaker: 'ZDOBYTO', text: 'MLEKO', tone: 'success' }],
        },
      ],
    },
    {
      id: 'return-home-with-milk',
      objective: 'Wróć z mlekiem do mieszkania niezauważony.',
      trigger: { type: 'area-entered', areaId: 'home' },
      effects: [
        {
          type: 'show-sequence',
          entries: [{ text: 'MLEKO TRAFIŁO DO LODÓWKI', tone: 'success' }],
        },
        { type: 'remove-item', itemId: 'milk' },
      ],
    },
  ],
} as const satisfies MissionDefinition;
