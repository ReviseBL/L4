import type { MissionDefinition } from '../../domain/missions/mission-types';
import { PRINT_PROJECT_STATE } from '../../domain/printing/print-job-types';
import { quickQuestionDialogue, recoveryCheckDialogue } from '../phone/manager-call-dialogues';

export const month5L4ProjectMission = {
  id: 'm5-l4-project-run',
  campaignMonth: 5,
  title: 'NOWY PROJEKT',
  goal: 'Zdobądź filament i uruchom projekt L4 — WERSJA 400%.',
  daysPassed: 10,
  coworkerPatrolRouteId: '3d-shop-loop',
  hrPatrolRouteId: 'filament-loop',
  companyCarRouteId: '3d-shop-road-loop',
  managerInterestPoints: [
    { id: '3d-shop-road', x: 1510, y: 575, lingerMs: 4_200 },
    { id: '3d-shop-return', x: 1880, y: 895, lingerMs: 3_800 },
    { id: 'parking', x: 1460, y: 895, lingerMs: 4_000 },
    { id: 'home-route', x: 680, y: 575, lingerMs: 4_000 },
  ],
  phoneCalls: [
    { id: 'call-m5-02-01', caller: 'manager', trigger: { type: 'elapsedTime', seconds: 26 }, ringDuration: 6, answerDuration: 4, dialogue: quickQuestionDialogue },
    { id: 'call-m5-02-02', caller: 'manager', trigger: { type: 'itemPickedUp', itemId: 'l4-print-filament', delaySeconds: 10 }, ringDuration: 6, answerDuration: 4, dialogue: recoveryCheckDialogue },
  ],
  intro: [
    { type: 'set-print-project-state', printJobId: 'l4-400', state: PRINT_PROJECT_STATE.Planned },
    { type: 'show-sequence', entries: [
      { speaker: 'BOHATER', text: 'Mam pomysł.', tone: 'speech' },
      { speaker: 'NOWY PROJEKT', text: 'L4 — WERSJA 400%', tone: 'success' },
      { speaker: 'ZUŻYCIE FILAMENTU', text: '1,7 KG', tone: 'system' },
      { speaker: 'CZAS DRUKU', text: '46h 13m', tone: 'system' },
      { speaker: 'BOHATER', text: 'Warto.', tone: 'speech' },
    ] },
  ],
  steps: [
    {
      id: 'check-l4-printer',
      objective: 'Sprawdź drukarkę 3D.',
      trigger: { type: 'interaction', targetId: 'home-printer' },
      interactionPrompt: '[E] URUCHOM PROJEKT L4',
      effects: [{ type: 'show-sequence', entries: [
        { speaker: 'DRUKARKA 3D', text: 'ZA MAŁO FILAMENTU', tone: 'warning' },
        { speaker: 'NOWY CEL', text: 'Kup filament do projektu L4.', tone: 'system' },
      ] }],
    },
    {
      id: 'buy-l4-project-filament',
      objective: 'Kup filament do projektu L4 w sklepie 3D.',
      trigger: { type: 'interaction', targetId: 'l4-filament-pallet' },
      interactionPrompt: '[E] KUP FILAMENT DO PROJEKTU L4',
      effects: [
        { type: 'add-item', itemId: 'l4-print-filament' },
        { type: 'set-print-project-state', printJobId: 'l4-400', state: PRINT_PROJECT_STATE.MaterialsReady },
        { type: 'show-sequence', entries: [{ speaker: 'ZDOBYTO', text: 'FILAMENT DO PROJEKTU L4', tone: 'success' }] },
      ],
    },
    {
      id: 'start-l4-print',
      objective: 'Wróć do drukarki i załaduj filament.',
      trigger: { type: 'interaction', targetId: 'home-printer' },
      interactionPrompt: '[E] ZAŁADUJ FILAMENT',
      effects: [
        { type: 'remove-item', itemId: 'l4-print-filament' },
        { type: 'start-print', printJobId: 'l4-400' },
        { type: 'show-sequence', entries: [
          { speaker: 'DRUKARKA 3D', text: 'PROJEKT: L4 — WERSJA 400%', tone: 'system' },
          { speaker: 'ZUŻYCIE', text: '1,7 KG', tone: 'system' },
          { speaker: 'CZAS', text: '46h 13m', tone: 'system' },
          { speaker: 'BOHATER', text: 'Warto.', tone: 'speech' },
        ] },
      ],
    },
  ],
} as const satisfies MissionDefinition;
