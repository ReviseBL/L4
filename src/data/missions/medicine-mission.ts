import type { MissionDefinition } from '../../domain/missions/mission-types';

export const medicineMission = {
  id: 'medicine-run',
  campaignMonth: 1,
  title: 'LEPIEJ NIE RYZYKOWAĆ',
  goal: 'Kup leki w aptece i wróć do mieszkania.',
  daysPassed: 2,
  intro: [
    {
      type: 'show-sequence',
      entries: [
        { speaker: 'MISJA', text: 'LEPIEJ NIE RYZYKOWAĆ', tone: 'system' },
        { speaker: 'NOWY CEL', text: 'Kup leki w aptece i wróć do mieszkania.', tone: 'system' },
      ],
    },
  ],
  steps: [
    {
      id: 'buy-medicine',
      objective: 'Idź do apteki, odstój kolejkę i kup leki.',
      trigger: { type: 'interaction', targetId: 'pharmacy-counter' },
      interactionPrompt: '[E] KUP LEKI',
      challenge: { type: 'pharmacy-queue', queueId: 'm1-pharmacy' },
      effects: [
        { type: 'add-item', itemId: 'medicine' },
        {
          type: 'show-sequence',
          entries: [{ speaker: 'ZDOBYTO', text: 'LEKI', tone: 'success' }],
        },
      ],
    },
    {
      id: 'return-home-with-medicine',
      objective: 'Wróć z lekami do mieszkania.',
      trigger: { type: 'area-entered', areaId: 'home' },
      effects: [
        {
          type: 'show-sequence',
          entries: [{ text: 'LEKI BEZPIECZNIE ODŁOŻONE', tone: 'success' }],
        },
        { type: 'remove-item', itemId: 'medicine' },
      ],
    },
  ],
} as const satisfies MissionDefinition;
