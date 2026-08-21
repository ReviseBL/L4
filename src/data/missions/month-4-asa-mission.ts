import type { MissionDefinition } from '../../domain/missions/mission-types';
import { quickQuestionDialogue, recoveryCheckDialogue } from '../phone/manager-call-dialogues';

export const month4AsaMission = {
  id: 'm4-asa-filament-run', campaignMonth: 4, title: 'POTRZEBUJĘ JESZCZE JEDNEJ SZPULI',
  goal: 'Kup szpulę ASA i wróć do mieszkania.', daysPassed: 10,
  coworkerPatrolRouteId: '3d-shop-loop', hrPatrolRouteId: 'filament-loop', companyCarRouteId: '3d-shop-road-loop',
  phoneCalls: [
    { id: 'call-m4-03-01', caller: 'manager', trigger: { type: 'elapsedTime', seconds: 23 }, ringDuration: 6, answerDuration: 4, dialogue: quickQuestionDialogue },
    { id: 'call-m4-03-02', caller: 'manager', trigger: { type: 'itemPickedUp', itemId: 'asa-black-spool', delaySeconds: 9 }, ringDuration: 6, answerDuration: 4, dialogue: recoveryCheckDialogue },
  ],
  intro: [{ type: 'show-sequence', entries: [
    { speaker: 'BOHATER', text: 'Mam PETG.', tone: 'speech' },
    { speaker: 'BOHATER', text: 'Mam PLA.', tone: 'speech' },
    { speaker: 'BOHATER', text: '...', tone: 'speech' },
    { speaker: 'BOHATER', text: 'Ale jednej jeszcze brakuje.', tone: 'speech' },
  ] }],
  steps: [
    { id: 'buy-asa', objective: 'Kup czarną szpulę ASA w sklepie 3D.', trigger: { type: 'interaction', targetId: 'asa-filament-shelf' }, interactionPrompt: '[E] KUP FILAMENT', effects: [{ type: 'add-item', itemId: 'asa-black-spool' }, { type: 'show-sequence', entries: [{ speaker: 'ZDOBYTO', text: 'ASA — NOWA SZPULA', tone: 'success' }] }] },
    { id: 'return-asa', objective: 'Wróć ze szpulą do mieszkania.', trigger: { type: 'area-entered', areaId: 'home' }, effects: [{ type: 'remove-item', itemId: 'asa-black-spool' }, { type: 'add-filament-spool', spoolId: 'asa-black' }, { type: 'show-sequence', entries: [{ speaker: 'BOHATER', text: 'Teraz mam komplet.', tone: 'speech' }] }] },
  ],
} as const satisfies MissionDefinition;
