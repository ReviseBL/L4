import type { MissionDefinition } from '../../domain/missions/mission-types';
import { recoveryCheckDialogue } from '../phone/manager-call-dialogues';

export const month3MedicineMission = {
  id: 'm3-medicine-run', campaignMonth: 3, title: 'LEKI SIĘ KOŃCZĄ',
  goal: 'Idź do apteki i wróć do mieszkania.', daysPassed: 10,
  coworkerPatrolRouteId: 'standard', hrPatrolRouteId: 'pharmacy-loop',
  phoneCalls: [{ id: 'call-m3-01-01', caller: 'manager', trigger: { type: 'elapsedTime', seconds: 28 }, ringDuration: 6, answerDuration: 4, dialogue: recoveryCheckDialogue }],
  intro: [{ type: 'show-sequence', entries: [
    { speaker: 'NOWE ZAGROŻENIE', text: 'HR', tone: 'warning' },
    { speaker: 'UWAGA', text: 'Jeśli cię rozpozna, spróbuje podejść i porozmawiać.', tone: 'warning' },
    { speaker: 'NOWY CEL', text: 'Idź do apteki i wróć do mieszkania.', tone: 'system' },
  ] }],
  steps: [
    { id: 'buy-m3-medicine', objective: 'Kup leki w aptece.', trigger: { type: 'interaction', targetId: 'pharmacy-counter' }, interactionPrompt: '[E] KUP LEKI', effects: [
      { type: 'add-item', itemId: 'medicine' }, { type: 'show-sequence', entries: [{ speaker: 'ZDOBYTO', text: 'LEKI', tone: 'success' }] },
    ] },
    { id: 'return-m3-medicine', objective: 'Wróć z lekami do mieszkania.', trigger: { type: 'area-entered', areaId: 'home' }, effects: [{ type: 'remove-item', itemId: 'medicine' }] },
  ],
} as const satisfies MissionDefinition;
