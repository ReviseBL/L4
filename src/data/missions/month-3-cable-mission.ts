import type { MissionDefinition } from '../../domain/missions/mission-types';
import { quickQuestionDialogue, statusUpdateDialogue } from '../phone/manager-call-dialogues';

export const month3CableMission = {
  id: 'm3-usb-c-run', campaignMonth: 3, title: 'TYLKO PO KABEL',
  goal: 'Kup kabel USB-C i wróć do mieszkania.', daysPassed: 10,
  coworkerPatrolRouteId: '3d-shop-loop', hrPatrolRouteId: 'tech-loop',
  phoneCalls: [
    { id: 'call-m3-02-01', caller: 'manager', trigger: { type: 'elapsedTime', seconds: 20 }, ringDuration: 6, answerDuration: 4, dialogue: quickQuestionDialogue },
    { id: 'call-m3-02-02', caller: 'manager', trigger: { type: 'itemPickedUp', itemId: 'usb-c-cable', delaySeconds: 12 }, ringDuration: 6, answerDuration: 4, dialogue: statusUpdateDialogue },
  ],
  intro: [{ type: 'show-sequence', entries: [
    { speaker: 'BOHATER', text: 'Ten kabel już ledwo żyje.', tone: 'speech' },
    { speaker: 'NOWY CEL', text: 'Kup kabel USB-C.', tone: 'system' },
  ] }],
  steps: [
    { id: 'buy-usb-c', objective: 'Kup kabel USB-C w dziale TECH SHOP.', trigger: { type: 'interaction', targetId: 'usb-c-shelf' }, interactionPrompt: '[E] KUP KABEL USB-C', effects: [
      { type: 'add-item', itemId: 'usb-c-cable' }, { type: 'show-sequence', entries: [{ speaker: 'ZDOBYTO', text: 'KABEL USB-C', tone: 'success' }] },
    ] },
    { id: 'return-usb-c', objective: 'Wróć z kablem do mieszkania.', trigger: { type: 'area-entered', areaId: 'home' }, effects: [
      { type: 'remove-item', itemId: 'usb-c-cable' }, { type: 'add-desk-item', itemId: 'usb-c-cable-installed' },
      { type: 'show-sequence', entries: [{ speaker: 'BOHATER', text: 'Jeszcze tylko dwanaście przejściówek.', tone: 'speech' }] },
    ] },
  ],
} as const satisfies MissionDefinition;
