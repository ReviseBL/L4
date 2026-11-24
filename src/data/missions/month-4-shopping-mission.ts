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
    { id: 'buy-groceries', objective: 'Zrób zakupy w minimarkecie.', trigger: { type: 'interaction', targetId: 'grocery-counter' }, interactionPrompt: '[E] KUP ZAKUPY', effects: [
      { type: 'add-item', itemId: 'groceries' },
      { type: 'show-sequence', entries: [
        { speaker: 'KASJERKA', text: 'Gazety z krzyżówkami nie ma. Rozeszła się.', tone: 'speech' },
        { speaker: 'KASJERKA', text: 'Kiosk nad rzeką zawsze ma. Za biurowcem, panie Hubercie.', tone: 'speech' },
        { speaker: 'BOHATER', text: 'Za biurowcem. Oczywiście.', tone: 'speech' },
      ] },
    ] },
    { id: 'buy-newspaper', objective: 'Kup gazetę z krzyżówkami w kiosku nad rzeką.', trigger: { type: 'interaction', targetId: 'riverside-kiosk' }, interactionPrompt: '[E] KUP GAZETĘ', effects: [{ type: 'add-item', itemId: 'crossword-newspaper' }] },
    { id: 'return-shopping', objective: 'Wróć z zakupami i gazetą do mieszkania.', trigger: { type: 'area-entered', areaId: 'home' }, effects: [{ type: 'remove-item', itemId: 'groceries' }, { type: 'remove-item', itemId: 'crossword-newspaper' }, { type: 'show-sequence', entries: [{ text: 'ZAKUPY I KRZYŻÓWKI BEZPIECZNIE W DOMU', tone: 'success' }] }] },
  ],
} as const satisfies MissionDefinition;
