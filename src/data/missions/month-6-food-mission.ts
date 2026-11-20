import type { MissionDefinition } from '../../domain/missions/mission-types';
import { quickQuestionDialogue, statusUpdateDialogue } from '../phone/manager-call-dialogues';

export const month6FoodMission = {
  id: 'm6-food-run',
  campaignMonth: 6,
  title: 'TYLKO PO JEDZENIE',
  goal: 'Odbierz jedzenie i wróć do mieszkania.',
  daysPassed: 14,
  coworkerPatrolRouteId: 'kebab-loop',
  hrPatrolRouteId: 'tech-loop',
  companyCarRouteId: 'parcel-road-loop',
  managerInterestPoints: [
    { id: 'kebab', x: 1610, y: 1160, lingerMs: 4_800 },
    { id: 'kebab-parking-corner', x: 1540, y: 1120, lingerMs: 900 },
    { id: 'parking', x: 1500, y: 895, lingerMs: 4_200 },
    { id: 'crossing', x: 560, y: 735, lingerMs: 3_900 },
    { id: 'home-route', x: 680, y: 575, lingerMs: 4_600 },
    { id: 'grocery', x: 970, y: 575, lingerMs: 4_100 },
  ],
  phoneCalls: [
    { id: 'call-m6-02-01', caller: 'manager', trigger: { type: 'elapsedTime', seconds: 24 }, ringDuration: 6, answerDuration: 4, dialogue: quickQuestionDialogue },
    { id: 'call-m6-02-02', caller: 'manager', trigger: { type: 'returningHome', afterStepId: 'collect-final-food', delaySeconds: 11 }, ringDuration: 6, answerDuration: 4, dialogue: statusUpdateDialogue },
  ],
  intro: [{ type: 'show-sequence', entries: [
    { speaker: 'BOHATER', text: 'Nie będę gotował.', tone: 'speech' },
    { speaker: 'BOHATER', text: 'Tylko szybko odbiorę jedzenie.', tone: 'speech' },
  ] }],
  steps: [
    {
      id: 'collect-final-food',
      objective: 'Odbierz jedzenie.',
      trigger: { type: 'interaction', targetId: 'kebab-counter' },
      challenge: { type: 'service-wait', serviceId: 'kebab' },
      interactionPrompt: '[E] ZAMÓW JEDZENIE',
      effects: [
        { type: 'add-item', itemId: 'kebab' },
        { type: 'increment-campaign-stat', stat: 'kebabsCollected' },
      ],
    },
    {
      id: 'return-final-food',
      objective: 'Wróć z jedzeniem do mieszkania.',
      trigger: { type: 'area-entered', areaId: 'home' },
      effects: [{ type: 'remove-item', itemId: 'kebab' }],
    },
  ],
} as const satisfies MissionDefinition;
