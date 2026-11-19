import type { MissionDefinition } from '../../domain/missions/mission-types';
import { quickQuestionDialogue, recoveryCheckDialogue } from '../phone/manager-call-dialogues';

export const month3FilamentMission = {
  id: 'm3-orange-filament-run', campaignMonth: 3, title: 'TEGO KOLORU JESZCZE NIE MAM',
  goal: 'Kup nową szpulę filamentu i wróć do mieszkania.', daysPassed: 10,
  coworkerPatrolRouteId: '3d-shop-loop', hrPatrolRouteId: 'filament-loop',
  phoneCalls: [
    { id: 'call-m3-03-01', caller: 'manager', trigger: { type: 'elapsedTime', seconds: 24 }, ringDuration: 6, answerDuration: 4, dialogue: quickQuestionDialogue },
    { id: 'call-m3-03-02', caller: 'manager', trigger: { type: 'itemPickedUp', itemId: 'pla-orange-spool', delaySeconds: 10 }, ringDuration: 6, answerDuration: 4, dialogue: recoveryCheckDialogue },
  ],
  intro: [{ type: 'show-sequence', entries: [
    { speaker: 'BOHATER', text: 'PETG jest. PLA jest. ...', tone: 'speech' },
    { speaker: 'BOHATER', text: 'Ale tego koloru jeszcze nie mam.', tone: 'speech' },
    { speaker: 'NOWY CEL', text: 'Kup nową szpulę filamentu.', tone: 'system' },
  ] }],
  steps: [
    { id: 'buy-orange-pla', objective: 'Kup pomarańczową szpulę PLA w sklepie 3D.', trigger: { type: 'interaction', targetId: 'orange-filament-shelf' }, interactionPrompt: '[E] KUP FILAMENT', effects: [
      { type: 'add-item', itemId: 'pla-orange-spool' }, { type: 'show-sequence', entries: [{ speaker: 'ZDOBYTO', text: 'PLA — NOWA SZPULA', tone: 'success' }] },
    ] },
    { id: 'return-orange-pla', objective: 'Wróć do mieszkania i załaduj szpulę do drukarki.', trigger: { type: 'interaction', targetId: 'home-printer' }, interactionPrompt: '[E] ZAŁADUJ FILAMENT PLA', effects: [
      { type: 'play-minigame', minigame: { kind: 'threading', variant: 'pla' } },
      { type: 'remove-item', itemId: 'pla-orange-spool' }, { type: 'add-filament-spool', spoolId: 'pla-orange' },
      { type: 'show-sequence', entries: [{ speaker: 'BOHATER', text: 'Było warto.', tone: 'speech' }] },
    ] },
  ],
} as const satisfies MissionDefinition;
