import type { MissionDefinition } from '../../domain/missions/mission-types';
import { quickQuestionDialogue, recoveryCheckDialogue } from '../phone/manager-call-dialogues';

export const month6FinalSpoolMission = {
  id: 'm6-final-spool-run',
  campaignMonth: 6,
  title: 'OSTATNIA SZPULA',
  goal: 'Kup ostatnią szpulę filamentu i wróć do mieszkania.',
  daysPassed: 14,
  coworkerPatrolRouteId: '3d-shop-loop',
  hrPatrolRouteId: 'filament-loop',
  companyCarRouteId: '3d-shop-road-loop',
  managerInterestPoints: [
    { id: '3d-shop', x: 1510, y: 575, lingerMs: 4_400 },
    { id: 'shop-return', x: 1880, y: 895, lingerMs: 4_200 },
    { id: 'parking', x: 1460, y: 895, lingerMs: 4_100 },
    { id: 'home-route', x: 680, y: 575, lingerMs: 4_200 },
  ],
  phoneCalls: [
    { id: 'call-m6-01-01', caller: 'manager', trigger: { type: 'elapsedTime', seconds: 28 }, ringDuration: 6, answerDuration: 4, dialogue: quickQuestionDialogue },
    { id: 'call-m6-01-02', caller: 'manager', trigger: { type: 'itemPickedUp', itemId: 'tpu-purple-spool', delaySeconds: 12 }, ringDuration: 6, answerDuration: 4, dialogue: recoveryCheckDialogue },
  ],
  intro: [{ type: 'show-sequence', entries: [
    { speaker: 'MIESIĄC 6', text: 'OSTATNI MIESIĄC', tone: 'system' },
    { speaker: 'BOHATER', text: 'Jeszcze tylko trzydzieści dni.', tone: 'speech' },
    { speaker: 'BOHATER', text: 'Co może pójść nie tak?', tone: 'speech' },
    { speaker: 'BOHATER', text: 'Dobra.', tone: 'speech' },
    { speaker: 'BOHATER', text: 'Naprawdę ostatnia.', tone: 'speech' },
    { speaker: 'BOHATER', text: 'Potem już nic nie kupuję.', tone: 'speech' },
  ] }],
  steps: [
    {
      id: 'buy-final-spool',
      objective: 'Kup ostatnią szpulę filamentu.',
      trigger: { type: 'interaction', targetId: 'tpu-filament-shelf' },
      interactionPrompt: '[E] KUP OSTATNIĄ SZPULĘ',
      effects: [
        { type: 'add-item', itemId: 'tpu-purple-spool' },
        { type: 'increment-campaign-stat', stat: 'threeDShopVisits' },
        { type: 'show-sequence', entries: [
          { speaker: 'ZDOBYTO', text: 'NOWA SZPULA FILAMENTU', tone: 'success' },
          { speaker: 'BOHATER', text: 'Ostatnia.', tone: 'speech' },
          { speaker: 'BOHATER', text: 'Na pewno.', tone: 'speech' },
        ] },
      ],
    },
    {
      id: 'return-final-spool',
      objective: 'Wróć do mieszkania i załaduj ostatnią szpulę.',
      trigger: { type: 'interaction', targetId: 'home-printer' },
      interactionPrompt: '[E] ZAŁADUJ FILAMENT TPU',
      effects: [
        { type: 'play-minigame', minigame: { kind: 'threading', variant: 'tpu' } },
        { type: 'remove-item', itemId: 'tpu-purple-spool' },
        { type: 'add-filament-spool', spoolId: 'tpu-purple' },
      ],
    },
  ],
} as const satisfies MissionDefinition;
