import type { MissionDefinition } from '../../domain/missions/mission-types';
import { quickQuestionDialogue } from '../phone/manager-call-dialogues';

export const month5ShoppingMission = {
  id: 'm5-shopping-run',
  campaignMonth: 5,
  title: 'NIE WYCHODŹ TERAZ',
  goal: 'Idź po zakupy i wróć do mieszkania.',
  daysPassed: 10,
  coworkerPatrolRouteId: 'standard',
  managerInterestPoints: [
    { id: 'apartment-approach', x: 620, y: 575, lingerMs: 4_800 },
    { id: 'grocery-approach', x: 960, y: 575, lingerMs: 4_200 },
    { id: 'parking-edge', x: 1450, y: 895, lingerMs: 3_600 },
  ],
  phoneCalls: [
    { id: 'call-m5-01-01', caller: 'manager', trigger: { type: 'elapsedTime', seconds: 34 }, ringDuration: 6, answerDuration: 4, dialogue: quickQuestionDialogue },
  ],
  intro: [{ type: 'show-sequence', entries: [
    { speaker: 'BOHATER', text: 'Tylko szybko do sklepu.', tone: 'speech' },
    { speaker: 'NOWE ZAGROŻENIE', text: 'KIEROWNIK AKTYWNIE SPRAWDZA WAŻNE MIEJSCA.', tone: 'warning' },
    { text: 'Zgub go za budynkiem lub w kryjówce. Po utracie wzroku będzie szukał.', tone: 'system' },
  ] }],
  steps: [
    { id: 'buy-m5-groceries', objective: 'Kup zakupy w minimarkecie.', trigger: { type: 'interaction', targetId: 'grocery-counter' }, interactionPrompt: '[E] KUP ZAKUPY', effects: [{ type: 'add-item', itemId: 'groceries' }] },
    { id: 'return-m5-shopping', objective: 'Zgub kierownika i wróć do mieszkania.', trigger: { type: 'area-entered', areaId: 'home' }, effects: [{ type: 'remove-item', itemId: 'groceries' }, { type: 'show-sequence', entries: [{ text: 'DRZWI ZAMKNIĘTE. KIEROWNIK ZOSTAŁ NA ZEWNĄTRZ.', tone: 'success' }] }] },
  ],
} as const satisfies MissionDefinition;
