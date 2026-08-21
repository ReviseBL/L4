import type { MissionDefinition } from '../../domain/missions/mission-types';
import { quickQuestionDialogue } from '../phone/manager-call-dialogues';

export const month4ShoppingMission = {
  id: 'm4-shopping-run', campaignMonth: 4, title: 'TYLKO DO SKLEPU',
  goal: 'Idź po zakupy i wróć do mieszkania.', daysPassed: 10,
  coworkerPatrolRouteId: 'standard', companyCarRouteId: 'tutorial-road-loop',
  phoneCalls: [{ id: 'call-m4-01-01', caller: 'manager', trigger: { type: 'elapsedTime', seconds: 32 }, ringDuration: 6, answerDuration: 4, dialogue: quickQuestionDialogue }],
  intro: [{ type: 'show-sequence', entries: [
    { speaker: 'NOWE ZAGROŻENIE', text: 'SAMOCHÓD SŁUŻBOWY', tone: 'warning' },
    { text: 'Jeśli cię zauważy, może przekazać twoją pozycję innym.', tone: 'system' },
  ] }],
  steps: [
    { id: 'buy-groceries', objective: 'Zrób zakupy w minimarkecie.', trigger: { type: 'interaction', targetId: 'grocery-counter' }, interactionPrompt: '[E] KUP ZAKUPY', effects: [{ type: 'add-item', itemId: 'groceries' }] },
    { id: 'return-shopping', objective: 'Wróć z zakupami do mieszkania.', trigger: { type: 'area-entered', areaId: 'home' }, effects: [{ type: 'remove-item', itemId: 'groceries' }, { type: 'show-sequence', entries: [{ text: 'ZAKUPY BEZPIECZNIE W DOMU', tone: 'success' }] }] },
  ],
} as const satisfies MissionDefinition;
