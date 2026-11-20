import type { MissionDefinition } from '../../domain/missions/mission-types';
import { quickQuestionDialogue, statusUpdateDialogue } from '../phone/manager-call-dialogues';

export const month5KebabMission = {
  id: 'm5-kebab-run',
  campaignMonth: 5,
  title: 'OSTATNI SPOKOJNY DZIEŃ',
  goal: 'Odbierz jedzenie i wróć do mieszkania.',
  daysPassed: 10,
  coworkerPatrolRouteId: 'kebab-loop',
  hrPatrolRouteId: 'tech-loop',
  companyCarRouteId: 'parcel-road-loop',
  managerInterestPoints: [
    { id: 'kebab', x: 1610, y: 1160, lingerMs: 4_500 },
    { id: 'kebab-parking-corner', x: 1540, y: 1120, lingerMs: 900 },
    { id: 'parking', x: 1530, y: 895, lingerMs: 4_000 },
    { id: 'grocery', x: 970, y: 575, lingerMs: 3_800 },
    { id: 'home-route', x: 650, y: 575, lingerMs: 4_000 },
  ],
  phoneCalls: [
    { id: 'call-m5-03-01', caller: 'manager', trigger: { type: 'elapsedTime', seconds: 22 }, ringDuration: 6, answerDuration: 4, dialogue: quickQuestionDialogue },
    { id: 'call-m5-03-02', caller: 'manager', trigger: { type: 'returningHome', afterStepId: 'collect-kebab', delaySeconds: 10 }, ringDuration: 6, answerDuration: 4, dialogue: statusUpdateDialogue },
  ],
  intro: [
    { type: 'show-sequence', entries: [
      { speaker: 'DRUKARKA 3D', text: 'BEEP BEEP\nPROJEKT L4 — WERSJA 400%: GOTOWE', tone: 'success' },
      { speaker: 'BOHATER', text: 'Teraz tylko odkleić to od stołu.', tone: 'speech' },
    ] },
    { type: 'play-minigame', minigame: { kind: 'timing', variant: 'print-removal' } },
    { type: 'complete-print', printJobId: 'l4-400' },
    { type: 'show-sequence', entries: [
      { speaker: 'BOHATER', text: 'Piękne.', tone: 'speech' },
      { speaker: 'BOHATER', text: 'Warto było.', tone: 'speech' },
    ] },
  ],
  steps: [
    { id: 'collect-kebab', objective: 'Odbierz kebaba.', trigger: { type: 'interaction', targetId: 'kebab-counter' }, interactionPrompt: '[E] ODBIERZ KEBABA', effects: [{ type: 'add-item', itemId: 'kebab' }] },
    { id: 'return-with-kebab', objective: 'Wróć z jedzeniem do mieszkania.', trigger: { type: 'area-entered', areaId: 'home' }, effects: [{ type: 'remove-item', itemId: 'kebab' }, { type: 'show-sequence', entries: [{ text: 'KEBAB OCALAŁ. SPOKÓJ — NIEKONIECZNIE.', tone: 'success' }] }] },
  ],
} as const satisfies MissionDefinition;
